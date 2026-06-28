using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using client.Models;
using client.Helpers;

namespace client.Services
{
    public class ConnectionService
    {
        private readonly HttpClient            _client;
        private readonly IpService             _ipService;
        private readonly JsonSerializerOptions _jsonOptions;
        private Heartbeat                      _heartbeat;

        public ConnectionService()
        {
            _client      = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            _ipService   = new IpService();
            _jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = null };
        }

        public ConnectionResponse Connect(Heartbeat.DisconnectCallback onDisconnected = null)
        {
            var ip         = _ipService.GetPublicIpAsync().GetAwaiter().GetResult();
            var deviceInfo = SystemInfo.GetDeviceInfo();

            var request = new ConnectionRequest
            {
                Ip         = ip,
                DeviceInfo = deviceInfo,
                OwnerId    = Constants.OWNER_ID
            };

            var content  = new StringContent(JsonSerializer.Serialize(request, _jsonOptions), Encoding.UTF8, "application/json");
            var response = _client.PostAsync($"{Constants.API_BASE}/connections", content).GetAwaiter().GetResult();

            if (!response.IsSuccessStatusCode)
            {
                var err = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
                throw new HttpRequestException($"Server returned {(int)response.StatusCode}: {err}");
            }

            var body       = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
            var connection = JsonSerializer.Deserialize<ConnectionResponse>(body, _jsonOptions);

            _heartbeat = new Heartbeat(connection.Id, onDisconnected);

            return connection;
        }

        public void StopHeartbeat()
        {
            _heartbeat?.Stop();
            _heartbeat = null;
        }

        public void Disconnect(string connectionId)
        {
            if (string.IsNullOrEmpty(connectionId))
                throw new ArgumentException("connectionId cannot be empty");

            StopHeartbeat();

            var response = _client.PutAsync($"{Constants.API_BASE}/connections/{connectionId}/inactive", null).GetAwaiter().GetResult();
            if (!response.IsSuccessStatusCode)
                throw new HttpRequestException($"Failed to disconnect: {(int)response.StatusCode}");
        }
    }
}
