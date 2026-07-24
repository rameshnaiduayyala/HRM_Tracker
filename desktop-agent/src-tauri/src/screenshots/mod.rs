use std::process::Command;

pub struct ScreenshotService;

impl ScreenshotService {
    pub fn capture_screen() -> Result<String, String> {
        let script = r#"
            Add-Type -AssemblyName System.Windows.Forms,System.Drawing
            try {
                $api = Add-Type -MemberDefinition '[DllImport("user32.dll")] public static extern bool SetProcessDPIAware();' -Name "Win32DPI" -Namespace "Win32" -PassThru
                $api::SetProcessDPIAware() | Out-Null
            } catch {}
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
            let base64_png = String::from_utf8_lossy(&output.stdout).trim().to_string();
            use base64::{Engine as _, engine::general_purpose};
            if let Ok(png_bytes) = general_purpose::STANDARD.decode(&base64_png) {
                if let Ok(img) = image::load_from_memory(&png_bytes) {
                    let mut webp_bytes: Vec<u8> = Vec::new();
                    if img.write_to(&mut std::io::Cursor::new(&mut webp_bytes), image::ImageFormat::WebP).is_ok() {
                        return Ok(general_purpose::STANDARD.encode(&webp_bytes));
                    } else {
                        let mut jpeg_bytes: Vec<u8> = Vec::new();
                        if img.write_to(&mut std::io::Cursor::new(&mut jpeg_bytes), image::ImageFormat::Jpeg).is_ok() {
                            return Ok(general_purpose::STANDARD.encode(&jpeg_bytes));
                        }
                    }
                }
            }
            Ok(base64_png)
        } else {
            Err(String::from_utf8_lossy(&output.stderr).to_string())
        }
    }
}
