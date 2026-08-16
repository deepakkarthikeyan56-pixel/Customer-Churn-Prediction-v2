import React from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

export const ConfusionMatrixModal = ({ isOpen, onClose, modelName, matrix }) => {
  if (!isOpen || !matrix || matrix.length < 2) return null;

  const tn = matrix[0][0];
  const fp = matrix[0][1];
  const fn = matrix[1][0];
  const tp = matrix[1][1];
  const total = tn + fp + fn + tp;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Confusion Matrix</h3>
            <p className="text-xs text-slate-400">Model: <span className="text-indigo-400 font-medium">{modelName}</span></p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2x2 Matrix Visual */}
        <div className="my-6 space-y-4">
          <div className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Predicted Class
          </div>

          <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-3">
            {/* Y axis label */}
            <div className="flex items-center justify-center -rotate-90 text-xs font-semibold uppercase tracking-wider text-slate-400 h-full">
              Actual Class
            </div>

            {/* Column Headers */}
            <div className="col-span-2 grid grid-cols-2 gap-3 text-center text-xs font-semibold text-slate-300">
              <div>Predicted No (0)</div>
              <div>Predicted Yes (1)</div>
            </div>

            <div /> {/* Spacer */}

            {/* Row 1: Actual No */}
            <div className="col-span-2 grid grid-cols-2 gap-3">
              {/* True Negative */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <div className="text-xs font-medium text-emerald-400">True Negative (TN)</div>
                <div className="text-2xl font-bold text-white my-1">{tn}</div>
                <div className="text-[11px] text-slate-400">{((tn / total) * 100).toFixed(1)}% of total</div>
              </div>

              {/* False Positive */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
                <div className="text-xs font-medium text-amber-400">False Positive (FP)</div>
                <div className="text-2xl font-bold text-white my-1">{fp}</div>
                <div className="text-[11px] text-slate-400">{((fp / total) * 100).toFixed(1)}% of total</div>
              </div>
            </div>

            <div /> {/* Spacer */}

            {/* Row 2: Actual Yes */}
            <div className="col-span-2 grid grid-cols-2 gap-3">
              {/* False Negative */}
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-center">
                <div className="text-xs font-medium text-rose-400">False Negative (FN)</div>
                <div className="text-2xl font-bold text-white my-1">{fn}</div>
                <div className="text-[11px] text-slate-400">{((fn / total) * 100).toFixed(1)}% of total</div>
              </div>

              {/* True Positive */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                <div className="text-xs font-medium text-emerald-400">True Positive (TP)</div>
                <div className="text-2xl font-bold text-white my-1">{tp}</div>
                <div className="text-[11px] text-slate-400">{((tp / total) * 100).toFixed(1)}% of total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Matrix Explanations */}
        <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span><strong>Correct Predictions:</strong> {tn + tp} / {total} ({(((tn + tp) / total) * 100).toFixed(1)}% Accuracy)</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span><strong>Missed Churners (False Negatives):</strong> {fn} customers who actually churned but were predicted loyal.</span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
