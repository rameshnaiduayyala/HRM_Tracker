using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using Agent.Core.Interfaces;

namespace Agent.Windows.ActiveWindow
{
    public class WindowsActiveWindowMonitor : IActiveWindowMonitor
    {
        [DllImport("user32.dll")]
        private static extern IntPtr GetForegroundWindow();

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

        [DllImport("user32.dll")]
        private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        public void GetActiveWindowDetails(out string processName, out string windowTitle)
        {
            processName = "Idle";
            windowTitle = "Desktop";

            IntPtr hwnd = GetForegroundWindow();
            if (hwnd == IntPtr.Zero) return;

            // Get window text
            var titleBuilder = new StringBuilder(256);
            if (GetWindowText(hwnd, titleBuilder, 256) > 0)
            {
                windowTitle = titleBuilder.ToString();
            }

            // Get process name
            GetWindowThreadProcessId(hwnd, out uint pid);
            if (pid > 0)
            {
                try
                {
                    using (var process = Process.GetProcessById((int)pid))
                    {
                        processName = process.ProcessName;
                    }
                }
                catch
                {
                    processName = "System";
                }
            }
        }
    }
}
