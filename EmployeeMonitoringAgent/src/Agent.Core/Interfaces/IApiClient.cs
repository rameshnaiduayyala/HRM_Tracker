using System.Threading.Tasks;
using Agent.Core.Models;

namespace Agent.Core.Interfaces
{
    public interface IApiClient
    {
        string BaseAddress { get; }
        string Token { get; }
        void Configure(string baseAddress, string? token = null);
        Task<AuthResult> LoginAsync(string email, string password);
        Task<bool> RegisterDeviceAsync(string fingerprint, string name);
        Task<AttendanceStatus> GetAttendanceStatusAsync();
        Task<bool> ClockInAsync();
        Task<bool> ClockOutAsync();
        Task<bool> StartWorkSessionAsync();
        Task<bool> StopWorkSessionAsync();
        Task<bool> SendHeartbeatAsync(object payload);
        Task<bool> UploadScreenshotAsync(object payload);
    }
}
