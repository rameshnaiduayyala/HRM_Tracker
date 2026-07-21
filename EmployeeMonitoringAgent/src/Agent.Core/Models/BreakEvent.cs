namespace Agent.Core.Models
{
    public class BreakEvent
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string BreakType { get; set; } = "Working";
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int DurationSeconds { get; set; }
        public bool IsExceeded { get; set; }
    }
}
