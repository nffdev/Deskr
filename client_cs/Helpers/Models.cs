using System;
using System.Text.Json.Serialization;

namespace client.Models
{
    public class ConnectionResponse
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; }

        [JsonPropertyName("ip")]
        public string Ip { get; set; }

        [JsonPropertyName("deviceInfo")]
        public string DeviceInfo { get; set; }

        [JsonPropertyName("timestamp")]
        public DateTime Timestamp { get; set; }

        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }
    }

    public class ConnectionRequest
    {
        [JsonPropertyName("ip")]
        public string Ip { get; set; }

        [JsonPropertyName("deviceInfo")]
        public string DeviceInfo { get; set; }
    }

    public class IpApiResponse
    {
        [JsonPropertyName("query")]
        public string Query { get; set; }
        
        [JsonPropertyName("country")]
        public string Country { get; set; }
        
        [JsonPropertyName("city")]
        public string City { get; set; }
    }
}