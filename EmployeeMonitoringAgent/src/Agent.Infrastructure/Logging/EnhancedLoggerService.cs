using System;
using System.IO;
using System.Text;
using Agent.Core.Interfaces;

namespace Agent.Infrastructure.Logging
{
    public class EnhancedLoggerService : IEnhancedLoggerService
    {
        private readonly string _logFolder;
        private readonly object _lockObj = new();
        private const int MaxLogFiles = 7;
        private const long MaxFileSizeBytes = 5 * 1024 * 1024;

        public event Action<string>? OnLogAdded;

        public EnhancedLoggerService()
        {
            _logFolder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "TaskTracky",
                "Logs"
            );

            try
            {
                if (!Directory.Exists(_logFolder))
                {
                    Directory.CreateDirectory(_logFolder);
                }

                RotateLogsIfNeeded();
            }
            catch
            {
            }
        }

        public void LogInfo(string message)
        {
            WriteLog("INFO", message);
        }

        public void LogWarning(string message)
        {
            WriteLog("WARN", message);
        }

        public void LogError(string message, Exception? ex = null)
        {
            string fullMessage = ex != null ? $"{message} | Exception: {ex}" : message;
            WriteLog("ERROR", fullMessage);
        }

        public void LogAudit(string action, string? details = null)
        {
            string message = $"[AUDIT] {action}" + (details != null ? $" - {details}" : string.Empty);
            WriteLog("AUDIT", message);
        }

        private void WriteLog(string level, string message)
        {
            try
            {
                string timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss.fff");
                string logLine = $"{timestamp} [{level}] {message}";
                string logFile = Path.Combine(_logFolder, $"agent-{DateTime.UtcNow:yyyy-MM-dd}.log");

                lock (_lockObj)
                {
                    File.AppendAllText(logFile, logLine + Environment.NewLine, Encoding.UTF8);

                    if (new FileInfo(logFile).Length > MaxFileSizeBytes)
                    {
                        RotateLogsIfNeeded();
                    }
                }

                OnLogAdded?.Invoke($"{timestamp} [{level}] {message}");
            }
            catch
            {
            }
        }

        private void RotateLogsIfNeeded()
        {
            try
            {
                var logFiles = new DirectoryInfo(_logFolder)
                    .GetFiles("agent-*.log")
                    .OrderByDescending(f => f.CreationTime)
                    .ToList();

                if (logFiles.Count > MaxLogFiles)
                {
                    foreach (var oldFile in logFiles.Skip(MaxLogFiles))
                    {
                        try { oldFile.Delete(); } catch { }
                    }
                }
            }
            catch
            {
            }
        }
    }
}
