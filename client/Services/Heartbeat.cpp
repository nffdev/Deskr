#include "Heartbeat.h"
#include "../Helpers/HttpClient.h"
#include "../Helpers/Constants.h"
#include <iostream>
#include <chrono>

Heartbeat::Heartbeat(const std::string& connectionId)
    : _connectionId(connectionId), _running(true) {
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
    while (_running) {
        std::this_thread::sleep_for(std::chrono::milliseconds(HEARTBEAT_INTERVAL));
        if (!_running) break;

        try {
            std::string url = Constants::API_BASE + "/connections/" + _connectionId + "/heartbeat";
            auto response = HttpClient::Post(url, "");

            if (response.statusCode != 200 && response.statusCode != 404) {
                std::cout << "Heartbeat failed: " << response.statusCode << std::endl;
            }
        }
        catch (const std::exception& ex) {
            std::cout << "Error sending heartbeat: " << ex.what() << std::endl;
        }
    }
}
