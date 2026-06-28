using System;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace client.Helpers
{
    public static class SystemInfo
    {
        public static string GetOperatingSystem()
        {
            try
            {
                using (var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows NT\CurrentVersion"))
                {
                    if (key != null)
                    {
                        string productName = key.GetValue("ProductName") as string;
                        int    buildNumber = int.TryParse(key.GetValue("CurrentBuildNumber") as string, out int b) ? b : 0;

                        if (productName != null)
                        {
                            if (buildNumber >= 22000 && productName.Contains("10"))
                                return "Windows 11";
                            return productName.Replace("Windows 10", "Windows 10")
                                             .Replace(" Pro", "")
                                             .Replace(" Home", "")
                                             .Replace(" Enterprise", "")
                                             .Trim();
                        }
                    }
                }
            }
            catch { }

            var version = Environment.OSVersion.Version;
            if (version.Build >= 22000) return "Windows 11";
            if (version.Major == 10)    return "Windows 10";
            if (version.Major == 6 && version.Minor == 3) return "Windows 8.1";
            if (version.Major == 6 && version.Minor == 2) return "Windows 8";
            if (version.Major == 6 && version.Minor == 1) return "Windows 7";
            return "Windows";
        }

        public static string GetArchitecture()
        {
            return RuntimeInformation.OSArchitecture == Architecture.X64 ? "x64"
                 : RuntimeInformation.OSArchitecture == Architecture.X86 ? "x86"
                 : RuntimeInformation.OSArchitecture.ToString();
        }

        public static string GetDeviceInfo()
        {
            return $"{GetOperatingSystem()} ({GetArchitecture()})";
        }
    }
}
