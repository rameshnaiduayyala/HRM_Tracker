using System;
using System.Threading.Tasks;
using Agent.Core.Interfaces;

namespace Agent.Background
{
    public class WatchdogWorker
    {
        private readonly IWatchdogService _watchdog;
        private readonly IEnhancedLoggerService _logger;

        public WatchdogWorker(IWatchdogService watchdog, IEnhancedLoggerService logger)
        {
            _watchdog = watchdog;
            _logger = logger;
        }

        public async Task StartAsync()
        {
            try
            {
                _watchdog.OnProcessCrashed += () => _logger.LogWarning("Watchdog detected process crash.");
                _watchdog.OnProcessRecovered += () => _logger.LogInfo("Watchdog recovered process.");

                await _watchdog.StartAsync();
                _logger.LogInfo("WatchdogWorker started.");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to start WatchdogWorker: {ex.Message}", ex);
            }
        }

        public async Task StopAsync()
        {
            await _watchdog.StopAsync();
            _logger.LogInfo("WatchdogWorker stopped.");
        }
    }
}
