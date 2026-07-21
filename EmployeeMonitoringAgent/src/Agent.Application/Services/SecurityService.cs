using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Agent.Core.Interfaces;

namespace Agent.Application.Services
{
    public class SecurityService : ISecurityService
    {
        private readonly IEnhancedLoggerService _logger;
        private readonly string _integrityFile;
        private bool _isTampered;

        public bool IsTampered => _isTampered;
        public event Action<bool>? OnTamperDetected;

        public SecurityService(IEnhancedLoggerService logger)
        {
            _logger = logger;
            _integrityFile = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "TaskTracky",
                ".integrity"
            );
        }

        public async Task<bool> VerifyIntegrityAsync()
        {
            try
            {
                _logger.LogInfo("Verifying agent integrity...");

                string executablePath = Environment.ProcessPath ?? string.Empty;
                if (string.IsNullOrEmpty(executablePath) || !File.Exists(executablePath))
                {
                    _logger.LogWarning("Executable path not found during integrity check.");
                    return true;
                }

                string currentHash = ComputeFileHash(executablePath);

                if (File.Exists(_integrityFile))
                {
                    string storedHash = File.ReadAllText(_integrityFile).Trim();
                    bool isMatch = string.Equals(storedHash, currentHash, StringComparison.OrdinalIgnoreCase);

                    if (!isMatch)
                    {
                        _isTampered = true;
                        _logger.LogError("INTEGRITY VIOLATION: Agent executable has been modified!");
                        OnTamperDetected?.Invoke(true);
                        return false;
                    }

                    _isTampered = false;
                    OnTamperDetected?.Invoke(false);
                    _logger.LogInfo("Integrity verification passed.");
                    return true;
                }
                else
                {
                    File.WriteAllText(_integrityFile, currentHash);
                    _logger.LogInfo("Integrity baseline established.");
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Integrity verification failed: {ex.Message}", ex);
                return true;
            }
        }

        public async Task RecordAuditAsync(string action, string? details = null)
        {
            try
            {
                string message = $"{action}" + (details != null ? $" | {details}" : string.Empty);
                _logger.LogAudit(action, details);
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Audit logging failed: {ex.Message}", ex);
            }
        }

        private string ComputeFileHash(string filePath)
        {
            try
            {
                using var sha256 = SHA256.Create();
                using var stream = File.OpenRead(filePath);
                byte[] hashBytes = sha256.ComputeHash(stream);
                return Convert.ToBase64String(hashBytes);
            }
            catch
            {
                return string.Empty;
            }
        }
    }
}
