using System.Threading.Tasks;

namespace Agent.Core.Interfaces
{
    public interface IUpdateService
    {
        string CurrentVersion { get; }
        string? AvailableVersion { get; }
        event Action<string>? OnUpdateAvailable;
        event Action<string>? OnUpdateProgress;
        event Action? OnUpdateCompleted;
        Task CheckForUpdatesAsync();
        Task DownloadUpdateAsync(string version);
        Task InstallUpdateAsync();
    }
}
