namespace Agent.Core.Models
{
    public class AgentConfig
    {
        public string CompanyId { get; set; } = string.Empty;
        public bool ScreenshotEnabled { get; set; } = true;
        public int ScreenshotIntervalSeconds { get; set; } = 60;
        public bool ActivityMonitoringEnabled { get; set; } = true;
        public bool WebsiteMonitoringEnabled { get; set; } = false;
        public double IdleTimeoutSeconds { get; set; } = 300;
        public string WorkStartTime { get; set; } = "09:00";
        public string WorkEndTime { get; set; } = "18:00";
        public int MaxBreakDurationMinutes { get; set; } = 60;
        public bool AllowManualTimeEntries { get; set; } = false;
        public bool RequireApprovalForOvertime { get; set; } = true;
        public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
    }
}
