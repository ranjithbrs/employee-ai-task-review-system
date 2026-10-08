import React, { useState } from 'react';
import { api } from '../api';
import {
  X,
  Bell,
  Mail,
  Smartphone,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock
} from 'lucide-react';

export default function NotificationsDrawer({ isOpen, onClose, notifications, onRefresh }) {
  const [activeChannel, setActiveChannel] = useState('ALL');
  const [marking, setMarking] = useState(false);

  if (!isOpen) return null;

  const filtered = (notifications || []).filter(n => {
    if (activeChannel === 'ALL') return true;
    return n.channel === activeChannel;
  });

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await api.markAllNotificationsRead();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Notification Center</h2>
              <p className="text-xs text-slate-400">In-App, Email & SMS Alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Filter Tabs */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex space-x-1">
            {['ALL', 'IN_APP', 'EMAIL', 'SMS'].map((ch) => (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activeChannel === ch
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {ch === 'ALL' ? 'All' : ch === 'IN_APP' ? 'In-App' : ch === 'EMAIL' ? 'Email' : 'SMS'}
              </button>
            ))}
          </div>

          <button
            onClick={handleMarkAllRead}
            disabled={marking}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center space-x-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-400">
              No notifications recorded yet.
            </div>
          ) : (
            filtered.map((notif) => {
              const isUnread = notif.status === 'UNREAD';
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border text-xs transition ${
                    isUnread
                      ? 'bg-slate-800/90 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-850/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center space-x-1 ${
                      notif.channel === 'EMAIL'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : notif.channel === 'SMS'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {notif.channel === 'EMAIL' && <Mail className="w-2.5 h-2.5" />}
                      {notif.channel === 'SMS' && <Smartphone className="w-2.5 h-2.5" />}
                      <span>{notif.channel}</span>
                      {notif.channel === 'SMS' && <span className="text-[9px] font-black text-amber-400">(DEMO MODE)</span>}
                    </span>

                    <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(notif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-100 text-xs">{notif.title}</h4>
                  <p className="text-slate-300 mt-1 leading-relaxed text-[11px]">{notif.message}</p>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
