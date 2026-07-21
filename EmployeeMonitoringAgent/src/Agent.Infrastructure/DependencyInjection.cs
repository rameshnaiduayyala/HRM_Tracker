using Microsoft.Extensions.DependencyInjection;
using Agent.Core.Interfaces;
using Agent.Application.Services;
using Agent.Windows.IdleDetection;
using Agent.Windows.ActiveWindow;
using Agent.Windows.ScreenCapture;
using Agent.Windows.Startup;
using Agent.LocalStorage.Queue;
using Agent.Network.Http;
using Agent.Infrastructure.Logging;
using Agent.Background;

namespace Agent.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddAgentInfrastructure(this IServiceCollection services)
        {
            services.AddSingleton<ILoggerService, LoggerService>();
            services.AddSingleton<IEnhancedLoggerService, EnhancedLoggerService>();

            services.AddSingleton<IIdleDetector, WindowsIdleDetector>();
            services.AddSingleton<IActiveWindowMonitor, WindowsActiveWindowMonitor>();
            services.AddSingleton<IScreenCaptureService, WindowsScreenCaptureService>();
            services.AddSingleton<IStartupService, WindowsRegistryStartupService>();

            services.AddSingleton<IOfflineQueue, JsonOfflineQueue>();
            services.AddSingleton<IApiClient, HttpApiClient>();

            services.AddSingleton<IAttendanceService, AttendanceService>();
            services.AddSingleton<IWorkSessionService, WorkSessionService>();
            services.AddSingleton<IConfigurationSyncService, ConfigurationSyncService>();
            services.AddSingleton<IActivityMonitoringService, ActivityMonitoringService>();
            services.AddSingleton<IApplicationMonitoringService, ApplicationMonitoringService>();
            services.AddSingleton<IWebsiteMonitoringService, WebsiteMonitoringService>();
            services.AddSingleton<IBreakManagementService, BreakManagementService>();
            services.AddSingleton<IUpdateService, UpdateService>();
            services.AddSingleton<IWatchdogService, WatchdogService>();
            services.AddSingleton<ISecurityService, SecurityService>();

            services.AddSingleton<SyncWorker>();
            services.AddSingleton<TelemetryWorker>();
            services.AddSingleton<ConfigSyncWorker>();
            services.AddSingleton<UpdateWorker>();
            services.AddSingleton<WatchdogWorker>();

            return services;
        }
    }
}
