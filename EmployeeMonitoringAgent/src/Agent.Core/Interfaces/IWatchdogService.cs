using System.Threading.Tasks;

namespace Agent.Core.Interfaces
{
    public interface IWatchdogService
    {
        bool IsRunning { get; }
        event Action? OnProcessCrashed;
        event Action? OnProcessRecovered;
        Task StartAsync();
        Task StopAsync();
        Task RestartAgentAsync();
    }
}
