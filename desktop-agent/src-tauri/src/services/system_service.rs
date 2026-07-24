use std::sync::OnceLock;
use mac_address::get_mac_address;
use crate::models::SystemInfo;

// Cache system info — these values don't change at runtime
static SYSTEM_INFO: OnceLock<SystemInfo> = OnceLock::new();

pub struct SystemService;

impl SystemService {
    pub fn get_system_info() -> SystemInfo {
        SYSTEM_INFO.get_or_init(|| {
            // Hostname via Win32 winbase::GetComputerNameW
            let hostname = {
                #[cfg(target_os = "windows")]
                {
                    use std::ffi::OsString;
                    use std::os::windows::ffi::OsStringExt;
                    unsafe {
                        let mut buf = vec![0u16; 256];
                        let mut size = buf.len() as u32;
                        if winapi::um::winbase::GetComputerNameW(buf.as_mut_ptr(), &mut size) != 0 {
                            let os_str = OsString::from_wide(&buf[..size as usize]);
                            os_str.to_string_lossy().into_owned()
                        } else {
                            std::env::var("COMPUTERNAME").unwrap_or_else(|_| "Unknown-Host".to_string())
                        }
                    }
                }
                #[cfg(not(target_os = "windows"))]
                { std::env::var("HOSTNAME").unwrap_or_else(|_| "Unknown-Host".to_string()) }
            };

            // OS version via Win32
            let os = {
                #[cfg(target_os = "windows")]
                {
                    // Read from registry — no sysinfo needed
                    std::process::Command::new("cmd")
                        .args(&["/C", "ver"])
                        .output()
                        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
                        .unwrap_or_else(|_| "Windows".to_string())
                }
                #[cfg(not(target_os = "windows"))]
                { "Unknown OS".to_string() }
            };

            // RAM via GlobalMemoryStatusEx — lightweight
            let ram = {
                #[cfg(target_os = "windows")]
                {
                    unsafe {
                        let mut mem_status = winapi::um::sysinfoapi::MEMORYSTATUSEX {
                            dwLength: std::mem::size_of::<winapi::um::sysinfoapi::MEMORYSTATUSEX>() as u32,
                            dwMemoryLoad: 0,
                            ullTotalPhys: 0,
                            ullAvailPhys: 0,
                            ullTotalPageFile: 0,
                            ullAvailPageFile: 0,
                            ullTotalVirtual: 0,
                            ullAvailVirtual: 0,
                            ullAvailExtendedVirtual: 0,
                        };
                        if winapi::um::sysinfoapi::GlobalMemoryStatusEx(&mut mem_status) != 0 {
                            mem_status.ullTotalPhys / 1024 / 1024 / 1024
                        } else { 0 }
                    }
                }
                #[cfg(not(target_os = "windows"))]
                { 0u64 }
            };

            // CPU count via Win32 SYSTEM_INFO
            let cpu_count = {
                #[cfg(target_os = "windows")]
                {
                    unsafe {
                        let mut info: winapi::um::sysinfoapi::SYSTEM_INFO = std::mem::zeroed();
                        winapi::um::sysinfoapi::GetSystemInfo(&mut info);
                        info.dwNumberOfProcessors as usize
                    }
                }
                #[cfg(not(target_os = "windows"))]
                { 1usize }
            };

            let mac = match get_mac_address() {
                Ok(Some(addr)) => addr.to_string(),
                _ => "00:00:00:00:00:00".to_string(),
            };

            SystemInfo {
                hostname: hostname.clone(),
                os,
                ram,
                cpu_count,
                mac_address: mac.clone(),
                device_id: format!("{}-{}", hostname, mac).replace(':', ""),
            }
        }).clone()
    }
}
