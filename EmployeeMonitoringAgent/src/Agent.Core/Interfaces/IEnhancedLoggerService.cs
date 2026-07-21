using System;

namespace Agent.Core.Interfaces
{
    public interface IEnhancedLoggerService
    {
        event Action<string>? OnLogAdded;
        void LogInfo(string message);
        void LogWarning(string message);
        void LogError(string message, Exception? ex = null);
        void LogAudit(string action, string? details = null);
    }
}
