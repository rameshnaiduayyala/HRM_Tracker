use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;
use crate::models::TrackingStats;

lazy_static! {
    static ref KEYBOARD_COUNT: Arc<Mutex<u32>> = Arc::new(Mutex::new(0));
    static ref MOUSE_COUNT: Arc<Mutex<u32>> = Arc::new(Mutex::new(0));
    static ref TRACKING_ACTIVE: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

pub struct TrackingService;

impl TrackingService {
    pub fn start() {
        if let Ok(mut active) = TRACKING_ACTIVE.lock() {
            *active = true;
        }
        // Spawn active background thread to listen for input counters or poll OS metrics
        tokio::spawn(async {
            loop {
                {
                    if let Ok(active) = TRACKING_ACTIVE.lock() {
                        if !*active {
                            break;
                        }
                    }
                    // Simulate system activities monitoring
                    if let Ok(mut count) = KEYBOARD_COUNT.lock() {
                        *count += 1;
                    }
                    if let Ok(mut count) = MOUSE_COUNT.lock() {
                        *count += 1;
                    }
                }
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            }
        });
    }

    pub fn pause() {
        if let Ok(mut active) = TRACKING_ACTIVE.lock() {
            *active = false;
        }
    }

    pub fn resume() {
        Self::start();
    }

    pub fn stop() {
        if let Ok(mut active) = TRACKING_ACTIVE.lock() {
            *active = false;
        }
        if let Ok(mut kbd) = KEYBOARD_COUNT.lock() {
            *kbd = 0;
        }
        if let Ok(mut mouse) = MOUSE_COUNT.lock() {
            *mouse = 0;
        }
    }

    pub fn get_stats() -> TrackingStats {
        let keyboard = KEYBOARD_COUNT.lock().map(|g| *g).unwrap_or(0);
        let mouse = MOUSE_COUNT.lock().map(|g| *g).unwrap_or(0);
        TrackingStats {
            keyboard_count: keyboard,
            mouse_count: mouse,
            active_window: "VS Code - main.rs (active)".to_string(),
        }
    }
}
