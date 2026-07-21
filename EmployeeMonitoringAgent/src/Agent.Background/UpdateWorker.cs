using System;
using System.Threading.Tasks;
using System.Windows.Threading;
using Agent.Core.Interfaces;

namespace Agent.Background
{
    public class UpdateWorker
    {
        private readonly IUpdateService _updateService;
        private readonly IEnhancedLoggerService _logger;
        private DispatcherTimer? _timer;

        public UpdateWorker(IUpdateService updateService, IEnhancedLoggerService logger)
        {
            _updateService = updateService;
            _logger = logger;
        }

        public void Start(int intervalHours = 24)
        {
            if (_timer != null) return;

            _timer = new DispatcherTimer
            {
                Interval = TimeSpan.FromHours(intervalHours)
            };
            _timer.Tick += async (s, e) => await CheckUpdatesAsync();
            _timer.Start();

            _ = CheckUpdatesAsync();
            _logger.LogInfo("UpdateWorker started.");
        }

        public void Stop()
        {
            _timer?.Stop();
            _timer = null;
            _logger.LogInfo("UpdateWorker stopped.");
        }

        public async Task CheckUpdatesAsync()
        {
            try
            {
                await _updateService.CheckForUpdatesAsync();
                if (!string.IsNullOrEmpty(_updateService.AvailableVersion))
                {
                    _logger.LogInfo($"Update available: {_updateService.AvailableVersion}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Update check failed: {ex.Message}", ex);
            }
        }
    }
}
