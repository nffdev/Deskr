#include "IpService.h"
#include "../Helpers/HttpClient.h"
#include "../Helpers/JsonParser.h"
#include <stdexcept>

std::string IpService::GetPublicIp() {
    auto response = HttpClient::Get("http://ip-api.com/json/");

    if (response.statusCode != 200) {
        throw std::runtime_error("Failed to fetch IP address");
    }

    auto json = JsonParser::Parse(response.body);
    auto it = json.find("query");
    if (it == json.end()) {
        throw std::runtime_error("Failed to parse IP address from response");
    }

    return it->second;
}
