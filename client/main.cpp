#include <iostream>
#include <string>
#include <Windows.h>
#include "services/connection.h"
#include "services/ScreenCapture.h"
#include "utils/utils.h"
#include "helpers/consent.h"

int main() {
    CoInitializeEx(0, COINIT_MULTITHREADED);

    if (!Consent::ShowConsentDialog()) {
        Utils::Log("Installation cancelled by user.");
        CoUninitialize();
        return 0;
    }

    try {
        std::cout << "Connecting..." << std::endl;

        ConnectionService connectionService;
        auto connectionData = connectionService.Connect();

        std::cout << std::endl << "Successfully connected!" << std::endl;
        std::cout << "IP: " << connectionData.ip << std::endl;
        std::cout << "Device Info: " << connectionData.deviceInfo << std::endl;
        std::cout << "Timestamp: " << connectionData.timestamp << std::endl;

        ScreenCapture screenCapture(connectionData.id, 1000);
        screenCapture.Start();
        std::cout << std::endl << "Screen capture started." << std::endl;

        std::cout << "Connection active. Press any key to stop..." << std::endl;
        system("pause >nul");

        screenCapture.Stop();
        std::cout << "Screen capture stopped." << std::endl;

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
