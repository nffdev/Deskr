# client_cs (C#)

C# port of the C++ client targeting .NET Framework 4.7.2. Same feature set, built with MSBuild.

## Features

- Screen capture & multi-monitor support
- Mouse & keyboard input simulation via P/Invoke
- Shell command execution (PowerShell/CMD)
- Heartbeat with auto-reconnect (exponential backoff)
- Consent dialog on startup

## Dev Notes

Requires Visual Studio 2022 and MSBuild. Windows-only (uses WinForms, WinAPI, Registry).

`Helpers/Constants.cs` contains `%BASE_API%` and `%OWNER_ID%` - injected at build time by the builder service, do not hardcode.
