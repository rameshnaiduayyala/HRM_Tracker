using System.Threading.Tasks;
using Agent.Core.Models;

namespace Agent.Core.Interfaces
{
    public interface IBreakManagementService
    {
        BreakEvent? CurrentBreak { get; }
        bool IsOnBreak { get; }
        event Action<BreakEvent>? OnBreakStarted;
        event Action<BreakEvent>? OnBreakEnded;
        event Action<bool>? OnBreakLimitExceeded;
        Task StartBreakAsync(string breakType);
        Task EndBreakAsync();
    }
}
