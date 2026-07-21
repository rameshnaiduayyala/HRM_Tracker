using System;

namespace Agent.Domain.Entities
{
    public class AttendanceLog
    {
        public string Id { get; private set; }
        public DateTime ClockInTime { get; private set; }
        public DateTime? ClockOutTime { get; private set; }
        public bool IsClockedIn => ClockOutTime == null;

        public AttendanceLog(string id, DateTime clockInTime)
        {
            Id = id ?? Guid.NewGuid().ToString();
            ClockInTime = clockInTime;
        }

        public void ClockOut(DateTime clockOutTime)
        {
            ClockOutTime = clockOutTime;
        }
    }
}
