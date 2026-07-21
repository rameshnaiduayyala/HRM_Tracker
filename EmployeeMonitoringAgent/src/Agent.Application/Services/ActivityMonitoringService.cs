using System;
using System.Threading.Tasks;
using Agent.Core.Interfaces;
using Agent.Core.Models;

namespace Agent.Application.Services
{
    public class ActivityMonitoringService : IActivityMonitoringService
    {
        private readonly IEnhancedLoggerService _logger;
        public double TotalActiveSeconds { get; private set; }
        public double TotalIdleSeconds { get; private set; }
        public int KeyboardActivityLevel { get; private set; }
        public int MouseActivityLevel { get; private set; }
        public event Action<double, double>? OnActivityUpdated;
        public event Action<int, int>? OnInputActivityUpdated;

        public ActivityMonitoringService(IEnhancedLoggerService logger)
        {
            _logger = logger;
        }

        public async Task RecordActivityAsync(double activeSeconds, double idleSeconds, int keyboardLevel, int mouseLevel)
        {
            try
            {
                TotalActiveSeconds += activeSeconds;
                TotalIdleSeconds += idleSeconds;
                KeyboardActivityLevel = keyboardLevel;
                MouseActivityLevel = mouseLevel;

                OnActivityUpdated?.Invoke(TotalActiveSeconds, TotalIdleSeconds);
                OnInputActivityUpdated?.Invoke(keyboardLevel, mouseLevel);

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to record activity: {ex.Message}", ex);
            }
        }

        public void Reset()
        {
            TotalActiveSeconds = 0;
            TotalIdleSeconds = 0;
            KeyboardActivityLevel = 0;
            MouseActivityLevel = 0;
            _logger.LogInfo("Activity tracking counters reset.");
        }
    }
}
