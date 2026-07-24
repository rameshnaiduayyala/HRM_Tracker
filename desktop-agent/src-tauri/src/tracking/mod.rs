use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;
use crate::models::TrackingStats;
use device_query::{DeviceState, DeviceQuery};
use std::collections::HashSet;
use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;
use winapi::um::winuser::{GetForegroundWindow, GetWindowTextW, GetWindowTextLengthW, GetWindowThreadProcessId};
use sysinfo::{System, Pid};

lazy_static! {
    pub static ref KEYBOARD_COUNT: Arc<Mutex<u32>> = Arc::new(Mutex::new(0));
    pub static ref MOUSE_COUNT: Arc<Mutex<u32>> = Arc::new(Mutex::new(0));
    pub static ref TRACKING_ACTIVE: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

pub struct TrackingService;

impl TrackingService {
    pub fn start() {
        if let Ok(mut active) = TRACKING_ACTIVE.lock() {
            if *active {
                return; // Already running
            }
            *active = true;
        }

        // Spawn a background OS thread for high-frequency input polling
        std::thread::spawn(|| {
            let device_state = DeviceState::new();
            let mut last_keys = HashSet::new();
            let mut last_buttons = vec![false; 5];

            loop {
                {
                    if let Ok(active) = TRACKING_ACTIVE.lock() {
                        if !*active {
                            break;
                        }
                    }
                }

                // Poll Keyboard transitions
                let current_keys: HashSet<_> = device_state.get_keys().into_iter().collect();
                let new_presses = current_keys.difference(&last_keys).count();
                if new_presses > 0 {
                    if let Ok(mut count) = KEYBOARD_COUNT.lock() {
                        *count += new_presses as u32;
                    }
                }
                last_keys = current_keys;

                // Poll Mouse transitions
                let mouse = device_state.get_mouse();
                for (i, &pressed) in mouse.button_pressed.iter().enumerate() {
                    if i < last_buttons.len() {
                        if pressed && !last_buttons[i] {
                            if let Ok(mut count) = MOUSE_COUNT.lock() {
                                *count += 1;
                            }
                        }
                        last_buttons[i] = pressed;
                    }
                }

                std::thread::sleep(std::time::Duration::from_millis(30));
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

    pub fn get_active_window_details() -> (String, String) {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.is_null() {
                return ("Idle".to_string(), "Idle".to_string());
            }

            // Get window title
            let len = GetWindowTextLengthW(hwnd);
            let title = if len > 0 {
                let mut buf = vec![0u16; (len + 1) as usize];
                let read = GetWindowTextW(hwnd, buf.as_mut_ptr(), buf.len() as i32);
                if read > 0 {
                    let os_str = OsString::from_wide(&buf[0..(read as usize)]);
                    os_str.to_string_lossy().into_owned()
                } else {
                    "Unknown".to_string()
                }
            } else {
                "Unknown".to_string()
            };

            // Get process name
            let mut pid: u32 = 0;
            GetWindowThreadProcessId(hwnd, &mut pid);
            let mut process_name = "Unknown".to_string();
            if pid > 0 {
                let mut sys = System::new_all();
                sys.refresh_processes();
                if let Some(process) = sys.process(Pid::from(pid as usize)) {
                    process_name = process.name().to_string();
                }
            }

            (process_name, title)
        }
    }

    pub fn get_stats() -> TrackingStats {
        let keyboard = KEYBOARD_COUNT.lock().map(|g| *g).unwrap_or(0);
        let mouse = MOUSE_COUNT.lock().map(|g| *g).unwrap_or(0);
        let (_, title) = Self::get_active_window_details();
        TrackingStats {
            keyboard_count: keyboard,
            mouse_count: mouse,
            active_window: title,
        }
    }
}
