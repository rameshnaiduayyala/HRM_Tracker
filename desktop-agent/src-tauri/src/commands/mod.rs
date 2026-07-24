use crate::models::{SystemInfo, TrackingStats};
use crate::services::system_service::SystemService;
use crate::tracking::TrackingService;
use crate::database::SqliteService;
use crate::scheduler::BackgroundScheduler;

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemService::get_system_info()
}

#[tauri::command]
pub fn get_tracking_stats() -> TrackingStats {
    TrackingService::get_stats()
}

#[tauri::command]
pub fn start_tracking_command() -> Result<(), String> {
    TrackingService::start();
    BackgroundScheduler::start();
    Ok(())
}

#[tauri::command]
pub fn pause_tracking_command() -> Result<(), String> {
    TrackingService::pause();
    BackgroundScheduler::stop();
    Ok(())
}

#[tauri::command]
pub fn resume_tracking_command() -> Result<(), String> {
    TrackingService::resume();
    BackgroundScheduler::start();
    Ok(())
}

#[tauri::command]
pub fn stop_tracking_command(_reason: String) -> Result<(), String> {
    TrackingService::stop();
    BackgroundScheduler::stop();
    Ok(())
}

#[tauri::command]
pub fn get_pending_sync_count() -> Result<i64, String> {
    SqliteService::get_pending_count()
}
