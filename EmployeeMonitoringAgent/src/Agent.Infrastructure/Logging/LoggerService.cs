using System;
using Agent.Core.Interfaces;

namespace Agent.Infrastructure.Logging
{
    public class LoggerService : ILoggerService
    {
        public event Action<string>? OnLogAdded;

        public void Log(string message)
        {
            string timestamped = $"[{DateTime.Now.ToLongTimeString()}] {message}";
            OnLogAdded?.Invoke(timestamped);
        }
    }
}
