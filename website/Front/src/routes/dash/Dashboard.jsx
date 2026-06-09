'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import BottomNav from "@/components/nav/BottomNav";
import { Search, Smartphone, Plus, Monitor, ArrowRight, X, Laptop } from 'lucide-react';
import io from 'socket.io-client';
import config from '@/config.json';

const API_URL = config.BASE_API;
const API_BASE = `${API_URL}/v${config.API_VERSION}`;

export default function Dashboard() {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [activeTab, setActiveTab] = useState('device');
  const [showBuilder, setShowBuilder] = useState(false);
  const [deviceType, setDeviceType] = useState('smartphone');

  useEffect(() => {
    if (!API_URL) return;

    fetchConnections();

    const socket = io(API_URL.split('/api')[0]);
    socket.on('newConnection', (connection) => {
      if (!user || String(connection.ownerId) !== String(user.id)) return;
      setConnections(prev => [connection, ...prev].slice(0, 10));
    });
    socket.on('connectionUpdated', (updatedConnection) => {
      if (!user || String(updatedConnection.ownerId) !== String(user.id)) return;
      setConnections(prev => prev.map(conn =>
        conn._id === updatedConnection._id ? updatedConnection : conn
      ));
    });

    return () => socket.disconnect();
  }, [user]);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/connections/recent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setConnections(data);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
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

      <header className="relative z-10 p-3 sm:p-4 border-b border-white/[0.06]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm sm:text-base text-white truncate">{user?.username}</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-500">Managed Devices: 1</span>
                <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-purple-500/20 text-purple-300 rounded font-medium">Free</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 sm:gap-6 border-b border-white/[0.06]">
            <button
              className={`pb-2.5 text-sm sm:text-base transition-colors ${activeTab === 'device' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
              onClick={() => setActiveTab('device')}
            >
              My Device
            </button>
            <button
              className={`pb-2.5 text-sm sm:text-base transition-colors ${activeTab === 'connections' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
              onClick={() => setActiveTab('connections')}
            >
              Connections
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="p-3 sm:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 text-sm sm:text-base bg-gray-800/50 border border-white/[0.08] rounded-xl text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
            />
          </div>
        </div>

        {activeTab === 'device' ? (
          <div className="px-3 sm:px-4 space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl flex items-center">
              <div className="w-8 h-12 sm:w-10 sm:h-16 bg-gray-800/50 rounded-lg flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </div>
              <div className="flex-1 ml-3 sm:ml-4 min-w-0">
                <h3 className="font-medium text-sm sm:text-base text-white truncate">iPhone (This device)</h3>
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
            </div>

            <button
              className="w-full p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl flex items-center hover:border-purple-500/30 transition-colors"
              onClick={() => setShowBuilder(true)}
            >
              <div className="w-8 h-12 sm:w-10 sm:h-16 bg-gray-800/50 rounded-lg flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              </div>
              <div className="flex-1 ml-3 sm:ml-4 min-w-0">
                <h3 className="font-medium text-sm sm:text-base text-white text-left">Add Device</h3>
              </div>
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 shrink-0" />
            </button>
          </div>
        ) : (
          <div className="px-3 sm:px-4 space-y-3 sm:space-y-4">
            {connections.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-8">No connections yet.</p>
            )}
            {connections.map((connection) => (
              <div key={connection._id} className="p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl flex items-center">
                <div className="w-8 h-12 sm:w-10 sm:h-16 bg-gray-800/50 rounded-lg flex items-center justify-center shrink-0">
                  <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                </div>
                <div className="flex-1 ml-3 sm:ml-4 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base text-white truncate">{connection.deviceInfo}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{connection.ip}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${connection.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[10px] sm:text-xs text-gray-500">
                      {connection.isActive ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center justify-center p-6 sm:p-8 mt-4 sm:mt-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
            <Monitor className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400/60" />
          </div>
          <p className="text-center text-xs sm:text-sm text-gray-500">Easy connect to device</p>
        </div>
      </div>

      {showBuilder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-900 border border-white/[0.06] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-white/[0.06] flex justify-between items-center sticky top-0 bg-gray-900">
              <h2 className="font-semibold text-base sm:text-lg text-white">Add New Device</h2>
              <button
                onClick={() => setShowBuilder(false)}
                className="p-1 rounded-full hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center transition-all ${deviceType === 'smartphone' ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/[0.08] bg-gray-800/50 hover:border-white/[0.12]'}`}
                  onClick={() => setDeviceType('smartphone')}
                >
                  <Smartphone className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${deviceType === 'smartphone' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <span className={`text-sm sm:text-base ${deviceType === 'smartphone' ? 'text-purple-300' : 'text-gray-300'}`}>Smartphone</span>
                </button>
                <button
                  className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center transition-all ${deviceType === 'laptop' ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/[0.08] bg-gray-800/50 hover:border-white/[0.12]'}`}
                  onClick={() => setDeviceType('laptop')}
                >
                  <Laptop className={`w-6 h-6 sm:w-8 sm:h-8 mb-2 ${deviceType === 'laptop' ? 'text-purple-400' : 'text-gray-400'}`} />
                  <span className={`text-sm sm:text-base ${deviceType === 'laptop' ? 'text-purple-300' : 'text-gray-300'}`}>Laptop</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-0.5">Device Name</label>
                  <input
                    type="text"
                    placeholder="Enter device name"
                    className="w-full p-2.5 text-sm sm:text-base bg-gray-800/50 border border-white/[0.08] rounded-xl text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-0.5">IP Address</label>
                  <input
                    type="text"
                    placeholder="192.168.1.1"
                    className="w-full p-2.5 text-sm sm:text-base bg-gray-800/50 border border-white/[0.08] rounded-xl text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 pb-2">
                <button className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-xl font-semibold hover:brightness-110 transition text-sm sm:text-base shadow-lg shadow-purple-500/20">
                  Add Device
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
