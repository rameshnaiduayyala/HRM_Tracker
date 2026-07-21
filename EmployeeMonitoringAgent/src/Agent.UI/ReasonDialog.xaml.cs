using System.Windows;
using System.Windows.Input;

namespace Agent.UI
{
    public partial class ReasonDialog : Window
    {
        public string Reason { get; private set; } = string.Empty;

        public ReasonDialog(double activeSeconds, double idleSeconds)
        {
            InitializeComponent();
            Loaded += ReasonDialog_Loaded;

            TxtWorkingTime.Text = FormatSeconds(activeSeconds);
            TxtIdleTime.Text = FormatSeconds(idleSeconds);
        }

        private string FormatSeconds(double totalSeconds)
        {
            var t = System.TimeSpan.FromSeconds(totalSeconds);
            return $"{(int)t.TotalHours:D2}h {t.Minutes:D2}m {t.Seconds:D2}s";
        }

        private void ReasonDialog_Loaded(object sender, RoutedEventArgs e)
        {
            TxtReason.Focus();
        }

        private void TitleBar_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ChangedButton == MouseButton.Left)
            {
                DragMove();
            }
        }

        private void Submit_Click(object sender, RoutedEventArgs e)
        {
            Submit();
        }

        private void Cancel_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }

        private void TxtReason_KeyDown(object sender, System.Windows.Input.KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
            {
                Submit();
            }
        }

        private void Submit()
        {
            Reason = TxtReason.Text.Trim();
            if (string.IsNullOrEmpty(Reason))
            {
                System.Windows.MessageBox.Show("Please enter a reason before submitting.", "Reason Required", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }
            DialogResult = true;
            Close();
        }
    }
}
