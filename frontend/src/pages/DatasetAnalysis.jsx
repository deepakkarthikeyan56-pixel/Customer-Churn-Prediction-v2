import React, { useState, useEffect } from 'react';
import { datasetService } from '../services/api';
import {
  BarChart3,
  Hash,
  Layers,
  Table as TableIcon,
  PieChart as PieIcon,
  RefreshCw,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const DatasetAnalysis = ({ onNavigate }) => {
  const [analysis, setAnalysis] = useState(null);
  const [activeDataset, setActiveDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('numeric'); // 'numeric' | 'categorical' | 'charts'

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const ds = await datasetService.getActiveDataset();
      setActiveDataset(ds);
      const data = await datasetService.getDatasetAnalysis(ds.id);
      setAnalysis(data);
    } catch (err) {
      setError('Please upload an active dataset first to view detailed statistical analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (loading && !analysis) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Computing Exploratory Statistical Summaries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">No Active Dataset for Analysis</h3>
        <p className="text-xs text-slate-400 max-w-md mb-6">{error}</p>
        <button
          onClick={() => onNavigate('upload')}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition"
        >
          Go to Dataset Upload &rarr;
        </button>
      </div>
    );
  }

  const numStats = analysis?.numerical_stats || {};
  const catStats = analysis?.categorical_stats || {};
  const charts = analysis?.charts_data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Exploratory Data Analysis (EDA)
          </h2>
          <p className="text-xs text-slate-400">
            Statistical profiles, numerical distributions, categorical frequencies, and feature correlations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalysis}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh EDA</span>
          </button>

          <button
            onClick={() => onNavigate('training')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition"
          >
            <span>Proceed to Model Training</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Dataset Overview Pill Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Dataset File</span>
          <p className="text-sm font-bold text-white truncate mt-1">{analysis?.filename}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Observations</span>
          <p className="text-lg font-bold text-white mt-1">{analysis?.rows_count?.toLocaleString()} rows</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Numerical Columns</span>
          <p className="text-lg font-bold text-blue-400 mt-1">{Object.keys(numStats).length} features</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Categorical Columns</span>
          <p className="text-lg font-bold text-indigo-400 mt-1">{Object.keys(catStats).length} features</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('numeric')}
          className={`flex items-center gap-2 pb-3 text-xs font-semibold transition border-b-2 ${
            activeTab === 'numeric'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="h-4 w-4" />
          <span>Numerical Statistics ({Object.keys(numStats).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categorical')}
          className={`flex items-center gap-2 pb-3 text-xs font-semibold transition border-b-2 ${
            activeTab === 'categorical'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Categorical Distributions ({Object.keys(catStats).length})</span>
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`flex items-center gap-2 pb-3 text-xs font-semibold transition border-b-2 ${
            activeTab === 'charts'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Exploratory Visualizations</span>
        </button>
      </div>

      {/* Tab 1: Numerical Statistics */}
      {activeTab === 'numeric' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">Descriptive Numerical Statistics</h3>
            <span className="text-xs text-slate-400">Aggregated with Pandas & NumPy</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Feature Name</th>
                  <th className="py-3 px-4 text-right">Count</th>
                  <th className="py-3 px-4 text-right">Missing</th>
                  <th className="py-3 px-4 text-right">Mean</th>
                  <th className="py-3 px-4 text-right">Std Dev</th>
                  <th className="py-3 px-4 text-right">Median (Q2)</th>
                  <th className="py-3 px-4 text-right">Min</th>
                  <th className="py-3 px-4 text-right">Max</th>
                  <th className="py-3 px-4 text-right">Skewness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 text-slate-300">
                {Object.entries(numStats).map(([col, s]) => (
                  <tr key={col} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-semibold text-white">{col}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{s.count}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-amber-400">{s.missing}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-blue-300">{s.mean}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{s.std}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{s.median}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{s.min}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{s.max}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{s.skew}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Categorical Statistics */}
      {activeTab === 'categorical' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">Categorical Feature Profiles</h3>
            <span className="text-xs text-slate-400">Cardinality and mode frequencies</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Feature Name</th>
                  <th className="py-3 px-4 text-right">Unique Classes</th>
                  <th className="py-3 px-4">Most Frequent (Mode)</th>
                  <th className="py-3 px-4 text-right">Top Frequency</th>
                  <th className="py-3 px-4 text-right">Frequency Share</th>
                  <th className="py-3 px-4">Sample Categories</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 text-slate-300">
                {Object.entries(catStats).map(([col, s]) => (
                  <tr key={col} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-semibold text-white">{col}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-indigo-300">{s.unique_count}</td>
                    <td className="py-2.5 px-4 font-medium text-emerald-400">{s.top_value}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{s.top_frequency}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-blue-300">{s.frequency_percentage}%</td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] truncate max-w-xs">
                      {s.unique_values?.slice(0, 4).join(', ')}
                      {s.unique_values?.length > 4 ? '...' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Visualizations */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Target Distribution */}
            {charts.target_distribution && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
                <h3 className="text-base font-bold text-white mb-1">Target Class Balance</h3>
                <p className="text-xs text-slate-400 mb-4">Class proportions for target '{analysis?.target_column}'</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.target_distribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {charts.target_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tenure Histogram */}
            {charts.hist_tenure && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
                <h3 className="text-base font-bold text-white mb-1">Customer Tenure Histogram</h3>
                <p className="text-xs text-slate-400 mb-4">Distribution across tenure intervals</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.hist_tenure.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="bin" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Customers" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
