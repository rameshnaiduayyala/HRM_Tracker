using System;
using System.Threading.Tasks;
using Agent.Core.Interfaces;
using Agent.Core.Models;

namespace Agent.Application.Services
{
    public class AttendanceService : IAttendanceService
    {
        private readonly IApiClient _apiClient;
        private readonly ILoggerService _logger;

        public bool IsClockedIn { get; private set; }
        public bool IsShiftCompleted { get; private set; }
        public event Action? OnAttendanceStatusChanged;

        public AttendanceService(IApiClient apiClient, ILoggerService logger)
        {
            _apiClient = apiClient;
            _logger = logger;
        }

        public async Task<bool> RefreshStatusAsync()
        {
            try
            {
                var status = await _apiClient.GetAttendanceStatusAsync();
                IsClockedIn = status.IsClockedIn;
                IsShiftCompleted = status.IsShiftCompleted;
                OnAttendanceStatusChanged?.Invoke();
                return true;
            }
            catch (Exception ex)
            {
                _logger.Log($"Error updating attendance status: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ClockInAsync()
        {
            try
            {
                _logger.Log("Sending clock-in shift log request...");
                bool success = await _apiClient.ClockInAsync();
                if (success)
                {
                    IsClockedIn = true;
                    _logger.Log("Shift started (Clocked In).");
                    OnAttendanceStatusChanged?.Invoke();
                    return true;
                }
                _logger.Log("Failed to update shift clock-in status.");
                return false;
            }
            catch (Exception ex)
            {
                _logger.Log($"Attendance ClockIn error: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> ClockOutAsync()
        {
            try
            {
                _logger.Log("Sending clock-out shift log request...");
                bool success = await _apiClient.ClockOutAsync();
                if (success)
                {
                    IsClockedIn = false;
                    IsShiftCompleted = true;
                    _logger.Log("Shift completed (Clocked Out).");
                    OnAttendanceStatusChanged?.Invoke();
                    return true;
                }
                _logger.Log("Failed to update shift clock-out status.");
                return false;
            }
            catch (Exception ex)
            {
                _logger.Log($"Attendance ClockOut error: {ex.Message}");
                return false;
            }
        }
    }
}
