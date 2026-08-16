import React, { useState, useRef } from 'react';
import { predictionService, modelService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Search,
  Users,
  UserX,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

export const BatchPrediction = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        setError('Please select a valid CSV file.');
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      if (!dropped.name.endsWith('.csv')) {
        setError('Please drop a valid CSV file.');
        return;
      }
      setFile(dropped);
      setError('');
    }
  };

  const handleRunBatch = async () => {
    if (!file) {
      setError('Please choose a CSV file first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await predictionService.predictBatch(file);
      setBatchResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Batch prediction failed. Make sure columns match the trained model features.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = batchResult?.results_preview?.filter((item) =>
    item.customer_identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.prediction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.risk_level?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white font-heading">
          Batch Customer Churn Inference
        </h2>
        <p className="text-xs text-slate-400">
          Upload a batch CSV file with multiple customer records for high-throughput churn prediction and probability scoring.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/40 p-8 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-slate-950/70 transition duration-200"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 mb-3">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-white">
            {file ? file.name : 'Select or drop customer CSV dataset'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Batch records will be classified simultaneously'}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={handleRunBatch}
            disabled={!file || loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Running Batch Inference...</span>
              </div>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Run Batch Churn Classification</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Batch Results Overview */}
      {batchResult && (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Batch Inference Results</h3>
              <p className="text-xs text-slate-400">
                Classified {batchResult.total_records} records using {batchResult.algorithm_name}
              </p>
            </div>

            {batchResult.download_url && (
              <a
                href={batchResult.download_url}
                download
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500 transition"
              >
                <Download className="h-4 w-4" />
                <span>Download Predictions CSV</span>
              </a>
            )}
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Records"
              value={batchResult.total_records}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Predicted Churn"
              value={batchResult.churn_count}
              subtitle={`${((batchResult.churn_count / batchResult.total_records) * 100).toFixed(1)}% of batch`}
              icon={UserX}
              color="rose"
            />
            <MetricCard
              title="Predicted Retained"
              value={batchResult.non_churn_count}
              subtitle={`${((batchResult.non_churn_count / batchResult.total_records) * 100).toFixed(1)}% of batch`}
              icon={UserCheck}
              color="emerald"
            />
            <MetricCard
              title="High Risk Customers"
              value={batchResult.high_risk_count}
              subtitle="Probability > 65%"
              icon={AlertTriangle}
              color="amber"
            />
          </div>

          {/* Results Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">Processed Records Preview</h4>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search customer / risk..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-4">Customer ID</th>
                    <th className="py-2.5 px-4">Prediction</th>
                    <th className="py-2.5 px-4">Churn Probability</th>
                    <th className="py-2.5 px-4">Retention Probability</th>
                    <th className="py-2.5 px-4">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 text-slate-300">
                  {filteredItems.map((item) => (
                    <tr key={item.row_index} className="hover:bg-slate-800/40 transition">
                      <td className="py-2 px-3 text-slate-500 font-mono">{item.row_index}</td>
                      <td className="py-2 px-4 font-mono font-medium text-white">{item.customer_identifier}</td>
                      <td className="py-2 px-4">
                        <StatusBadge status={item.prediction} />
                      </td>
                      <td className="py-2 px-4 font-bold text-white">{item.churn_probability}%</td>
                      <td className="py-2 px-4 font-bold text-slate-300">{item.retention_probability}%</td>
                      <td className="py-2 px-4">
                        <StatusBadge status={item.risk_level} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
