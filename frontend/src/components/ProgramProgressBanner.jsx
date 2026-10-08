import React from 'react';
import { Calendar, CheckCircle2, TrendingUp, Layers } from 'lucide-react';

export default function ProgramProgressBanner({ progress }) {
  if (!progress) return null;

  const pct = Math.round(progress.progress_percentage || 0);

  return (
    <div className="bg-gradient-to-r from-slate-800/90 via-slate-800/60 to-indigo-950/40 border border-slate-700/80 rounded-2xl p-4 sm:p-5 mb-6 shadow-lg backdrop-blur">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Program title & date */}
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Month-Long Program • Week {progress.current_week} of 4</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {progress.program_title}
          </h2>
          <div className="flex items-center text-xs text-slate-400 mt-1 space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>01 Oct 2026 → 31 Oct 2026</span>
          </div>
        </div>

        {/* Right: Metrics & Progress bar */}
        <div className="flex items-center space-x-6">
          
          {/* Completed tasks badge */}
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Tasks Completed</div>
            <div className="flex items-center justify-end space-x-1 text-slate-100 font-bold text-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{progress.completed_tasks} / {progress.total_tasks}</span>
            </div>
          </div>

          {/* Average review score */}
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Avg Review Score</div>
            <div className="flex items-center justify-end space-x-1 text-indigo-300 font-bold text-lg">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>{Math.round(progress.average_review_score)}%</span>
            </div>
          </div>

          {/* Progress gauge/bar */}
          <div className="min-w-[130px]">
            <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
              <span>Overall Progress</span>
              <span className="text-cyan-400 font-bold">{pct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-700/80 rounded-full overflow-hidden border border-slate-600/50">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.max(pct, 5)}%` }}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
