import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Sparkles,
  UserCheck,
  Bell,
  Download,
  RotateCcw,
  Briefcase,
  ChevronDown,
  FileCode,
  FileText
} from 'lucide-react';

export default function Navbar({ onOpenNotifications, unreadCount, onDataRefresh }) {
  const { user, switchRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [reseedLoading, setReseedLoading] = useState(false);

  const handleReseed = async () => {
    if (!window.confirm('Reset demo data to initial state?')) return;
    setReseedLoading(true);
    try {
      await api.reseedData();
      if (onDataRefresh) onDataRefresh();
    } catch (err) {
      alert('Error resetting demo: ' + err.message);
    } finally {
      setReseedLoading(false);
    }
  };

  const isManager = user?.role === 'MANAGER';

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Positioning */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">MentorAI</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Continuous Review
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AI-Assisted Internship Task Review System</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          
          {/* Sample Files Download Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Download test files for the demo"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Test Files</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50 text-xs"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  Sample Submission Files
                </div>
                <a
                  href="/api/sample-files/employee_api_v1_incomplete.pdf"
                  download="employee_api_v1_incomplete.pdf"
                  className="flex items-center px-3 py-2 text-slate-200 hover:bg-slate-700/60 transition group"
                >
                  <FileText className="w-4 h-4 text-amber-400 mr-2.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-100">Sample v1 Report (PDF)</div>
                    <div className="text-[10px] text-amber-400/90">Fails validation → Score 72 (Needs Revision)</div>
                  </div>
                </a>
                <a
                  href="/api/sample-files/employee_api_v2_improved.pdf"
                  download="employee_api_v2_improved.pdf"
                  className="flex items-center px-3 py-2 text-slate-200 hover:bg-slate-700/60 transition group"
                >
                  <FileText className="w-4 h-4 text-emerald-400 mr-2.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-100">Sample v2 Report (PDF)</div>
                    <div className="text-[10px] text-emerald-400/90">Passes all criteria → Score 88 (Approved)</div>
                  </div>
                </a>
                <a
                  href="/api/sample-files/employee_api_v1_code.zip"
                  download="employee_api_v1_code.zip"
                  className="flex items-center px-3 py-2 text-slate-200 hover:bg-slate-700/60 transition"
                >
                  <FileCode className="w-4 h-4 text-indigo-400 mr-2.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-100">Sample v1 Code (.zip)</div>
                    <div className="text-[10px] text-slate-400">Java project with missing DTO validation</div>
                  </div>
                </a>
                <a
                  href="/api/sample-files/employee_api_v2_code.zip"
                  download="employee_api_v2_code.zip"
                  className="flex items-center px-3 py-2 text-slate-200 hover:bg-slate-700/60 transition"
                >
                  <FileCode className="w-4 h-4 text-cyan-400 mr-2.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-slate-100">Sample v2 Code (.zip)</div>
                    <div className="text-[10px] text-slate-400">Java project with @Valid & @ControllerAdvice</div>
                  </div>
                </a>
              </div>
            )}
          </div>

          {/* Reset Demo Button */}
          <button
            onClick={handleReseed}
            disabled={reseedLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Reset demo data to initial state"
          >
            <RotateCcw className={`w-4 h-4 ${reseedLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-800" />

          {/* User Persona & 1-Click Role Switcher */}
          <div className="flex items-center space-x-2 pl-1">
            <div className="flex items-center space-x-2.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
              <img
                src={user?.avatar || (isManager ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')}
                alt={user?.name || 'User'}
                className="w-7 h-7 rounded-lg object-cover border border-slate-600"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 leading-none">{user?.name || 'User'}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-none">
                  {isManager ? 'Manager (Reviewer)' : 'Intern (Submitter)'}
                </div>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                isManager ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {user?.role}
              </span>
            </div>

            {/* Quick Switch Button */}
            <button
              onClick={() => switchRole(isManager ? 'INTERN' : 'MANAGER')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition active:scale-95"
              title={`Switch active persona to ${isManager ? 'Intern' : 'Manager'}`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Switch to {isManager ? 'Intern (Alex)' : 'Manager (Sarah)'}</span>
            </button>
          </div>

        </div>

      </div>
    </header>
  );
}
