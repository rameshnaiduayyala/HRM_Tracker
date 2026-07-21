using System.Threading.Tasks;
using Agent.Core.Models;

namespace Agent.Core.Interfaces
{
    public interface IActivityMonitoringService
    {
        double TotalActiveSeconds { get; }
        double TotalIdleSeconds { get; }
        int KeyboardActivityLevel { get; }
        int MouseActivityLevel { get; }
        event Action<double, double>? OnActivityUpdated;
        event Action<int, int>? OnInputActivityUpdated;
        Task RecordActivityAsync(double activeSeconds, double idleSeconds, int keyboardLevel, int mouseLevel);
        void Reset();
    }
}
