use sqlite::Connection;
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;

lazy_static! {
    static ref DB_CONN: Arc<Mutex<Option<Connection>>> = Arc::new(Mutex::new(None));
}

pub struct SqliteService;

impl SqliteService {
    pub fn init() -> Result<(), String> {
        let mut conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
        if conn_lock.is_none() {
            let connection = sqlite::open("agent_offline.db").map_err(|e| e.to_string())?;
            
            // Create screenshots table for offline queue storage
            connection
                .execute(
                    "CREATE TABLE IF NOT EXISTS offline_screenshots (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        image_data TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    );",
                )
                .map_err(|e| e.to_string())?;

            // Create activities table for offline activity logs queue storage
            connection
                .execute(
                    "CREATE TABLE IF NOT EXISTS offline_activities (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        app TEXT NOT NULL,
                        window_title TEXT,
                        idle_duration INTEGER NOT NULL,
                        active_duration INTEGER NOT NULL,
                        created_at TEXT NOT NULL
                    );",
                )
                .map_err(|e| e.to_string())?;

            *conn_lock = Some(connection);
        }
        Ok(())
    }

    pub fn save_screenshot(image_base64: &str) -> Result<(), String> {
        let conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
        if let Some(ref conn) = *conn_lock {
            let mut statement = conn
                .prepare("INSERT INTO offline_screenshots (image_data, created_at) VALUES (?, ?);")
                .map_err(|e| e.to_string())?;
            statement.bind((1, image_base64)).map_err(|e| e.to_string())?;
            statement
                .bind((2, chrono::Utc::now().to_rfc3339().as_str()))
                .map_err(|e| e.to_string())?;
            statement.next().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn save_activity(app: &str, window_title: &str, idle: u64, active: u64) -> Result<(), String> {
        let conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
        if let Some(ref conn) = *conn_lock {
            let mut statement = conn
                .prepare("INSERT INTO offline_activities (app, window_title, idle_duration, active_duration, created_at) VALUES (?, ?, ?, ?, ?);")
                .map_err(|e| e.to_string())?;
            statement.bind((1, app)).map_err(|e| e.to_string())?;
            statement.bind((2, window_title)).map_err(|e| e.to_string())?;
            statement.bind((3, idle as i64)).map_err(|e| e.to_string())?;
            statement.bind((4, active as i64)).map_err(|e| e.to_string())?;
            statement
                .bind((5, chrono::Utc::now().to_rfc3339().as_str()))
                .map_err(|e| e.to_string())?;
            statement.next().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    pub fn get_pending_count() -> Result<i64, String> {
        let conn_lock = DB_CONN.lock().map_err(|e| e.to_string())?;
        if let Some(ref conn) = *conn_lock {
            let mut statement = conn.prepare("SELECT COUNT(*) FROM offline_screenshots;").map_err(|e| e.to_string())?;
            if let Ok(sqlite::State::Row) = statement.next() {
                return Ok(statement.read::<i64, _>(0).unwrap_or(0));
            }
        }
        Ok(0)
    }
}
