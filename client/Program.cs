using System;
using System.Threading.Tasks;
using client.Services;
using client.Helpers;
using client.Models;

namespace client
{
    class Program
    {
        static async Task Main(string[] args)
        {
            try
            {
                Console.WriteLine("Connecting...");

                var connectionService = new ConnectionService();
                var connectionData = await connectionService.ConnectAsync();

                Console.WriteLine("\nSuccessfully connected!");
                Console.WriteLine($"IP: {connectionData.Ip}");
                Console.WriteLine($"Device Info: {connectionData.DeviceInfo}");
                Console.WriteLine($"Timestamp: {connectionData.Timestamp}");

                Console.WriteLine("\nConnection active.");
                Console.ReadKey();

                if (!string.IsNullOrEmpty(connectionData.Id))
                {
                    try
                    {
                        await connectionService.DisconnectAsync(connectionData.Id);
                        Console.WriteLine("Inactive connection.");
                    }
                    catch (Exception)
                    {
                        Console.WriteLine("Error disconnecting.");
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error: {e.Message}");
            }

            Console.WriteLine("\nPress any key to exit...");
            Console.ReadKey();
        }
    }
}
