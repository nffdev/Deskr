import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import BottomNav from "@/components/nav/BottomNav";
import { Terminal, Monitor, Trash2, ChevronDown } from 'lucide-react';
import io from 'socket.io-client';
import config from '@/config.json';

const API_URL = config.BASE_API;
const API_BASE = `${API_URL}/v${config.API_VERSION}`;

export default function Shell() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [cmdHistoryIndex, setCmdHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchDevices();

    const socket = io(API_URL.split('/api')[0], { withCredentials: true });
    socketRef.current = socket;

    socket.on('shellOutput', (data) => {
      if (selectedDevice && data.connectionId === selectedDevice._id) {
        setHistory(prev => [...prev, { type: 'output', text: data.output, commandId: data.commandId }]);
      }
    });

    socket.on('newConnection', fetchDevices);
    socket.on('connectionUpdated', fetchDevices);

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.off('shellOutput');
    socketRef.current.on('shellOutput', (data) => {
      if (selectedDevice && data.connectionId === selectedDevice._id) {
        setHistory(prev => [...prev, { type: 'output', text: data.output, commandId: data.commandId }]);
      }
    });
  }, [selectedDevice]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const fetchDevices = async () => {
    try {
      const res = await fetch(`${API_BASE}/connections/recent`, {
        credentials: 'include'
      });
      const data = await res.json();
      setDevices(data.filter(d => d.isActive));
    } catch (e) {}
  };

  const sendCommand = async () => {
    if (!command.trim() || !selectedDevice) return;

    const commandId = Date.now().toString();

    setHistory(prev => [...prev, { type: 'command', text: command }]);
    setCmdHistory(prev => [command, ...prev]);
    setCmdHistoryIndex(-1);

    try {
      await fetch(`${API_BASE}/connections/${selectedDevice._id}/command`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'shell', command, commandId })
      });
    } catch (e) {
      setHistory(prev => [...prev, { type: 'error', text: 'Failed to send command' }]);
    }

    setCommand('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIndex = Math.min(cmdHistoryIndex + 1, cmdHistory.length - 1);
        setCmdHistoryIndex(newIndex);
        setCommand(cmdHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdHistoryIndex > 0) {
        const newIndex = cmdHistoryIndex - 1;
        setCmdHistoryIndex(newIndex);
        setCommand(cmdHistory[newIndex]);
      } else {
        setCmdHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const selectDevice = (device) => {
    setSelectedDevice(device);
    setShowDeviceList(false);
    setHistory([
      { type: 'output', text: 'Microsoft Windows [version 10.0.26200.7840]\n(c) Microsoft Corporation. All rights reserved.\n' }
    ]);
  };

  const onlineDevices = devices.filter(d => d.isActive);

  return (
    <div className="relative min-h-screen bg-gray-950 text-white pb-20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-purple-600/[0.07] blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-purple-500/[0.05] blur-[120px]" />
      </div>
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      <header className="relative z-10 p-3 sm:p-4 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Terminal className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm sm:text-base text-white">Shell</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-500">
                {selectedDevice ? `Connected to ${selectedDevice.deviceInfo}` : 'No active session'}
              </span>
              {selectedDevice && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/10 rounded text-[10px] text-green-400 font-medium">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>
          {selectedDevice && (
            <button
              onClick={() => { setSelectedDevice(null); setHistory([]); }}
              className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs sm:text-sm text-red-400 font-medium hover:bg-red-500/20 transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto p-3 sm:p-4">
        {!selectedDevice ? (
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
                    {onlineDevices.length > 0 ? (
                      <>
                        <p className="text-sm text-white font-medium">Choose a device</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{onlineDevices.length} device{onlineDevices.length > 1 ? 's' : ''} online</p>
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
                    {onlineDevices.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-gray-500 text-center">No online devices</p>
                    ) : (
                      onlineDevices.map((device) => (
                        <button
                          key={device._id}
                          onClick={() => selectDevice(device)}
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
                <Terminal className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400/50" />
              </div>
              <p className="text-sm sm:text-base text-gray-400 text-center">Select a device to start a shell session</p>
              <p className="text-[10px] sm:text-xs text-gray-600 mt-1">You'll be able to send commands in real-time</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="flex items-center justify-end mb-3">
              <button
                onClick={() => setHistory([])}
                className="p-1.5 rounded-lg hover:bg-gray-800/60 text-gray-500 hover:text-gray-300 transition-colors"
                title="Clear"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div
              ref={terminalRef}
              onClick={() => inputRef.current?.focus()}
              className="flex-1 bg-gray-950 border border-white/[0.06] rounded-xl p-4 font-mono text-[13px] overflow-y-auto cursor-text"
            >
              {history.map((entry, i) => (
                <div key={i} className="mb-1">
                  {entry.type === 'command' && (
                    <div className="flex items-start gap-2">
                      <span className="text-purple-400 shrink-0">{'>'}</span>
                      <span className="text-gray-200">{entry.text}</span>
                    </div>
                  )}
                  {entry.type === 'output' && (
                    <pre className="text-gray-400 whitespace-pre-wrap break-all pl-4">{entry.text}</pre>
                  )}
                  {entry.type === 'error' && (
                    <span className="text-red-400 pl-4">{entry.text}</span>
                  )}
                  {entry.type === 'system' && (
                    <span className="text-gray-600 text-xs">{entry.text}</span>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-2 mt-1">
                <span className="text-purple-400 shrink-0">{'>'}</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent outline-none text-gray-200 placeholder-gray-700 caret-purple-400"
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
