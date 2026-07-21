using System;
using System.Threading.Tasks;
using System.Windows.Threading;
using Agent.Core.Interfaces;

namespace Agent.Background
{
    public class SyncWorker
    {
        private readonly IApiClient _apiClient;
        private readonly IOfflineQueue _offlineQueue;
        private readonly ILoggerService _logger;
        private DispatcherTimer? _timer;

        public SyncWorker(IApiClient apiClient, IOfflineQueue offlineQueue, ILoggerService logger)
        {
            _apiClient = apiClient;
            _offlineQueue = offlineQueue;
            _logger = logger;
        }

        public void Start(int intervalSeconds = 10)
        {
            if (_timer != null) return;

            _timer = new DispatcherTimer
            {
                Interval = TimeSpan.FromSeconds(intervalSeconds)
            };
            _timer.Tick += async (s, e) => await SyncOfflineEventsAsync();
            _timer.Start();
            _logger.Log("SyncWorker background loop started.");
        }

        public void Stop()
        {
            _timer?.Stop();
            _timer = null;
            _logger.Log("SyncWorker background loop stopped.");
        }

        public async Task SyncOfflineEventsAsync()
        {
            if (!System.Net.NetworkInformation.NetworkInterface.GetIsNetworkAvailable()) return;

            int size = _offlineQueue.GetQueueSize();
            if (size == 0) return;

            _logger.Log($"Online connection healthy. Syncing {size} local buffered events...");
            var events = _offlineQueue.DequeueAll();
            int success = 0;

            foreach (var ev in events)
            {
                try
                {
                    bool ok = false;
                    if (ev.Type == "heartbeat")
                    {
                        ok = await _apiClient.SendHeartbeatAsync(ev.Payload);
                    }
                    else if (ev.Type == "screenshot")
                    {
                        ok = await _apiClient.UploadScreenshotAsync(ev.Payload);
                    }

                    if (ok)
                    {
                        success++;
                    }
                    else
                    {
                        _offlineQueue.Enqueue(ev.Type, ev.Payload);
                    }
                }
                catch
                {
                    _offlineQueue.Enqueue(ev.Type, ev.Payload);
                }
            }

            if (success > 0)
            {
                _logger.Log($"Successfully synchronized {success} events to SaaS cloud.");
            }
        }
    }
}
