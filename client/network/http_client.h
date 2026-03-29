#pragma once
#include <string>
#include <Windows.h>
#include <winhttp.h>

#pragma comment(lib, "winhttp.lib")

class HttpClient {
public:
    struct Response {
        int statusCode;
        std::string body;
    };

    static Response Get(const std::string& url);
    static Response Post(const std::string& url, const std::string& jsonBody);
    static Response Put(const std::string& url, const std::string& jsonBody = "");

private:
    struct UrlParts {
        std::wstring host;
        std::wstring path;
        int port;
        bool useHttps;
    };

    static UrlParts ParseUrl(const std::string& url);
    static Response SendRequest(const std::string& url, const std::wstring& method, const std::string& body = "");
};
