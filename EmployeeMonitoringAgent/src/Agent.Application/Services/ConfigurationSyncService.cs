using System;
using System.Threading.Tasks;
using System.Text.Json;
using Agent.Core.Interfaces;
using Agent.Core.Models;

namespace Agent.Application.Services
{
    public class ConfigurationSyncService : IConfigurationSyncService
    {
        private readonly IApiClient _apiClient;
        private readonly IEnhancedLoggerService _logger;
        private AgentConfig? _currentConfig;

        public AgentConfig? CurrentConfig => _currentConfig;
        public event Action<AgentConfig>? OnConfigUpdated;

        public ConfigurationSyncService(IApiClient apiClient, IEnhancedLoggerService logger)
        {
            _apiClient = apiClient;
            _logger = logger;
        }

        public async Task<bool> FetchConfigAsync()
        {
            try
            {
                _logger.LogInfo("Fetching company configuration policies...");

                // TODO: Replace with actual API endpoint when backend endpoint is ready
                // For now, return a default config based on environment or cached config
                _currentConfig ??= new AgentConfig
                {
                    CompanyId = "default",
                    ScreenshotEnabled = true,
                    ScreenshotIntervalSeconds = 60,
                    ActivityMonitoringEnabled = true,
                    WebsiteMonitoringEnabled = false,
                    IdleTimeoutSeconds = 300,
                    WorkStartTime = "09:00",
                    WorkEndTime = "18:00",
                    MaxBreakDurationMinutes = 60,
                    AllowManualTimeEntries = false,
                    RequireApprovalForOvertime = true,
                };

                _logger.LogInfo($"Configuration synced. Screenshot interval: {_currentConfig.ScreenshotIntervalSeconds}s, Idle timeout: {_currentConfig.IdleTimeoutSeconds}s");
                OnConfigUpdated?.Invoke(_currentConfig);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to fetch configuration: {ex.Message}", ex);
                return false;
            }
        }
    }
}
