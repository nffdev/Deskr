#include "http_client.h"
#include <sstream>

HttpClient::UrlParts HttpClient::ParseUrl(const std::string& url) {
    UrlParts parts;
    parts.useHttps = false;
    parts.port = 80;

    std::string remaining = url;

    if (remaining.substr(0, 8) == "https://") {
        parts.useHttps = true;
        parts.port = 443;
        remaining = remaining.substr(8);
    }
    else if (remaining.substr(0, 7) == "http://") {
        remaining = remaining.substr(7);
    }

    size_t pathStart = remaining.find('/');
    std::string hostPort;
    std::string path;

    if (pathStart != std::string::npos) {
        hostPort = remaining.substr(0, pathStart);
        path = remaining.substr(pathStart);
    }
    else {
        hostPort = remaining;
        path = "/";
    }

    size_t colonPos = hostPort.find(':');
    std::string host;
    if (colonPos != std::string::npos) {
        host = hostPort.substr(0, colonPos);
        parts.port = std::stoi(hostPort.substr(colonPos + 1));
    }
    else {
        host = hostPort;
    }

    parts.host = std::wstring(host.begin(), host.end());
    parts.path = std::wstring(path.begin(), path.end());

    return parts;
}

HttpClient::Response HttpClient::SendRequest(const std::string& url, const std::wstring& method, const std::string& body) {
    Response result;
    result.statusCode = 0;

    UrlParts parts = ParseUrl(url);

    HINTERNET hSession = WinHttpOpen(L"DeskrClient/1.0",
        WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);

    if (!hSession) return result;

    HINTERNET hConnect = WinHttpConnect(hSession, parts.host.c_str(), parts.port, 0);
    if (!hConnect) {
        WinHttpCloseHandle(hSession);
        return result;
    }

    DWORD flags = parts.useHttps ? WINHTTP_FLAG_SECURE : 0;
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, method.c_str(), parts.path.c_str(),
        NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, flags);

    if (!hRequest) {
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return result;
    }

    LPCWSTR headers = L"Content-Type: application/json\r\n";
    BOOL bResults;

    if (!body.empty()) {
        bResults = WinHttpSendRequest(hRequest, headers, -1L,
            (LPVOID)body.c_str(), (DWORD)body.size(), (DWORD)body.size(), 0);
    }
    else {
        bResults = WinHttpSendRequest(hRequest, headers, -1L,
            WINHTTP_NO_REQUEST_DATA, 0, 0, 0);
    }

    if (bResults) {
        bResults = WinHttpReceiveResponse(hRequest, NULL);
    }

    if (bResults) {
        DWORD statusCode = 0;
        DWORD statusCodeSize = sizeof(statusCode);
        WinHttpQueryHeaders(hRequest, WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
            WINHTTP_HEADER_NAME_BY_INDEX, &statusCode, &statusCodeSize, WINHTTP_NO_HEADER_INDEX);
        result.statusCode = (int)statusCode;

        std::string responseBody;
        DWORD dwSize = 0;
        DWORD dwDownloaded = 0;

        do {
            dwSize = 0;
            WinHttpQueryDataAvailable(hRequest, &dwSize);
            if (dwSize > 0) {
                char* pszOutBuffer = new char[dwSize + 1];
                ZeroMemory(pszOutBuffer, dwSize + 1);
                WinHttpReadData(hRequest, (LPVOID)pszOutBuffer, dwSize, &dwDownloaded);
                responseBody.append(pszOutBuffer, dwDownloaded);
                delete[] pszOutBuffer;
            }
        } while (dwSize > 0);

        result.body = responseBody;
    }

    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);

    return result;
}

HttpClient::Response HttpClient::Get(const std::string& url) {
    return SendRequest(url, L"GET");
}

HttpClient::Response HttpClient::Post(const std::string& url, const std::string& jsonBody) {
    return SendRequest(url, L"POST", jsonBody);
}

HttpClient::Response HttpClient::Put(const std::string& url, const std::string& jsonBody) {
    return SendRequest(url, L"PUT", jsonBody);
}
