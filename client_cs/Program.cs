using System;
using System.Threading;
using client.Services;
using client.Helpers;
using client.Models;

namespace client
{
    class Program
    {
        private static readonly ConnectionService _connectionService = new ConnectionService();
        private static ScreenCapture              _screenCapture;
        private static volatile bool              _running = true;
        private static readonly object            _sessionLock = new object();
        private static string                     _connectionId;

        private static ReconnectService _reconnect;

        [STAThread]
        static void Main(string[] args)
        {
            _reconnect = new ReconnectService(StartSession);

            if (!Consent.ShowConsentDialog())
            {
                Console.WriteLine("Installation cancelled by user.");
                return;
            }

            if (!StartSession())
            {
                Console.WriteLine("Initial connection failed. Starting reconnection...");
                _reconnect.TriggerReconnect();
            }

            Console.WriteLine("Press any key to stop...");
            Console.ReadKey(true);

            _running = false;
            _reconnect.Stop();

            lock (_sessionLock)
            {
                _screenCapture?.Stop();
                _screenCapture = null;
            }

            if (!string.IsNullOrEmpty(_connectionId))
            {
                try { _connectionService.Disconnect(_connectionId); }
                catch { }
            }

            Console.WriteLine("\nPress any key to exit...");
            Console.ReadKey(true);
        }

        private static bool StartSession()
        {
            lock (_sessionLock)
            {
                _screenCapture?.Stop();
                _screenCapture = null;
                _connectionService.StopHeartbeat();

                try
                {
                    var data = _connectionService.Connect(() =>
                    {
                        if (_running)
                        {
                            Console.WriteLine("[disconnected] Connection lost.");
                            _reconnect.TriggerReconnect();
                        }
                    });

                    _connectionId = data.Id;

                    Console.WriteLine("[Deskr] Successfully connected!");
                    Console.WriteLine($"[Deskr] IP: {data.Ip}");
                    Console.WriteLine($"[Deskr] Device: {data.DeviceInfo}");

                    _screenCapture = new ScreenCapture(data.Id, 1000);
                    _screenCapture.Start();

                    Console.WriteLine("[connected]");
                    return true;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[error] Connection failed: {ex.Message}");
                    return false;
                }
            }
        }
    }
}
