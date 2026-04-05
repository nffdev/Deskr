'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import BottomNav from "@/components/nav/BottomNav";
import { Terminal, Send, Monitor, Trash2 } from 'lucide-react';
import io from 'socket.io-client';
import config from '@/config.json';

const API_URL = config.BASE_API;
const API_BASE = `${API_URL}/v${config.API_VERSION}`;

export default function Shell() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState([]);
  const [cmdHistory, setCmdHistory] = useState([]);
  const [cmdHistoryIndex, setCmdHistoryIndex] = useState(-1);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchDevices();

    const socket = io(API_URL.split('/api')[0]);
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
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/connections/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDevices(data.filter(d => d.isActive));
    } catch (e) {}
  };

  const sendCommand = async () => {
    if (!command.trim() || !selectedDevice) return;

    const commandId = Date.now().toString();
    const token = localStorage.getItem('token');

    setHistory(prev => [...prev, { type: 'command', text: command }]);
    setCmdHistory(prev => [command, ...prev]);
    setCmdHistoryIndex(-1);

    try {
      await fetch(`${API_BASE}/connections/${selectedDevice._id}/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Terminal className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Shell</h1>
            <p className="text-xs text-gray-500">
              {selectedDevice ? `Connected to ${selectedDevice.deviceInfo}` : 'Select a device'}
            </p>
          </div>
        </div>

        {!selectedDevice ? (
          <div className="space-y-3">
            <div className="bg-gray-900/50 border border-white/[0.06] rounded-xl p-4">
              <h2 className="text-sm font-medium text-gray-300 mb-3">Online Devices</h2>
              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <Monitor className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No devices online</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {devices.map(device => (
                    <button
                      key={device._id}
                      onClick={() => {
                        setSelectedDevice(device);
                        setHistory([
                          { type: 'output', text: 'Microsoft Windows [version 10.0.26200.7840]\n(c) Microsoft Corporation. All rights reserved.\n' }
                        ]);
                      }}
                      className="w-full p-3 rounded-lg border border-white/[0.08] bg-gray-800/50 flex items-center gap-3 hover:border-purple-500/30 transition-all"
                    >
                      <div className="w-8 h-8 bg-gray-800/60 rounded-lg flex items-center justify-center">
                        <Monitor className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{device.deviceInfo}</p>
                        <p className="text-[10px] text-gray-500">{device.ip}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-gray-400">{selectedDevice.deviceInfo}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistory([])}
                  className="p-1.5 rounded-lg hover:bg-gray-800/60 text-gray-500 hover:text-gray-300 transition-colors"
                  title="Clear"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedDevice(null);
                    setHistory([]);
                  }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                >
                  Disconnect
                </button>
              </div>
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
