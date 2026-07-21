using System;
using Microsoft.Win32;
using Agent.Core.Interfaces;

namespace Agent.Windows.Startup
{
    public class WindowsRegistryStartupService : IStartupService
    {
        private const string AppName = "TaskTrackyAgent";

        public void SetAutoStart(bool enable)
        {
            try
            {
                using (RegistryKey? key = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", true))
                {
                    if (key != null)
                    {
                        if (enable)
                        {
                            string? exePath = Environment.ProcessPath;
                            if (!string.IsNullOrEmpty(exePath))
                            {
                                key.SetValue(AppName, $"\"{exePath}\" --hidden");
                            }
                        }
                        else
                        {
                            key.DeleteValue(AppName, false);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating startup registry key: {ex.Message}");
            }
        }

        public bool IsAutoStartEnabled()
        {
            try
            {
                using (RegistryKey? key = Registry.CurrentUser.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\Run", false))
                {
                    if (key != null)
                    {
                        return key.GetValue(AppName) != null;
                    }
                }
            }
            catch
            {
                // ignore
            }
            return false;
        }
    }
}
