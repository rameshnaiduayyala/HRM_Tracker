using System;
using System.Threading.Tasks;
using Agent.Core.Interfaces;
using Agent.Core.Models;

namespace Agent.Application.Services
{
    public class WebsiteMonitoringService : IWebsiteMonitoringService
    {
        private readonly IActiveWindowMonitor _activeWindowMonitor;
        private readonly IEnhancedLoggerService _logger;
        private WebsiteUsage? _currentWebsite;

        public WebsiteUsage? CurrentWebsite => _currentWebsite;
        public event Action<WebsiteUsage>? OnWebsiteChanged;

        public WebsiteMonitoringService(IActiveWindowMonitor activeWindowMonitor, IEnhancedLoggerService logger)
        {
            _activeWindowMonitor = activeWindowMonitor;
            _logger = logger;
        }

        public async Task TrackWebsiteAsync(string domain, string? pageTitle)
        {
            try
            {
                if (_currentWebsite == null ||
                    !string.Equals(_currentWebsite.Domain, domain, StringComparison.OrdinalIgnoreCase))
                {
                    var previous = _currentWebsite;
                    _currentWebsite = new WebsiteUsage
                    {
                        Domain = domain,
                        PageTitle = pageTitle,
                        StartTime = DateTime.UtcNow,
                        Category = CategorizeWebsite(domain),
                    };

                    OnWebsiteChanged?.Invoke(_currentWebsite);

                    if (previous != null && previous.EndTime == null)
                    {
                        previous.EndTime = DateTime.UtcNow;
                        previous.DurationSeconds = (int)(previous.EndTime.Value - previous.StartTime).TotalSeconds;
                        await RecordUsageAsync(previous);
                    }
                }
                else
                {
                    _currentWebsite.PageTitle = pageTitle ?? _currentWebsite.PageTitle;
                    if (_currentWebsite.EndTime == null)
                    {
                        _currentWebsite.DurationSeconds = (int)(DateTime.UtcNow - _currentWebsite.StartTime).TotalSeconds;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Website monitoring error: {ex.Message}", ex);
            }

            await Task.CompletedTask;
        }

        public async Task RecordUsageAsync(WebsiteUsage usage)
        {
            try
            {
                _logger.LogInfo($"Website usage recorded: {usage.Domain} ({usage.DurationSeconds}s) - {usage.Category}");
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to record website usage: {ex.Message}", ex);
            }
        }

        private string CategorizeWebsite(string domain)
        {
            string lower = domain.ToLowerInvariant();
            if (lower.Contains("github") || lower.Contains("stackoverflow") || lower.Contains("docs.microsoft"))
                return "Development";
            if (lower.Contains("jira") || lower.Contains("confluence") || lower.Contains("asana") || lower.Contains("trello"))
                return "Project Management";
            if (lower.Contains("youtube") || lower.Contains("netflix") || lower.Contains("twitch"))
                return "Entertainment";
            if (lower.Contains("facebook") || lower.Contains("twitter") || lower.Contains("instagram") || lower.Contains("linkedin"))
                return "Social Media";
            return "Other";
        }
    }
}
