using System.Threading.Tasks;

namespace Agent.Core.Interfaces
{
    public interface ISecurityService
    {
        bool IsTampered { get; }
        event Action<bool>? OnTamperDetected;
        Task<bool> VerifyIntegrityAsync();
        Task RecordAuditAsync(string action, string? details = null);
    }
}
