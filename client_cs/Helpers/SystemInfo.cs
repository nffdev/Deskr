using System;
using System.Management;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace client.Helpers
{
    public static class SystemInfo
    {
        public static string GetOperatingSystem()
        {
            string osVersion = string.Empty;
            using (var searcher = new ManagementObjectSearcher("SELECT Caption FROM Win32_OperatingSystem"))
            {
                foreach (var queryObj in searcher.Get())
                {
                    osVersion = queryObj["Caption"].ToString();
                    break;
                }
            }

            if (osVersion.Contains("Windows"))
            {
                if (osVersion.Contains("11"))
                    return "Windows 11";
                if (osVersion.Contains("10"))
                    return "Windows 10";
                if (osVersion.Contains("8.1"))
                    return "Windows 8.1";
                if (osVersion.Contains("8"))
                    return "Windows 8";
                if (osVersion.Contains("7"))
                    return "Windows 7";
            }

            return "Windows";
        }
    }
}
