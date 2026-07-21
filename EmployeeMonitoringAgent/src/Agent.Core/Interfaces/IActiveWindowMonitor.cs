namespace Agent.Core.Interfaces
{
    public interface IActiveWindowMonitor
    {
        void GetActiveWindowDetails(out string processName, out string windowTitle);
    }
}
