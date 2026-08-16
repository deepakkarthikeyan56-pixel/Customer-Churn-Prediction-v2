import React, { useState, useEffect } from 'react';
import { modelService, datasetService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import {
  Cpu,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Sliders,
  Layers,
  BarChart2
} from 'lucide-react';

const ALGORITHM_OPTIONS = [
  {
    id: 'Logistic Regression',
    name: 'Logistic Regression',
    type: 'Linear / Probability Baseline',
    description: 'Fast, interpretable, well-calibrated probability estimation for binary churn.'
  },
  {
    id: 'Decision Tree',
    name: 'Decision Tree Classifier',
    type: 'Tree-based Rule Extraction',
    description: 'Constructs transparent decision paths for customer segment behavior.'
  },
  {
    id: 'Random Forest',
    name: 'Random Forest Classifier',
    type: 'Bagging Ensemble',
    description: 'High-performance ensemble of decorrelated decision trees with feature importance.'
  },
  {
    id: 'Gradient Boosting',
    name: 'Gradient Boosting Classifier',
    type: 'Sequential Boosting Ensemble',
    description: 'Iterative residual error minimization for high predictive accuracy.'
  }
];

export const ModelTraining = ({ onNavigate, onModelTrained }) => {
  const [activeDataset, setActiveDataset] = useState(null);
  const [selectedAlgos, setSelectedAlgos] = useState([
    'Logistic Regression',
    'Decision Tree',
    'Random Forest',
    'Gradient Boosting'
  ]);
  const [testSplit, setTestSplit] = useState(0.2);
  const [randomState, setRandomState] = useState(42);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingElapsed, setTrainingElapsed] = useState(0);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDataset = async () => {
      try {
        const ds = await datasetService.getActiveDataset();
        setActiveDataset(ds);
      } catch {
        setError('No active dataset found. Please upload a dataset first.');
      }
    };
    loadDataset();
  }, []);

  // Timer while training is running
  useEffect(() => {
    let interval = null;
    if (isTraining) {
      setTrainingElapsed(0);
      interval = setInterval(() => {
        setTrainingElapsed((prev) => +(prev + 0.1).toFixed(1));
      }, 100);
    } else if (!isTraining && interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTraining]);

  const toggleAlgo = (algoId) => {
    if (selectedAlgos.includes(algoId)) {
      if (selectedAlgos.length === 1) return; // Keep at least one
      setSelectedAlgos(selectedAlgos.filter((a) => a !== algoId));
    } else {
      setSelectedAlgos([...selectedAlgos, algoId]);
    }
  };

  const handleStartTraining = async () => {
    if (!activeDataset) {
      setError('Please upload a dataset before starting training.');
      return;
    }
    setIsTraining(true);
    setError('');
    setComparisonResult(null);

    try {
      const res = await modelService.trainModels(
        activeDataset.id,
        selectedAlgos,
        testSplit,
        randomState
      );
      setComparisonResult(res);
      if (onModelTrained) onModelTrained(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Model training failed. Please check your dataset configuration.');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Machine Learning Training Studio
          </h2>
          <p className="text-xs text-slate-400">
            Train and evaluate multiple Scikit-learn classification algorithms with zero data leakage.
          </p>
        </div>

        {comparisonResult && (
          <button
            onClick={() => onNavigate('comparison')}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition"
          >
            <BarChart2 className="h-4 w-4" />
            <span>Open Algorithm Comparison</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset & Config Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Algorithm Selector */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Select Algorithms to Train</h3>
              <p className="text-xs text-slate-400">Compare baseline, interpretable trees, and high-performance ensembles</p>
            </div>
            <span className="text-xs text-blue-400 font-semibold">{selectedAlgos.length} of 4 selected</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ALGORITHM_OPTIONS.map((algo) => {
              const isSelected = selectedAlgos.includes(algo.id);
              return (
                <div
                  key={algo.id}
                  onClick={() => !isTraining && toggleAlgo(algo.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-sm shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">{algo.name}</p>
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {algo.type}
                      </span>
                    </div>
                    <div className={`flex h-5 w-5 items-center justify-center rounded border ${
                      isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {isSelected && <CheckCircle2 className="h-4 w-4" />}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">{algo.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Hyperparameters & Trigger */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              <span>Training Hyperparameters</span>
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400">Target Dataset:</span>
              <p className="font-semibold text-white truncate">{activeDataset?.filename || 'No dataset loaded'}</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Train/Test Split:</span>
                <span className="font-semibold text-white">{(100 - testSplit * 100).toFixed(0)}% / {(testSplit * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.4"
                step="0.05"
                value={testSplit}
                disabled={isTraining}
                onChange={(e) => setTestSplit(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <span className="text-slate-400">Random State (Reproducibility):</span>
              <input
                type="number"
                value={randomState}
                disabled={isTraining}
                onChange={(e) => setRandomState(parseInt(e.target.value) || 42)}
                className="w-full mt-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 space-y-1">
              <span className="text-[11px] font-semibold text-blue-300">Preprocessing Pipeline:</span>
              <p className="text-[10px] text-slate-400">
                SimpleImputer + StandardScaler + OneHotEncoder with ColumnTransformer
              </p>
            </div>

            <button
              onClick={handleStartTraining}
              disabled={isTraining || !activeDataset}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition duration-200"
            >
              {isTraining ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Training {selectedAlgos.length} Models ({trainingElapsed}s)...</span>
                </div>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Train Models Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Training / Completed Results Card */}
      {comparisonResult && (
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-6 backdrop-blur-xl space-y-6 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Training Completed Successfully</h3>
                <p className="text-xs text-slate-400">
                  Trained {comparisonResult.models?.length} algorithms in{' '}
                  <span className="font-semibold text-emerald-400">{comparisonResult.total_training_time} seconds</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 px-3.5 py-1.5">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-200">
                Best Model Selected: <strong className="text-white">{comparisonResult.best_algorithm}</strong>
              </span>
            </div>
          </div>

          {/* Model Timings & Accuracy Breakdown Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {comparisonResult.models.map((m) => (
              <div
                key={m.algorithm_name}
                className={`relative rounded-xl border p-4 transition ${
                  m.is_best
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-950/40'
                }`}
              >
                {m.is_best && (
                  <span className="absolute right-3 top-3 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                    Top Model
                  </span>
                )}
                <p className="text-xs font-bold text-white mb-2">{m.algorithm_name}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Accuracy:</span>
                    <span className="font-semibold text-white">{m.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">F1-Score:</span>
                    <span className="font-semibold text-emerald-400">{m.f1_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ROC-AUC:</span>
                    <span className="font-semibold text-blue-400">{m.roc_auc}%</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span>Train Time:</span>
                    <span className="font-mono text-slate-300">{m.training_time}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={() => onNavigate('comparison')}
              className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <Layers className="h-4 w-4" />
              <span>Inspect Detailed Metrics & Confusion Matrix</span>
            </button>

            <button
              onClick={() => onNavigate('predict')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:from-blue-500 hover:to-indigo-500 transition"
            >
              <span>Predict Individual Customer Churn</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
