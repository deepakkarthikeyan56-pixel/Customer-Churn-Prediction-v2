import React, { useState, useEffect } from 'react';
import { modelService, predictionService } from '../services/api';
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
  Phone
} from 'lucide-react';

export const PredictCustomer = ({ onNavigate }) => {
  const [activeModelMeta, setActiveModelMeta] = useState(null);
  const [formData, setFormData] = useState({});
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState('');

  // Default values for standard Telco features
  const defaultPresets = {
    highRisk: {
      gender: 'Female',
      SeniorCitizen: 1,
      Partner: 'No',
      Dependents: 'No',
      tenure: 2,
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
      MonthlyCharges: 98.5,
      TotalCharges: 197.0
    },
    loyal: {
      gender: 'Male',
      SeniorCitizen: 0,
      Partner: 'Yes',
      Dependents: 'Yes',
      tenure: 60,
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
      MonthlyCharges: 55.0,
      TotalCharges: 3300.0
    }
  };

  const fetchModelMeta = async () => {
    setLoading(true);
    setError('');
    try {
      const meta = await modelService.getActiveModel();
      setActiveModelMeta(meta);

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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyPreset = (type) => {
    const preset = defaultPresets[type];
    if (preset) {
      setFormData((prev) => ({ ...prev, ...preset }));
      setCustomerIdentifier(`CUST-${type === 'highRisk' ? 'RISK' : 'LOYAL'}-${Math.floor(100 + Math.random() * 900)}`);
      setPredictionResult(null);
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
      setCustomerIdentifier(`CUST-${Math.floor(1000 + Math.random() * 9000)}`);
      setPredictionResult(null);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!activeModelMeta) return;

    setPredicting(true);
    setError('');
    try {
      const res = await predictionService.predictSingle(
        formData,
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

  const handlePrintReport = () => {
    window.print();
  };

  if (loading && !activeModelMeta) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading Active Prediction Model...</p>
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
      {/* Header & Presets */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Customer Churn Predictor & Explainable AI (XAI)
          </h2>
          <p className="text-xs text-slate-400">
            Powered by active model: <strong className="text-emerald-400">{activeModelMeta?.algorithm_name}</strong> (F1: {activeModelMeta?.f1_score}%)
          </p>
        </div>

        {/* Quick Test Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleApplyPreset('highRisk')}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
          >
            Load High-Risk Preset
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('loyal')}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
          >
            Load Loyal Preset
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            className="rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition"
            title="Reset Form"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Layout: Form (Left) & Live Prediction Gauge / XAI (Right) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Customer Input Form (Left 7 Cols) */}
        <form onSubmit={handlePredict} className="space-y-6 lg:col-span-7">
          {/* Customer Identifier Bar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-blue-400" />
              <label className="text-xs font-semibold text-slate-300">Customer Identifier / ID:</label>
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
              <h3 className="text-sm font-bold text-white">2. Telecommunication & Web Services</h3>
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

          {/* Section 3: Contract & Billing */}
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

          {/* Other Dynamic Features if any */}
          {otherCols.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800">4. Additional Features</h3>
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
                <span>Running Inference...</span>
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
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] uppercase font-bold text-rose-400">Churn Probability</span>
                    <p className="text-lg font-bold text-white">{predictionResult.churn_probability}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Retention Probability</span>
                    <p className="text-lg font-bold text-white">{predictionResult.retention_probability}%</p>
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
                  onClick={handlePrintReport}
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
                Fill in the customer attributes on the left and click "Calculate Churn Probability" to trigger instant ML prediction with risk drivers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
