#pragma once
#include <string>
#include <memory>
#include "../helpers/models.h"
#include "ip_service.h"
#include "heartbeat.h"

class ConnectionService {
public:
    ConnectionResponse Connect();
    void Disconnect(const std::string& connectionId);

private:
    IpService _ipService;
    std::unique_ptr<Heartbeat> _heartbeat;
};
