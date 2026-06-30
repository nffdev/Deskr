# client (C++)

Native Windows agent that streams the screen and executes remote commands (mouse, keyboard, shell) sent by the web interface.

## Features

- Screen capture & multi-monitor support
- Mouse & keyboard input simulation
- Shell command execution (PowerShell/CMD)
- Heartbeat with auto-reconnect (exponential backoff)
- Consent dialog on startup

## Dev Notes

Requires Visual Studio 2022 or MinGW (C++17), WinHTTP, GDI+.

`helpers/constants.h` contains `%API_BASE%` and `%OWNER_ID%` - injected at build time by the builder service, do not hardcode.
