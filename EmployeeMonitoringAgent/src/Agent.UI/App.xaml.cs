using System;
using System.Windows;
using Microsoft.Extensions.DependencyInjection;
using Agent.Infrastructure;
using Agent.Application.Services;
using Agent.Core.Interfaces;
using Agent.Infrastructure.Logging;

namespace Agent.UI
{
    public partial class App : System.Windows.Application
    {
        private IServiceProvider? _serviceProvider;

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            var serviceCollection = new ServiceCollection();
            serviceCollection.AddAgentInfrastructure();
            serviceCollection.AddSingleton<MainWindow>();

            _serviceProvider = serviceCollection.BuildServiceProvider();

            var mainWindow = _serviceProvider.GetRequiredService<MainWindow>();
            mainWindow.Show();

            _ = InitializeBackgroundServicesAsync();
        }

        private async System.Threading.Tasks.Task InitializeBackgroundServicesAsync()
        {
            try
            {
                var watchdog = _serviceProvider?.GetService(typeof(IWatchdogService)) as IWatchdogService;
                var logger = _serviceProvider?.GetService(typeof(IEnhancedLoggerService)) as IEnhancedLoggerService;

                if (watchdog != null && logger != null)
                {
                    await watchdog.StartAsync();
                    logger.LogInfo("Background services initialized successfully.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Background services initialization error: {ex.Message}");
            }
        }

        protected override async void OnExit(ExitEventArgs e)
        {
            try
            {
                var watchdog = _serviceProvider?.GetService(typeof(IWatchdogService)) as IWatchdogService;
                if (watchdog != null)
                {
                    await watchdog.StopAsync();
                }
            }
            catch
            {
            }

            base.OnExit(e);
        }
    }
}
