#pragma once
#include <string>
#include <memory>
#include <functional>
#include "../helpers/models.h"
#include "ip_service.h"
#include "heartbeat.h"

class ConnectionService {
public:
    ConnectionResponse Connect(Heartbeat::DisconnectCallback onDisconnected = nullptr);
    void Disconnect(const std::string& connectionId);
    void StopHeartbeat();

private:
    IpService _ipService;
    std::unique_ptr<Heartbeat> _heartbeat;
};
