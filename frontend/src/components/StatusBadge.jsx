import React from 'react';

export const StatusBadge = ({ status, text, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  };

  const cleanStatus = String(status || text || '').toLowerCase().trim();

  let style = 'bg-slate-800 text-slate-300 border-slate-700';

  if (cleanStatus.includes('high') || cleanStatus === 'churn' || cleanStatus === 'failed' || cleanStatus === '1' || cleanStatus === 'yes') {
    style = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  } else if (cleanStatus.includes('medium') || cleanStatus === 'warning') {
    style = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  } else if (cleanStatus.includes('low') || cleanStatus === 'no churn' || cleanStatus === 'passed' || cleanStatus === '0' || cleanStatus === 'no' || cleanStatus === 'completed' || cleanStatus === 'active') {
    style = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  } else if (cleanStatus.includes('best') || cleanStatus.includes('selected')) {
    style = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-sm shadow-indigo-500/20';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${style} ${sizeClasses[size]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
      {text || status}
    </span>
  );
};
