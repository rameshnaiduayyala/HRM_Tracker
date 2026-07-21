using System;

namespace Agent.Core.Models
{
    public class DeviceInfo
    {
        public string DeviceId { get; set; } = string.Empty;
        public string CompanyId { get; set; } = string.Empty;
        public string EmployeeId { get; set; } = string.Empty;
        public string ComputerName { get; set; } = string.Empty;
        public string OperatingSystem { get; set; } = string.Empty;
        public string AgentVersion { get; set; } = string.Empty;
        public string TimeZone { get; set; } = string.Empty;
        public DateTime? LastSyncAt { get; set; }
        public string RegistrationStatus { get; set; } = "Pending";
    }
}
