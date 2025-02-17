using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using client.Models;

namespace client.Services
{
    public class IpService
    {
        private readonly HttpClient _client;
        private const string IP_API_URL = "http://ip-api.com/json/";

        public IpService()
        {
            _client = new HttpClient();
        }

        public async Task<string> GetPublicIpAsync()
        {
            try
            {
                // Console.WriteLine("Fetching IP address...");
                var response = await _client.GetAsync(IP_API_URL);
                response.EnsureSuccessStatusCode();
                
                var content = await response.Content.ReadAsStringAsync();
                // Console.WriteLine($"API Response: {content}");
                
                var ipInfo = JsonSerializer.Deserialize<IpApiResponse>(content);
                // Console.WriteLine($"Parsed IP: {ipInfo.Query}");
                
                
                return ipInfo.Query;
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error fetching IP: {ex.Message}");
                throw new Exception($"Failed to fetch IP address: {ex.Message}");
            }
        }
    }
}
