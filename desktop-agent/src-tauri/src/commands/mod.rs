use crate::models::{SystemInfo, TrackingStats};
use crate::services::system_service::SystemService;
use crate::tracking::TrackingService;
use crate::database::SqliteService;
use crate::scheduler::BackgroundScheduler;
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;

lazy_static! {
    pub static ref AUTH_TOKEN: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemService::get_system_info()
}

#[tauri::command]
pub fn get_tracking_stats() -> TrackingStats {
    TrackingService::get_stats()
}

#[tauri::command]
pub async fn start_tracking_command(token: String) -> Result<(), String> {
    if let Ok(mut lock) = AUTH_TOKEN.lock() {
        *lock = Some(token);
    }
    TrackingService::start();
    BackgroundScheduler::start();
    Ok(())
}

#[tauri::command]
pub async fn pause_tracking_command() -> Result<(), String> {
    TrackingService::pause();
    BackgroundScheduler::stop();
    Ok(())
}

#[tauri::command]
pub async fn resume_tracking_command(token: String) -> Result<(), String> {
    if let Ok(mut lock) = AUTH_TOKEN.lock() {
        *lock = Some(token);
    }
    TrackingService::resume();
    BackgroundScheduler::start();
    Ok(())
}

#[tauri::command]
pub async fn stop_tracking_command(_reason: String) -> Result<(), String> {
    TrackingService::stop();
    BackgroundScheduler::stop();
    Ok(())
}

#[tauri::command]
pub fn get_pending_sync_count() -> Result<i64, String> {
    SqliteService::get_pending_count()
}
