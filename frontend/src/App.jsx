import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './api';
import Navbar from './components/Navbar';
import NotificationsDrawer from './components/NotificationsDrawer';
import ManagerDashboard from './views/ManagerDashboard';
import EmployeeDashboard from './views/EmployeeDashboard';
import {
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.warn('Failed to load notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Polling every 10s for new alerts
    return () => clearInterval(interval);
  }, [user, dataRefreshKey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Starting MentorAI Continuous Review System...</span>
        </div>
      </div>
    );
  }

  const isManager = user?.role === 'MANAGER';
  const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Navigation Header */}
      <Navbar
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={unreadCount}
        onDataRefresh={() => setDataRefreshKey((k) => k + 1)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hackathon 3-Minute Live Demo Flow Guide */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/40 border border-indigo-500/30 p-4 shadow-lg backdrop-blur text-xs">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setGuideOpen(!guideOpen)}>
            <div className="flex items-center space-x-2 text-indigo-300 font-bold">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Hackathon 3-Minute Demo Playbook</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                Instant Step-by-Step
              </span>
            </div>
            <button className="text-slate-400 hover:text-white p-1">
              {guideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {guideOpen && (
            <div className="mt-3 pt-3 border-t border-indigo-500/20 grid grid-cols-1 md:grid-cols-4 gap-3 text-slate-300">
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center space-x-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white">1</span>
                  <span>View Milestone</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  As Intern Alex, open <strong>"Build Employee REST API"</strong> (Week 2).
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center space-x-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white">2</span>
                  <span>Submit v1 (Fails)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Click <em>Submit Work</em> → click <strong>"⚡ Load v1"</strong> → Submit. AI returns <strong>Score 72 (Needs Revision)</strong> with mentor issues.
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center space-x-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white">3</span>
                  <span>Resubmit v2 (Approved)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Click <em>Resubmit v2</em> → click <strong>"⚡ Load v2"</strong>. AI shows <strong>72 → 88 (+16 pts, Approved)</strong> with improvement comparison!
                </p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                <div className="font-bold text-white flex items-center space-x-1.5 mb-1">
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white">4</span>
                  <span>Manager Approval</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Click top bar <em>"Switch to Manager"</em> to inspect submissions, audit timeline, and program progress.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Role Views */}
        {isManager ? (
          <ManagerDashboard
            key={`mgr-${dataRefreshKey}`}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        ) : (
          <EmployeeDashboard
            key={`emp-${dataRefreshKey}`}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
          />
        )}

      </main>

      {/* Slide-out Notification Center Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onRefresh={fetchNotifications}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            MentorAI • AI-Assisted Continuous Internship Task Review System
          </div>
          <div className="text-slate-400">
            Powered by FastAPI + React + Gemini AI Mentor Architecture
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
