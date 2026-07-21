using System.Threading.Tasks;
using Agent.Core.Models;

namespace Agent.Core.Interfaces
{
    public interface IConfigurationSyncService
    {
        AgentConfig? CurrentConfig { get; }
        event Action<AgentConfig>? OnConfigUpdated;
        Task<bool> FetchConfigAsync();
    }
}
