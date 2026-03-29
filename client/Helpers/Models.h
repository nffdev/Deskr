#pragma once
#include <string>

struct ConnectionRequest {
    std::string ip;
    std::string deviceInfo;

    std::string toJson() const {
        return "{\"ip\":\"" + ip + "\",\"deviceInfo\":\"" + deviceInfo + "\"}";
    }
};

struct ConnectionResponse {
    std::string id;
    std::string ip;
    std::string deviceInfo;
    std::string timestamp;
    bool isActive;
};

struct IpApiResponse {
    std::string query;
    std::string country;
    std::string city;
};
