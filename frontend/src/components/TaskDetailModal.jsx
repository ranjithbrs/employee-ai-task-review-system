import React, { useState, useEffect } from 'react';
import { api } from '../api';
import AIReviewResult from './AIReviewResult';
import {
  X,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  History,
  Layers,
  Send,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function TaskDetailModal({ taskId, isOpen, onClose, onRefresh, isManager, onOpenSubmit }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  
  // Manager decision state
  const [managerAction, setManagerAction] = useState(null); // 'APPROVE' | 'REQUEST_REVISION' | 'OVERRIDE_SCORE'
  const [managerComment, setManagerComment] = useState('');
  const [overrideScore, setOverrideScore] = useState(90);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (taskId && isOpen) {
      loadTask();
    }
  }, [taskId, isOpen]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const data = await api.getTaskDetail(taskId);
      setTask(data);
      if (data.submissions && data.submissions.length > 0) {
        setSelectedVersion(data.submissions[0].version);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentSubmission = task?.submissions?.find(s => s.version === selectedVersion) || task?.submissions?.[0];

  const handleManagerDecision = async (decision) => {
    setActionLoading(true);
    try {
      await api.managerDecision(taskId, {
        decision,
        override_score: decision === 'OVERRIDE_SCORE' ? parseFloat(overrideScore) : null,
        manager_comment: managerComment || (decision === 'APPROVE' ? 'Approved by manager.' : 'Revision requested.'),
      });
      setManagerAction(null);
      setManagerComment('');
      await loadTask();
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Error recording decision: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = {
    APPROVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    NEEDS_REVISION: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    HUMAN_REVIEW_REQUIRED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    PENDING_SUBMISSION: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    UNDER_REVIEW: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  }[task?.status] || 'bg-slate-700 text-slate-300 border-slate-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-3">
            <span className="text-xs px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Week {task?.week_number}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{task?.title}</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${statusBadge}`}>
                  {task?.status}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                <span>Assignee: <strong className="text-slate-300">{task?.intern?.name || 'Intern'}</strong></span>
                <span>•</span>
                <span>Deadline: <strong className="text-slate-300">{task?.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</strong></span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 animate-pulse">Loading task details...</div>
          ) : (
            <>
              {/* Task Description & Expectations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
                  <div className="font-bold text-slate-200">Task Overview</div>
                  <p className="text-slate-300 leading-relaxed">{task.description}</p>
                  {task.expected_outcome && (
                    <div className="pt-2 border-t border-slate-700/40">
                      <span className="font-semibold text-indigo-300">Expected Outcome: </span>
                      <span className="text-slate-300">{task.expected_outcome}</span>
                    </div>
                  )}
                </div>

                {/* AI Task Understanding Synthesis */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs space-y-2 relative">
                  <div className="flex items-center space-x-1.5 text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>AI Task Understanding</span>
                  </div>
                  <div className="text-slate-300 leading-relaxed whitespace-pre-line font-mono text-[11px] bg-slate-900/60 p-2.5 rounded-lg border border-indigo-500/20">
                    {task.ai_task_understanding || task.evaluation_guidelines}
                  </div>
                </div>
              </div>

              {/* Submissions Section */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">Submissions & AI Reviews ({task.submissions?.length || 0})</h3>
                  </div>

                  {/* Submit button for intern */}
                  {!isManager && task.status !== 'APPROVED' && onOpenSubmit && (
                    <button
                      onClick={() => onOpenSubmit(task)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{task.submissions?.length > 0 ? 'Submit Revision' : 'Submit Work'}</span>
                    </button>
                  )}
                </div>

                {/* Version Selector Tabs */}
                {task.submissions && task.submissions.length > 0 ? (
                  <div>
                    <div className="flex space-x-2 border-b border-slate-800 pb-2 mb-4">
                      {task.submissions.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedVersion(sub.version)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
                            selectedVersion === sub.version
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                          }`}
                        >
                          <span>Version {sub.version}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            sub.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {sub.ai_review ? `${Math.round(sub.ai_review.overall_score)}%` : sub.status}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Active Submission Details & AI Review */}
                    {currentSubmission && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/40 px-3 py-2 rounded-lg border border-slate-700/40">
                          <div>
                            <strong>File:</strong> {currentSubmission.file_name} •{' '}
                            <span>Submitted: {new Date(currentSubmission.submitted_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {currentSubmission.repo_link && (
                            <a
                              href={currentSubmission.repo_link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline flex items-center space-x-1"
                            >
                              <span>Repo Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        {/* Visual AI Review Result Card */}
                        {currentSubmission.ai_review ? (
                          <AIReviewResult
                            review={currentSubmission.ai_review}
                            onResubmit={() => onOpenSubmit(task)}
                            isIntern={!isManager}
                          />
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 bg-slate-800/20 rounded-xl">
                            AI Review pending for this submission.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-10 text-center rounded-xl bg-slate-800/30 border border-dashed border-slate-700 text-slate-400 text-xs space-y-2">
                    <p>No submissions have been uploaded for this task yet.</p>
                    {!isManager && onOpenSubmit && (
                      <button
                        onClick={() => onOpenSubmit(task)}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition text-xs"
                      >
                        Submit First Version
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Manager Actions / Override Panel (Visible to Managers) */}
              {isManager && (
                <div className="p-4 sm:p-5 rounded-xl bg-slate-800/70 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                      <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                      <span>Manager Review & Decision Panel (Human Authority)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">AI assists • Manager decides</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    As manager, you can confirm approval, request another revision with custom comments, or override the AI evaluation score.
                  </p>

                  {managerAction ? (
                    <div className="space-y-3 p-3 bg-slate-900 rounded-lg border border-slate-700 text-xs">
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>
                          Action: {managerAction === 'APPROVE' ? 'Manual Approval' : managerAction === 'REQUEST_REVISION' ? 'Request Revision' : 'Score Override'}
                        </span>
                        <button onClick={() => setManagerAction(null)} className="text-slate-400 hover:text-white">Cancel</button>
                      </div>

                      {managerAction === 'OVERRIDE_SCORE' && (
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">New Score (0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={overrideScore}
                            onChange={(e) => setOverrideScore(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white w-28"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Manager Feedback / Comments</label>
                        <textarea
                          rows={2}
                          value={managerComment}
                          onChange={(e) => setManagerComment(e.target.value)}
                          placeholder="Add instructions or encouragement for the intern..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleManagerDecision(managerAction)}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-lg font-bold bg-purple-600 hover:bg-purple-500 text-white transition text-xs"
                        >
                          {actionLoading ? 'Saving...' : 'Confirm Action'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => { setManagerAction('APPROVE'); setManagerComment('Work is approved. Great job!'); }}
                        className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Work</span>
                      </button>
                      <button
                        onClick={() => { setManagerAction('REQUEST_REVISION'); setManagerComment('Please address feedback and resubmit.'); }}
                        className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Revision</span>
                      </button>
                      <button
                        onClick={() => { setManagerAction('OVERRIDE_SCORE'); }}
                        className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Override AI Score</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Review History Audit Trail */}
              {task.history_events && task.history_events.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
                    <History className="w-4 h-4 text-slate-400" />
                    <span>Review History & Audit Trail</span>
                  </div>
                  <div className="space-y-2">
                    {task.history_events.map((evt) => (
                      <div key={evt.id} className="text-xs bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/40 flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-slate-200">{evt.title}</div>
                          <div className="text-slate-400 mt-0.5 text-[11px]">{evt.description}</div>
                        </div>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-3">
                          {new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
