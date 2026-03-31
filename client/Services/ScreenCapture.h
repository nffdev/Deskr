#pragma once
#include <vector>
#include <string>
#include <atomic>
#include <thread>
#include <Windows.h>

class ScreenCapture {
public:
    ScreenCapture(const std::string& connectionId, int intervalMs = 1000);
    ~ScreenCapture();

    void Start();
    void Stop();
    bool IsRunning() const;

    static std::vector<BYTE> CaptureScreen(int quality = 50);
    static std::string ToBase64(const std::vector<BYTE>& data);

private:
    void CaptureLoop();

    std::string _connectionId;
    int _intervalMs;
    std::atomic<bool> _running;
    std::thread _thread;
};
