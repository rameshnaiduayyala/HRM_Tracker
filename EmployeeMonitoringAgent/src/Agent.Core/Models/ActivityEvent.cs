using System;

namespace Agent.Core.Models
{
    public class ActivityEvent
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string EventType { get; set; } = string.Empty;
        public string? Details { get; set; }
        public double DurationSeconds { get; set; }
    }
}
