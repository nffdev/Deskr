'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import BottomNav from "@/components/nav/BottomNav";
import {
  Radio, Monitor, Maximize2, Minimize2, MousePointer2,
  Keyboard, RotateCcw, Power, Wifi, WifiOff, Circle,
  ChevronDown, Volume2, VolumeX, Camera, Square
} from 'lucide-react';

export default function Remote() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const screenRef = useRef(null);

  const devices = [
    { id: 1, name: 'Desktop-PC-01', os: 'Windows 11', status: 'online', ip: '192.168.1.42' },
    { id: 2, name: 'Laptop-Work', os: 'Windows 10', status: 'online', ip: '192.168.1.58' },
    { id: 3, name: 'Server-Prod', os: 'Windows Server', status: 'offline', ip: '10.0.0.12' },
  ];

  const manageConnect = (device) => {
    setSelectedDevice(device);
    setShowDeviceList(false);
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
    }, 2000);
  };

  const manageDisconnect = () => {
    setConnected(false);
    setSelectedDevice(null);
  };

  const manageScreenClick = (e) => {
    if (!screenRef.current || !connected) return;
    const rect = screenRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  };

  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="relative min-h-screen bg-gray-950 pb-16 sm:pb-20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-purple-600/[0.07] blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-purple-500/[0.05] blur-[120px]" />
      </div>
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      {!fullscreen && (
        <header className="relative z-10 p-3 sm:p-4 border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-sm sm:text-base text-white">Remote Control</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-500">
                  {connected ? `Connected to ${selectedDevice?.name}` : 'No active session'}
                </span>
                {connected && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded text-[10px] text-green-400 font-medium">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
              </div>
            </div>
            {connected && (
              <button onClick={manageDisconnect} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs sm:text-sm text-red-400 font-medium hover:bg-red-500/20 transition-colors">
                Disconnect
              </button>
            )}
          </div>
        </header>
      )}

      <div className="relative z-10 max-w-5xl mx-auto p-3 sm:p-4">
        {!connected && !connecting ? (
          <div className="space-y-4">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5">
              <h2 className="font-semibold text-base sm:text-lg text-white mb-4">Select Device</h2>
              <div className="space-y-2">
                {devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => device.status === 'online' && manageConnect(device)}
                    disabled={device.status === 'offline'}
                    className={`w-full p-3 sm:p-4 rounded-xl border flex items-center gap-3 transition-all ${
                      device.status === 'offline'
                        ? 'border-white/[0.04] bg-gray-800/20 opacity-50 cursor-not-allowed'
                        : 'border-white/[0.06] bg-gray-800/30 hover:border-purple-500/30 hover:bg-gray-800/50 cursor-pointer'
                    }`}
                  >
                    <div className="w-10 h-10 bg-gray-800/60 rounded-lg flex items-center justify-center shrink-0">
                      <Monitor className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm sm:text-base text-white font-medium truncate">{device.name}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{device.os} — {device.ip}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className={`text-xs ${device.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                        {device.status === 'online' ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 sm:p-12 flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Monitor className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400/50" />
              </div>
              <p className="text-sm sm:text-base text-gray-400 text-center">Select a device to start a remote session</p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-1">You'll be able to view and control the screen in real-time</p>
            </div>
          </div>
        ) : connecting ? (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 sm:p-12 flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-6 relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
              <div className="relative w-full h-full bg-purple-500/10 rounded-full flex items-center justify-center">
                <Wifi className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400 animate-pulse" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Connecting...</h2>
            <p className="text-sm text-gray-400">Establishing connection to {selectedDevice?.name}</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {showToolbar && !fullscreen && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl p-2 flex items-center gap-1 sm:gap-2 overflow-x-auto">
                <ToolbarBtn icon={Maximize2} label="Fullscreen" onClick={() => setFullscreen(true)} />
                <ToolbarBtn icon={MousePointer2} label="Cursor" active />
                <ToolbarBtn icon={Keyboard} label="Keyboard" onClick={() => setShowKeyboard(!showKeyboard)} active={showKeyboard} />
                <ToolbarBtn icon={Camera} label="Screenshot" />
                <ToolbarBtn icon={RotateCcw} label="Refresh" />
                <div className="flex-1" />
                <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-gray-800/50 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">24ms</span>
                </div>
                <div className="px-2 sm:px-3 py-1.5 bg-gray-800/50 rounded-lg">
                  <span className="text-[10px] sm:text-xs text-gray-400">1920×1080</span>
                </div>
              </div>
            )}

            <div
              ref={screenRef}
              onClick={manageScreenClick}
              className={`relative bg-[#0078d4] rounded-xl overflow-hidden cursor-crosshair select-none ${
                fullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video'
              }`}
              style={{ backgroundImage: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)' }}
            >
              <div className="absolute inset-0">
                <div className="absolute top-4 left-4 space-y-4">
                  <DesktopIcon label="This PC" />
                  <DesktopIcon label="Recycle Bin" />
                  <DesktopIcon label="Documents" />
                  <DesktopIcon label="Chrome" />
                </div>

                <div className="absolute top-[10%] left-[15%] w-[60%] h-[55%] bg-[#202020] rounded-t-lg shadow-2xl shadow-black/50 overflow-hidden">
                  <div className="h-8 bg-[#2d2d2d] flex items-center justify-between px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#0078d4] rounded-sm" />
                      <span className="text-[10px] text-gray-300 font-medium">File Explorer — Documents</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <div className="w-8 h-6 flex items-center justify-center hover:bg-white/10 rounded-sm">
                        <div className="w-2.5 h-[1px] bg-gray-400" />
                      </div>
                      <div className="w-8 h-6 flex items-center justify-center hover:bg-white/10 rounded-sm">
                        <Square className="w-2.5 h-2.5 text-gray-400" />
                      </div>
                      <div className="w-8 h-6 flex items-center justify-center hover:bg-red-500 rounded-sm">
                        <span className="text-gray-400 text-xs">×</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <FileRow name="Project_Report.docx" size="2.4 MB" date="Mar 28, 2026" />
                    <FileRow name="Budget_2026.xlsx" size="1.1 MB" date="Mar 25, 2026" />
                    <FileRow name="Presentation.pptx" size="8.7 MB" date="Mar 22, 2026" />
                    <FileRow name="meeting_notes.txt" size="12 KB" date="Mar 20, 2026" />
                    <FileRow name="client_backup.zip" size="156 MB" date="Mar 15, 2026" />
                    <FileRow name="screenshot_01.png" size="3.2 MB" date="Mar 12, 2026" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#1c1c1c]/95 backdrop-blur-sm flex items-center px-2 justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded">
                      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="white"><path d="M0 0h7.5v7.5H0zM8.5 0H16v7.5H8.5zM0 8.5h7.5V16H0zM8.5 8.5H16V16H8.5z"/></svg>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded border-b-2 border-[#0078d4]">
                      <div className="w-3.5 h-3.5 bg-yellow-500/80 rounded-sm" />
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded">
                      <Circle className="w-3.5 h-3.5 text-[#0078d4]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2">
                    <Wifi className="w-3 h-3 text-gray-400" />
                    <Volume2 className="w-3 h-3 text-gray-400" />
                    <span className="text-[9px] text-gray-400">{currentTime}</span>
                    <span className="text-[9px] text-gray-400">{currentDate}</span>
                  </div>
                </div>

                <div
                  className="absolute w-4 h-4 transition-all duration-100 pointer-events-none z-10"
                  style={{ left: `${cursorPos.x}%`, top: `${cursorPos.y}%`, transform: 'translate(-2px, -2px)' }}
                >
                  <svg viewBox="0 0 16 16" fill="white" stroke="black" strokeWidth="1">
                    <path d="M0 0 L0 14 L4 10 L8 16 L10 15 L6 9 L12 9 Z" />
                  </svg>
                </div>
              </div>

              {fullscreen && (
                <button
                  onClick={() => setFullscreen(false)}
                  className="absolute top-3 right-3 z-20 p-2 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-black/80 transition-colors"
                >
                  <Minimize2 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {showKeyboard && !fullscreen && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl p-2 sm:p-3">
                <div className="space-y-1.5">
                  {[
                    ['Esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Del'],
                    ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                    ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Enter'],
                    ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
                    ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Ctrl'],
                  ].map((row, i) => (
                    <div key={i} className="flex gap-1 justify-center">
                      {row.map((key) => (
                        <button
                          key={key}
                          className={`${
                            key === 'Space' ? 'flex-1 max-w-[200px]' :
                            ['Shift', 'Enter', 'Caps', 'Tab', 'Ctrl', 'Alt', 'Win', 'Del', 'Esc'].includes(key) ? 'px-2 sm:px-3' : 'w-7 sm:w-8'
                          } h-8 sm:h-9 bg-gray-800/60 border border-white/[0.06] rounded-md text-[10px] sm:text-xs text-gray-300 font-medium hover:bg-gray-700/60 hover:border-purple-500/30 active:bg-purple-500/20 transition-colors flex items-center justify-center`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!fullscreen && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl p-3 sm:p-4 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-400">{selectedDevice?.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-gray-400">{selectedDevice?.ip}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{selectedDevice?.os}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!fullscreen && <BottomNav />}
    </div>
  );
}

function ToolbarBtn({ icon: Icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded-lg transition-colors shrink-0 ${
        active ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-300'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function DesktopIcon({ label }) {
  return (
    <div className="flex flex-col items-center gap-1 w-14 cursor-default">
      <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
        <Monitor className="w-4 h-4 text-white/70" />
      </div>
      <span className="text-[8px] sm:text-[9px] text-white text-center leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{label}</span>
    </div>
  );
}

function FileRow({ name, size, date }) {
  return (
    <div className="flex items-center gap-3 px-2 py-1 rounded hover:bg-white/5 text-[9px] sm:text-[10px]">
      <div className="w-4 h-4 bg-blue-500/30 rounded-sm shrink-0" />
      <span className="text-gray-300 flex-1 truncate">{name}</span>
      <span className="text-gray-500 shrink-0">{size}</span>
      <span className="text-gray-500 shrink-0 hidden sm:block">{date}</span>
    </div>
  );
}
