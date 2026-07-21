using System;
using System.Threading.Tasks;
using System.Windows.Threading;
using Agent.Core.Interfaces;

namespace Agent.Background
{
    public class ConfigSyncWorker
    {
        private readonly IConfigurationSyncService _configSync;
        private readonly IEnhancedLoggerService _logger;
        private DispatcherTimer? _timer;

        public ConfigSyncWorker(IConfigurationSyncService configSync, IEnhancedLoggerService logger)
        {
            _configSync = configSync;
            _logger = logger;
        }

        public void Start(int intervalMinutes = 5)
        {
            if (_timer != null) return;

            _timer = new DispatcherTimer
            {
                Interval = TimeSpan.FromMinutes(intervalMinutes)
            };
            _timer.Tick += async (s, e) => await SyncConfigAsync();
            _timer.Start();
            _logger.LogInfo("ConfigSyncWorker started.");
        }

        public void Stop()
        {
            _timer?.Stop();
            _timer = null;
            _logger.LogInfo("ConfigSyncWorker stopped.");
        }

        public async Task SyncConfigAsync()
        {
            try
            {
                await _configSync.FetchConfigAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Config sync failed: {ex.Message}", ex);
            }
        }
    }
}
