using System.Threading.Tasks;
using Agent.Core.Models;

namespace Agent.Core.Interfaces
{
    public interface IApplicationMonitoringService
    {
        ApplicationUsage? CurrentApplication { get; }
        event Action<ApplicationUsage>? OnApplicationChanged;
        Task TrackApplicationAsync(string processName, string windowTitle);
        Task RecordUsageAsync(ApplicationUsage usage);
    }
}
