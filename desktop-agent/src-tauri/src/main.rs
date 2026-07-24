// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use employee_tracker_agent_lib::database::SqliteService;
use employee_tracker_agent_lib::commands::*;

fn main() {
    // Initialize offline DB cache
    if let Err(e) = SqliteService::init() {
        eprintln!("Failed to initialize local offline SQLite: {}", e);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_tracking_stats,
            start_tracking_command,
            pause_tracking_command,
            resume_tracking_command,
            stop_tracking_command,
            get_pending_sync_count
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
