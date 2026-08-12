import React, { useState } from 'react';
import { User, FileText, Bell, Shield, Edit3 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, hydrated } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'records' | 'notifications' | 'privacy'>('profile');

  if (!hydrated) {
    return (
      <div className="pt-28 pb-20 min-h-screen flex items-center justify-center">
        <p className="text-sm font-semibold text-slate-400">Loading your profile...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  const initials = (user.name || '?')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Profile Banner Header */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-extrabold text-slate-900">{user.name}</h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-600">
                  Patient
                </span>
              </div>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="w-4 h-4" /> Personal Profile
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'records'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" /> Digital Prescriptions
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'notifications'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" /> Privacy & Security
          </button>
        </div>

        {/* Tab Contents */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl bg-white">

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-slate-900">Account Details</h3>
                <button className="text-xs font-bold text-blue-600 flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold">Full Name</span>
                  <p className="font-extrabold text-sm text-slate-900">{user.name}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold">Email Address</span>
                  <p className="font-extrabold text-sm text-slate-900">{user.email || '—'}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-400 font-semibold">Phone Number</span>
                  <p className="font-extrabold text-sm text-slate-900">{user.phone || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-slate-900">Digital EHR & Session Summaries</h3>
              <p className="text-xs text-slate-500">Your session notes and prescriptions will appear here after your first appointment.</p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-xl font-extrabold text-slate-900">Notification Settings</h3>
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input type="checkbox" defaultChecked className="accent-blue-600" />
                <span className="font-semibold text-slate-900">SMS & WhatsApp doctor arrival tracking alerts</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <input type="checkbox" defaultChecked className="accent-blue-600" />
                <span className="font-semibold text-slate-900">Weekly ergonomic posture exercise reminders</span>
              </label>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4 text-xs">
              <h3 className="text-xl font-extrabold text-slate-900">Privacy & Security Controls</h3>
              <p className="text-slate-500">Your health data is encrypted according to HIPAA and ISO-27001 medical standards.</p>
              <button className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold text-slate-700">
                Change Account Password
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
