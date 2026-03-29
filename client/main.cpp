#include <iostream>
#include <string>
#include <Windows.h>
#include "Services/Connection.h"

int main() {
    CoInitializeEx(0, COINIT_MULTITHREADED);

    try {
        std::cout << "Connecting..." << std::endl;

        ConnectionService connectionService;
        auto connectionData = connectionService.Connect();

        std::cout << std::endl << "Successfully connected!" << std::endl;
        std::cout << "IP: " << connectionData.ip << std::endl;
        std::cout << "Device Info: " << connectionData.deviceInfo << std::endl;
        std::cout << "Timestamp: " << connectionData.timestamp << std::endl;

        std::cout << std::endl << "Connection active." << std::endl;
        system("pause >nul");

        if (!connectionData.id.empty()) {
            try {
                connectionService.Disconnect(connectionData.id);
                std::cout << "Inactive connection." << std::endl;
            }
            catch (const std::exception&) {
                std::cout << "Error disconnecting." << std::endl;
            }
        }
    }
    catch (const std::exception& e) {
        std::cout << "Error: " << e.what() << std::endl;
    }

    std::cout << std::endl << "Press any key to exit..." << std::endl;
    system("pause >nul");

    CoUninitialize();
    return 0;
}
