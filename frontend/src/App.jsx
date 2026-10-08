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
  CheckCircle
} from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 border border-emerald-500/50 shadow-2xl shadow-emerald-500/20 text-xs font-semibold text-white">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </div>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        unreadCount={unreadCount}
        onDataRefresh={() => setDataRefreshKey((k) => k + 1)}
        showToast={showToast}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Dynamic Role Views */}
        {isManager ? (
          <ManagerDashboard
            key={`mgr-${dataRefreshKey}`}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            showToast={showToast}
          />
        ) : (
          <EmployeeDashboard
            key={`emp-${dataRefreshKey}`}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            showToast={showToast}
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
