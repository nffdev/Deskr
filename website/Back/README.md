# backend

Express.js API server. Manages user accounts, device connections, screen frames, remote commands, and build jobs. Bridges the desktop clients and the web frontend via REST + Socket.IO.

## Features

- Auth (register, login, JWT cookies)
- Connection lifecycle (register, heartbeat, inactive)
- Real-time screen frame & shell output relay via Socket.IO
- Remote command queue (mouse, keyboard, shell, monitor switch)
- Client build trigger (MSBuild / MinGW) with live progress
- Icon upload & build artifact download

## Dev Notes

Copy `.env.example` to `.env` and fill in the values.

```bash
npm install
node index.js
```

`BUILD_PATH` must point to a valid MSBuild or dotnet executable on the host.