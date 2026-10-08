import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatCard from '../components/StatCard';
import ProgramProgressBanner from '../components/ProgramProgressBanner';
import TaskDetailModal from '../components/TaskDetailModal';
import SubmissionUploadModal from '../components/SubmissionUploadModal';
import {
  Briefcase,
  Clock,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  UploadCloud,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Zap
} from 'lucide-react';

export default function EmployeeDashboard({ onOpenNotifications }) {
  const [metrics, setMetrics] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [submittingTask, setSubmittingTask] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [met, prog, taskList] = await Promise.all([
        api.getInternMetrics(),
        api.getProgramProgress(),
        api.getTasks(),
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

      {/* 2. Intern KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          title="Assigned Tasks"
          value={metrics?.total_assigned ?? '-'}
          subtitle="4-week program"
          icon={Briefcase}
          color="indigo"
        />
        <StatCard
          title="In Progress"
          value={metrics?.in_progress ?? '-'}
          subtitle="Active work"
          icon={Clock}
          color="cyan"
        />
        <StatCard
          title="Needs Revision"
          value={metrics?.needs_revision ?? '-'}
          subtitle="Feedback received"
          icon={RotateCcw}
          color="amber"
        />
        <StatCard
          title="Approved"
          value={metrics?.approved ?? '-'}
          subtitle="Milestones closed"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="My Average Score"
          value={metrics?.average_score ? `${metrics.average_score}%` : '-'}
          subtitle="Cumulative review"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* 3. Assigned Internship Tasks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">My Program Milestones</h3>
            <p className="text-xs text-slate-400 mt-0.5">Submit your deliverables for AI mentor review and continuous guidance</p>
          </div>
          <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
            {tasks.filter(t => t.status === 'APPROVED').length} / {tasks.length} Completed
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading your assigned tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            No tasks assigned at this moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const isApproved = task.status === 'APPROVED';
              const hasSubmissions = task.submissions_count > 0;

              return (
                <div
                  key={task.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition p-5 shadow-lg flex flex-col justify-between space-y-4 group"
                >
                  {/* Top Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Week {task.week_number} Milestone
                      </span>
                      {getStatusBadge(task.status)}
                    </div>

                    <h4 
                      onClick={() => setSelectedTaskId(task.id)}
                      className="text-base font-bold text-slate-100 group-hover:text-indigo-300 transition cursor-pointer"
                    >
                      {task.title}
                    </h4>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Mid Bar: Expected Deliverable & Score */}
                  <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Expected Outcome:</span>
                      <span className="text-slate-200 font-medium truncate max-w-[200px]">
                        {task.expected_outcome || 'Working project'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-750 text-[11px]">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Deadline: {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>

                      {task.latest_score !== null && task.latest_score !== undefined ? (
                        <span className={`font-bold ${
                          task.latest_score >= 85 ? 'text-emerald-400' :
                          task.latest_score >= 70 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          Score: {Math.round(task.latest_score)}% (v{task.latest_version})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not submitted</span>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => setSelectedTaskId(task.id)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 transition flex items-center justify-center space-x-1"
                    >
                      <span>View Details & Review</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {!isApproved && (
                      <button
                        onClick={() => setSubmittingTask(task)}
                        className="py-2 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition active:scale-95 flex items-center space-x-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{hasSubmissions ? 'Resubmit v' + (task.latest_version + 1) : 'Submit Work'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Upload Modal */}
      <SubmissionUploadModal
        task={submittingTask}
        isOpen={!!submittingTask}
        onClose={() => setSubmittingTask(null)}
        onSuccess={() => {
          loadData();
          if (submittingTask) {
            setSelectedTaskId(submittingTask.id);
          }
        }}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onRefresh={() => loadData()}
        isManager={false}
        onOpenSubmit={(t) => setSubmittingTask(t)}
      />

    </div>
  );
}
