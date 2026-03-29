#pragma once
#include <string>
#include <memory>
#include "../Helpers/Models.h"
#include "IpService.h"
#include "Heartbeat.h"

class ConnectionService {
public:
    ConnectionResponse Connect();
    void Disconnect(const std::string& connectionId);

private:
    IpService _ipService;
    std::unique_ptr<Heartbeat> _heartbeat;
};
