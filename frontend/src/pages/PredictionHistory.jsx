import React, { useState, useEffect } from 'react';
import { predictionService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  X,
  AlertCircle,
  RefreshCw,
  Clock,
  User,
  HelpCircle
} from 'lucide-react';

export const PredictionHistory = ({ onNavigate }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [predFilter, setPredFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await predictionService.getHistory(searchTerm, riskFilter, predFilter);
      setRecords(data);
    } catch (err) {
      setError('Could not load prediction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [riskFilter, predFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await predictionService.deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (selectedRecord?.id === id) setSelectedRecord(null);
    } catch (err) {
      setError('Failed to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all prediction records?')) {
      try {
        await predictionService.clearAllHistory();
        setRecords([]);
        setSelectedRecord(null);
      } catch (err) {
        setError('Failed to clear history.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Prediction History & Inference Audit Log
          </h2>
          <p className="text-xs text-slate-400">
            Persistent log of all individual and batch model inference runs stored securely in the database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {records.length > 0 && (
            <>
              <a
                href={predictionService.getExportUrl()}
                download
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 transition"
              >
                <Download className="h-4 w-4" />
                <span>Export to CSV</span>
              </a>

              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
              >
                <Trash2 className="h-4 w-4 text-rose-400" />
                <span>Clear All</span>
              </button>
            </>
          )}

          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer ID or identifier..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-3">
          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Risk Tiers</option>
            <option value="High Risk">High Risk (&gt;65%)</option>
            <option value="Medium Risk">Medium Risk (35-65%)</option>
            <option value="Low Risk">Low Risk (&lt;35%)</option>
          </select>

          {/* Prediction Class Filter */}
          <select
            value={predFilter}
            onChange={(e) => setPredFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Predictions</option>
            <option value="Churn">Churn</option>
            <option value="No Churn">No Churn</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Model Used</th>
                  <th className="py-3 px-4">Prediction</th>
                  <th className="py-3 px-4 text-right">Churn Probability</th>
                  <th className="py-3 px-4 text-right">Retention Probability</th>
                  <th className="py-3 px-4 text-center">Risk Level</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 text-slate-300">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      {r.customer_identifier || `CUST-${r.id}`}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{r.model_name || 'Classifier'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.prediction} />
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">{r.churn_probability}%</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-300">{r.retention_probability}%</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={r.risk_level} />
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="rounded-lg border border-slate-700 bg-slate-800 p-1.5 text-slate-300 hover:text-white transition"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                          className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20 transition disabled:opacity-50"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-10 w-10 text-slate-600 mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">No Prediction History Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              Individual and batch customer predictions will appear here once executed.
            </p>
            <button
              onClick={() => onNavigate('predict')}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition"
            >
              Run First Prediction &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Prediction Details</h3>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedRecord.customer_identifier}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status overview */}
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-950/60 p-3.5 border border-slate-800 text-center text-xs">
              <div>
                <span className="text-slate-400">Prediction:</span>
                <p className="font-bold text-white mt-0.5">{selectedRecord.prediction}</p>
              </div>
              <div>
                <span className="text-slate-400">Churn Probability:</span>
                <p className="font-bold text-rose-400 mt-0.5">{selectedRecord.churn_probability}%</p>
              </div>
              <div>
                <span className="text-slate-400">Risk Tier:</span>
                <p className="font-bold text-amber-400 mt-0.5">{selectedRecord.risk_level}</p>
              </div>
            </div>

            {/* Contributing factors if present */}
            {selectedRecord.top_factors?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Risk Factors Recorded
                </h4>
                <div className="space-y-1.5">
                  {selectedRecord.top_factors.map((f, idx) => (
                    <div key={idx} className="flex justify-between rounded-lg bg-slate-950/40 p-2.5 text-xs border border-slate-800/80">
                      <span className="font-semibold text-white">{f.feature}</span>
                      <span className={f.impact?.includes('Increases') ? 'text-rose-400' : 'text-emerald-400'}>
                        {f.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Data Payload */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Customer Input Features
              </h4>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/60 p-3 border border-slate-800 text-xs max-h-48 overflow-y-auto">
                {Object.entries(selectedRecord.input_data || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-800/40 pb-1">
                    <span className="text-slate-400 truncate max-w-[120px]">{k}:</span>
                    <span className="font-semibold text-white">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
