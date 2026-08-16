import React, { useState, useEffect } from 'react';
import { modelService, datasetService } from '../services/api';
import { ConfusionMatrixModal } from '../components/ConfusionMatrixModal';
import { StatusBadge } from '../components/StatusBadge';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Table as TableIcon,
  BarChart3,
  Check,
  AlertCircle,
  Eye,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

export const ModelComparison = ({ onNavigate, onModelSelected }) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModalModel, setActiveModalModel] = useState(null);
  const [settingDefault, setSettingDefault] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchComparison = async () => {
    setLoading(true);
    setError('');
    try {
      const ds = await datasetService.getActiveDataset();
      const data = await modelService.getModelComparison(ds.id);
      setComparison(data);
    } catch (err) {
      setError('No trained models found. Please train models in the ML Studio first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  const handleSetDefault = async (modelId, algoName) => {
    setSettingDefault(modelId);
    setSuccessMsg('');
    try {
      await modelService.setDefaultModel(modelId);
      setSuccessMsg(`'${algoName}' is now set as your active prediction model.`);
      fetchComparison();
      if (onModelSelected) onModelSelected();
    } catch (err) {
      setError('Failed to set default model.');
    } finally {
      setSettingDefault(null);
    }
  };

  if (loading && !comparison) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading Comparative ML Metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">No Model Comparison Available</h3>
        <p className="text-xs text-slate-400 max-w-md mb-6">{error}</p>
        <button
          onClick={() => onNavigate('training')}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition"
        >
          Go to Model Training Studio &rarr;
        </button>
      </div>
    );
  }

  const chartData = comparison?.models?.map((m) => ({
    name: m.algorithm_name,
    Accuracy: m.accuracy,
    Precision: m.precision,
    Recall: m.recall,
    F1_Score: m.f1_score,
    ROC_AUC: m.roc_auc
  })) || [];

  const bestModel = comparison?.models?.find((m) => m.is_best) || comparison?.models?.[0];
  const featureImportances = bestModel?.feature_importances || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Algorithm Comparison & Performance Evaluation
          </h2>
          <p className="text-xs text-slate-400">
            Real Scikit-learn benchmark metrics across Accuracy, Precision, Recall, F1-Score, and ROC-AUC.
          </p>
        </div>

        <button
          onClick={() => onNavigate('predict')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition"
        >
          <span>Predict Customer</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Best Model Callout Banner */}
      {bestModel && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-blue-950/60 p-6 backdrop-blur-xl gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Recommended Production Classifier
              </span>
              <h3 className="text-xl font-bold text-white">{bestModel.algorithm_name}</h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Highest balanced F1-Score of <strong className="text-emerald-400">{bestModel.f1_score}%</strong> and ROC-AUC of <strong className="text-blue-400">{bestModel.roc_auc}%</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveModalModel(bestModel)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <Eye className="h-4 w-4" />
              <span>Confusion Matrix</span>
            </button>
          </div>
        </div>
      )}

      {/* Model Metrics Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TableIcon className="h-4 w-4 text-blue-400" />
            <span>Algorithm Comparison Benchmark</span>
          </h3>
          <span className="text-xs text-slate-400">Dataset: {comparison?.dataset_filename}</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Accuracy</th>
                <th className="py-3 px-4 text-right">Precision</th>
                <th className="py-3 px-4 text-right">Recall</th>
                <th className="py-3 px-4 text-right">F1-Score</th>
                <th className="py-3 px-4 text-right">ROC-AUC</th>
                <th className="py-3 px-4 text-right">Training Time</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 text-slate-300">
              {comparison?.models?.map((m) => (
                <tr key={m.algorithm_name} className={`hover:bg-slate-800/40 transition ${m.is_best ? 'bg-indigo-950/20' : ''}`}>
                  <td className="py-3 px-4 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <span>{m.algorithm_name}</span>
                      {m.is_best && (
                        <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-[9px] font-semibold text-indigo-300">
                          Best
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {m.is_active ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <Check className="h-3.5 w-3.5" /> Active Model
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Trained</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-white">{m.accuracy}%</td>
                  <td className="py-3 px-4 text-right font-mono">{m.precision}%</td>
                  <td className="py-3 px-4 text-right font-mono">{m.recall}%</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{m.f1_score}%</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-400">{m.roc_auc}%</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">{m.training_time}s</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setActiveModalModel(m)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white transition"
                        title="View Confusion Matrix"
                      >
                        Matrix
                      </button>
                      {!m.is_active && (
                        <button
                          onClick={() => handleSetDefault(m.id, m.algorithm_name)}
                          disabled={settingDefault === m.id}
                          className="rounded-lg bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 text-[11px] font-semibold text-blue-300 hover:bg-blue-600/40 transition disabled:opacity-50"
                        >
                          Use Model
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparative Performance Visual Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Metric Comparison Bar Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-400" />
              <span>Multi-Metric Performance Comparison (%)</span>
            </h3>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                <Legend verticalAlign="top" iconType="circle" />
                <Bar dataKey="Accuracy" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Precision" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Recall" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="F1_Score" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ROC_AUC" fill="#ec4899" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Importance Driver Chart for Best Model */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Top Feature Drivers</h3>
              <p className="text-[11px] text-slate-400">Derived from {bestModel?.algorithm_name}</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {featureImportances.slice(0, 8).map((fi, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300 truncate max-w-[170px]">{fi.feature}</span>
                  <span className="font-mono text-blue-400 font-semibold">{fi.importance}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    style={{ width: `${Math.min(Math.abs(fi.importance) * 200, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confusion Matrix Inspection Modal */}
      {activeModalModel && (
        <ConfusionMatrixModal
          isOpen={!!activeModalModel}
          onClose={() => setActiveModalModel(null)}
          modelName={activeModalModel.algorithm_name}
          matrix={activeModalModel.confusion_matrix}
        />
      )}
    </div>
  );
};
