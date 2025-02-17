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
        private readonly HttpClient _client;

        public ConnectionService()
        {
            _client = new HttpClient();
        }

        public async Task<ConnectionResponse> ConnectAsync()
        {
            var connectionInfo = new
            {
                deviceInfo = $"{Environment.OSVersion}"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(connectionInfo),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _client.PostAsync($"{Constants.API_BASE}/connections", content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Server returned {response.StatusCode}: {errorContent}");
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<ConnectionResponse>(responseBody);
        }

        public async Task DisconnectAsync(string connectionId)
        {
            if (string.IsNullOrEmpty(connectionId))
                throw new ArgumentException("Connection ID cannot be null or empty", nameof(connectionId));

            var response = await _client.PutAsync($"{Constants.API_BASE}/connections/{connectionId}/inactive", null);
            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"Failed to disconnect: {response.StatusCode}");
            }
        }
    }
}
