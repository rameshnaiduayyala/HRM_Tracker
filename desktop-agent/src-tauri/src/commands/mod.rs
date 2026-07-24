use crate::models::{SystemInfo, TrackingStats};
use crate::services::system_service::SystemService;
use crate::tracking::TrackingService;
use crate::database::SqliteService;
use crate::scheduler::BackgroundScheduler;
use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;

lazy_static! {
    pub static ref AUTH_TOKEN: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));
    pub static ref IN_INACTIVITY_MODAL: Arc<Mutex<bool>> = Arc::new(Mutex::new(false));
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemService::get_system_info()
}

#[tauri::command]
pub fn get_tracking_stats() -> TrackingStats {
    TrackingService::get_stats()
}

/// Start tracking with company-configured intervals.
/// `screenshot_interval` and `idle_threshold` are in seconds, fetched from
/// the backend `/work-sessions/config` endpoint by the frontend.
#[tauri::command]
pub async fn start_tracking_command(
    app: tauri::AppHandle,
    token: String,
    screenshot_interval: Option<u32>,
    idle_threshold: Option<u32>,
) -> Result<(), String> {
    if let Ok(mut lock) = AUTH_TOKEN.lock() {
        *lock = Some(token);
    }
    if let Ok(mut lock) = IN_INACTIVITY_MODAL.lock() {
        *lock = false;
    }
    TrackingService::start();
    BackgroundScheduler::start(
        app,
        screenshot_interval.unwrap_or(60),
        idle_threshold.unwrap_or(300),
    );
    Ok(())
}

#[tauri::command]
pub async fn pause_tracking_command() -> Result<(), String> {
    if let Ok(mut lock) = IN_INACTIVITY_MODAL.lock() {
        *lock = false;
    }
    TrackingService::pause();
    BackgroundScheduler::stop();
    Ok(())
}

#[tauri::command]
pub async fn resume_tracking_command(
    app: tauri::AppHandle,
    token: String,
    screenshot_interval: Option<u32>,
    idle_threshold: Option<u32>,
) -> Result<(), String> {
    if let Ok(mut lock) = AUTH_TOKEN.lock() {
        *lock = Some(token);
    }
    if let Ok(mut lock) = IN_INACTIVITY_MODAL.lock() {
        *lock = false;
    }
    TrackingService::resume();
    BackgroundScheduler::start(
        app,
        screenshot_interval.unwrap_or(60),
        idle_threshold.unwrap_or(300),
    );
    Ok(())
}

#[tauri::command]
pub async fn stop_tracking_command(_reason: String) -> Result<(), String> {
    if let Ok(mut lock) = IN_INACTIVITY_MODAL.lock() {
        *lock = false;
    }
    TrackingService::stop();
    BackgroundScheduler::stop();
    Ok(())
}

#[tauri::command]
pub fn get_pending_sync_count() -> Result<i64, String> {
    SqliteService::get_pending_count()
}
