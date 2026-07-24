/// SQLite offline cache — stores heartbeats and screenshots when the server is unreachable.
/// drain_offline_* methods replay the queue to the server when connectivity restores.
use sqlite::Connection;
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;

lazy_static! {
    static ref DB_CONN: Arc<Mutex<Option<Connection>>> = Arc::new(Mutex::new(None));
}

pub struct SqliteService;

impl SqliteService {
    // ── Init ─────────────────────────────────────────────────────────────────

    pub fn init() -> Result<(), String> {
        let mut conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
        if conn_lock.is_some() {
            return Ok(());
        }

        let db_path = std::env::temp_dir().join("employee_tracker_agent_offline.db");
        let connection = sqlite::open(db_path.to_str().unwrap_or("agent_offline.db")).map_err(|e| e.to_string())?;

        connection.execute("PRAGMA journal_mode=WAL;").ok();
        connection.execute("PRAGMA synchronous=NORMAL;").ok();

        connection.execute(
            "CREATE TABLE IF NOT EXISTS offline_screenshots (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                image_data TEXT    NOT NULL,
                created_at TEXT    NOT NULL
            );",
        ).map_err(|e| e.to_string())?;

        connection.execute(
            "CREATE TABLE IF NOT EXISTS offline_activities (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                app             TEXT    NOT NULL,
                window_title    TEXT,
                idle_duration   INTEGER NOT NULL,
                active_duration INTEGER NOT NULL,
                created_at      TEXT    NOT NULL
            );",
        ).map_err(|e| e.to_string())?;

        *conn_lock = Some(connection);
        log::info!("[SQLite] Offline cache initialised (WAL mode).");
        Ok(())
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    pub fn save_screenshot(image_base64: &str) -> Result<(), String> {
        let conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
        if let Some(ref conn) = *conn_lock {
            let mut stmt = conn
                .prepare("INSERT INTO offline_screenshots (image_data, created_at) VALUES (?, ?);")
                .map_err(|e| e.to_string())?;
            stmt.bind((1, image_base64)).map_err(|e| e.to_string())?;
            stmt.bind((2, chrono::Utc::now().to_rfc3339().as_str())).map_err(|e| e.to_string())?;
            stmt.next().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn save_activity(app: &str, window_title: &str, idle: u64, active: u64) -> Result<(), String> {
        let conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
        if let Some(ref conn) = *conn_lock {
            let mut stmt = conn
                .prepare("INSERT INTO offline_activities (app, window_title, idle_duration, active_duration, created_at) VALUES (?, ?, ?, ?, ?);")
                .map_err(|e| e.to_string())?;
            stmt.bind((1, app)).map_err(|e| e.to_string())?;
            stmt.bind((2, window_title)).map_err(|e| e.to_string())?;
            stmt.bind((3, idle as i64)).map_err(|e| e.to_string())?;
            stmt.bind((4, active as i64)).map_err(|e| e.to_string())?;
            stmt.bind((5, chrono::Utc::now().to_rfc3339().as_str())).map_err(|e| e.to_string())?;
            stmt.next().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    pub fn get_pending_count() -> Result<i64, String> {
        let conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
        if let Some(ref conn) = *conn_lock {
            let mut stmt = conn
                .prepare("SELECT COUNT(*) FROM offline_screenshots;")
                .map_err(|e| e.to_string())?;
            if let Ok(sqlite::State::Row) = stmt.next() {
                return Ok(stmt.read::<i64, _>(0).unwrap_or(0));
            }
        }
        Ok(0)
    }

    // ── Drain (sync-back to server when online) ───────────────────────────────

    /// Replay offline screenshots to the server, deleting each one on success.
    pub async fn drain_offline_screenshots(
        client: &reqwest::Client,
        token: &str,
        api_base: &str,
    ) -> Result<(), String> {
        // Collect rows while holding the lock, then release before await
        let rows: Vec<(i64, String)> = {
            let conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
            let mut out = Vec::new();
            if let Some(ref conn) = *conn_lock {
                let mut stmt = conn
                    .prepare("SELECT id, image_data FROM offline_screenshots ORDER BY id LIMIT 10;")
                    .map_err(|e| e.to_string())?;
                while let Ok(sqlite::State::Row) = stmt.next() {
                    let id: i64 = stmt.read(0).unwrap_or(0);
                    let img: String = stmt.read(1).unwrap_or_default();
                    out.push((id, img));
                }
            }
            out
        };

        for (id, image_data) in rows {
            let res = client
                .post(format!("{}/work-sessions/screenshot", api_base))
                .bearer_auth(token)
                .json(&serde_json::json!({ "image": image_data }))
                .send()
                .await;

            if let Ok(resp) = res {
                if resp.status().is_success() {
                    // Delete synced row
                    let conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
                    if let Some(ref conn) = *conn_lock {
                        let _ = conn.execute(format!("DELETE FROM offline_screenshots WHERE id = {};", id));
                    }
                }
            }
        }
        Ok(())
    }

    /// Replay offline activity heartbeats to the server, deleting each on success.
    pub async fn drain_offline_activities(
        client: &reqwest::Client,
        token: &str,
        api_base: &str,
    ) -> Result<(), String> {
        let rows: Vec<(i64, String, String, i64, i64)> = {
            let conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
            let mut out = Vec::new();
            if let Some(ref conn) = *conn_lock {
                let mut stmt = conn
                    .prepare("SELECT id, app, window_title, idle_duration, active_duration FROM offline_activities ORDER BY id LIMIT 20;")
                    .map_err(|e| e.to_string())?;
                while let Ok(sqlite::State::Row) = stmt.next() {
                    let id: i64    = stmt.read(0).unwrap_or(0);
                    let app: String  = stmt.read(1).unwrap_or_default();
                    let wt: String   = stmt.read(2).unwrap_or_default();
                    let idle: i64    = stmt.read(3).unwrap_or(0);
                    let active: i64  = stmt.read(4).unwrap_or(0);
                    out.push((id, app, wt, idle, active));
                }
            }
            out
        };

        for (id, app, wt, idle, active) in rows {
            let res = client
                .post(format!("{}/work-sessions/heartbeat", api_base))
                .bearer_auth(token)
                .json(&serde_json::json!({
                    "app": app,
                    "windowTitle": wt,
                    "idleDuration": idle,
                    "activeDuration": active
                }))
                .send()
                .await;

            if let Ok(resp) = res {
                if resp.status().is_success() {
                    let conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
                    if let Some(ref conn) = *conn_lock {
                        let _ = conn.execute(format!("DELETE FROM offline_activities WHERE id = {};", id));
                    }
                }
            }
        }
        Ok(())
    }
}
