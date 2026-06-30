# builder

Holds the C++ and C# client source templates. When a build is triggered via the API, the backend copies the relevant template, injects the user's configuration (API URL, owner ID, app name, icon), compiles it, and returns the executable.

## Structure

```
scripts/cpp/   - C++ client template (Visual Studio / MinGW)
scripts/cs/    - C# client template (.NET Framework 4.7.2, MSBuild)
builds/        - compiled executables 
configs/       - per-build metadata 
icons/         - uploaded app icons
```

## Dev Notes

Templates are kept in sync with `client/` and `client_cs/` via `sync-client.ps1` at the repo root.

`Helpers/constants.h` and `Helpers/Constants.cs` contain build-time placeholders (`%API_BASE%`, `%OWNER_ID%`) - never replace them manually.
