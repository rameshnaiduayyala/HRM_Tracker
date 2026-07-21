using System;

namespace Agent.Core.Interfaces
{
    public interface ILoggerService
    {
        event Action<string> OnLogAdded;
        void Log(string message);
    }
}
