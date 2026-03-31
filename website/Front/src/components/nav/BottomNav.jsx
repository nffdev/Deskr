import React from 'react';
import { Settings, Monitor, Radio, Package } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/dash/dashboard', icon: Monitor, label: 'Devices' },
    { path: '/dash/remote', icon: Radio, label: 'Remote' },
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
