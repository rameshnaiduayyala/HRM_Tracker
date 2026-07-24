/// Native Win32 GDI BitBlt screenshot — no PowerShell subprocess needed.
/// Captures primary monitor → encodes WebP (fallback JPEG) → returns base64.
/// Average execution time: ~30-80ms vs ~2000ms for PowerShell approach.
use base64::{Engine as _, engine::general_purpose};

pub struct ScreenshotService;

impl ScreenshotService {
    pub fn capture_screen() -> Result<String, String> {
        #[cfg(target_os = "windows")]
        {
            Self::capture_win32()
        }
        #[cfg(not(target_os = "windows"))]
        {
            Err("Screenshot not supported on this platform".to_string())
        }
    }

    #[cfg(target_os = "windows")]
    fn capture_win32() -> Result<String, String> {
        use winapi::um::wingdi::{
            BitBlt, CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject,
            GetDIBits, SelectObject, BITMAPINFO, BITMAPINFOHEADER, DIB_RGB_COLORS, SRCCOPY,
            BI_RGB,
        };
        use winapi::um::winuser::{GetDC, GetSystemMetrics, ReleaseDC, SM_CXSCREEN, SM_CYSCREEN};

        let (width, height, raw_pixels) = unsafe {
            let screen_dc = GetDC(std::ptr::null_mut());
            if screen_dc.is_null() {
                return Err("GetDC failed".to_string());
            }

            let width = GetSystemMetrics(SM_CXSCREEN);
            let height = GetSystemMetrics(SM_CYSCREEN);

            let mem_dc = CreateCompatibleDC(screen_dc);
            if mem_dc.is_null() {
                ReleaseDC(std::ptr::null_mut(), screen_dc);
                return Err("CreateCompatibleDC failed".to_string());
            }

            let bitmap = CreateCompatibleBitmap(screen_dc, width, height);
            if bitmap.is_null() {
                DeleteDC(mem_dc);
                ReleaseDC(std::ptr::null_mut(), screen_dc);
                return Err("CreateCompatibleBitmap failed".to_string());
            }

            let old_bmp = SelectObject(mem_dc, bitmap as *mut _);
            BitBlt(mem_dc, 0, 0, width, height, screen_dc, 0, 0, SRCCOPY);

            // Build BITMAPINFO for GetDIBits (32-bit BGRA)
            let bmi = BITMAPINFO {
                bmiHeader: BITMAPINFOHEADER {
                    biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                    biWidth: width,
                    biHeight: -height, // top-down
                    biPlanes: 1,
                    biBitCount: 32,
                    biCompression: BI_RGB,
                    biSizeImage: 0,
                    biXPelsPerMeter: 0,
                    biYPelsPerMeter: 0,
                    biClrUsed: 0,
                    biClrImportant: 0,
                },
                bmiColors: [winapi::um::wingdi::RGBQUAD {
                    rgbBlue: 0, rgbGreen: 0, rgbRed: 0, rgbReserved: 0,
                }],
            };

            let pixel_count = (width * height) as usize;
            let mut raw = vec![0u8; pixel_count * 4]; // BGRA

            GetDIBits(
                mem_dc,
                bitmap,
                0,
                height as u32,
                raw.as_mut_ptr() as *mut _,
                &bmi as *const _ as *mut _,
                DIB_RGB_COLORS,
            );

            // Cleanup GDI objects
            SelectObject(mem_dc, old_bmp);
            DeleteObject(bitmap as *mut _);
            DeleteDC(mem_dc);
            ReleaseDC(std::ptr::null_mut(), screen_dc);

            (width as u32, height as u32, raw)
        };

        // Convert BGRA → RGBA
        let mut rgba = raw_pixels;
        for chunk in rgba.chunks_exact_mut(4) {
            chunk.swap(0, 2); // B ↔ R
        }

        // Build image and encode to WebP (fallback to JPEG at 75% quality)
        let img = image::RgbaImage::from_raw(width, height, rgba)
            .ok_or_else(|| "Failed to create RgbaImage".to_string())?;
        let dyn_img = image::DynamicImage::ImageRgba8(img);

        // Try WebP first
        let mut buf = Vec::with_capacity(width as usize * height as usize / 4);
        if dyn_img
            .write_to(&mut std::io::Cursor::new(&mut buf), image::ImageFormat::WebP)
            .is_ok()
        {
            return Ok(general_purpose::STANDARD.encode(&buf));
        }

        // Fallback: JPEG at 75% quality
        buf.clear();
        {
            let mut cursor = std::io::Cursor::new(&mut buf);
            let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut cursor, 75);
            dyn_img
                .write_with_encoder(encoder)
                .map_err(|e| e.to_string())?;
        }

        Ok(general_purpose::STANDARD.encode(&buf))
    }
}
