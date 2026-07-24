use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;
use crate::database::SqliteService;
use crate::screenshots::ScreenshotService;
use crate::tracking::{TrackingService, KEYBOARD_COUNT, MOUSE_COUNT};
use serde_json::json;

lazy_static! {
    static ref SCHEDULER_RUNNING: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

pub struct BackgroundScheduler;

impl BackgroundScheduler {
    pub fn start() {
        if let Ok(mut running) = SCHEDULER_RUNNING.lock() {
            if *running {
                return;
            }
            *running = true;
        }

        tokio::spawn(async {
            let client = reqwest::Client::new();
            let mut tick_count = 0;

            loop {
                {
                    if let Ok(running) = SCHEDULER_RUNNING.lock() {
                        if !*running {
                            break;
                        }
                    }
                }

                // Get auth token from global state
                let token_opt = if let Ok(lock) = crate::commands::AUTH_TOKEN.lock() {
                    lock.clone()
                } else {
                    None
                };

                if let Some(token) = token_opt {
                    // 1. Retrieve and reset keyboard/mouse counts
                    let mut kbd_diff = 0;
                    let mut mouse_diff = 0;
                    if let Ok(mut lock) = KEYBOARD_COUNT.lock() {
                        kbd_diff = *lock;
                        *lock = 0;
                    }
                    if let Ok(mut lock) = MOUSE_COUNT.lock() {
                        mouse_diff = *lock;
                        *lock = 0;
                    }

                    // 2. Get active window details
                    let (app_process, window_title) = TrackingService::get_active_window_details();

                    // Calculate active/idle duration based on keyboard/mouse clicks
                    let (active_dur, idle_dur) = if kbd_diff + mouse_diff > 0 {
                        (10, 0)
                    } else {
                        (0, 10)
                    };

                    // 3. Send Heartbeat to legacy API
                    let heartbeat_payload = json!({
                        "app": app_process,
                        "windowTitle": window_title,
                        "idleDuration": idle_dur,
                        "activeDuration": active_dur
                    });

                    let heartbeat_url = "http://localhost:5000/api/legacy/work-sessions/heartbeat";
                    let res = client.post(heartbeat_url)
                        .bearer_auth(&token)
                        .json(&heartbeat_payload)
                        .send()
                        .await;

                    match res {
                        Ok(resp) if resp.status().is_success() => {
                            // Heartbeat uploaded successfully
                        }
                        _ => {
                            // If upload fails, cache offline or ignore heartbeat
                        }
                    }

                    // 4. Periodically capture screen & upload/cache
                    tick_count += 10;
                    if tick_count >= 60 {
                        tick_count = 0;

                        if let Ok(base64_screen) = ScreenshotService::capture_screen() {
                            let screenshot_payload = json!({
                                "image": base64_screen
                            });

                            let screenshot_url = "http://localhost:5000/api/legacy/work-sessions/screenshot";
                            let ss_res = client.post(screenshot_url)
                                .bearer_auth(&token)
                                .json(&screenshot_payload)
                                .send()
                                .await;

                            match ss_res {
                                Ok(resp) if resp.status().is_success() => {
                                    // Screenshot uploaded successfully
                                }
                                _ => {
                                    // Fallback to local offline cache
                                    let _ = SqliteService::save_screenshot(&base64_screen);
                                }
                            }
                        }
                    }
                }

                // Sleep for configured interval (10 seconds)
                tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
            }
        });
    }

    pub fn stop() {
        if let Ok(mut running) = SCHEDULER_RUNNING.lock() {
            *running = false;
        }
    }
}
