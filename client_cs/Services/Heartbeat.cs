using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using client.Helpers;

namespace client.Services
{
    public class Heartbeat
    {
        private readonly HttpClient _client;
        private readonly Timer _timer;
        private readonly string _connectionId;
        private const int HEARTBEAT_INTERVAL = 5000; // 5 seconds

        public Heartbeat(string connectionId)
        {
            _client = new HttpClient();
            _connectionId = connectionId;
            _timer = new Timer(SendHeartbeat, null, HEARTBEAT_INTERVAL, HEARTBEAT_INTERVAL);
        }

        private async void SendHeartbeat(object state)
        {
            try
            {
                var response = await _client.PostAsync(
                    $"{Constants.API_BASE}/connections/{_connectionId}/heartbeat",
                    null
                );

                if (!response.IsSuccessStatusCode && response.StatusCode != System.Net.HttpStatusCode.NotFound)
                {
                    Console.WriteLine($"Heartbeat failed: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending heartbeat: {ex.Message}");
            }
        }

        public void Stop()
        {
            _timer?.Change(Timeout.Infinite, Timeout.Infinite);
            _timer?.Dispose();
        }
    }
}
