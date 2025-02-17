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
        private readonly IpService _ipService;
        private readonly JsonSerializerOptions _jsonOptions;

        public ConnectionService()
        {
            _client = new HttpClient();
            _ipService = new IpService();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNamingPolicy = null,
                WriteIndented = true
            };
        }

        public async Task<ConnectionResponse> ConnectAsync()
        {
            try 
            {
                var ip = await _ipService.GetPublicIpAsync();
                var deviceInfo = $"{Environment.OSVersion}";
                
                var connectionInfo = new ConnectionRequest
                {
                    Ip = ip,
                    DeviceInfo = deviceInfo
                };

                var jsonRequest = JsonSerializer.Serialize(connectionInfo, _jsonOptions);
                // Console.WriteLine($"Sending JSON to server: {jsonRequest}");
                // Console.WriteLine($"Target URL: {Constants.API_BASE}/connections");
                
                var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");
                
                // Console.WriteLine("Request Headers:");
                // Console.WriteLine($"Content-Type: {content.Headers.ContentType}");
                
                var response = await _client.PostAsync($"{Constants.API_BASE}/connections", content);
                
                // Console.WriteLine($"Response Status: {response.StatusCode}");
                // Console.WriteLine("Response Headers:");
                foreach (var header in response.Headers)
                {
                    // Console.WriteLine($"{header.Key}: {string.Join(", ", header.Value)}");
                }
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new HttpRequestException($"Server returned {response.StatusCode}: {errorContent}");
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                // Console.WriteLine($"Server response: {responseBody}");
                
                return JsonSerializer.Deserialize<ConnectionResponse>(responseBody, _jsonOptions);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in ConnectAsync: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                throw;
            }
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
