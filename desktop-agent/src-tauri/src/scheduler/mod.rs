/// Background scheduler — runs every 10s while a session is active.
/// Responsibilities:
///   1. Read keyboard/mouse activity deltas from TrackingService
///   2. Detect inactivity (>5 min idle) → emit event → pause session
///   3. POST heartbeat to backend API (app name + active/idle durations)
///   4. Every 60s: capture screenshot → upload, or cache offline in SQLite
///   5. On backend reconnect: drain offline SQLite queue to server
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;
use crate::database::SqliteService;
use crate::screenshots::ScreenshotService;
use crate::tracking::{TrackingService, KEYBOARD_COUNT, MOUSE_COUNT};
use serde_json::json;
use tauri::Emitter;

const API_BASE: &str = "http://localhost:5000/api/legacy";
const TICK_SECS: u64 = 10;
const SCREENSHOT_EVERY_TICKS: u32 = 6;   // 6 × 10s = 60s
const IDLE_THRESHOLD_SECS: u32 = 300;    // 5 minutes

lazy_static! {
    static ref SCHEDULER_RUNNING: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

pub struct BackgroundScheduler;

impl BackgroundScheduler {
    /// Start the background scheduler loop (idempotent — safe to call multiple times).
    pub fn start(app: tauri::AppHandle) {
        {
            let mut running = SCHEDULER_RUNNING.lock().unwrap();
            if *running {
                return;
            }
            *running = true;
        }

        tokio::spawn(async move {
            let client = reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(8))
                .build()
                .unwrap_or_default();

            let mut tick_count: u32 = 0;
            let mut idle_ticks: u32 = 0;

            log::info!("[Scheduler] Background loop started. Tick interval: {}s", TICK_SECS);

            loop {
                // — Check stop flag —
                {
                    let running = SCHEDULER_RUNNING.lock().unwrap();
                    if !*running {
                        log::info!("[Scheduler] Stop flag set. Exiting loop.");
                        break;
                    }
                }

                // — Read auth token —
                let token_opt = crate::commands::AUTH_TOKEN.lock().ok()
                    .and_then(|g| g.clone());

                let Some(token) = token_opt else {
                    // No token yet — wait and retry
                    tokio::time::sleep(tokio::time::Duration::from_secs(TICK_SECS)).await;
                    continue;
                };

                // ── 1. Read & reset activity counters ──
                let kbd_delta = {
                    let mut lock = KEYBOARD_COUNT.lock().unwrap();
                    let v = *lock;
                    *lock = 0;
                    v
                };
                let mouse_delta = {
                    let mut lock = MOUSE_COUNT.lock().unwrap();
                    let v = *lock;
                    *lock = 0;
                    v
                };
                let has_activity = kbd_delta + mouse_delta > 0;

                // ── 2. Inactivity detection ──
                if has_activity {
                    idle_ticks = 0;
                } else {
                    idle_ticks += 1;
                }

                let idle_secs = idle_ticks * (TICK_SECS as u32);
                if idle_secs >= IDLE_THRESHOLD_SECS {
                    TrackingService::pause();
                    BackgroundScheduler::stop();

                    log::warn!("[Scheduler] Inactivity threshold reached. Emitting event.");
                    let _ = app.emit("inactivity-detected", ());
                    break;
                }

                // ── 3. Get active window ──
                let (proc_name, window_title) = TrackingService::get_active_window_details();
                let (active_dur, idle_dur): (u64, u64) = if has_activity {
                    (TICK_SECS, 0)
                } else {
                    (0, TICK_SECS)
                };

                // ── 4. POST heartbeat ──
                let hb_result = client
                    .post(format!("{}/work-sessions/heartbeat", API_BASE))
                    .bearer_auth(&token)
                    .json(&json!({
                        "app": proc_name,
                        "windowTitle": window_title,
                        "idleDuration": idle_dur,
                        "activeDuration": active_dur
                    }))
                    .send()
                    .await;

                match hb_result {
                    Ok(resp) if resp.status().is_success() => {
                        // Online — try to drain offline activity queue
                        let _ = SqliteService::drain_offline_activities(&client, &token, API_BASE).await;
                    }
                    Ok(resp) => {
                        log::warn!("[Scheduler] Heartbeat HTTP {}", resp.status());
                        // Cache locally
                        let _ = SqliteService::save_activity(&proc_name, &window_title, idle_dur, active_dur);
                    }
                    Err(e) => {
                        log::warn!("[Scheduler] Heartbeat offline: {}", e);
                        let _ = SqliteService::save_activity(&proc_name, &window_title, idle_dur, active_dur);
                    }
                }

                // ── 5. Periodic screenshot (every 60s) ──
                tick_count += 1;
                if tick_count >= SCREENSHOT_EVERY_TICKS {
                    tick_count = 0;

                    // Run capture on blocking thread to avoid stalling the async executor
                    let capture_result = tokio::task::spawn_blocking(ScreenshotService::capture_screen).await;

                    match capture_result {
                        Ok(Ok(base64_img)) => {
                            let ss_result = client
                                .post(format!("{}/work-sessions/screenshot", API_BASE))
                                .bearer_auth(&token)
                                .json(&json!({ "image": base64_img }))
                                .send()
                                .await;

                            match ss_result {
                                Ok(resp) if resp.status().is_success() => {
                                    // Drain cached screenshots if online
                                    let _ = SqliteService::drain_offline_screenshots(&client, &token, API_BASE).await;
                                }
                                _ => {
                                    log::warn!("[Scheduler] Screenshot upload failed — caching offline.");
                                    let _ = SqliteService::save_screenshot(&base64_img);
                                }
                            }
                        }
                        Ok(Err(e)) => log::warn!("[Scheduler] Screen capture error: {}", e),
                        Err(e)    => log::error!("[Scheduler] Spawn blocking panicked: {}", e),
                    }
                }

                tokio::time::sleep(tokio::time::Duration::from_secs(TICK_SECS)).await;
            }
        });
    }

    /// Signal the scheduler loop to exit cleanly on the next tick.
    pub fn stop() {
        if let Ok(mut running) = SCHEDULER_RUNNING.lock() {
            *running = false;
        }
    }
}
