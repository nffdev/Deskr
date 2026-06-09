import React, { useEffect, useRef } from 'react';
import { Settings, Monitor, Radio, Package, Terminal } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import io from 'socket.io-client';
import config from '@/config.json';

const socketInstance = { current: null };
const userPrefs = { current: null };

export const updateNotifPrefs = (notifications) => {
  if (userPrefs.current) {
    userPrefs.current.notifications = notifications;
  } else {
    userPrefs.current = { notifications };
  }
};

const fetchUserPrefs = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${config.BASE_API}/v${config.API_VERSION}/users/@me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) userPrefs.current = await res.json();
  } catch (e) {}
};

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    fetchUserPrefs();

    if (!socketInstance.current) {
      socketInstance.current = io(config.BASE_API.replace('/api', ''), {
        transports: ['websocket', 'polling']
      });
    }

    socketInstance.current.on('newConnection', (data) => {
      const myId = userPrefs.current?.id;
      if (!myId || String(data?.ownerId) !== String(myId)) return;
      if (userPrefs.current?.notifications?.connectionAlerts === false) return;
      toast.success('New device connected', {
        description: data?.deviceInfo || data?.ip || 'A new device is now online',
      });
    });

    socketInstance.current.on('buildProgress', (data) => {
      if (data.progress === 100) {
        if (data.success) {
          if (userPrefs.current?.notifications?.buildNotifications === false) return;
          toast.success('Build completed', {
            description: data.fileName || 'Your executable is ready to download',
          });
        } else {
          toast.error('Build failed', {
            description: data.error?.substring(0, 100) || 'An error occurred during the build',
          });
        }
      }
    });

    return () => {};
  }, []);

  const tabs = [
    { path: '/dash/dashboard', icon: Monitor, label: 'Devices' },
    { path: '/dash/remote', icon: Radio, label: 'Remote' },
    { path: '/dash/shell', icon: Terminal, label: 'Shell' },
    { path: '/dash/builder', icon: Package, label: 'Builder' },
    { path: '/dash/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-xl border-t border-white/[0.06] flex justify-around py-2 sm:py-3 px-2 z-50">
      {tabs.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={path}
            className={`flex flex-col items-center min-w-0 flex-1 py-1 transition-colors ${isActive ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
            onClick={() => navigate(path)}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
