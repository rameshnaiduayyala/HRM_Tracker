using System.Collections.Generic;
using Agent.Core.Models;

namespace Agent.Core.Interfaces
{
    public interface IOfflineQueue
    {
        void Enqueue(string type, object payload);
        List<QueueEvent> DequeueAll();
        int GetQueueSize();
    }
}
