use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub hostname: String,
    pub os: String,
    pub ram: u64,
    pub cpu_count: usize,
    pub mac_address: String,
    pub device_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackingStats {
    pub keyboard_count: u32,
    pub mouse_count: u32,
    pub active_window: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityPayload {
    pub app: String,
    pub window_title: String,
    pub idle_duration: u64,
    pub active_duration: u64,
}
