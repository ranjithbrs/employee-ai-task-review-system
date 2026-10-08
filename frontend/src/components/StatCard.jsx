import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'indigo' }) {
  const colorMap = {
    indigo: {
      bg: 'from-indigo-900/20 to-indigo-950/10 border-indigo-500/30 text-indigo-400',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    },
    emerald: {
      bg: 'from-emerald-900/20 to-emerald-950/10 border-emerald-500/30 text-emerald-400',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    amber: {
      bg: 'from-amber-900/20 to-amber-950/10 border-amber-500/30 text-amber-400',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    rose: {
      bg: 'from-rose-900/20 to-rose-950/10 border-rose-500/30 text-rose-400',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    },
    purple: {
      bg: 'from-purple-900/20 to-purple-950/10 border-purple-500/30 text-purple-400',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    },
    cyan: {
      bg: 'from-cyan-900/20 to-cyan-950/10 border-cyan-500/30 text-cyan-400',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    },
  };

  const currentTheme = colorMap[color] || colorMap.indigo;

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${currentTheme.bg} border p-4 sm:p-5 flex items-start justify-between shadow-md backdrop-blur`}>
      <div>
        <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-xl ${currentTheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
