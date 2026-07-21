using System;
using System.Threading.Tasks;
using System.Windows.Threading;
using Agent.Core.Interfaces;
using Agent.Core.Models;

namespace Agent.Background
{
    public class TelemetryWorker
    {
        private readonly IWorkSessionService _workSessionService;
        private readonly IIdleDetector _idleDetector;
        private readonly IActiveWindowMonitor _activeWindowMonitor;
        private readonly IScreenCaptureService _screenCaptureService;
        private readonly ILoggerService _logger;
        private readonly IConfigurationSyncService _configSync;
        private readonly IApplicationMonitoringService _appMonitoring;
        private readonly IWebsiteMonitoringService _websiteMonitoring;
        private readonly IBreakManagementService _breakManagement;
        private readonly IActivityMonitoringService _activityMonitoring;

        private DispatcherTimer? _monitorTimer;
        private DispatcherTimer? _clockTimer;
        private int _screenshotTicks = 0;
        private int _appMonitorTicks = 0;

        public event Action? OnInactivityDetected;
        public event Action<string, string>? OnActiveWindowChanged;
        public event Action<double>? OnIdleTimeUpdated;
        public event Action<int>? OnTrackedTimeUpdated;

        public TelemetryWorker(
            IWorkSessionService workSessionService,
            IIdleDetector idleDetector,
            IActiveWindowMonitor activeWindowMonitor,
            IScreenCaptureService screenCaptureService,
            ILoggerService logger,
            IConfigurationSyncService configSync,
            IApplicationMonitoringService appMonitoring,
            IWebsiteMonitoringService websiteMonitoring,
            IBreakManagementService breakManagement,
            IActivityMonitoringService activityMonitoring)
        {
            _workSessionService = workSessionService;
            _idleDetector = idleDetector;
            _activeWindowMonitor = activeWindowMonitor;
            _screenCaptureService = screenCaptureService;
            _logger = logger;
            _configSync = configSync;
            _appMonitoring = appMonitoring;
            _websiteMonitoring = websiteMonitoring;
            _breakManagement = breakManagement;
            _activityMonitoring = activityMonitoring;
        }

        public void Start()
        {
            if (_monitorTimer != null) return;

            _monitorTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(10) };
            _monitorTimer.Tick += async (s, e) => await MonitorTimer_Tick();
            _monitorTimer.Start();

            _clockTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
            _clockTimer.Tick += ClockTimer_Tick;
            _clockTimer.Start();

            _logger.Log("Telemetry workers started.");
        }

        public void Stop()
        {
            _monitorTimer?.Stop();
            _monitorTimer = null;

            _clockTimer?.Stop();
            _clockTimer = null;

            _logger.Log("Telemetry workers stopped.");
        }

        private void ClockTimer_Tick(object? sender, EventArgs e)
        {
            if (!_workSessionService.IsTemporarilyIdle && _workSessionService.IsSessionActive && !_breakManagement.IsOnBreak)
            {
                _workSessionService.TrackedSeconds++;
                OnTrackedTimeUpdated?.Invoke(_workSessionService.TrackedSeconds);
            }
        }

        private async Task MonitorTimer_Tick()
        {
            try
            {
                // 1. Get idle time
                double idleSeconds = _idleDetector.GetIdleTimeSeconds();
                OnIdleTimeUpdated?.Invoke(idleSeconds);

                // 2. Auto-suspend session if idle >= config threshold
                double idleThreshold = _configSync.CurrentConfig?.IdleTimeoutSeconds ?? 300;
                if (idleSeconds >= idleThreshold)
                {
                    if (!_workSessionService.IsTemporarilyIdle && !_breakManagement.IsOnBreak)
                    {
                        _workSessionService.IsTemporarilyIdle = true;
                        _logger.Log($"Inactivity detected ({idleSeconds}s idle). Suspending session...");
                        OnInactivityDetected?.Invoke();
                        await _workSessionService.StopSessionAsync();
                    }
                    return;
                }

                // 3. Auto-resume on return
                if (_workSessionService.IsTemporarilyIdle)
                {
                    _workSessionService.IsTemporarilyIdle = false;
                    _logger.Log("User returned. Resuming work session tracker...");
                    await _workSessionService.StartSessionAsync();
                }

                // 4. Capture focused app details
                _activeWindowMonitor.GetActiveWindowDetails(out string process, out string title);
                OnActiveWindowChanged?.Invoke(process, title);

                // 5. Track application usage every 10 seconds
                _appMonitorTicks += 10;
                if (_appMonitorTicks >= 10)
                {
                    _appMonitorTicks = 0;
                    await _appMonitoring.TrackApplicationAsync(process, title);

                    // Track website if browser is active
                    if (process.Contains("chrome", StringComparison.OrdinalIgnoreCase) ||
                        process.Contains("firefox", StringComparison.OrdinalIgnoreCase) ||
                        process.Contains("edge", StringComparison.OrdinalIgnoreCase))
                    {
                        await _websiteMonitoring.TrackWebsiteAsync(ExtractDomainFromTitle(title), title);
                    }

                    // Record activity
                    double activeSec = idleSeconds >= 10 ? 0 : 10 - idleSeconds;
                    double idleSec = idleSeconds >= 10 ? 10 : idleSeconds;
                    int keyboardLevel = (int)(activeSec / 10.0 * 100);
                    int mouseLevel = (int)(activeSec / 10.0 * 100);
                    await _activityMonitoring.RecordActivityAsync(activeSec, idleSec, keyboardLevel, mouseLevel);
                }

                // 6. Periodic screenshot capture
                _screenshotTicks += 10;
                if (_screenshotTicks >= (_configSync.CurrentConfig?.ScreenshotIntervalSeconds ?? 60))
                {
                    _screenshotTicks = 0;
                    if (_configSync.CurrentConfig?.ScreenshotEnabled == true)
                    {
                        string? base64 = _screenCaptureService.CapturePrimaryScreenBase64();
                        if (!string.IsNullOrEmpty(base64))
                        {
                            await _workSessionService.UploadScreenshotAsync(base64);
                        }
                    }
                }

                // 7. Send telemetry heartbeat
                double activeSec2 = idleSeconds >= 10 ? 0 : 10 - idleSeconds;
                double idleSec2 = idleSeconds >= 10 ? 10 : idleSeconds;

                await _workSessionService.SendHeartbeatAsync(process, title, activeSec2, idleSec2);
            }
            catch (Exception ex)
            {
                _logger.Log($"Telemetry worker loop error: {ex.Message}");
            }
        }

        private string ExtractDomainFromTitle(string title)
        {
            try
            {
                if (title.Contains(" - "))
                {
                    string[] parts = title.Split(new[] { " - " }, StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length > 0)
                    {
                        return parts[parts.Length - 1].Trim();
                    }
                }
                return title;
            }
            catch
            {
                return title;
            }
        }
    }
}
