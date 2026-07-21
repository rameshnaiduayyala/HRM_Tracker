using System;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using System.Windows.Threading;
using Agent.Core.Interfaces;
using Agent.Background;

namespace Agent.UI
{
    public partial class MainWindow : Window
    {
        private readonly IApiClient _apiClient;
        private readonly IAttendanceService _attendanceService;
        private readonly IWorkSessionService _workSessionService;
        private readonly TelemetryWorker _telemetryWorker;
        private readonly SyncWorker _syncWorker;
        private readonly IStartupService _startupService;
        private readonly ILoggerService _logger;
        private readonly IOfflineQueue _offlineQueue;

        private System.Windows.Forms.NotifyIcon? _notifyIcon;

        public MainWindow(
            IApiClient apiClient,
            IAttendanceService attendanceService,
            IWorkSessionService workSessionService,
            TelemetryWorker telemetryWorker,
            SyncWorker syncWorker,
            IStartupService startupService,
            ILoggerService logger,
            IOfflineQueue offlineQueue)
        {
            InitializeComponent();
            _apiClient = apiClient;
            _attendanceService = attendanceService;
            _workSessionService = workSessionService;
            _telemetryWorker = telemetryWorker;
            _syncWorker = syncWorker;
            _startupService = startupService;
            _logger = logger;
            _offlineQueue = offlineQueue;

            InitializeTrayIcon();
            InitializeSettings();
            RegisterEvents();
        }

        private void InitializeSettings()
        {
            ChkAutoStart.IsChecked = _startupService.IsAutoStartEnabled();
            TxtWorkstation.Text = $"Workstation: {Environment.MachineName} ({Environment.OSVersion.Platform})";
        }

        private void InitializeTrayIcon()
        {
            _notifyIcon = new System.Windows.Forms.NotifyIcon
            {
                Icon = System.Drawing.Icon.ExtractAssociatedIcon(System.Diagnostics.Process.GetCurrentProcess().MainModule?.FileName ?? string.Empty) 
                       ?? SystemIcons.Application,
                Visible = true,
                Text = "taskTracky Desktop Agent"
            };

            var contextMenu = new System.Windows.Forms.ContextMenuStrip();
            contextMenu.Items.Add("Restore Dashboard", null, (s, e) => ShowWindow());
            contextMenu.Items.Add(new System.Windows.Forms.ToolStripSeparator());
            contextMenu.Items.Add("Quit Agent", null, (s, e) => ForceQuit());

            _notifyIcon.ContextMenuStrip = contextMenu;
            _notifyIcon.DoubleClick += (s, e) => ShowWindow();
        }

        private void ShowWindow()
        {
            this.Show();
            this.WindowState = WindowState.Normal;
            this.Activate();
        }

        private void ForceQuit()
        {
            if (_notifyIcon != null)
            {
                _notifyIcon.Visible = false;
                _notifyIcon.Dispose();
            }
            System.Windows.Application.Current.Shutdown();
        }

        private void RegisterEvents()
        {
            _logger.OnLogAdded += AddLog;
            _attendanceService.OnAttendanceStatusChanged += UpdateAttendanceUI;
            _workSessionService.OnSessionStatusChanged += UpdateSessionUI;

            _telemetryWorker.OnTrackedTimeUpdated += (secs) => Dispatcher.Invoke(() =>
            {
                UpdateTrackedTimeUI(secs);
            });

            _telemetryWorker.OnIdleTimeUpdated += (idleSecs) => Dispatcher.Invoke(() =>
            {
                TxtIdleTime.Text = $"{(int)idleSecs}s";
            });

            _telemetryWorker.OnActiveWindowChanged += (proc, title) => Dispatcher.Invoke(() =>
            {
                TxtActiveApp.Text = proc;
                TxtWindowTitle.Text = title;
            });

            _telemetryWorker.OnInactivityDetected += () => Dispatcher.Invoke(() =>
            {
                ShowWindow();
            });
        }

        private void UpdateTrackedTimeUI(int seconds)
        {
            TimeSpan t = TimeSpan.FromSeconds(seconds);
            TxtTrackedTime.Text = $"{(int)t.TotalHours:D2}h {t.Minutes:D2}m {t.Seconds:D2}s";

            int remainingSeconds = Math.Max(0, 28800 - seconds);
            TimeSpan r = TimeSpan.FromSeconds(remainingSeconds);
            TxtRemainingTime.Text = $"{(int)r.TotalHours:D2}h {r.Minutes:D2}m {r.Seconds:D2}s";
        }

        private void AddLog(string timestampedMsg)
        {
            Dispatcher.Invoke(() =>
            {
                LstLogs.Items.Insert(0, timestampedMsg);
                if (LstLogs.Items.Count > 100)
                {
                    LstLogs.Items.RemoveAt(LstLogs.Items.Count - 1);
                }
            });
        }

        private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            DragMove();
        }

        private void Minimize_Click(object sender, RoutedEventArgs e)
        {
            this.WindowState = WindowState.Minimized;
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            this.Hide();
            _logger.Log("Agent minimized to system tray. Tracking continues in the background.");
        }

        private async void Login_Click(object sender, RoutedEventArgs e)
        {
            TxtAuthError.Text = string.Empty;
            string serverUrl = TxtServerUrl.Text.Trim();
            string email = TxtEmail.Text.Trim();
            string password = TxtPassword.Password.Trim();

            if (string.IsNullOrEmpty(serverUrl) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(password))
            {
                TxtAuthError.Text = "All credentials are required.";
                return;
            }

            _apiClient.Configure(serverUrl);
            _logger.Log($"Authenticating with SaaS portal at {serverUrl}...");

            var authResult = await _apiClient.LoginAsync(email, password);
            if (authResult.IsSuccess)
            {
                TxtProfileName.Text = $"{authResult.FirstName} {authResult.LastName}";
                TxtProfileEmail.Text = email;

                AuthView.Visibility = Visibility.Collapsed;
                DashboardView.Visibility = Visibility.Visible;
                _logger.Log($"Signed in successfully. Welcome {authResult.FirstName}!");

                // Register Device, Fetch Status and Start Workers
                await RegisterDeviceAsync();
                await _attendanceService.RefreshStatusAsync();

                _syncWorker.Start();
                StartSyncScheduler();

                // Autostart tracker on daily login
                if (!_attendanceService.IsShiftCompleted)
                {
                    if (!_attendanceService.IsClockedIn)
                    {
                        _logger.Log("Autostarting shift clock-in on daily login...");
                        await _attendanceService.ClockInAsync();
                    }
                    if (!_workSessionService.IsSessionActive)
                    {
                        _logger.Log("Autostarting work session tracker...");
                        await StartWorkSessionAsync();
                    }
                }
            }
            else
            {
                TxtAuthError.Text = authResult.ErrorMessage;
                _logger.Log($"Authentication rejected: {authResult.ErrorMessage}");
            }
        }

        private async Task RegisterDeviceAsync()
        {
            string fingerprint = $"{Environment.MachineName}-{Environment.OSVersion.Platform}-{Environment.UserName}";
            string name = $"{Environment.MachineName} ({Environment.OSVersion.Platform})";
            bool success = await _apiClient.RegisterDeviceAsync(fingerprint, name);
            if (success)
            {
                _logger.Log("Device identity synced and registered successfully.");
            }
        }

        private void UpdateAttendanceUI()
        {
            Dispatcher.Invoke(() =>
            {
                if (_attendanceService.IsShiftCompleted)
                {
                    BtnClockToggle.Content = "Clock In";
                    BtnClockToggle.IsEnabled = false;
                    BtnClockToggle.Background = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(75, 85, 99)); // Gray
                    BtnSessionToggle.IsEnabled = false;
                    BtnSessionToggle.Background = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(75, 85, 99)); // Gray
                    ClockInReminderBanner.Visibility = Visibility.Collapsed;
                    StartTrackerReminderBanner.Visibility = Visibility.Collapsed;
                    _logger.Log("Daily shift clocked out. Work tracking is closed for today.");
                }
                else if (_attendanceService.IsClockedIn)
                {
                    BtnClockToggle.Content = "Clock Out";
                    BtnClockToggle.Background = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(239, 68, 68)); // Red
                    BtnSessionToggle.IsEnabled = true;
                    BtnSessionToggle.Background = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(99, 102, 241)); // Indigo
                    ClockInReminderBanner.Visibility = Visibility.Collapsed;
                    if (!_workSessionService.IsSessionActive)
                    {
                        StartTrackerReminderBanner.Visibility = Visibility.Visible;
                    }
                }
                else
                {
                    BtnClockToggle.Content = "Clock In";
                    BtnClockToggle.Background = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(16, 185, 129)); // Emerald
                    BtnSessionToggle.IsEnabled = false;
                    BtnSessionToggle.Background = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(75, 85, 99)); // Gray
                    ClockInReminderBanner.Visibility = Visibility.Visible;
                    StartTrackerReminderBanner.Visibility = Visibility.Collapsed;
                }
            });
        }

        private void UpdateSessionUI()
        {
            Dispatcher.Invoke(() =>
            {
                if (_workSessionService.IsSessionActive)
                {
                    BtnSessionToggle.Content = "Stop Tracker";
                    BtnSessionToggle.Background = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(239, 68, 68)); // Red
                    StartTrackerReminderBanner.Visibility = Visibility.Collapsed;
                }
                else
                {
                    BtnSessionToggle.Content = "Start Tracker";
                    BtnSessionToggle.Background = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(99, 102, 241)); // Indigo
                    if (_attendanceService.IsClockedIn && !_attendanceService.IsShiftCompleted)
                    {
                        StartTrackerReminderBanner.Visibility = Visibility.Visible;
                    }
                }
            });
        }

        private async void ClockToggle_Click(object sender, RoutedEventArgs e)
        {
            if (_attendanceService.IsClockedIn)
            {
                bool ok = await _attendanceService.ClockOutAsync();
                if (ok)
                {
                    if (_workSessionService.IsSessionActive)
                    {
                        await StopWorkSessionAsync();
                    }
                }
            }
            else
            {
                bool ok = await _attendanceService.ClockInAsync();
                if (ok)
                {
                    await StartWorkSessionAsync();
                }
            }
        }

        private async void SessionToggle_Click(object sender, RoutedEventArgs e)
        {
            if (_workSessionService.IsSessionActive)
            {
                await StopWorkSessionAsync();
            }
            else
            {
                await StartWorkSessionAsync();
            }
        }

        private async Task StartWorkSessionAsync()
        {
            bool ok = await _workSessionService.StartSessionAsync();
            if (ok)
            {
                _telemetryWorker.Start();
            }
        }

        private async Task StopWorkSessionAsync()
        {
            await _workSessionService.StopSessionAsync();
            _telemetryWorker.Stop();
            TxtActiveApp.Text = "-";
            TxtWindowTitle.Text = "-";
            TxtIdleTime.Text = "0s";
        }

        private void StartSyncScheduler()
        {
            var syncTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(5) };
            syncTimer.Tick += (s, e) => UpdateSyncBanner();
            syncTimer.Start();
        }

        private void UpdateSyncBanner()
        {
            int size = _offlineQueue.GetQueueSize();
            if (size > 0)
            {
                OfflineSyncBanner.Visibility = Visibility.Visible;
                TxtOfflineCount.Text = $" {size} events queued locally.";
            }
            else
            {
                OfflineSyncBanner.Visibility = Visibility.Collapsed;
            }
        }

        private async void SyncOffline_Click(object sender, RoutedEventArgs e)
        {
            await _syncWorker.SyncOfflineEventsAsync();
            UpdateSyncBanner();
        }

        private void AutoStart_Click(object sender, RoutedEventArgs e)
        {
            bool isChecked = ChkAutoStart.IsChecked == true;
            _startupService.SetAutoStart(isChecked);
            _logger.Log($"Auto-start preference updated to: {(isChecked ? "ENABLED" : "DISABLED")}");
        }

        private async void BreakReason_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            if (_workSessionService == null) return;

            var item = CboBreakReason.SelectedItem as System.Windows.Controls.ComboBoxItem;
            if (item == null) return;

            string reason = item.Content.ToString() ?? "Working";
            _workSessionService.BreakReason = reason;

            if (reason == "Working")
            {
                _logger.Log("Returned from break status. Automatically resuming work sessions...");
                if (!_workSessionService.IsSessionActive) await StartWorkSessionAsync();
            }
            else
            {
                _logger.Log($"Transitioned to break: {reason.ToUpper()}. Pausing tracking sessions.");
                if (_workSessionService.IsSessionActive) await StopWorkSessionAsync();
            }
        }

        private void Logout_Click(object sender, RoutedEventArgs e)
        {
            _telemetryWorker.Stop();
            _syncWorker.Stop();

            _workSessionService.TrackedSeconds = 0;
            _workSessionService.IsTemporarilyIdle = false;
            UpdateTrackedTimeUI(0);

            _apiClient.Configure(string.Empty, null);

            AuthView.Visibility = Visibility.Visible;
            DashboardView.Visibility = Visibility.Collapsed;
            _logger.Log("Logged out from taskTracky SaaS portal.");
        }
    }
}