/// Background scheduler — runs every 10s while a session is active.
/// Screenshot interval and idle threshold are dynamic — set by company admin
/// and fetched from the backend on every session start.
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;
use crate::database::SqliteService;
use crate::screenshots::ScreenshotService;
use crate::tracking::{TrackingService, KEYBOARD_COUNT, MOUSE_COUNT};
use serde_json::json;
use tauri::{Emitter, Manager};

const API_BASE: &str = "http://localhost:5000/api/legacy";
const TICK_SECS: u64 = 10;

lazy_static! {
    static ref SCHEDULER_RUNNING: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

pub struct BackgroundScheduler;

impl BackgroundScheduler {
    /// Start the background scheduler loop with company-configured intervals.
    ///
    /// * `screenshot_interval_secs` — how often to capture a screenshot (e.g. 60, 120, 300)
    /// * `idle_threshold_secs` — how many seconds of zero input before showing the reason modal
    pub fn start(app: tauri::AppHandle, screenshot_interval_secs: u32, idle_threshold_secs: u32) {
        {
            let mut running = SCHEDULER_RUNNING.lock().unwrap();
            if *running {
                return;
            }
            *running = true;
        }

        // Calculate how many 10s ticks fit into the screenshot interval
        let ss_every_ticks = std::cmp::max(1, screenshot_interval_secs / (TICK_SECS as u32));

        log::info!(
            "[Scheduler] Started — screenshot every {}s ({} ticks), idle threshold {}s",
            screenshot_interval_secs, ss_every_ticks, idle_threshold_secs
        );

        tokio::spawn(async move {
            let client = reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(8))
                .build()
                .unwrap_or_default();

            let mut tick_count: u32 = 0;
            let mut idle_ticks: u32 = 0;

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

                // ── 2. Inactivity detection (company-configured threshold) ──
                if has_activity {
                    idle_ticks = 0;
                } else {
                    idle_ticks += 1;
                }

                let idle_secs = idle_ticks * (TICK_SECS as u32);
                if idle_secs >= idle_threshold_secs {
                    TrackingService::pause();
                    BackgroundScheduler::stop();

                    log::warn!(
                        "[Scheduler] Inactivity threshold reached ({}s >= {}s). Forcing window open.",
                        idle_secs, idle_threshold_secs
                    );

                    // Force-show the app window so the user MUST respond
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                        let _ = window.set_always_on_top(true);
                    }

                    // Notify the frontend to display the unclosable reason modal
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
                        let _ = SqliteService::drain_offline_activities(&client, &token, API_BASE).await;
                    }
                    Ok(resp) => {
                        log::warn!("[Scheduler] Heartbeat HTTP {}", resp.status());
                        let _ = SqliteService::save_activity(&proc_name, &window_title, idle_dur, active_dur);
                    }
                    Err(e) => {
                        log::warn!("[Scheduler] Heartbeat offline: {}", e);
                        let _ = SqliteService::save_activity(&proc_name, &window_title, idle_dur, active_dur);
                    }
                }

                // ── 5. Periodic screenshot (company-configured interval) ──
                tick_count += 1;
                if tick_count >= ss_every_ticks {
                    tick_count = 0;

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
                                    let _ = SqliteService::drain_offline_screenshots(&client, &token, API_BASE).await;
                                }
                                _ => {
                                    log::warn!("[Scheduler] Screenshot upload failed — caching offline.");
                                    let _ = SqliteService::save_screenshot(&base64_img);
                                }
                            }
                        }
                        Ok(Err(e)) => log::warn!("[Scheduler] Screen capture error: {}", e),
                        Err(e)     => log::error!("[Scheduler] Spawn blocking panicked: {}", e),
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
