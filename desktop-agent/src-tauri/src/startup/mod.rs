use std::process::Command;

pub struct StartupService;

impl StartupService {
    /// Enable launch-on-login by writing to the User Run registry key.
    pub fn enable_autostart(app_name: &str, app_path: &str) -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            let status = Command::new("reg")
                .args(&[
                    "add",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    app_name,
                    "/t",
                    "REG_SZ",
                    "/d",
                    app_path,
                    "/f"
                ])
                .status()
                .map_err(|e| e.to_string())?;

            if status.success() {
                Ok(())
            } else {
                Err("reg.exe returned non-zero status code".to_string())
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            // Abstraction placeholder for macOS/Linux autostart options
            Ok(())
        }
    }

    /// Disable launch-on-login by deleting the User Run registry key.
    pub fn disable_autostart(app_name: &str) -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            let status = Command::new("reg")
                .args(&[
                    "delete",
                    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                    "/v",
                    app_name,
                    "/f"
                ])
                .status()
                .map_err(|e| e.to_string())?;

            if status.success() {
                Ok(())
            } else {
                Err("reg.exe returned non-zero status code".to_string())
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            Ok(())
        }
    }
}
