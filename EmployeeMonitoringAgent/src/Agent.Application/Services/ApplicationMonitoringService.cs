using System;
using System.Threading.Tasks;
using Agent.Core.Interfaces;
using Agent.Core.Models;

namespace Agent.Application.Services
{
    public class ApplicationMonitoringService : IApplicationMonitoringService
    {
        private readonly IActiveWindowMonitor _activeWindowMonitor;
        private readonly IEnhancedLoggerService _logger;
        private ApplicationUsage? _currentApplication;
        private DateTime _lastAppSwitch = DateTime.UtcNow;

        public ApplicationUsage? CurrentApplication => _currentApplication;
        public event Action<ApplicationUsage>? OnApplicationChanged;

        public ApplicationMonitoringService(IActiveWindowMonitor activeWindowMonitor, IEnhancedLoggerService logger)
        {
            _activeWindowMonitor = activeWindowMonitor;
            _logger = logger;
        }

        public async Task TrackApplicationAsync(string processName, string windowTitle)
        {
            try
            {
                if (_currentApplication == null ||
                    !string.Equals(_currentApplication.ProcessName, processName, StringComparison.OrdinalIgnoreCase) ||
                    !string.Equals(_currentApplication.WindowTitle, windowTitle, StringComparison.Ordinal))
                {
                    var previous = _currentApplication;
                    _currentApplication = new ApplicationUsage
                    {
                        ProcessName = processName,
                        WindowTitle = windowTitle,
                        StartTime = DateTime.UtcNow,
                        Category = CategorizeApplication(processName),
                        IsProductive = IsProductiveApplication(processName),
                    };

                    _lastAppSwitch = DateTime.UtcNow;
                    OnApplicationChanged?.Invoke(_currentApplication);

                    if (previous != null)
                    {
                        previous.EndTime = _lastAppSwitch;
                        previous.DurationSeconds = (int)(_lastAppSwitch - previous.StartTime).TotalSeconds;
                        await RecordUsageAsync(previous);
                    }
                }
                else if (_currentApplication.EndTime == null)
                {
                    _currentApplication.DurationSeconds = (int)(DateTime.UtcNow - _currentApplication.StartTime).TotalSeconds;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Application monitoring error: {ex.Message}", ex);
            }

            await Task.CompletedTask;
        }

        public async Task RecordUsageAsync(ApplicationUsage usage)
        {
            try
            {
                _logger.LogInfo($"App usage recorded: {usage.ProcessName} ({usage.DurationSeconds}s) - {usage.Category}");
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to record app usage: {ex.Message}", ex);
            }
        }

        private string CategorizeApplication(string processName)
        {
            string lower = processName.ToLowerInvariant();
            if (lower.Contains("code") || lower.Contains("studio") || lower.Contains("vim") || lower.Contains("notepad"))
                return "Development";
            if (lower.Contains("word") || lower.Contains("excel") || lower.Contains("powerpoint") || lower.Contains("outlook"))
                return "Office";
            if (lower.Contains("chrome") || lower.Contains("firefox") || lower.Contains("edge") || lower.Contains("browser"))
                return "Browser";
            if (lower.Contains("teams") || lower.Contains("zoom") || lower.Contains("slack") || lower.Contains("meet"))
                return "Communication";
            if (lower.Contains("explorer") || lower.Contains("file"))
                return "File Management";
            return "Other";
        }

        private bool IsProductiveApplication(string processName)
        {
            string lower = processName.ToLowerInvariant();
            return !(lower.Contains("game") || lower.Contains("steam") || lower.Contains("discord") || lower.Contains("youtube"));
        }
    }
}
