namespace Agent.Core.Models
{
    public class WebsiteUsage
    {
        public string Domain { get; set; } = string.Empty;
        public string? PageTitle { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int DurationSeconds { get; set; }
        public string Category { get; set; } = "Unknown";
    }
}
