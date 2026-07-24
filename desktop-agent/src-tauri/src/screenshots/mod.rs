use std::process::Command;

pub struct ScreenshotService;

impl ScreenshotService {
    pub fn capture_screen() -> Result<String, String> {
        let script = r#"
            Add-Type -AssemblyName System.Windows.Forms,System.Drawing
            $screen = [System.Windows.Forms.Screen]::PrimaryScreen
            $bounds = $screen.Bounds
            $bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
            $ms = New-Object System.IO.MemoryStream
            $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            $bytes = $ms.ToArray()
            [Convert]::ToBase64String($bytes)
        "#;

        let output = Command::new("powershell")
            .args(&["-NoProfile", "-Command", script])
            .output()
            .map_err(|e| e.to_string())?;

        if output.status.success() {
            let base64 = String::from_utf8_lossy(&output.stdout).trim().to_string();
            Ok(base64)
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}
