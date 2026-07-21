using System;
using System.Windows;
using Microsoft.Extensions.DependencyInjection;
using Agent.Infrastructure;

namespace Agent.UI
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : System.Windows.Application
    {
        private IServiceProvider? _serviceProvider;

        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);

            var serviceCollection = new ServiceCollection();
            
            // Register Infrastructure layer and all background workers/services
            serviceCollection.AddAgentInfrastructure();

            // Register UI View
            serviceCollection.AddSingleton<MainWindow>();

            _serviceProvider = serviceCollection.BuildServiceProvider();

            // Resolve and show MainWindow
            var mainWindow = _serviceProvider.GetRequiredService<MainWindow>();
            mainWindow.Show();
        }
    }
}
