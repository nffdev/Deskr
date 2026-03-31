'use client'

import React, { useState } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import BottomNav from "@/components/nav/BottomNav";
import { Settings as SettingsIcon, User, Lock, LogOut, ChevronRight, Mail, Shield, Bell, Palette, HardDrive } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { BASE_API, API_VERSION } from "../../config.json";

export default function Settings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState(null);
  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.replace('/auth/login');
  };

  const manageChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwords.current) return setPasswordError('Current password is required.');
    if (!passwords.newPassword) return setPasswordError('New password is required.');
    if (passwords.newPassword.length < 6) return setPasswordError('Password must be at least 6 characters.');
    if (passwords.newPassword !== passwords.confirm) return setPasswordError('Passwords do not match.');

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_API}/v${API_VERSION}/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to change password.');
      setPasswordSuccess('Password changed successfully.');
      setPasswords({ current: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full p-2.5 text-sm sm:text-base bg-gray-800/50 border border-white/[0.08] rounded-xl text-white placeholder:text-gray-600 outline-none focus:border-purple-500/50 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)] transition-all";

  const menuItems = [
    {
      id: 'account',
      icon: User,
      label: 'Account',
      description: 'Profile information',
    },
    {
      id: 'security',
      icon: Lock,
      label: 'Security',
      description: 'Password & authentication',
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      description: 'Alerts & preferences',
    },
    {
      id: 'storage',
      icon: HardDrive,
      label: 'Storage',
      description: 'Manage builds & data',
    },
    {
      id: 'appearance',
      icon: Palette,
      label: 'Appearance',
      description: 'Theme & display',
    },
  ];

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
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
            <SettingsIcon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm sm:text-base text-white">Settings</h1>
            <span className="text-xs sm:text-sm text-gray-500">Manage your account</span>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
              <span className="text-lg sm:text-xl font-bold text-white">
                {user?.username?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-base sm:text-lg text-white truncate">{user?.username || 'User'}</h2>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-gray-500" />
                <span className="text-xs sm:text-sm text-gray-500 truncate">{user?.email || 'No email'}</span>
              </div>
            </div>
            <div className="px-2 py-1 bg-purple-500/20 rounded-lg shrink-0">
              <span className="text-[10px] sm:text-xs text-purple-300 font-medium">Free</span>
            </div>
          </div>
        </div>

        {!activeSection ? (
          <div className="space-y-1.5">
            {menuItems.map(({ id, icon: Icon, label, description }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className="w-full bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-xl p-3.5 sm:p-4 flex items-center gap-3 hover:border-purple-500/20 transition-all group"
              >
                <div className="w-9 h-9 bg-gray-800/60 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-purple-500/10 transition-colors">
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm sm:text-base text-white font-medium">{label}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">{description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
              </button>
            ))}

            <button
              onClick={handleLogout}
              className="w-full bg-red-500/5 border border-red-500/10 rounded-xl p-3.5 sm:p-4 flex items-center gap-3 hover:border-red-500/20 transition-all group mt-3"
            >
              <div className="w-9 h-9 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm sm:text-base text-red-400 font-medium">Log out</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Sign out of your account</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <button
              onClick={() => { setActiveSection(null); setPasswordError(''); setPasswordSuccess(''); }}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              ← Back to settings
            </button>

            {activeSection === 'account' && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-4">
                <h2 className="font-semibold text-base sm:text-lg text-white">Account</h2>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-0.5">Username</label>
                  <input type="text" value={user?.username || ''} readOnly className={`${inputClass} opacity-60 cursor-not-allowed`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-0.5">Email</label>
                  <input type="email" value={user?.email || ''} readOnly className={`${inputClass} opacity-60 cursor-not-allowed`} />
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500">Contact support to change your account details.</p>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-4">
                <h2 className="font-semibold text-base sm:text-lg text-white">Change Password</h2>

                {passwordError && (
                  <div className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-xs sm:text-sm">{passwordError}</p>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="px-3.5 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-green-400 text-xs sm:text-sm">{passwordSuccess}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-0.5">Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-0.5">New Password</label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-0.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </div>
                <button
                  onClick={manageChangePassword}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-lg shadow-purple-500/20 hover:brightness-110 transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-4">
                <h2 className="font-semibold text-base sm:text-lg text-white">Notifications</h2>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium">Build notifications</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Get notified when a build completes</p>
                  </div>
                  <Switch defaultChecked className="ml-3" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium">Connection alerts</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Alert when a new device connects</p>
                  </div>
                  <Switch defaultChecked className="ml-3" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium">Security alerts</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Notify on suspicious login attempts</p>
                  </div>
                  <Switch defaultChecked className="ml-3" />
                </div>
              </div>
            )}

            {activeSection === 'storage' && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-4">
                <h2 className="font-semibold text-base sm:text-lg text-white">Storage</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Used</span>
                    <span className="text-white font-medium">0 MB / 100 MB</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-600 to-violet-500 h-2 rounded-full" style={{ width: '0%' }} />
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-500">Build artifacts are stored temporarily and auto-deleted after 24h.</p>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 sm:p-5 space-y-4">
                <h2 className="font-semibold text-base sm:text-lg text-white">Appearance</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">Theme</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Current theme</p>
                  </div>
                  <span className="px-3 py-1.5 bg-gray-800/50 border border-white/[0.08] rounded-lg text-sm text-gray-300">Dark</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
