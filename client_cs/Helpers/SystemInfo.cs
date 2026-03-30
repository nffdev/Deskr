using System;
using System.Runtime.InteropServices;

namespace client.Helpers
{
    public static class SystemInfo
    {
        public static string GetOperatingSystem()
        {
            var version = Environment.OSVersion.Version;
            if (version.Build >= 22000) return "Windows 11";
            if (version.Major == 10) return "Windows 10";
            if (version.Major == 6 && version.Minor == 3) return "Windows 8.1";
            if (version.Major == 6 && version.Minor == 2) return "Windows 8";
            if (version.Major == 6 && version.Minor == 1) return "Windows 7";
            return "Windows";
        }

        public static string GetArchitecture()
        {
            return RuntimeInformation.OSArchitecture.ToString();
        }

        public static string GetDeviceInfo()
        {
            return $"{GetOperatingSystem()} ({GetArchitecture()})";
        }
    }
}
