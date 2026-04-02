#include "ScreenCapture.h"
#include "../network/http_client.h"
#include "../helpers/constants.h"
#include "../helpers/parser.h"
#include <gdiplus.h>
#include <iostream>
#include <chrono>

#pragma comment(lib, "gdiplus.lib")

static ULONG_PTR gdiplusToken = 0;
static bool gdiplusInitialized = false;

static void InitGdiPlus() {
    if (!gdiplusInitialized) {
        Gdiplus::GdiplusStartupInput input;
        Gdiplus::GdiplusStartup(&gdiplusToken, &input, nullptr);
        gdiplusInitialized = true;
    }
}

static int GetEncoderClsid(const WCHAR* format, CLSID* pClsid) {
    UINT num = 0, size = 0;
    Gdiplus::GetImageEncodersSize(&num, &size);
    if (size == 0) return -1;

    auto pImageCodecInfo = (Gdiplus::ImageCodecInfo*)(malloc(size));
    if (!pImageCodecInfo) return -1;

    Gdiplus::GetImageEncoders(num, size, pImageCodecInfo);
    for (UINT i = 0; i < num; ++i) {
        if (wcscmp(pImageCodecInfo[i].MimeType, format) == 0) {
            *pClsid = pImageCodecInfo[i].Clsid;
            free(pImageCodecInfo);
            return i;
        }
    }
    free(pImageCodecInfo);
    return -1;
}

static BOOL CALLBACK MonitorEnumProc(HMONITOR hMonitor, HDC, LPRECT, LPARAM dwData) {
    auto* monitors = reinterpret_cast<std::vector<MonitorInfo>*>(dwData);

    MONITORINFOEX mi;
    mi.cbSize = sizeof(MONITORINFOEX);
    GetMonitorInfo(hMonitor, &mi);

    MonitorInfo info;
    info.index = (int)monitors->size();
    info.x = mi.rcMonitor.left;
    info.y = mi.rcMonitor.top;
    info.width = mi.rcMonitor.right - mi.rcMonitor.left;
    info.height = mi.rcMonitor.bottom - mi.rcMonitor.top;
    info.isPrimary = (mi.dwFlags & MONITORINFOF_PRIMARY) != 0;

    info.name = std::string(mi.szDevice);

    monitors->push_back(info);
    return TRUE;
}

ScreenCapture::ScreenCapture(const std::string& connectionId, int intervalMs)
    : _connectionId(connectionId), _intervalMs(intervalMs), _running(false), _monitorIndex(0) {
    InitGdiPlus();
    _monitors = GetMonitors();
}

ScreenCapture::~ScreenCapture() {
    Stop();
}

void ScreenCapture::Start() {
    if (_running) return;
    _running = true;
    SendMonitorList();
    _thread = std::thread(&ScreenCapture::CaptureLoop, this);
}

void ScreenCapture::Stop() {
    _running = false;
    if (_thread.joinable()) {
        _thread.join();
    }
}

bool ScreenCapture::IsRunning() const {
    return _running;
}

void ScreenCapture::SetMonitor(int index) {
    std::lock_guard<std::mutex> lock(_monitorMutex);
    if (index >= 0 && index < (int)_monitors.size()) {
        _monitorIndex = index;
    }
}

std::vector<MonitorInfo> ScreenCapture::GetMonitors() {
    std::vector<MonitorInfo> monitors;
    EnumDisplayMonitors(nullptr, nullptr, MonitorEnumProc, reinterpret_cast<LPARAM>(&monitors));
    return monitors;
}

void ScreenCapture::SendMonitorList() {
    std::lock_guard<std::mutex> lock(_monitorMutex);
    _monitors = GetMonitors();

    std::string json = "{\"connectionId\":\"" + _connectionId + "\",\"monitors\":[";
    for (size_t i = 0; i < _monitors.size(); i++) {
        if (i > 0) json += ",";
        json += _monitors[i].toJson();
    }
    json += "]}";

    std::string url = Constants::API_BASE + "/connections/" + _connectionId + "/monitors";
    HttpClient::Post(url, json);
}

std::vector<BYTE> ScreenCapture::CaptureScreen(int quality, const MonitorInfo* monitor) {
    std::vector<BYTE> result;

    int x, y, width, height;
    if (monitor) {
        x = monitor->x;
        y = monitor->y;
        width = monitor->width;
        height = monitor->height;
    } else {
        x = 0;
        y = 0;
        width = GetSystemMetrics(SM_CXSCREEN);
        height = GetSystemMetrics(SM_CYSCREEN);
    }

    HDC hScreenDC = GetDC(nullptr);
    HDC hMemDC = CreateCompatibleDC(hScreenDC);
    HBITMAP hBitmap = CreateCompatibleBitmap(hScreenDC, width, height);
    SelectObject(hMemDC, hBitmap);

    BitBlt(hMemDC, 0, 0, width, height, hScreenDC, x, y, SRCCOPY);

    CURSORINFO ci = {};
    ci.cbSize = sizeof(CURSORINFO);
    if (GetCursorInfo(&ci) && (ci.flags & CURSOR_SHOWING)) {
        ICONINFO ii;
        if (GetIconInfo(ci.hCursor, &ii)) {
            DrawIconEx(hMemDC, ci.ptScreenPos.x - x - ii.xHotspot, ci.ptScreenPos.y - y - ii.yHotspot, ci.hCursor, 0, 0, 0, nullptr, DI_NORMAL);
            if (ii.hbmMask) DeleteObject(ii.hbmMask);
            if (ii.hbmColor) DeleteObject(ii.hbmColor);
        }
    }

    Gdiplus::Bitmap bitmap(hBitmap, nullptr);

    CLSID jpegClsid;
    if (GetEncoderClsid(L"image/jpeg", &jpegClsid) < 0) {
        DeleteObject(hBitmap);
        DeleteDC(hMemDC);
        ReleaseDC(nullptr, hScreenDC);
        return result;
    }

    Gdiplus::EncoderParameters encoderParams;
    encoderParams.Count = 1;
    encoderParams.Parameter[0].Guid = Gdiplus::EncoderQuality;
    encoderParams.Parameter[0].Type = Gdiplus::EncoderParameterValueTypeLong;
    encoderParams.Parameter[0].NumberOfValues = 1;
    ULONG qualityValue = (ULONG)quality;
    encoderParams.Parameter[0].Value = &qualityValue;

    IStream* pStream = nullptr;
    CreateStreamOnHGlobal(nullptr, TRUE, &pStream);

    if (bitmap.Save(pStream, &jpegClsid, &encoderParams) == Gdiplus::Ok) {
        STATSTG stat;
        pStream->Stat(&stat, STATFLAG_NONAME);
        ULONG size = (ULONG)stat.cbSize.QuadPart;

        result.resize(size);
        LARGE_INTEGER li = {};
        pStream->Seek(li, STREAM_SEEK_SET, nullptr);
        ULONG bytesRead = 0;
        pStream->Read(result.data(), size, &bytesRead);
    }

    if (pStream) pStream->Release();
    DeleteObject(hBitmap);
    DeleteDC(hMemDC);
    ReleaseDC(nullptr, hScreenDC);

    return result;
}

std::string ScreenCapture::ToBase64(const std::vector<BYTE>& data) {
    static const char table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string encoded;
    size_t len = data.size();
    encoded.reserve(((len + 2) / 3) * 4);

    for (size_t i = 0; i < len; i += 3) {
        unsigned int b = (data[i] << 16);
        if (i + 1 < len) b |= (data[i + 1] << 8);
        if (i + 2 < len) b |= data[i + 2];

        encoded.push_back(table[(b >> 18) & 0x3F]);
        encoded.push_back(table[(b >> 12) & 0x3F]);
        encoded.push_back((i + 1 < len) ? table[(b >> 6) & 0x3F] : '=');
        encoded.push_back((i + 2 < len) ? table[b & 0x3F] : '=');
    }

    return encoded;
}

void ScreenCapture::CheckCommands() {
    try {
        std::string url = Constants::API_BASE + "/connections/" + _connectionId + "/command";
        auto response = HttpClient::Get(url);
        if (response.statusCode == 200 && !response.body.empty()) {
            auto json = JsonParser::Parse(response.body);
            if (json.count("type") && json["type"] == "switchMonitor" && json.count("monitorIndex")) {
                int idx = std::stoi(json["monitorIndex"]);
                SetMonitor(idx);
            }
        }
    } catch (...) {}
}

void ScreenCapture::CaptureLoop() {
    while (_running) {
        try {
            const MonitorInfo* currentMonitor = nullptr;
            {
                std::lock_guard<std::mutex> lock(_monitorMutex);
                int idx = _monitorIndex.load();
                if (idx >= 0 && idx < (int)_monitors.size()) {
                    currentMonitor = &_monitors[idx];
                }
            }

            auto imageData = CaptureScreen(40, currentMonitor);
            if (!imageData.empty()) {
                std::string base64 = ToBase64(imageData);
                auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch()).count();
                std::string json = "{\"connectionId\":\"" + _connectionId +
                    "\",\"monitorIndex\":" + std::to_string(_monitorIndex.load()) +
                    ",\"timestamp\":" + std::to_string(now) +
                    ",\"frame\":\"" + base64 + "\"}";
                std::string url = Constants::API_BASE + "/connections/" + _connectionId + "/screen";
                HttpClient::Post(url, json);
            }
        }
        catch (...) {}

        CheckCommands();
        Sleep(_intervalMs);
    }
}
