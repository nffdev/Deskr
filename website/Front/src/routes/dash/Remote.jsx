'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import BottomNav from "@/components/nav/BottomNav";
import {
  Radio, Monitor, Maximize2, Minimize2, MousePointer2,
  Keyboard, RotateCcw, Wifi, Camera, MonitorSmartphone, ChevronDown
} from 'lucide-react';
import io from 'socket.io-client';
import config from '@/config.json';

export default function Remote() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [mouseControl, setMouseControl] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [screenFrame, setScreenFrame] = useState(null);
  const [latency, setLatency] = useState(null);
  const [devices, setDevices] = useState([]);
  const [monitors, setMonitors] = useState([]);
  const [activeMonitor, setActiveMonitor] = useState(0);
  const [showMonitorPicker, setShowMonitorPicker] = useState(false);
  const screenRef = useRef(null);
  const socketRef = useRef(null);
  const connectingRef = useRef(false);

  const API_BASE = `${config.BASE_API}/v${config.API_VERSION}`;

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/connections/recent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const selectedDeviceRef = useRef(null);
  useEffect(() => { selectedDeviceRef.current = selectedDevice; }, [selectedDevice]);

  useEffect(() => {
    const socket = io(config.BASE_API.replace('/api', ''), {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('screenFrame', (data) => {
      const dev = selectedDeviceRef.current;
      if (dev && data.connectionId === dev._id) {
        if (data.timestamp) {
          setLatency(Date.now() - data.timestamp);
        }
        setScreenFrame(`data:image/jpeg;base64,${data.frame}`);
      }
    });

    socket.on('monitors', (data) => {
      const dev = selectedDeviceRef.current;
      if (dev && data.connectionId === dev._id) {
        setMonitors(data.monitors || []);
      }
    });

    socket.on('newConnection', () => fetchDevices());
    socket.on('connectionUpdated', (data) => {
      fetchDevices();
      const dev = selectedDeviceRef.current;
      if (dev && data._id === dev._id && !data.isActive) {
        setConnected(false);
        setConnecting(false);
        setSelectedDevice(null);
        setScreenFrame(null);
        setLatency(null);
        setMonitors([]);
        setActiveMonitor(0);
        setShowMonitorPicker(false);
      }
    });

    return () => socket.disconnect();
  }, []);

  const fetchMonitors = async (deviceId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/connections/${deviceId}/monitors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMonitors(data.monitors || []);
      }
    } catch (err) {
      console.error('Failed to fetch monitors:', err);
    }
  };

  useEffect(() => {
    if (!connected || !selectedDevice) return;
    fetchMonitors(selectedDevice._id);
    const interval = setInterval(() => {
      fetchMonitors(selectedDevice._id);
    }, 3000);
    return () => clearInterval(interval);
  }, [connected, selectedDevice]);

  const switchMonitor = async (index) => {
    setActiveMonitor(index);
    setShowMonitorPicker(false);
    setScreenFrame(null);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/connections/${selectedDevice._id}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'switchMonitor', monitorIndex: index })
      });
    } catch (err) {
      console.error('Failed to switch monitor:', err);
    }
  };

  const manageConnect = async (device) => {
    if (connectingRef.current) return;
    connectingRef.current = true;
    setSelectedDevice(device);
    setShowDeviceList(false);
    setConnecting(true);
    setScreenFrame(null);
    setMonitors([]);
    setActiveMonitor(0);

    const token = localStorage.getItem('token');
    for (let i = 0; i < 15; i++) {
      try {
        const res = await fetch(`${API_BASE}/connections/${device._id}/monitors`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.monitors && data.monitors.length > 0) {
            setMonitors(data.monitors);
            break;
          }
        }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1000));
    }

    setConnecting(false);
    setConnected(true);
    connectingRef.current = false;
  };

  const lastMouseMove = useRef(0);

  const mouseControlRef = useRef(false);
  useEffect(() => { mouseControlRef.current = mouseControl; }, [mouseControl]);

  const sendMouseEvent = (type, e) => {
    if (!mouseControlRef.current) { return; }
    if (type === 'mouseMove') {
      const now = Date.now();
      if (now - lastMouseMove.current < 50) return;
      lastMouseMove.current = now;
    }
    if (!selectedDevice || !screenRef.current || !screenFrame) return;
    const rect = screenRef.current.getBoundingClientRect();
    const monitor = monitors[activeMonitor];
    const screenW = monitor ? monitor.width : 1920;
    const screenH = monitor ? monitor.height : 1080;

    const imgAspect = screenW / screenH;
    const containerAspect = rect.width / rect.height;

    let imgX, imgY, imgW, imgH;
    if (containerAspect > imgAspect) {
      imgH = rect.height;
      imgW = imgH * imgAspect;
      imgX = (rect.width - imgW) / 2;
      imgY = 0;
    } else {
      imgW = rect.width;
      imgH = imgW / imgAspect;
      imgX = 0;
      imgY = (rect.height - imgH) / 2;
    }

    const relX = (e.clientX - rect.left - imgX) / imgW;
    const relY = (e.clientY - rect.top - imgY) / imgH;

    if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return;

    const x = Math.round(relX * screenW);
    const y = Math.round(relY * screenH);

    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/connections/${selectedDevice._id}/command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ type, x, y, button: e.button || 0 })
    }).catch(() => {});
  };

  const manageDisconnect = () => {
    setConnected(false);
    setSelectedDevice(null);
    setScreenFrame(null);
    setLatency(null);
    setMonitors([]);
    setActiveMonitor(0);
    setShowMonitorPicker(false);
  };


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
                  {connected ? `Connected to ${selectedDevice?.deviceInfo}` : 'No active session'}
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
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5 overflow-visible relative z-20">
              <h2 className="font-semibold text-base sm:text-lg text-white mb-4">Select Device</h2>
              <div className="relative">
                <button
                  onClick={() => setShowDeviceList(!showDeviceList)}
                  className="w-full p-3 sm:p-4 rounded-xl border border-white/[0.08] bg-gray-800/50 flex items-center gap-3 hover:border-white/[0.12] transition-all"
                >
                  <div className="w-10 h-10 bg-gray-800/60 rounded-lg flex items-center justify-center shrink-0">
                    <Monitor className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    {devices.filter(d => d.isActive).length > 0 ? (
                      <>
                        <p className="text-sm text-white font-medium">Choose a device</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{devices.filter(d => d.isActive).length} device{devices.filter(d => d.isActive).length > 1 ? 's' : ''} online</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-400 font-medium">No devices online</p>
                        <p className="text-[10px] sm:text-xs text-gray-600">Waiting for connections...</p>
                      </>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDeviceList ? 'rotate-180' : ''}`} />
                </button>

                {showDeviceList && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-gray-900 border border-white/[0.08] rounded-xl shadow-xl z-30 py-1 max-h-60 overflow-y-auto">
                    {devices.filter(d => d.isActive).length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500 text-center">No online devices</p>
                    ) : (
                      devices.filter(d => d.isActive).map((device) => (
                        <button
                          key={device._id}
                          onClick={() => manageConnect(device)}
                          className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800/60 transition-colors"
                        >
                          <div className="w-8 h-8 bg-gray-800/60 rounded-lg flex items-center justify-center shrink-0">
                            <Monitor className="w-4 h-4 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm text-white font-medium truncate">{device.deviceInfo}</p>
                            <p className="text-[10px] text-gray-500">{device.ip}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs text-green-400">Online</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
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
            <p className="text-sm text-gray-400">Establishing connection to {selectedDevice?.deviceInfo}</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {showToolbar && !fullscreen && (
              <div className="relative z-30 bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl p-2 flex items-center gap-1 sm:gap-2 overflow-visible flex-wrap">
                <ToolbarBtn icon={Maximize2} label="Fullscreen" onClick={() => {
                  setFullscreen(true);
                  screenRef.current?.requestFullscreen?.();
                }} />
                <ToolbarBtn icon={MousePointer2} label="Cursor" active={mouseControl} onClick={() => setMouseControl(!mouseControl)} />
                <ToolbarBtn icon={Keyboard} label="Keyboard" onClick={() => setShowKeyboard(!showKeyboard)} active={showKeyboard} />
                <ToolbarBtn icon={Camera} label="Screenshot" onClick={() => {
                  if (!screenFrame) return;
                  const a = document.createElement('a');
                  a.href = screenFrame;
                  a.download = `screenshot_${selectedDevice?.deviceInfo || 'remote'}_${Date.now()}.jpg`;
                  a.click();
                }} />
                <ToolbarBtn icon={RotateCcw} label="Refresh" onClick={() => {
                  setScreenFrame(null);
                  setLatency(null);
                  if (selectedDevice) fetchMonitors(selectedDevice._id);
                }} />
                <div className="relative">
                  <button
                    onClick={() => setShowMonitorPicker(!showMonitorPicker)}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-gray-800/50 rounded-lg text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    <MonitorSmartphone className="w-3.5 h-3.5" />
                    <span className="text-[10px] sm:text-xs whitespace-nowrap">Screen {activeMonitor + 1}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showMonitorPicker ? 'rotate-180' : ''}`} />
                  </button>
                  {showMonitorPicker && (
                    <div className="absolute top-full mt-1 left-0 bg-gray-900 border border-white/[0.08] rounded-lg shadow-xl z-50 min-w-[200px] py-1">
                      {monitors.length > 0 ? monitors.map((m) => (
                        <button
                          key={m.index}
                          onClick={() => switchMonitor(m.index)}
                          className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-800/60 transition-colors ${
                            activeMonitor === m.index ? 'text-purple-400' : 'text-gray-300'
                          }`}
                        >
                          <Monitor className="w-3.5 h-3.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              Screen {m.index + 1} {m.isPrimary ? '(Primary)' : ''}
                            </p>
                            <p className="text-[10px] text-gray-500">{m.width}x{m.height}</p>
                          </div>
                          {activeMonitor === m.index && (
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full ml-auto shrink-0" />
                          )}
                        </button>
                      )) : (
                        <p className="px-3 py-2 text-xs text-gray-500">No monitors detected</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 bg-gray-800/50 rounded-lg">
                  <div className={`w-1.5 h-1.5 rounded-full ${screenFrame ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">{latency ? `${latency}ms` : '—'}</span>
                </div>
                <div className="px-2 sm:px-3 py-1.5 bg-gray-800/50 rounded-lg">
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    {monitors[activeMonitor] ? `${monitors[activeMonitor].width}×${monitors[activeMonitor].height}` : '—'}
                  </span>
                </div>
              </div>
            )}

            <div
              ref={screenRef}
              className={`relative bg-black rounded-xl overflow-hidden select-none ${mouseControl ? 'cursor-none' : ''} ${
                fullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video'
              }`}
              onMouseMove={(e) => sendMouseEvent('mouseMove', e)}
              onMouseDown={(e) => { e.preventDefault(); sendMouseEvent('mouseDown', e); }}
              onMouseUp={(e) => sendMouseEvent('mouseUp', e)}
              onContextMenu={(e) => e.preventDefault()}
            >
              {screenFrame ? (
                <img
                  src={screenFrame}
                  alt="Remote screen"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Monitor className="w-10 h-10 sm:w-12 sm:h-12 text-gray-600" />
                  <p className="text-xs sm:text-sm text-gray-500">Waiting for screen data...</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {fullscreen && (
                <button
                  onClick={() => {
                    document.exitFullscreen?.();
                    setFullscreen(false);
                  }}
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
                  <span className="text-gray-400">{selectedDevice?.deviceInfo}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-gray-400">{selectedDevice?.ip}</span>
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
