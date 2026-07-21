using System;
using System.Threading.Tasks;
using System.Windows.Threading;
using Agent.Core.Interfaces;

namespace Agent.Background
{
    public class TelemetryWorker
    {
        private readonly IWorkSessionService _workSessionService;
        private readonly IIdleDetector _idleDetector;
        private readonly IActiveWindowMonitor _activeWindowMonitor;
        private readonly IScreenCaptureService _screenCaptureService;
        private readonly ILoggerService _logger;

        private DispatcherTimer? _monitorTimer;
        private DispatcherTimer? _clockTimer;
        private int _screenshotTicks = 0;

        public event Action? OnInactivityDetected;
        public event Action<string, string>? OnActiveWindowChanged;
        public event Action<double>? OnIdleTimeUpdated;
        public event Action<int>? OnTrackedTimeUpdated;

        public TelemetryWorker(
            IWorkSessionService workSessionService,
            IIdleDetector idleDetector,
            IActiveWindowMonitor activeWindowMonitor,
            IScreenCaptureService screenCaptureService,
            ILoggerService logger)
        {
            _workSessionService = workSessionService;
            _idleDetector = idleDetector;
            _activeWindowMonitor = activeWindowMonitor;
            _screenCaptureService = screenCaptureService;
            _logger = logger;
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
            if (!_workSessionService.IsTemporarilyIdle && _workSessionService.IsSessionActive)
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

                // 2. Auto-suspend session if idle >= 300 seconds (5 mins)
                if (idleSeconds >= 300)
                {
                    if (!_workSessionService.IsTemporarilyIdle)
                    {
                        _workSessionService.IsTemporarilyIdle = true;
                        _logger.Log("Inactivity detected (5 mins idle). Suspending session...");
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

                // 5. Periodic screenshot capture every 60 seconds
                _screenshotTicks += 10;
                if (_screenshotTicks >= 60)
                {
                    _screenshotTicks = 0;
                    string? base64 = _screenCaptureService.CapturePrimaryScreenBase64();
                    if (!string.IsNullOrEmpty(base64))
                    {
                        await _workSessionService.UploadScreenshotAsync(base64);
                    }
                }

                // 6. Send telemetry heartbeat
                double activeSec = idleSeconds >= 10 ? 0 : 10 - idleSeconds;
                double idleSec = idleSeconds >= 10 ? 10 : idleSeconds;

                await _workSessionService.SendHeartbeatAsync(process, title, activeSec, idleSec);
            }
            catch (Exception ex)
            {
                _logger.Log($"Telemetry worker loop error: {ex.Message}");
            }
        }
    }
}
