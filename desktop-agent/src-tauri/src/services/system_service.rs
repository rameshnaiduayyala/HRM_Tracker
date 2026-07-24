use sysinfo::System;
use mac_address::get_mac_address;
use crate::models::SystemInfo;

pub struct SystemService;

impl SystemService {
    pub fn get_system_info() -> SystemInfo {
        let mut sys = System::new_all();
        sys.refresh_all();

        let hostname = System::host_name().unwrap_or_else(|| "Unknown-Host".to_string());
        let os = System::long_os_version().unwrap_or_else(|| "Windows 11 Enterprise".to_string());
        let ram = sys.total_memory() / 1024 / 1024 / 1024; // GB
        let cpu_count = sys.cpus().len();
        
        let mac = match get_mac_address() {
            Ok(Some(addr)) => addr.to_string(),
            _ => "00:0A:95:9D:68:16".to_string(),
        };

        SystemInfo {
            hostname: hostname.clone(),
            os,
            ram,
            cpu_count,
            mac_address: mac.clone(),
            device_id: format!("{}-{}", hostname, mac).replace(":", ""),
        }
    }
}
