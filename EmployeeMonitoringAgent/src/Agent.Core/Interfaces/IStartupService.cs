namespace Agent.Core.Interfaces
{
    public interface IStartupService
    {
        void SetAutoStart(bool enable);
        bool IsAutoStartEnabled();
    }
}
