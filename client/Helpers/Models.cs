using System;

namespace client.Models
{
    public class ConnectionResponse
    {
        public string Id { get; set; }
        public string Ip { get; set; }
        public string DeviceInfo { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsActive { get; set; }
    }
}