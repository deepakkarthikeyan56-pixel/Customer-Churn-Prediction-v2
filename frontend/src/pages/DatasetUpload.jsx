import React, { useState, useEffect, useRef } from 'react';
import { datasetService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  Database,
  Search,
  Settings,
  RefreshCw,
  Info
} from 'lucide-react';

export const DatasetUpload = ({ onNavigate, onDatasetLoaded }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeDataset, setActiveDataset] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTargetCol, setSelectedTargetCol] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const fetchActive = async () => {
    try {
      const ds = await datasetService.getActiveDataset();
      setActiveDataset(ds);
      setSelectedTargetCol(ds.target_column || '');
      loadPreview(ds.id);
      if (onDatasetLoaded) onDatasetLoaded(ds);
    } catch {
      // No active dataset yet
    }
  };

  const loadPreview = async (datasetId) => {
    setPreviewLoading(true);
    try {
      const prev = await datasetService.getDatasetPreview(datasetId, 50);
      setPreviewData(prev);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.endsWith('.csv')) {
        setError('Please select a valid CSV (.csv) file.');
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
        setError('Please drop a valid CSV (.csv) file.');
        return;
      }
      setFile(dropped);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccessMsg('');
    try {
      const ds = await datasetService.uploadDataset(file);
      setActiveDataset(ds);
      setSelectedTargetCol(ds.target_column || '');
      setSuccessMsg(`Successfully uploaded and validated '${ds.filename}'!`);
      loadPreview(ds.id);
      if (onDatasetLoaded) onDatasetLoaded(ds);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSample = async () => {
    setUploading(true);
    setError('');
    setSuccessMsg('');
    try {
      const ds = await datasetService.loadSampleDataset();
      setActiveDataset(ds);
      setSelectedTargetCol(ds.target_column || '');
      setSuccessMsg('Loaded Kaggle Telco Customer Churn sample dataset successfully!');
      loadPreview(ds.id);
      if (onDatasetLoaded) onDatasetLoaded(ds);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load sample dataset.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTarget = async () => {
    if (!activeDataset || !selectedTargetCol) return;
    try {
      const updated = await datasetService.configureDataset(activeDataset.id, {
        target_column: selectedTargetCol
      });
      setActiveDataset(updated);
      setSuccessMsg(`Target column updated to '${selectedTargetCol}'!`);
      if (onDatasetLoaded) onDatasetLoaded(updated);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update target column.');
    }
  };

  const filteredRows = previewData?.rows?.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Dataset Upload & Health Validation
          </h2>
          <p className="text-xs text-slate-400">
            Upload any customer CSV dataset from Kaggle. Automatic validation, type inference, and profiling will execute instantly.
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          disabled={uploading}
          className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-600/20 px-4 py-2.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-600/30 transition disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span>Load 1-Click Kaggle Telco Demo Dataset</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Upload Zone & Quick Controls */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Drag & Drop Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl lg:col-span-2">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/40 p-8 text-center cursor-pointer hover:border-blue-500/50 hover:bg-slate-950/70 transition duration-200"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-400 mb-3">
              <UploadCloud className="h-7 w-7" />
            </div>
            <p className="text-sm font-semibold text-white">
              {file ? file.name : 'Drag & drop your customer CSV file here'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports Kaggle customer churn datasets (.csv format)'}
            </p>

            <button
              type="button"
              className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              Browse Local Files
            </button>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition"
            >
              {uploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Upload & Analyze Dataset</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dataset Summary & Target Selector */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-400" />
              <span>Active Dataset</span>
            </h3>
            {activeDataset && <StatusBadge status="Active" size="sm" />}
          </div>

          {activeDataset ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">File Name:</span>
                <p className="font-semibold text-white truncate">{activeDataset.filename}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                <div>
                  <span className="text-slate-400">Total Rows:</span>
                  <p className="text-base font-bold text-white">{activeDataset.rows_count.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-400">Total Columns:</span>
                  <p className="text-base font-bold text-white">{activeDataset.columns_count}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                <label className="text-slate-400 font-medium">Target Classification Column:</label>
                <div className="flex gap-2">
                  <select
                    value={selectedTargetCol}
                    onChange={(e) => setSelectedTargetCol(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                  >
                    {previewData?.columns?.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSaveTarget}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
                  >
                    Set
                  </button>
                </div>
                {activeDataset.target_classes && (
                  <p className="text-[11px] text-emerald-400">
                    Detected Classes: {activeDataset.target_classes.join(' / ')}
                  </p>
                )}
              </div>

              <div className="pt-3">
                <button
                  onClick={() => onNavigate('training')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition"
                >
                  <span>Proceed to ML Model Training</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No dataset loaded. Upload a CSV file or load the sample Kaggle dataset above.
            </div>
          )}
        </div>
      </div>

      {/* Automated Validation Results Checklist */}
      {activeDataset?.validation_status?.checks && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Automated Dataset Health Validation</h3>
              <p className="text-xs text-slate-400">Heuristic checks for machine learning readiness</p>
            </div>
            <StatusBadge
              status={activeDataset.validation_status.is_valid ? 'Valid & Ready' : 'Warning'}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeDataset.validation_status.checks.map((check, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5"
              >
                {check.status === 'passed' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : check.status === 'warning' ? (
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white">{check.name}</p>
                  <p className="text-[11px] text-slate-400">{check.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dataset Preview Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Dataset Preview</h3>
            <p className="text-xs text-slate-400">
              Showing first {filteredRows.length} rows of {previewData?.total_rows || 0} total records
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in preview..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {previewLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : previewData?.columns?.length > 0 ? (
          <div className="overflow-x-auto max-h-96 rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="sticky top-0 bg-slate-950 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 bg-slate-950">#</th>
                  {previewData.columns.map((col) => (
                    <th
                      key={col}
                      className={`py-2.5 px-3 ${col === activeDataset?.target_column ? 'text-blue-400 bg-blue-950/40' : ''}`}
                    >
                      {col}
                      {col === activeDataset?.target_column && ' (Target)'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/30 text-slate-300">
                {filteredRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 text-slate-500 font-mono">{rIdx + 1}</td>
                    {previewData.columns.map((col) => (
                      <td
                        key={col}
                        className={`py-2 px-3 ${col === activeDataset?.target_column ? 'font-semibold text-blue-300 bg-blue-950/20' : ''}`}
                      >
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            Upload or select a dataset to inspect records preview.
          </div>
        )}
      </div>
    </div>
  );
};
