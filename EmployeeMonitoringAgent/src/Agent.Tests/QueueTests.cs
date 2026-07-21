using System;
using System.IO;
using System.Linq;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Agent.LocalStorage.Queue;

namespace Agent.Tests
{
    [TestClass]
    public class QueueTests
    {
        private JsonOfflineQueue? _queue;

        [TestInitialize]
        public void Setup()
        {
            _queue = new JsonOfflineQueue();
            // Clear any preexisting test queues by dequeuing
            _queue.DequeueAll();
        }

        [TestMethod]
        public void Queue_EnqueueAndDequeue_ShouldWorkCorrectly()
        {
            // Arrange
            Assert.IsNotNull(_queue);
            var payload = new { testProp = "hello" };

            // Act
            _queue.Enqueue("test-event", payload);
            int sizeAfterEnqueue = _queue.GetQueueSize();
            var events = _queue.DequeueAll();
            int sizeAfterDequeue = _queue.GetQueueSize();

            // Assert
            Assert.AreEqual(1, sizeAfterEnqueue, "Queue size should be 1 after one enqueue.");
            Assert.AreEqual(0, sizeAfterDequeue, "Queue size should be 0 after dequeue all.");
            Assert.AreEqual(1, events.Count, "Dequeued events count should match enqueued.");
            Assert.AreEqual("test-event", events.First().Type, "Event type should match.");
        }
    }
}
