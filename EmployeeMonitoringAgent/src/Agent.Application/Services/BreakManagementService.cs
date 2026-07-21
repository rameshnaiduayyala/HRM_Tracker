using System;
using System.Threading.Tasks;
using Agent.Core.Interfaces;
using Agent.Core.Models;

namespace Agent.Application.Services
{
    public class BreakManagementService : IBreakManagementService
    {
        private readonly IEnhancedLoggerService _logger;
        private readonly IWorkSessionService _workSessionService;
        private BreakEvent? _currentBreak;
        private DateTime _breakStartTime;

        public BreakEvent? CurrentBreak => _currentBreak;
        public bool IsOnBreak => _currentBreak != null && _currentBreak.EndTime == null;
        public event Action<BreakEvent>? OnBreakStarted;
        public event Action<BreakEvent>? OnBreakEnded;
        public event Action<bool>? OnBreakLimitExceeded;

        public BreakManagementService(IWorkSessionService workSessionService, IEnhancedLoggerService logger)
        {
            _workSessionService = workSessionService;
            _logger = logger;
        }

        public async Task StartBreakAsync(string breakType)
        {
            try
            {
                if (IsOnBreak)
                {
                    await EndBreakAsync();
                }

                _breakStartTime = DateTime.UtcNow;
                _currentBreak = new BreakEvent
                {
                    BreakType = breakType,
                    StartTime = _breakStartTime,
                };

                _logger.LogInfo($"Break started: {breakType}");
                OnBreakStarted?.Invoke(_currentBreak);

                if (_workSessionService.IsSessionActive)
                {
                    await _workSessionService.StopSessionAsync($"Break: {breakType}");
                }

                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to start break: {ex.Message}", ex);
            }
        }

        public async Task EndBreakAsync()
        {
            try
            {
                if (!IsOnBreak || _currentBreak == null) return;

                _currentBreak.EndTime = DateTime.UtcNow;
                _currentBreak.DurationSeconds = (int)(_currentBreak.EndTime.Value - _currentBreak.StartTime).TotalSeconds;

                _logger.LogInfo($"Break ended: {_currentBreak.BreakType} ({_currentBreak.DurationSeconds}s)");
                OnBreakEnded?.Invoke(_currentBreak);

                if (!_workSessionService.IsSessionActive)
                {
                    await _workSessionService.StartSessionAsync();
                }

                _currentBreak = null;
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to end break: {ex.Message}", ex);
            }
        }
    }
}
