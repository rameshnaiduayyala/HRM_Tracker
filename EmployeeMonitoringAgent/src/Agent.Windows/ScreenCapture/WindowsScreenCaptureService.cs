using System;
using System.Drawing;
using System.IO;
using System.Windows;
using Agent.Core.Interfaces;

namespace Agent.Windows.ScreenCapture
{
    public class WindowsScreenCaptureService : IScreenCaptureService
    {
        public string? CapturePrimaryScreenBase64()
        {
            try
            {
                int width = (int)SystemParameters.PrimaryScreenWidth;
                int height = (int)SystemParameters.PrimaryScreenHeight;

                using (var bitmap = new Bitmap(width, height))
                {
                    using (var graphics = Graphics.FromImage(bitmap))
                    {
                        graphics.CopyFromScreen(0, 0, 0, 0, bitmap.Size);
                    }
                    using (var ms = new MemoryStream())
                    {
                        bitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
                        return Convert.ToBase64String(ms.ToArray());
                    }
                }
            }
            catch
            {
                return null;
            }
        }
    }
}
