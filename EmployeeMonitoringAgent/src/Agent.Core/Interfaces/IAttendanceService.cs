using System;
using System.Threading.Tasks;

namespace Agent.Core.Interfaces
{
    public interface IAttendanceService
    {
        bool IsClockedIn { get; }
        bool IsShiftCompleted { get; }
        event Action? OnAttendanceStatusChanged;
        Task<bool> RefreshStatusAsync();
        Task<bool> ClockInAsync();
        Task<bool> ClockOutAsync();
    }
}
