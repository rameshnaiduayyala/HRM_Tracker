use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;
use crate::database::SqliteService;
use crate::screenshots::ScreenshotService;

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
            loop {
                {
                    if let Ok(running) = SCHEDULER_RUNNING.lock() {
                        if !*running {
                            break;
                        }
                    }
                }
                
                // Periodically capture screenshot and cache offline if backend is unreachable
                if let Ok(base64_screen) = ScreenshotService::capture_screen() {
                    let _ = SqliteService::save_screenshot(&base64_screen);
                }

                // Sleep for configured interval
                tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;
            }
        });
    }

    pub fn stop() {
        if let Ok(mut running) = SCHEDULER_RUNNING.lock() {
            *running = false;
        }
    }
}
