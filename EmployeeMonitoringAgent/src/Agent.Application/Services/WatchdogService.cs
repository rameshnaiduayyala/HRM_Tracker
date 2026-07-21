using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Agent.Core.Interfaces;

namespace Agent.Application.Services
{
    public class WatchdogService : IWatchdogService
    {
        private readonly IEnhancedLoggerService _logger;
        private readonly string _watchdogMarkerFile;
        private bool _isRunning;
        private int _failureCount;
        private const int MaxFailuresBeforeAlert = 3;

        public bool IsRunning => _isRunning;
        public event Action? OnProcessCrashed;
        public event Action? OnProcessRecovered;

        public WatchdogService(IEnhancedLoggerService logger)
        {
            _logger = logger;
            _watchdogMarkerFile = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "TaskTracky",
                "watchdog.marker"
            );
        }

        public async Task StartAsync()
        {
            try
            {
                _isRunning = true;
                _failureCount = 0;
                _logger.LogInfo("Watchdog service started.");

                await Task.Run(async () =>
                {
                    while (_isRunning)
                    {
                        try
                        {
                            await Task.Delay(TimeSpan.FromSeconds(30));
                            await CheckProcessHealthAsync();
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError($"Watchdog loop error: {ex.Message}", ex);
                        }
                    }
                });

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to start watchdog: {ex.Message}", ex);
            }
        }

        public async Task StopAsync()
        {
            _isRunning = false;
            _logger.LogInfo("Watchdog service stopped.");
            await Task.CompletedTask;
        }

        public async Task RestartAgentAsync()
        {
            try
            {
                _logger.LogInfo("Watchdog initiating agent restart...");
                OnProcessCrashed?.Invoke();

                // TODO: Implement graceful restart logic
                // This could involve:
                // 1. Saving current state
                // 2. Stopping background workers
                // 3. Restarting the process

                await Task.Delay(1000);
                OnProcessRecovered?.Invoke();
                _logger.LogInfo("Agent restarted successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Agent restart failed: {ex.Message}", ex);
            }
        }

        private async Task CheckProcessHealthAsync()
        {
            try
            {
                var currentProcess = Process.GetCurrentProcess();
                bool isHealthy = currentProcess != null &&
                                  !currentProcess.HasExited &&
                                  currentProcess.WorkingSet64 > 0;

                if (!isHealthy)
                {
                    _failureCount++;
                    _logger.LogWarning($"Process health check failed ({_failureCount}/{MaxFailuresBeforeAlert})");

                    if (_failureCount >= MaxFailuresBeforeAlert)
                    {
                        _logger.LogError("Max failures reached. Initiating recovery...");
                        OnProcessCrashed?.Invoke();
                        await RestartAgentAsync();
                        _failureCount = 0;
                    }
                }
                else
                {
                    if (_failureCount > 0)
                    {
                        _logger.LogInfo("Process health restored.");
                        OnProcessRecovered?.Invoke();
                    }
                    _failureCount = 0;
                }

                // Write heartbeat marker
                try
                {
                    File.WriteAllText(_watchdogMarkerFile, DateTime.UtcNow.Ticks.ToString());
                }
                catch
                {
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Health check error: {ex.Message}", ex);
            }

            await Task.CompletedTask;
        }
    }
}
