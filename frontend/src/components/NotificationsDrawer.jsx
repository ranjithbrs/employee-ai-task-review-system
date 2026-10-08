import React, { useState } from 'react';
import { api } from '../api';
import {
  X,
  Bell,
  Mail,
  Smartphone,
  CheckCheck,
  Clock,
  Send,
  Eye,
  ChevronLeft,
  Wifi,
  BatteryMedium,
  Sparkles,
  RotateCcw
} from 'lucide-react';

export default function NotificationsDrawer({ isOpen, onClose, notifications, onRefresh }) {
  const [activeChannel, setActiveChannel] = useState('ALL');
  const [marking, setMarking] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [previewNotif, setPreviewNotif] = useState(null);

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

  const handleTriggerRepeating = async () => {
    setTriggering(true);
    try {
      await api.triggerReminders();
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <>
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

          {/* Trigger Repeating Reminders Bar */}
          <div className="px-5 py-2.5 bg-indigo-950/40 border-b border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-[11px] text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Automated Repeat Loop</span>
            </div>
            <button
              onClick={handleTriggerRepeating}
              disabled={triggering}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition active:scale-95 disabled:opacity-50"
              title="Dispatches repeated reminders for incomplete tasks"
            >
              <RotateCcw className={`w-3 h-3 ${triggering ? 'animate-spin' : ''}`} />
              <span>{triggering ? 'Sending...' : 'Trigger Reminders'}</span>
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
                    onClick={() => setPreviewNotif(notif)}
                    className={`p-3.5 rounded-xl border text-xs transition cursor-pointer group ${
                      isUnread
                        ? 'bg-slate-800/90 border-indigo-500/40 shadow-sm hover:border-indigo-400'
                        : 'bg-slate-850/60 border-slate-800/80 hover:border-slate-700'
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
                      </span>

                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(notif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                        <span className="text-[10px] text-cyan-400 opacity-0 group-hover:opacity-100 transition flex items-center space-x-0.5">
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-100 text-xs">{notif.title}</h4>
                    <p className="text-slate-300 mt-1 leading-relaxed text-[11px] line-clamp-3">{notif.message}</p>
                    
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Click to preview delivery</span>
                      <span className="font-medium text-indigo-400">
                        {notif.channel === 'SMS' ? '📱 Mobile SMS View' : notif.channel === 'EMAIL' ? '✉️ Email Client View' : '🔔 In-App Modal'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* Device Simulator Modal */}
      {previewNotif && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg">
            
            {/* Close button */}
            <button
              onClick={() => setPreviewNotif(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {previewNotif.channel === 'SMS' ? (
              /* Phone Mockup for SMS */
              <div className="bg-slate-950 border-4 border-slate-700 rounded-[38px] p-3 shadow-2xl overflow-hidden max-w-xs mx-auto">
                {/* Phone Speaker Notch */}
                <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
                </div>

                {/* Status Bar */}
                <div className="px-4 py-1 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>9:41</span>
                  <div className="flex items-center space-x-1.5">
                    <Wifi className="w-3 h-3" />
                    <BatteryMedium className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* SMS Header */}
                <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
                      AI
                    </div>
                    <div>
                      <div className="font-bold text-white text-[11px]">MentorAI System</div>
                      <div className="text-[9px] text-slate-400">+1 (555) 019-2834</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                    SMS
                  </span>
                </div>

                {/* Message Body Bubble */}
                <div className="p-4 space-y-3 min-h-[260px] flex flex-col justify-end bg-slate-900/60 rounded-2xl my-2">
                  <div className="text-center text-[10px] text-slate-500">
                    Today • {new Date(previewNotif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <div className="bg-gradient-to-br from-indigo-600 to-cyan-600 text-white p-3.5 rounded-2xl rounded-bl-xs text-xs shadow-md leading-relaxed">
                    <div className="font-bold text-[11px] mb-1 opacity-90">{previewNotif.title}</div>
                    <div>{previewNotif.message}</div>
                  </div>
                  <div className="text-right text-[9px] text-slate-400 pr-1">
                    Delivered via cellular SMS
                  </div>
                </div>

                {/* Simulated SMS Input Bar */}
                <div className="p-2 border-t border-slate-800 flex items-center space-x-2">
                  <div className="flex-1 bg-slate-900 rounded-full px-3 py-1.5 text-[11px] text-slate-500">
                    Text message...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ) : (
              /* Corporate Email Client Mockup */
              <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-xs">
                {/* Window title bar */}
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                    <span className="text-slate-400 text-xs font-mono ml-2">Inbox — MentorAI Notification</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                    EMAIL
                  </span>
                </div>

                {/* Email Headers */}
                <div className="p-4 border-b border-slate-800 space-y-1 bg-slate-850">
                  <div className="text-slate-400">
                    <strong className="text-slate-300">From:</strong> MentorAI Bot &lt;mentor-ai@company.com&gt;
                  </div>
                  <div className="text-slate-400">
                    <strong className="text-slate-300">To:</strong> Alex Chen &lt;alex@demo.com&gt;
                  </div>
                  <div className="text-slate-400">
                    <strong className="text-slate-300">Date:</strong> {new Date(previewNotif.sent_at).toLocaleString()}
                  </div>
                  <div className="text-base font-bold text-white pt-2">{previewNotif.title}</div>
                </div>

                {/* Email Body Card */}
                <div className="p-6 bg-slate-900 space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                    <div className="flex items-center space-x-2 text-indigo-400 font-bold">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>AI Review Assessment & Notification</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-xs">{previewNotif.message}</p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setPreviewNotif(null)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
                    >
                      Close & Return to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
