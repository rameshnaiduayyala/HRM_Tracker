using System.Threading.Tasks;
using Agent.Core.Models;

namespace Agent.Core.Interfaces
{
    public interface IWebsiteMonitoringService
    {
        WebsiteUsage? CurrentWebsite { get; }
        event Action<WebsiteUsage>? OnWebsiteChanged;
        Task TrackWebsiteAsync(string domain, string? pageTitle);
        Task RecordUsageAsync(WebsiteUsage usage);
    }
}
