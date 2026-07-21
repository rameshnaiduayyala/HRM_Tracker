using System;
using System.Threading.Tasks;
using Agent.Core.Interfaces;
using Agent.Core.Models;

namespace Agent.Application.Services
{
    public class WorkSessionService : IWorkSessionService
    {
        private readonly IApiClient _apiClient;
        private readonly IOfflineQueue _offlineQueue;
        private readonly ILoggerService _logger;

        public bool IsSessionActive { get; private set; }
        public bool IsTemporarilyIdle { get; set; }
        public int TrackedSeconds { get; set; }
        public string BreakReason { get; set; } = "Working";
        public event Action? OnSessionStatusChanged;

        public WorkSessionService(IApiClient apiClient, IOfflineQueue offlineQueue, ILoggerService logger)
        {
            _apiClient = apiClient;
            _offlineQueue = offlineQueue;
            _logger = logger;
        }

        public async Task<bool> StartSessionAsync()
        {
            try
            {
                _logger.Log("Starting work session tracker...");
                bool success = await _apiClient.StartWorkSessionAsync();
                if (success)
                {
                    IsSessionActive = true;
                    IsTemporarilyIdle = false;
                    _logger.Log("Work session tracker active. Background activity loop started.");
                    OnSessionStatusChanged?.Invoke();
                    return true;
                }
                _logger.Log("Failed to activate work session.");
                return false;
            }
            catch (Exception ex)
            {
                _logger.Log($"Failed to activate session: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> StopSessionAsync(string? reason = null)
        {
            try
            {
                _logger.Log($"Stopping work session tracker with reason: {reason ?? "none"}...");
                bool success = await _apiClient.StopWorkSessionAsync(reason);
                IsSessionActive = false;
                _logger.Log("Work session tracker paused.");
                OnSessionStatusChanged?.Invoke();
                return success;
            }
            catch (Exception ex)
            {
                _logger.Log($"Failed to stop session: {ex.Message}");
                IsSessionActive = false;
                OnSessionStatusChanged?.Invoke();
                return false;
            }
        }

        public async Task<bool> UpdateLastSessionReasonAsync(string reason)
        {
            try
            {
                _logger.Log($"Updating last completed work session reason to: {reason}...");
                return await _apiClient.UpdateLastSessionReasonAsync(reason);
            }
            catch (Exception ex)
            {
                _logger.Log($"Failed to update last session reason: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendHeartbeatAsync(string activeApp, string windowTitle, double activeDuration, double idleDuration)
        {
            var hbPayload = new
            {
                app = activeApp,
                windowTitle = windowTitle,
                idleDuration = (int)idleDuration,
                activeDuration = (int)activeDuration
            };

            try
            {
                bool success = await _apiClient.SendHeartbeatAsync(hbPayload);
                if (success)
                {
                    _logger.Log($"Heartbeat synced: {activeApp} ({windowTitle})");
                    return true;
                }
                else
                {
                    _offlineQueue.Enqueue("heartbeat", hbPayload);
                    _logger.Log("Heartbeat failed, queued offline.");
                    return false;
                }
            }
            catch
            {
                _offlineQueue.Enqueue("heartbeat", hbPayload);
                _logger.Log("Heartbeat network failure, queued offline.");
                return false;
            }
        }

        public async Task<bool> UploadScreenshotAsync(string base64Image)
        {
            var ssPayload = new { image = base64Image };
            try
            {
                bool success = await _apiClient.UploadScreenshotAsync(ssPayload);
                if (success)
                {
                    _logger.Log("Screenshot synced successfully.");
                    return true;
                }
                else
                {
                    _offlineQueue.Enqueue("screenshot", ssPayload);
                    _logger.Log("Screenshot sync failed, queued offline.");
                    return false;
                }
            }
            catch
            {
                _offlineQueue.Enqueue("screenshot", ssPayload);
                _logger.Log("Screenshot network failure, queued offline.");
                return false;
            }
        }
    }
}
