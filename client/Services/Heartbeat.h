#pragma once
#include <string>
#include <thread>
#include <atomic>
#include <functional>

class Heartbeat {
public:
    using DisconnectCallback = std::function<void()>;

    Heartbeat(const std::string& connectionId, DisconnectCallback onDisconnected = nullptr);
    ~Heartbeat();
    void Stop();

private:
    void Run();

    std::string        _connectionId;
    std::atomic<bool>  _running;
    std::thread        _thread;
    DisconnectCallback _onDisconnected;
    static const int   HEARTBEAT_INTERVAL  = 2000;
    static const int   MAX_FAILURES        = 3;
};
