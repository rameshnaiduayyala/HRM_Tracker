// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use employee_tracker_agent_lib::database::SqliteService;
use employee_tracker_agent_lib::commands::*;

use tauri::{
    menu::{MenuBuilder, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

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
        .setup(|app| {
            let show_i = MenuItem::with_id(app, "show", "Restore Dashboard", true, None::<&str>).unwrap();
            let quit_i = MenuItem::with_id(app, "quit", "Quit Agent", true, None::<&str>).unwrap();

            let menu = MenuBuilder::new(app)
                .item(&show_i)
                .separator()
                .item(&quit_i)
                .build()?;

            let tray_icon = app.default_window_icon().unwrap().clone();

            let _tray = TrayIconBuilder::new()
                .icon(tray_icon)
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    match event {
                        tauri::tray::TrayIconEvent::DoubleClick { .. } => {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                window.show().unwrap();
                                window.set_focus().unwrap();
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                window.hide().unwrap();
            }
            _ => {}
        })
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
