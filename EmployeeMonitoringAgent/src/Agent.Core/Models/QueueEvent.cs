using System;

namespace Agent.Core.Models
{
    public class QueueEvent
    {
        public string Type { get; set; } = string.Empty;
        public object Payload { get; set; } = new();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
