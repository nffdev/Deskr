#include "connection.h"
#include "../network/http_client.h"
#include "../helpers/constants.h"
#include "../helpers/system_info.h"
#include "../helpers/parser.h"
#include <iostream>
#include <stdexcept>

ConnectionResponse ConnectionService::Connect() {
    auto ip = _ipService.GetPublicIp();
    auto deviceInfo = SystemInfo::GetDeviceInfo();

    ConnectionRequest request;
    request.ip = ip;
    request.deviceInfo = deviceInfo;
    request.ownerId = Constants::OWNER_ID;

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
