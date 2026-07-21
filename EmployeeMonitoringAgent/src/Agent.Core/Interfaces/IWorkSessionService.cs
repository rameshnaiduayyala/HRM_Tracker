using System;
using System.Threading.Tasks;

namespace Agent.Core.Interfaces
{
    public interface IWorkSessionService
    {
        bool IsSessionActive { get; }
        bool IsTemporarilyIdle { get; set; }
        int TrackedSeconds { get; set; }
        string BreakReason { get; set; }
        event Action? OnSessionStatusChanged;
        Task<bool> StartSessionAsync();
        Task<bool> StopSessionAsync(string? reason = null);
        Task<bool> UpdateLastSessionReasonAsync(string reason);
        Task<bool> SendHeartbeatAsync(string activeApp, string windowTitle, double activeDuration, double idleDuration);
        Task<bool> UploadScreenshotAsync(string base64Image);
    }
}
