import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  Lightbulb,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';

export default function AIReviewResult({ review, onResubmit, isIntern }) {
  if (!review) return null;

  const isApproved = review.recommendation === 'APPROVED';
  const isHumanReview = review.recommendation === 'HUMAN_REVIEW_REQUIRED';
  const isNeedsRevision = review.recommendation === 'NEEDS_REVISION';

  const score = Math.round(review.overall_score || 0);
  const confidence = Math.round(review.confidence_score || 0);

  // Status badge styling
  const statusConfig = {
    APPROVED: {
      label: 'APPROVED',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: CheckCircle,
      glow: 'shadow-emerald-500/10 border-emerald-500/30',
    },
    NEEDS_REVISION: {
      label: 'NEEDS REVISION',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: AlertTriangle,
      glow: 'shadow-amber-500/10 border-amber-500/30',
    },
    HUMAN_REVIEW_REQUIRED: {
      label: 'HUMAN REVIEW REQUIRED',
      badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: HelpCircle,
      glow: 'shadow-purple-500/10 border-purple-500/30',
    },
  }[review.recommendation] || {
    label: review.recommendation,
    badgeClass: 'bg-slate-700 text-slate-200 border-slate-600',
    icon: HelpCircle,
    glow: 'border-slate-700',
  };

  const StatusIcon = statusConfig.icon;

  return (
    <div className={`rounded-2xl bg-slate-900 border ${statusConfig.glow} p-5 sm:p-7 shadow-xl space-y-6`}>
      
      {/* 1. Header & Score Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        
        {/* Left: AI Review & Status */}
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-white tracking-tight">AI Mentor Evaluation</h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border flex items-center space-x-1 ${statusConfig.badgeClass}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusConfig.label}</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Reviewed using {review.model_used || 'MentorAI'} • Confidence: <span className="text-slate-200 font-semibold">{confidence}%</span>
            </p>
          </div>
        </div>

        {/* Right: Circular Score & Gauge */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Evaluation Score</div>
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-baseline justify-end">
              <span>{score}</span>
              <span className="text-sm font-semibold text-slate-400 ml-0.5">/100</span>
            </div>
          </div>
          
          {/* Circular badge */}
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border ${
            score >= 85 ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' :
            score >= 70 ? 'bg-amber-950/40 text-amber-400 border-amber-500/30' :
            'bg-rose-950/40 text-rose-400 border-rose-500/30'
          }`}>
            {score}%
          </div>
        </div>

      </div>

      {/* 2. Low Confidence / Human Review Alert if applicable */}
      {isHumanReview && (
        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs flex items-start space-x-3">
          <HelpCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-purple-300">Human Review Recommended</div>
            <div className="mt-0.5 text-purple-200/90 leading-relaxed">
              The AI confidence ({confidence}%) is below the configured threshold. A manager must inspect and make the final decision before closing the task.
            </div>
          </div>
        </div>
      )}

      {/* 3. ⭐ Continuous Improvement Comparison (Showstopper Feature for v2+) */}
      {review.improvement_summary && (
        <div className="rounded-xl bg-gradient-to-r from-emerald-950/30 via-slate-800/60 to-indigo-950/30 border border-emerald-500/30 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Continuous Improvement Tracking (v1 → v2)</span>
            </div>
            {review.previous_score && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400">Previous: <strong className="text-slate-200">{Math.round(review.previous_score)}</strong></span>
                <ArrowRight className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-400">Current: <strong className="text-emerald-400">{score}</strong></span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                  +{review.score_change || (score - Math.round(review.previous_score))} pts
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
            {review.improvement_summary}
          </p>

          {/* Previous Issues Status Checklist */}
          {review.previous_issues_status && review.previous_issues_status.length > 0 && (
            <div className="pt-1">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Previous Review Issues Addressed:
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {review.previous_issues_status.map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-700/40">
                    {item.status === 'RESOLVED' ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={`font-semibold ${item.status === 'RESOLVED' ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {item.issue}
                      </span>
                      {item.note && <span className="text-slate-400 ml-1.5 text-[11px]">— {item.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Human-like Mentor Feedback Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-800/80 border border-slate-700/80 relative">
        <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
          <MessageSquare className="w-4 h-4" />
          <span>Senior Mentor Feedback</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic border-l-2 border-indigo-500 pl-3">
          "{review.mentor_feedback}"
        </p>
        <div className="mt-3 text-xs text-slate-400 font-medium">
          <strong>Overall Assessment:</strong> {review.overall_assessment}
        </div>
      </div>

      {/* 5. Four Detailed Analytical Columns: Strengths, Areas for Improvement, Issues, Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Strengths 🟢 */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-emerald-500/20">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2.5">
            <CheckCircle className="w-4 h-4" />
            <span>Strengths ({review.strengths?.length || 0})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {review.strengths && review.strengths.length > 0 ? (
              review.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">No specific strengths recorded.</li>
            )}
          </ul>
        </div>

        {/* Areas for Improvement 🟡 */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-amber-500/20">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2.5">
            <TrendingUp className="w-4 h-4" />
            <span>Areas for Improvement ({review.weaknesses?.length || 0})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {review.weaknesses && review.weaknesses.length > 0 ? (
              review.weaknesses.map((weak, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span>{weak}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">None noted.</li>
            )}
          </ul>
        </div>

        {/* Issues Found 🔴 */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-rose-500/20">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2.5">
            <X className="w-4 h-4" />
            <span>Issues Found ({review.issues?.length || 0})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {review.issues && review.issues.length > 0 ? (
              review.issues.map((iss, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-rose-400 font-bold mt-0.5">•</span>
                  <span>{iss}</span>
                </li>
              ))
            ) : (
              <li className="text-emerald-400 font-medium flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>No blocking issues found! Work is clean.</span>
              </li>
            )}
          </ul>
        </div>

        {/* Actionable Suggestions 💡 */}
        <div className="p-4 rounded-xl bg-slate-800/40 border border-indigo-500/20">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2.5">
            <Lightbulb className="w-4 h-4" />
            <span>Actionable Suggestions ({review.suggestions?.length || 0})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {review.suggestions && review.suggestions.length > 0 ? (
              review.suggestions.map((sug, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="text-indigo-400 font-bold mt-0.5">•</span>
                  <span>{sug}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">No additional suggestions.</li>
            )}
          </ul>
        </div>

      </div>

      {/* 6. Resubmit Action Button if Needs Revision & User is Intern */}
      {isNeedsRevision && isIntern && onResubmit && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={onResubmit}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/25 transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Resubmit Improved Work (v2)</span>
          </button>
        </div>
      )}

      {/* 7. Approved Celebratory Callout */}
      {isApproved && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center space-x-3 text-emerald-300 text-xs">
          <Award className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="font-bold">Task Objectives Satisfied & Closed</div>
            <div className="text-emerald-200/80">
              The intern's submission fulfills all acceptance guidelines. Internship progress metrics have been updated.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
