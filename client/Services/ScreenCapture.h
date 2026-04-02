#pragma once
#include <vector>
#include <string>
#include <atomic>
#include <thread>
#include <mutex>
#include <Windows.h>

struct MonitorInfo {
    int index;
    std::string name;
    int x, y, width, height;
    bool isPrimary;

    static std::string escapeJson(const std::string& s) {
        std::string out;
        for (char c : s) {
            if (c == '\\') out += "\\\\";
            else if (c == '"') out += "\\\"";
            else out += c;
        }
        return out;
    }

    std::string toJson() const {
        return "{\"index\":" + std::to_string(index) +
            ",\"name\":\"" + escapeJson(name) + "\"" +
            ",\"x\":" + std::to_string(x) +
            ",\"y\":" + std::to_string(y) +
            ",\"width\":" + std::to_string(width) +
            ",\"height\":" + std::to_string(height) +
            ",\"isPrimary\":" + (isPrimary ? "true" : "false") + "}";
    }
};

class ScreenCapture {
public:
    ScreenCapture(const std::string& connectionId, int intervalMs = 1000);
    ~ScreenCapture();

    void Start();
    void Stop();
    bool IsRunning() const;
    void SetMonitor(int index);

    static std::vector<MonitorInfo> GetMonitors();
    static std::vector<BYTE> CaptureScreen(int quality = 50, const MonitorInfo* monitor = nullptr);
    static std::string ToBase64(const std::vector<BYTE>& data);

    void SendMonitorList();

private:
    void CaptureLoop();
    void CommandLoop();
    void CheckCommands();
    void ExecuteMouseEvent(const std::string& type, int x, int y, int button);

    std::string _connectionId;
    int _intervalMs;
    std::atomic<bool> _running;
    std::atomic<int> _monitorIndex;
    std::thread _thread;
    std::thread _commandThread;
    std::vector<MonitorInfo> _monitors;
    std::mutex _monitorMutex;
};
