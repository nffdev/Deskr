using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using client.Helpers;

namespace client.Services
{
    public class Heartbeat
    {
        public delegate void DisconnectCallback();

        private readonly HttpClient         _client;
        private readonly string             _connectionId;
        private readonly DisconnectCallback _onDisconnected;
        private readonly Thread             _thread;
        private readonly CancellationTokenSource _cts;
        private volatile bool               _running;

        private const int HEARTBEAT_INTERVAL = 2000;
        private const int MAX_FAILURES       = 3;

        public Heartbeat(string connectionId, DisconnectCallback onDisconnected = null)
        {
            _cts            = new CancellationTokenSource();
            _client         = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
            _connectionId   = connectionId;
            _onDisconnected = onDisconnected;
            _running        = true;
            _thread         = new Thread(Run) { IsBackground = true };
            _thread.Start();
        }

        public void Stop()
        {
            _running = false;
            _cts.Cancel();
            _client.CancelPendingRequests();
            if (_thread.IsAlive)
                _thread.Join(TimeSpan.FromSeconds(3));
        }

        private void Run()
        {
            int failures = 0;

            while (_running)
            {
                for (int i = 0; i < HEARTBEAT_INTERVAL / 100; i++)
                {
                    if (!_running || _cts.IsCancellationRequested) return;
                    Thread.Sleep(100);
                }

                if (!_running) break;

                try
                {
                    string url      = $"{Constants.API_BASE}/connections/{_connectionId}/heartbeat";
                    var    response = _client.PostAsync(url, null).GetAwaiter().GetResult();
                    int    status   = (int)response.StatusCode;

                    if (status == 200)
                    {
                        failures = 0;
                    }
                    else
                    {
                        failures = MAX_FAILURES;
                        Console.WriteLine($"Heartbeat fatal ({status}) -> disconnecting immediately");
                    }
                }
                catch (Exception ex)
                {
                    if (!_running || _cts.IsCancellationRequested) return;
                    failures = MAX_FAILURES;
                    Console.WriteLine($"Heartbeat fatal: {ex.Message} -> disconnecting immediately");
                }

                if (failures >= MAX_FAILURES && _running)
                {
                    Console.WriteLine("[disconnected] Heartbeat lost.");
                    _running = false;
                    if (_onDisconnected != null)
                    {
                        var cb = _onDisconnected;
                        new Thread(() => cb()) { IsBackground = true }.Start();
                    }
                    return;
                }
            }
        }
    }
}
