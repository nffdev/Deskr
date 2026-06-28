#include "heartbeat.h"
#include "../network/http_client.h"
#include "../helpers/constants.h"
#include <iostream>
#include <chrono>
#include <thread>

Heartbeat::Heartbeat(const std::string& connectionId, DisconnectCallback onDisconnected)
    : _connectionId(connectionId), _running(true), _onDisconnected(onDisconnected) {
    _thread = std::thread(&Heartbeat::Run, this);
}

Heartbeat::~Heartbeat() {
    Stop();
}

void Heartbeat::Stop() {
    _running = false;
    if (_thread.joinable()) {
        _thread.join();
    }
}

void Heartbeat::Run() {
    int failures = 0;

    while (_running) {
        std::this_thread::sleep_for(std::chrono::milliseconds(HEARTBEAT_INTERVAL));
        if (!_running) break;

        try {
            std::string url = Constants::API_BASE + "/connections/" + _connectionId + "/heartbeat";
            auto response = HttpClient::Post(url, "");

            if (response.statusCode == 200) {
                failures = 0;
            } else if (response.statusCode == 404 || response.statusCode == 0) {
                failures = MAX_FAILURES;
                std::cout << "Heartbeat fatal (" << response.statusCode << ") -> disconnecting immediately" << std::endl;
            } else {
                ++failures;
                std::cout << "Heartbeat failed (" << response.statusCode << ") -> " << failures << "/" << MAX_FAILURES << std::endl;
            }
        }
        catch (const std::exception& ex) {
            ++failures;
            std::cout << "Heartbeat error: " << ex.what() << " -> " << failures << "/" << MAX_FAILURES << std::endl;
        }

        if (failures >= MAX_FAILURES && _running) {
            std::cout << "[disconnected] Heartbeat lost." << std::endl;
            _running = false;
            if (_onDisconnected) {
                std::thread([cb = _onDisconnected]() { cb(); }).detach();
            }
            return;
        }
    }
}
