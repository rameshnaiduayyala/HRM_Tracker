using System;
using System.Runtime.InteropServices;
using Agent.Core.Interfaces;

namespace Agent.Windows.IdleDetection
{
    public class WindowsIdleDetector : IIdleDetector
    {
        [StructLayout(LayoutKind.Sequential)]
        private struct LASTINPUTINFO
        {
            public uint cbSize;
            public uint dwTime;
        }

        [DllImport("user32.dll")]
        private static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

        public double GetIdleTimeSeconds()
        {
            var lii = new LASTINPUTINFO();
            lii.cbSize = (uint)Marshal.SizeOf(lii);

            if (GetLastInputInfo(ref lii))
            {
                uint ticks = (uint)Environment.TickCount;
                uint idleTicks = ticks - lii.dwTime;
                return idleTicks / 1000.0;
            }
            return 0;
        }
    }
}
