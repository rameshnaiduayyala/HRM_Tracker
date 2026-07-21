namespace Agent.Core.Models
{
    public class ApplicationUsage
    {
        public string ProcessName { get; set; } = string.Empty;
        public string WindowTitle { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int DurationSeconds { get; set; }
        public string Category { get; set; } = "Unknown";
        public bool IsProductive { get; set; }
    }
}
