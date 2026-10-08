import React, { useState } from 'react';
import { api } from '../api';
import { PlusCircle, X, Sparkles, Calendar, Layers, CheckSquare } from 'lucide-react';

export default function TaskCreateModal({ isOpen, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [evaluationGuidelines, setEvaluationGuidelines] = useState(
    '• Code quality & structure\n• Functionality & endpoints\n• Input validation & error handling\n• Documentation'
  );
  const [weekNumber, setWeekNumber] = useState(2);
  const [deadline, setDeadline] = useState('2026-10-25T18:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        expected_outcome: expectedOutcome.trim(),
        evaluation_guidelines: evaluationGuidelines.trim(),
        week_number: parseInt(weekNumber),
        deadline: new Date(deadline).toISOString(),
        intern_email: 'intern@demo.com',
        max_revisions: 3,
      };

      const created = await api.createTask(taskData);
      onSuccess(created);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Create & Assign Internship Task</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Build Employee REST API"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Detailed Description *</label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe requirements, tech stack, and goals for the intern..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Program Week</span>
              </label>
              <select
                value={weekNumber}
                onChange={(e) => setWeekNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>Week 1 - Requirements & DB</option>
                <option value={2}>Week 2 - Backend REST API</option>
                <option value={3}>Week 3 - Testing & CI</option>
                <option value={4}>Week 4 - Deployment & Docs</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Deadline</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Expected Outcome</label>
            <input
              type="text"
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              placeholder="e.g. A working REST API with CRUD operations, database integration, validation and error handling."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center space-x-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
              <span>Evaluation Guidelines & Criteria (Basis for AI Mentor Review)</span>
            </label>
            <textarea
              rows={4}
              value={evaluationGuidelines}
              onChange={(e) => setEvaluationGuidelines(e.target.value)}
              placeholder="List evaluation guidelines (one per line)..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              The AI Reviewer uses these guidelines as the strict benchmark for evidence-based evaluation.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>{loading ? 'Creating...' : 'Create & Assign Task'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
