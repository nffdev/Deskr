'use client'

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import BottomNav from "@/components/nav/BottomNav";
import { Search, Settings, Smartphone, Plus, Monitor, Radio, ArrowRight, Users, X, Laptop, Tablet, Tv } from 'lucide-react'
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
    if (!API_URL) {
      console.error('API URL not configured');
      return;
    }

    fetchConnections();

    const socket = io(API_URL.split('/api')[0]);
    socket.on('newConnection', (connection) => {
      setConnections(prev => [connection, ...prev].slice(0, 10));
    });

    socket.on('connectionUpdated', (updatedConnection) => {
      setConnections(prev => prev.map(conn => 
        conn._id === updatedConnection._id ? updatedConnection : conn
      ));
    });

    return () => socket.disconnect();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch(`${API_BASE}/connections/recent`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setConnections(data);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  return (
    <div className="h-screen bg-gray-50">
      <header className="p-4 bg-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h1 className="font-medium">{user.username}</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Managed Devices: 1</span>
              <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded">Free</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-6 border-b">
          <button 
            className={`pb-2 ${activeTab === 'device' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('device')}
          >
            My Device
          </button>
          <button 
            className={`pb-2 ${activeTab === 'connections' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('connections')}
          >
            Connections
          </button>
        </div>
      </header>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none"
          />
        </div>
      </div>

      {activeTab === 'device' ? (
        <div className="p-4 space-y-4">
          <div className="p-4 bg-white rounded-lg shadow-sm flex items-center">
            <div className="w-10 h-16 bg-gray-100 rounded flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1 ml-4">
              <h3 className="font-medium">iPhone (This device)</h3>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-500" />
          </div>

          <button 
            className="w-full p-4 bg-white rounded-lg shadow-sm flex items-center"
            onClick={() => setShowBuilder(true)}
          >
            <div className="w-10 h-16 bg-gray-100 rounded flex items-center justify-center">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1 ml-4">
              <h3 className="font-medium text-left">Add Device</h3>
            </div>
            <Plus className="w-5 h-5 text-blue-500" />
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {connections.map((connection) => (
            <div key={connection._id} className="p-4 bg-white rounded-lg shadow-sm flex items-center">
              <div className="w-10 h-16 bg-gray-100 rounded flex items-center justify-center">
                <Monitor className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1 ml-4">
                <h3 className="font-medium">{connection.deviceInfo}</h3>
                <p className="text-sm text-gray-500">{connection.ip}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${connection.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-500">
                    {connection.isActive ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-8 mt-8">
        <div className="w-32 h-32 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
          <Monitor className="w-16 h-16 text-blue-500" />
        </div>
        <p className="text-center text-gray-500">Easy connect to device</p>
      </div>
      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-lg">Add New Device</h2>
              <button 
                onClick={() => setShowBuilder(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  className={`p-4 rounded-lg border flex flex-col items-center ${deviceType === 'smartphone' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setDeviceType('smartphone')}
                >
                  <Smartphone className="w-8 h-8 mb-2 text-gray-600" />
                  <span>Smartphone</span>
                </button>
                
                <button 
                  className={`p-4 rounded-lg border flex flex-col items-center ${deviceType === 'laptop' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setDeviceType('laptop')}
                >
                  <Laptop className="w-8 h-8 mb-2 text-gray-600" />
                  <span>Laptop</span>
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Device Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter device name"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">IP Address</label>
                  <input 
                    type="text" 
                    placeholder="192.168.1.1"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition">
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
