import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatCard from '../components/StatCard';
import ProgramProgressBanner from '../components/ProgramProgressBanner';
import TaskCreateModal from '../components/TaskCreateModal';
import TaskDetailModal from '../components/TaskDetailModal';
import {
  Users,
  Clock,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Eye,
  FileText,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  Bell,
  Zap
} from 'lucide-react';

export default function ManagerDashboard({ onOpenNotifications, showToast }) {
  const [metrics, setMetrics] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reminderLoading, setReminderLoading] = useState(false);
  
  // Filters & Search
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const handleTriggerReminders = async () => {
    setReminderLoading(true);
    try {
      const res = await api.triggerReminders();
      loadData();
      if (showToast) {
        showToast(`Automated reminder check: ${res.reminders_dispatched_count} repeat reminder(s) dispatched via Email & SMS!`);
      } else {
        alert(`Dispatched ${res.reminders_dispatched_count} repeat reminders across channels.`);
      }
    } catch (e) {
      alert('Error triggering reminders: ' + e.message);
    } finally {
      setReminderLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [met, prog, taskList] = await Promise.all([
        api.getManagerMetrics(),
        api.getProgramProgress(),
        api.getTasks(filterStatus === 'ALL' ? null : filterStatus),
      ]);
      setMetrics(met);
      setProgress(prog);
      setTasks(taskList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (!searchQuery) return true;
    return t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           t.description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStatusBadge = (status) => {
    const config = {
      APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      NEEDS_REVISION: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      HUMAN_REVIEW_REQUIRED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      PENDING_SUBMISSION: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      UNDER_REVIEW: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    }[status] || 'bg-slate-700 text-slate-300 border-slate-600';

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wider uppercase ${config}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Month-Long Program Banner */}
      <ProgramProgressBanner progress={progress} />

      {/* 2. Manager Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Active Tasks"
          value={metrics?.active_tasks ?? '-'}
          subtitle="Currently underway"
          icon={Layers}
          color="indigo"
        />
        <StatCard
          title="Pending Reviews"
          value={metrics?.pending_reviews ?? '-'}
          subtitle="Awaiting review"
          icon={Clock}
          color="cyan"
        />
        <StatCard
          title="Needs Revision"
          value={metrics?.tasks_requiring_revision ?? '-'}
          subtitle="Feedback dispatched"
          icon={RotateCcw}
          color="amber"
        />
        <StatCard
          title="Completed"
          value={metrics?.completed_tasks ?? '-'}
          subtitle="Approved deliverables"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Avg Mentor Score"
          value={metrics?.average_review_score ? `${metrics.average_review_score}%` : '-'}
          subtitle="Cohort average"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* 2.5 Automated Repeating Review & Reminder Engine (Active Automation) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-cyan-400 border border-indigo-500/20 shrink-0">
            <RotateCcw className={`w-5 h-5 ${reminderLoading ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white">Automated Repeating Review & Reminder Engine</h4>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Automatically checks tasks in <span className="text-amber-400 font-semibold">Needs Revision</span> or <span className="text-blue-400 font-semibold">Pending</span> and sends repeating follow-ups via <strong className="text-slate-100">Email & SMS</strong> until approved.
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerReminders}
          disabled={reminderLoading}
          className="flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-md shadow-indigo-600/30 transition active:scale-95 whitespace-nowrap disabled:opacity-50"
        >
          <Bell className="w-4 h-4" />
          <span>{reminderLoading ? 'Scanning & Sending...' : 'Trigger Auto-Reminders Now'}</span>
        </button>
      </div>

      {/* 3. Task Management Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Table Header Bar with Search, Filter & Create Task */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Internship Tasks & AI Reviews</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage assignments, inspect AI reviews, and provide human approval</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_SUBMISSION">Pending Submission</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="NEEDS_REVISION">Needs Revision</option>
              <option value="APPROVED">Approved</option>
              <option value="HUMAN_REVIEW_REQUIRED">Human Review Required</option>
            </select>

            {/* Create Task Button */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Assign New Task</span>
            </button>
          </div>
        </div>

        {/* Task Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850/60 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Milestone</th>
                <th className="py-3 px-4">Task Title</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latest Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading tasks...</td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No tasks found matching filter.</td>
                </tr>
              ) : (
                filteredTasks.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-indigo-400 whitespace-nowrap">
                      Week {t.week_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100 group-hover:text-indigo-300 transition">
                      <div className="max-w-xs sm:max-w-sm truncate">{t.title}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.expected_outcome || t.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      {t.intern?.name || 'Alex Chen'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(t.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.latest_score !== null && t.latest_score !== undefined ? (
                        <span className={`font-bold text-xs ${
                          t.latest_score >= 85 ? 'text-emerald-400' :
                          t.latest_score >= 70 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {Math.round(t.latest_score)}%
                          <span className="text-[10px] text-slate-400 font-normal ml-1">(v{t.latest_version})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No submission</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTaskId(t.id); }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="View details & review"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Task Creation Modal */}
      <TaskCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => loadData()}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onRefresh={() => loadData()}
        isManager={true}
      />

    </div>
  );
}
