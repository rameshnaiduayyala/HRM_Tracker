using System;

namespace Agent.Domain.Entities
{
    public class WorkSession
    {
        public string Id { get; private set; }
        public DateTime StartTime { get; private set; }
        public DateTime? EndTime { get; private set; }
        public bool IsActive { get; private set; }

        public WorkSession(string id, DateTime startTime)
        {
            Id = id ?? Guid.NewGuid().ToString();
            StartTime = startTime;
            IsActive = true;
        }

        public void Stop(DateTime endTime)
        {
            EndTime = endTime;
            IsActive = false;
        }
    }
}
