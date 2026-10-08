import React, { useState } from 'react';
import { api } from '../api';
import {
  UploadCloud,
  FileText,
  Link,
  Code,
  X,
  Sparkles,
  CheckCircle,
  FileCheck,
  Zap,
  Loader2
} from 'lucide-react';

export default function SubmissionUploadModal({ task, isOpen, onClose, onSuccess }) {
  const [submissionType, setSubmissionType] = useState('FILE'); // FILE, LINK, TEXT
  const [selectedFile, setSelectedFile] = useState(null);
  const [repoLink, setRepoLink] = useState('');
  const [submittedText, setSubmittedText] = useState('');
  
  // Submission process state
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState(null);

  if (!isOpen || !task) return null;

  const currentVersion = (task.submissions?.length || 0) + 1;

  // 1-Click Fast Fill Helpers for Hackathon Demo
  const handleQuickFillV1 = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch the sample v1 file from backend
      const resp = await fetch('/api/sample-files/employee_api_v1_incomplete.pdf');
      const blob = await resp.blob();
      const testFile = new File([blob], 'employee_api_v1_incomplete.pdf', { type: 'application/pdf' });
      setSelectedFile(testFile);
      setSubmissionType('FILE');
      setSubmittedText('Initial implementation of Employee REST API with CRUD and database persistence.');
    } catch (e) {
      setError('Failed to load sample v1 file: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillV2 = async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch the sample v2 file from backend
      const resp = await fetch('/api/sample-files/employee_api_v2_improved.pdf');
      const blob = await resp.blob();
      const testFile = new File([blob], 'employee_api_v2_improved.pdf', { type: 'application/pdf' });
      setSelectedFile(testFile);
      setSubmissionType('FILE');
      setSubmittedText('Revised version with Jakarta validation (@Valid, @Email) and centralized GlobalExceptionHandler.');
    } catch (e) {
      setError('Failed to load sample v2 file: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submissionType === 'FILE' && !selectedFile) {
      setError('Please select a document or code file to submit.');
      return;
    }
    if (submissionType === 'LINK' && !repoLink.trim()) {
      setError('Please provide a repository or project link.');
      return;
    }

    setLoading(true);
    setError(null);

    // Multi-step animated progress simulation for hackathon presentation impact
    setProgressStep(1);
    await new Promise(r => setTimeout(r, 600));
    setProgressStep(2);
    await new Promise(r => setTimeout(r, 800));
    setProgressStep(3);

    try {
      const formData = new FormData();
      formData.append('submission_type', submissionType);
      if (selectedFile) formData.append('file', selectedFile);
      if (repoLink) formData.append('repo_link', repoLink);
      if (submittedText) formData.append('submitted_text', submittedText);

      const result = await api.submitWork(task.id, formData);
      onSuccess(result);
      onClose();
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
      setProgressStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Submission v{currentVersion}
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">Submit Work for AI Review</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Quick Demo Fill Callout */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-300">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Instant Hackathon Demo Auto-Fill:</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Click to pre-fill test files</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickFillV1}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-left"
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Load v1 Incomplete (Fails)</span>
              </button>
              <button
                type="button"
                onClick={handleQuickFillV2}
                disabled={loading}
                className="flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition text-left"
              >
                <FileCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Load v2 Improved (Passes)</span>
              </button>
            </div>
          </div>

          {/* Submission Mode Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              type="button"
              onClick={() => setSubmissionType('FILE')}
              className={`pb-2.5 px-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
                submissionType === 'FILE'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Document / Code File</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmissionType('LINK')}
              className={`pb-2.5 px-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
                submissionType === 'LINK'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link className="w-4 h-4" />
              <span>GitHub / Project Link</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmissionType('TEXT')}
              className={`pb-2.5 px-3 text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
                submissionType === 'TEXT'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Text / Notes Only</span>
            </button>
          </div>

          {/* File Upload Zone */}
          {submissionType === 'FILE' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Upload Submission File (PDF, DOCX, TXT, or ZIP code archive)
              </label>
              
              <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-800/40 group">
                <input
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.zip"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-indigo-400 transition" />
                <div className="mt-2 text-xs text-slate-300 font-medium">
                  {selectedFile ? (
                    <span className="text-emerald-400 font-bold">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  ) : (
                    <span>Click or drag file here to upload</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Supports PDF, DOCX, TXT, or ZIP up to 15MB</p>
              </div>
            </div>
          )}

          {/* Repository Link */}
          {submissionType === 'LINK' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                GitHub Repository or Live Website URL
              </label>
              <input
                type="url"
                value={repoLink}
                onChange={(e) => setRepoLink(e.target.value)}
                placeholder="https://github.com/alexchen/employee-rest-api"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                disabled={loading}
              />
            </div>
          )}

          {/* Submission Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Intern Notes / Changelog for this version
            </label>
            <textarea
              rows={3}
              value={submittedText}
              onChange={(e) => setSubmittedText(e.target.value)}
              placeholder="Explain your approach, changes made since previous review, or key highlights..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              disabled={loading}
            />
          </div>

          {/* Animated AI Analysis Steps when submitting */}
          {loading && (
            <div className="rounded-xl bg-slate-800/90 border border-indigo-500/30 p-4 space-y-2.5">
              <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>AI Mentor is Analyzing Your Submission...</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className={`flex items-center space-x-2 ${progressStep >= 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>1. Extracting text & parsing code structure</span>
                </div>
                <div className={`flex items-center space-x-2 ${progressStep >= 2 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>2. Evaluating implementation against mentor guidelines</span>
                </div>
                <div className={`flex items-center space-x-2 ${progressStep >= 3 ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3. Formulating evidence-based mentor feedback & improvement comparison</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reviewing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Submit for AI Review (v{currentVersion})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
