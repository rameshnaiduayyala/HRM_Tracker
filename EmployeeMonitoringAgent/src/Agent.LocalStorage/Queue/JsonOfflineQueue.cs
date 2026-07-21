using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using Agent.Core.Interfaces;
using Agent.Core.Models;

namespace Agent.LocalStorage.Queue
{
    public class JsonOfflineQueue : IOfflineQueue
    {
        private static readonly string FolderPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "TaskTracky"
        );
        private static readonly string FilePath = Path.Combine(FolderPath, "queue.json");
        private readonly object _lockObj = new();

        public JsonOfflineQueue()
        {
            try
            {
                if (!Directory.Exists(FolderPath))
                {
                    Directory.CreateDirectory(FolderPath);
                }
            }
            catch
            {
                // ignore
            }
        }

        public void Enqueue(string type, object payload)
        {
            lock (_lockObj)
            {
                try
                {
                    var queue = LoadQueue();
                    queue.Add(new QueueEvent
                    {
                        Type = type,
                        Payload = payload,
                        Timestamp = DateTime.UtcNow
                    });
                    SaveQueue(queue);
                }
                catch
                {
                    // ignore
                }
            }
        }

        public List<QueueEvent> DequeueAll()
        {
            lock (_lockObj)
            {
                try
                {
                    var queue = LoadQueue();
                    ClearQueue();
                    return queue;
                }
                catch
                {
                    return new List<QueueEvent>();
                }
            }
        }

        public int GetQueueSize()
        {
            lock (_lockObj)
            {
                try
                {
                    return LoadQueue().Count;
                }
                catch
                {
                    return 0;
                }
            }
        }

        private List<QueueEvent> LoadQueue()
        {
            if (!File.Exists(FilePath))
            {
                return new List<QueueEvent>();
            }

            try
            {
                string json = File.ReadAllText(FilePath);
                return JsonSerializer.Deserialize<List<QueueEvent>>(json) ?? new List<QueueEvent>();
            }
            catch
            {
                return new List<QueueEvent>();
            }
        }

        private void SaveQueue(List<QueueEvent> queue)
        {
            try
            {
                string json = JsonSerializer.Serialize(queue, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(FilePath, json);
            }
            catch
            {
                // ignore
            }
        }

        private void ClearQueue()
        {
            try
            {
                if (File.Exists(FilePath))
                {
                    File.Delete(FilePath);
                }
            }
            catch
            {
                // ignore
            }
        }
    }
}
