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
            // Core & Cross-cutting Infrastructures
            services.AddSingleton<ILoggerService, LoggerService>();

            // Native Windows Integrations
            services.AddSingleton<IIdleDetector, WindowsIdleDetector>();
            services.AddSingleton<IActiveWindowMonitor, WindowsActiveWindowMonitor>();
            services.AddSingleton<IScreenCaptureService, WindowsScreenCaptureService>();
            services.AddSingleton<IStartupService, WindowsRegistryStartupService>();

            // Data & Network
            services.AddSingleton<IOfflineQueue, JsonOfflineQueue>();
            services.AddSingleton<IApiClient, HttpApiClient>();

            // Domain / Application Services
            services.AddSingleton<IAttendanceService, AttendanceService>();
            services.AddSingleton<IWorkSessionService, WorkSessionService>();

            // Background Workers
            services.AddSingleton<SyncWorker>();
            services.AddSingleton<TelemetryWorker>();

            return services;
        }
    }
}
