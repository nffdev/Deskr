#pragma once
#include <string>
#include <thread>
#include <atomic>

class Heartbeat {
public:
    Heartbeat(const std::string& connectionId);
    ~Heartbeat();
    void Stop();

private:
    void Run();

    std::string _connectionId;
    std::atomic<bool> _running;
    std::thread _thread;
    static const int HEARTBEAT_INTERVAL = 5000;
};
