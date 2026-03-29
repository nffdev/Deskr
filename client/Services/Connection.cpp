#include "Connection.h"
#include "../Helpers/HttpClient.h"
#include "../Helpers/Constants.h"
#include "../Helpers/SystemInfo.h"
#include "../Helpers/JsonParser.h"
#include <iostream>
#include <stdexcept>

ConnectionResponse ConnectionService::Connect() {
    auto ip = _ipService.GetPublicIp();
    auto deviceInfo = SystemInfo::GetOperatingSystem();

    ConnectionRequest request;
    request.ip = ip;
    request.deviceInfo = deviceInfo;

    std::string url = Constants::API_BASE + "/connections";
    auto response = HttpClient::Post(url, request.toJson());

    if (response.statusCode < 200 || response.statusCode >= 300) {
        throw std::runtime_error("Server returned " + std::to_string(response.statusCode) + ": " + response.body);
    }

    auto json = JsonParser::Parse(response.body);

    ConnectionResponse result;
    result.id = json["_id"];
    result.ip = json["ip"];
    result.deviceInfo = json["deviceInfo"];
    result.timestamp = json["timestamp"];
    result.isActive = (json["isActive"] == "true");

    _heartbeat = std::make_unique<Heartbeat>(result.id);

    return result;
}

void ConnectionService::Disconnect(const std::string& connectionId) {
    if (connectionId.empty()) {
        throw std::invalid_argument("connectionId cannot be empty");
    }

    if (_heartbeat) {
        _heartbeat->Stop();
        _heartbeat.reset();
    }

    std::string url = Constants::API_BASE + "/connections/" + connectionId + "/inactive";
    auto response = HttpClient::Put(url);

    if (response.statusCode < 200 || response.statusCode >= 300) {
        throw std::runtime_error("Failed to disconnect: " + std::to_string(response.statusCode));
    }
}
