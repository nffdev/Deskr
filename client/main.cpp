#include <iostream>
#include <string>
#include <atomic>
#include <mutex>
#include <Windows.h>
#include "services/connection.h"
#include "services/ScreenCapture.h"
#include "services/reconnect.h"
#include "utils/utils.h"
#include "helpers/consent.h"

static ConnectionService              g_connectionService;
static std::unique_ptr<ScreenCapture> g_screenCapture;
static std::atomic<bool>              g_running(true);
static std::mutex                     g_sessionMutex;
static std::string                    g_connectionId;

bool StartSession();

static ReconnectService g_reconnect([]() -> bool {
    return StartSession();
});

bool StartSession() {
    std::lock_guard<std::mutex> lock(g_sessionMutex);

    if (g_screenCapture) {
        g_screenCapture->Stop();
        g_screenCapture.reset();
    }
    g_connectionService.StopHeartbeat();

    try {
        auto connectionData = g_connectionService.Connect([&]() {
            if (g_running) {
                std::cout << "[disconnected] Connection lost." << std::endl;
                g_reconnect.TriggerReconnect();
            }
        });

        g_connectionId = connectionData.id;

        Utils::Log("Successfully connected!");
        Utils::Log("IP: " + connectionData.ip);
        Utils::Log("Device: " + connectionData.deviceInfo);

        g_screenCapture = std::make_unique<ScreenCapture>(connectionData.id, 1000);
        g_screenCapture->Start();

        std::cout << "[connected]" << std::endl;
        return true;
    }
    catch (const std::exception& e) {
        Utils::LogError(std::string("Connection failed: ") + e.what());
        return false;
    }
}

int main() {
    CoInitializeEx(0, COINIT_MULTITHREADED);

    if (!Consent::ShowConsentDialog()) {
        Utils::Log("Installation cancelled by user.");
        CoUninitialize();
        return 0;
    }

    if (!StartSession()) {
        Utils::Log("Initial connection failed. Starting reconnection...");
        g_reconnect.TriggerReconnect();
    }

    std::cout << "Press any key to stop..." << std::endl;
    system("pause >nul");

    g_running = false;
    g_reconnect.Stop();

    if (g_screenCapture) {
        g_screenCapture->Stop();
        g_screenCapture.reset();
    }

    if (!g_connectionId.empty()) {
        try { g_connectionService.Disconnect(g_connectionId); }
        catch (...) {}
    }

    std::cout << std::endl << "Press any key to exit..." << std::endl;
    system("pause >nul");

    CoUninitialize();
    return 0;
}
