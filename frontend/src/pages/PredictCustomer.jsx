import React, { useState, useEffect } from 'react';
import { modelService, predictionService, datasetService } from '../services/api';
import { RiskGauge } from '../components/RiskGauge';
import { StatusBadge } from '../components/StatusBadge';
import {
  UserCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Printer,
  FileText,
  User,
  Shield,
  CreditCard,
  Wifi,
  Phone,
  Shuffle,
  Zap
} from 'lucide-react';

export const PredictCustomer = ({ onNavigate }) => {
  const [activeModelMeta, setActiveModelMeta] = useState(null);
  const [activeDataset, setActiveDataset] = useState(null);
  const [formData, setFormData] = useState({});
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState('');
  const [autofillSource, setAutofillSource] = useState('');

  // Built-in presets with distinct probability outcomes
  const defaultPresets = {
    extremeHighRisk: {
      label: 'Extreme High Churn Risk (Month-to-month, High Bill, No Support)',
      data: {
        gender: 'Female',
        SeniorCitizen: 1,
        Partner: 'No',
        Dependents: 'No',
        tenure: 1,
        PhoneService: 'Yes',
        MultipleLines: 'Yes',
        InternetService: 'Fiber optic',
        OnlineSecurity: 'No',
        OnlineBackup: 'No',
        DeviceProtection: 'No',
        TechSupport: 'No',
        StreamingTV: 'Yes',
        StreamingMovies: 'Yes',
        Contract: 'Month-to-month',
        PaperlessBilling: 'Yes',
        PaymentMethod: 'Electronic check',
        MonthlyCharges: 110.5,
        TotalCharges: 110.5
      }
    },
    loyalLowRisk: {
      label: 'Loyal Low Risk Customer (2-Year Contract, 6+ Years, Tech Support)',
      data: {
        gender: 'Male',
        SeniorCitizen: 0,
        Partner: 'Yes',
        Dependents: 'Yes',
        tenure: 70,
        PhoneService: 'Yes',
        MultipleLines: 'Yes',
        InternetService: 'DSL',
        OnlineSecurity: 'Yes',
        OnlineBackup: 'Yes',
        DeviceProtection: 'Yes',
        TechSupport: 'Yes',
        StreamingTV: 'No',
        StreamingMovies: 'No',
        Contract: 'Two year',
        PaperlessBilling: 'No',
        PaymentMethod: 'Credit card (automatic)',
        MonthlyCharges: 35.0,
        TotalCharges: 2450.0
      }
    },
    moderateRisk: {
      label: 'Moderate / Medium Risk (1-Year Contract, Moderate Tenure)',
      data: {
        gender: 'Female',
        SeniorCitizen: 0,
        Partner: 'Yes',
        Dependents: 'No',
        tenure: 24,
        PhoneService: 'Yes',
        MultipleLines: 'No',
        InternetService: 'Fiber optic',
        OnlineSecurity: 'No',
        OnlineBackup: 'Yes',
        DeviceProtection: 'Yes',
        TechSupport: 'No',
        StreamingTV: 'Yes',
        StreamingMovies: 'No',
        Contract: 'One year',
        PaperlessBilling: 'Yes',
        PaymentMethod: 'Bank transfer (automatic)',
        MonthlyCharges: 75.0,
        TotalCharges: 1800.0
      }
    },
    budgetLoyal: {
      label: 'Budget Customer (No Internet, Phone Only, Long-term)',
      data: {
        gender: 'Male',
        SeniorCitizen: 0,
        Partner: 'No',
        Dependents: 'No',
        tenure: 50,
        PhoneService: 'Yes',
        MultipleLines: 'No',
        InternetService: 'No',
        OnlineSecurity: 'No internet service',
        OnlineBackup: 'No internet service',
        DeviceProtection: 'No internet service',
        TechSupport: 'No internet service',
        StreamingTV: 'No internet service',
        StreamingMovies: 'No internet service',
        Contract: 'Two year',
        PaperlessBilling: 'No',
        PaymentMethod: 'Mailed check',
        MonthlyCharges: 20.0,
        TotalCharges: 1000.0
      }
    }
  };

  const fetchModelMeta = async () => {
    setLoading(true);
    setError('');
    try {
      const [meta, ds] = await Promise.all([
        modelService.getActiveModel(),
        datasetService.getActiveDataset().catch(() => null)
      ]);
      setActiveModelMeta(meta);
      setActiveDataset(ds);

      // Initialize form fields with defaults
      const initial = {};
      meta.numerical_cols?.forEach((col) => {
        initial[col] = meta.numerical_ranges?.[col]?.median ?? 20;
      });
      meta.categorical_cols?.forEach((col) => {
        initial[col] = meta.categorical_unique_values?.[col]?.[0] ?? 'No';
      });
      setFormData(initial);
      setCustomerIdentifier(`CUST-${Math.floor(1000 + Math.random() * 9000)}`);
    } catch (err) {
      setError('Please train a machine learning model before generating customer predictions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelMeta();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate TotalCharges when tenure or MonthlyCharges changes
      if (field === 'tenure' || field === 'MonthlyCharges') {
        const t = parseFloat(field === 'tenure' ? value : prev.tenure) || 1;
        const m = parseFloat(field === 'MonthlyCharges' ? value : prev.MonthlyCharges) || 50;
        if ('TotalCharges' in prev || 'TotalCharges' in (activeModelMeta?.feature_columns || [])) {
          updated.TotalCharges = roundToTwo(m * t);
        }
      }
      return updated;
    });
  };

  const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  const handleApplyPreset = async (presetKey, autoRun = false) => {
    const preset = defaultPresets[presetKey];
    if (!preset) return;

    const newForm = { ...formData, ...preset.data };
    setFormData(newForm);
    setAutofillSource(preset.label);
    setCustomerIdentifier(`CUST-${presetKey.toUpperCase().slice(0, 5)}-${Math.floor(100 + Math.random() * 900)}`);
    setPredictionResult(null);

    if (autoRun) {
      executePredict(newForm);
    }
  };

  const handleAutofillFromDataset = async (churnType = null) => {
    if (!activeDataset) {
      setError('No dataset active to pull samples from.');
      return;
    }
    setLoading(true);
    try {
      const res = await datasetService.getRandomSample(activeDataset.id, churnType);
      const sample = res.sample;
      
      const newForm = { ...formData };
      activeModelMeta.feature_columns.forEach((col) => {
        if (col in sample && sample[col] !== '') {
          newForm[col] = sample[col];
        }
      });

      setFormData(newForm);
      const label = churnType === 'churn' 
        ? 'Real Churned Customer from Dataset (Ground Truth: Churn)'
        : churnType === 'loyal'
        ? 'Real Loyal Customer from Dataset (Ground Truth: Retained)'
        : 'Random Sample from Dataset';
      setAutofillSource(label);
      setCustomerIdentifier(sample.customerID || `CUST-DS-${Math.floor(1000 + Math.random() * 9000)}`);
      setPredictionResult(null);

      // Auto-predict for instant feedback
      executePredict(newForm);
    } catch (err) {
      setError('Failed to fetch sample from dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    if (activeModelMeta) {
      const initial = {};
      activeModelMeta.numerical_cols?.forEach((col) => {
        initial[col] = activeModelMeta.numerical_ranges?.[col]?.median ?? 20;
      });
      activeModelMeta.categorical_cols?.forEach((col) => {
        initial[col] = activeModelMeta.categorical_unique_values?.[col]?.[0] ?? 'No';
      });
      setFormData(initial);
      setAutofillSource('');
      setCustomerIdentifier(`CUST-${Math.floor(1000 + Math.random() * 9000)}`);
      setPredictionResult(null);
    }
  };

  const executePredict = async (dataToPredict) => {
    if (!activeModelMeta) return;
    setPredicting(true);
    setError('');
    try {
      const res = await predictionService.predictSingle(
        dataToPredict,
        activeModelMeta.model_id,
        customerIdentifier
      );
      setPredictionResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed.');
    } finally {
      setPredicting(false);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    executePredict(formData);
  };

  if (loading && !activeModelMeta) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading Prediction Engine...</p>
        </div>
      </div>
    );
  }

  if (error && !activeModelMeta) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
        <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">No Active ML Model Ready</h3>
        <p className="text-xs text-slate-400 max-w-md mb-6">{error}</p>
        <button
          onClick={() => onNavigate('training')}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-500 transition"
        >
          Train Models in ML Studio &rarr;
        </button>
      </div>
    );
  }

  // Dynamic Grouping of Features
  const demographicsCols = ['gender', 'SeniorCitizen', 'Partner', 'Dependents'];
  const serviceCols = [
    'PhoneService', 'MultipleLines', 'InternetService', 'OnlineSecurity',
    'OnlineBackup', 'DeviceProtection', 'TechSupport', 'StreamingTV', 'StreamingMovies'
  ];
  const billingCols = [
    'Contract', 'PaperlessBilling', 'PaymentMethod', 'MonthlyCharges', 'TotalCharges', 'tenure'
  ];

  const allKnown = [...demographicsCols, ...serviceCols, ...billingCols];
  const otherCols = activeModelMeta?.feature_columns?.filter((c) => !allKnown.includes(c)) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white font-heading">
              Customer Churn Predictor & Explainable AI (XAI)
            </h2>
            <p className="text-xs text-slate-400">
              Active Production Classifier: <strong className="text-emerald-400">{activeModelMeta?.algorithm_name}</strong> (F1-Score: {activeModelMeta?.f1_score}%, ROC-AUC: {activeModelMeta?.roc_auc}%)
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetForm}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* 1-Click Auto-Fill Bar */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-blue-950/60 p-4 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                1-Click Quick Autofill Profiles:
              </span>
            </div>
            {autofillSource && (
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full truncate max-w-sm">
                Active: {autofillSource}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('extremeHighRisk', true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/30 transition shadow-sm"
            >
              <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
              <span>Autofill High Risk Churner (85-98%)</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('loyalLowRisk', true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition shadow-sm"
            >
              <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
              <span>Autofill Loyal Customer (5-15%)</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('moderateRisk', true)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 transition shadow-sm"
            >
              <span>Autofill Moderate Risk (35-50%)</span>
            </button>

            <button
              type="button"
              onClick={() => handleAutofillFromDataset('churn')}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/30 transition shadow-sm"
            >
              <Shuffle className="h-3.5 w-3.5 text-indigo-400" />
              <span>Real Churned Row from Dataset</span>
            </button>

            <button
              type="button"
              onClick={() => handleAutofillFromDataset('loyal')}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/30 transition shadow-sm"
            >
              <Shuffle className="h-3.5 w-3.5 text-indigo-400" />
              <span>Real Retained Row from Dataset</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form + Live Result Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Customer Input Form (Left 7 Cols) */}
        <form onSubmit={handlePredict} className="space-y-6 lg:col-span-7">
          {/* Customer Identifier Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-blue-400" />
              <label className="text-xs font-semibold text-slate-300">Customer Identifier:</label>
            </div>
            <input
              type="text"
              value={customerIdentifier}
              onChange={(e) => setCustomerIdentifier(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-mono text-white focus:border-blue-500 focus:outline-none w-48 text-right"
              required
            />
          </div>

          {/* Section 1: Customer Demographics */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <User className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">1. Customer Demographics</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activeModelMeta?.feature_columns
                ?.filter((c) => demographicsCols.includes(c))
                ?.map((col) => (
                  <div key={col} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 capitalize">{col}</label>
                    {activeModelMeta.categorical_cols.includes(col) ? (
                      <select
                        value={formData[col] ?? ''}
                        onChange={(e) => handleInputChange(col, e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        {activeModelMeta.categorical_unique_values?.[col]?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={formData[col] ?? ''}
                        onChange={(e) => handleInputChange(col, parseFloat(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Section 2: Subscribed Services */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <Wifi className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">2. Subscribed Telecom & Digital Services</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {activeModelMeta?.feature_columns
                ?.filter((c) => serviceCols.includes(c))
                ?.map((col) => (
                  <div key={col} className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 capitalize truncate block">
                      {col.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {activeModelMeta.categorical_cols.includes(col) ? (
                      <select
                        value={formData[col] ?? ''}
                        onChange={(e) => handleInputChange(col, e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        {activeModelMeta.categorical_unique_values?.[col]?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={formData[col] ?? ''}
                        onChange={(e) => handleInputChange(col, parseFloat(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Section 3: Contract, Billing & Tenure */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <CreditCard className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">3. Contract, Billing & Tenure</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {activeModelMeta?.feature_columns
                ?.filter((c) => billingCols.includes(c))
                ?.map((col) => (
                  <div key={col} className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300 capitalize truncate block">
                      {col.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {activeModelMeta.categorical_cols.includes(col) ? (
                      <select
                        value={formData[col] ?? ''}
                        onChange={(e) => handleInputChange(col, e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        {activeModelMeta.categorical_unique_values?.[col]?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={formData[col] ?? ''}
                        onChange={(e) => handleInputChange(col, parseFloat(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Additional features if dataset has custom columns */}
          {otherCols.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">4. Additional Dataset Features</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {otherCols.map((col) => (
                  <div key={col} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">{col}</label>
                    {activeModelMeta.categorical_cols.includes(col) ? (
                      <select
                        value={formData[col] ?? ''}
                        onChange={(e) => handleInputChange(col, e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        {activeModelMeta.categorical_unique_values?.[col]?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={formData[col] ?? ''}
                        onChange={(e) => handleInputChange(col, parseFloat(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={predicting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-xl shadow-blue-600/30 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 transition duration-200"
          >
            {predicting ? (
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Evaluating Model Inference...</span>
              </div>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Calculate Churn Probability</span>
              </>
            )}
          </button>
        </form>

        {/* Prediction Results & Explanation Card (Right 5 Cols) */}
        <div className="space-y-6 lg:col-span-5">
          {predictionResult ? (
            <div className="sticky top-24 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Prediction Intelligence</h3>
                  <p className="text-[11px] text-slate-400">ID: {predictionResult.customer_identifier}</p>
                </div>
                <StatusBadge status={predictionResult.risk_level} size="lg" />
              </div>

              {/* Radial Probability Meter */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
                <RiskGauge probability={predictionResult.churn_probability} size={200} />

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] uppercase font-bold text-rose-400">Churn Probability</span>
                    <p className="text-xl font-extrabold text-white">{predictionResult.churn_probability}%</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Retention Probability</span>
                    <p className="text-xl font-extrabold text-white">{predictionResult.retention_probability}%</p>
                  </div>
                </div>
              </div>

              {/* Explainable AI: Why is this customer at risk? */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Key Risk Factor Explanations
                  </h4>
                </div>

                <div className="space-y-2">
                  {predictionResult.top_factors?.map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white">{factor.feature}</span>
                        <p className="text-[11px] text-slate-400">Value: <strong className="text-slate-200">{String(factor.value)}</strong></p>
                      </div>
                      <span className={`text-[11px] font-medium text-right shrink-0 ${
                        factor.impact.includes('Increases') ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {factor.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Customer PDF Report</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center flex flex-col items-center justify-center">
              <Sparkles className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-white mb-1">Awaiting Customer Profile</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Click any <strong>1-Click Quick Autofill Profile</strong> above or customize customer attributes to calculate instant ML churn probabilities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
