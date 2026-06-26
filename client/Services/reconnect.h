#pragma once
#include <string>
#include <functional>
#include <thread>
#include <atomic>
#include <chrono>
#include <iostream>
#include "../utils/utils.h"

class ReconnectService {
public:
    static const int MAX_ATTEMPTS   = 10;
    static const int BASE_DELAY_MS  = 500;
    static const int MAX_DELAY_MS   = 30000;

    using ConnectFn = std::function<bool()>;

    ReconnectService(ConnectFn connectFn)
        : _connectFn(connectFn), _running(false) {}

    ~ReconnectService() { Stop(); }

    void TriggerReconnect() {
        if (_running.exchange(true)) return;
        _thread = std::thread(&ReconnectService::Run, this);
        _thread.detach();
    }

    void Stop() { _running = false; }

private:
    void Run() {
        int attempt = 0;
        int delayMs = BASE_DELAY_MS;

        while (_running && attempt < MAX_ATTEMPTS) {
            ++attempt;
            std::cout << "[reconnecting... attempt " << attempt << "/" << MAX_ATTEMPTS << "]" << std::endl;
            std::this_thread::sleep_for(std::chrono::milliseconds(delayMs));

            if (_connectFn()) {
                std::cout << "[connected] Reconnected successfully." << std::endl;
                _running = false;
                return;
            }

            delayMs = (delayMs * 2 < MAX_DELAY_MS) ? delayMs * 2 : MAX_DELAY_MS;
        }

        if (!_running) return;

        std::cout << "[disconnected] Max reconnection attempts reached." << std::endl;
        _running = false;
    }

    ConnectFn            _connectFn;
    std::atomic<bool>    _running;
    std::thread          _thread;
};
