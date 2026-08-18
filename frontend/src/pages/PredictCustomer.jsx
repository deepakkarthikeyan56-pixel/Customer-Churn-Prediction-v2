import React, { useState, useEffect, useCallback } from 'react';
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
  Zap,
  Sliders,
  Activity,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

export const PredictCustomer = ({ onNavigate }) => {
  const [activeModelMeta, setActiveModelMeta] = useState(null);
  const [activeDataset, setActiveDataset] = useState(null);
  const [sampleCustomers, setSampleCustomers] = useState([]);
  const [formData, setFormData] = useState({});
  const [customerIdentifier, setCustomerIdentifier] = useState('');
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState('');
  const [autofillSource, setAutofillSource] = useState('');
  const [liveMode, setLiveMode] = useState(true);

  // 4 Curated benchmark customer archetypes spanning the full 0% - 100% spectrum
  const defaultPresets = {
    extremeHighRisk: {
      label: '1. High Risk Churner (Month-to-month, High Bill, No Support)',
      badge: 'High Risk (~85-98%)',
      badgeColor: 'border-rose-500/50 bg-rose-500/20 text-rose-200',
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
      label: '2. Loyal Low Risk Customer (2-Year Contract, 6+ Years, Tech Support)',
      badge: 'Loyal (~5-15%)',
      badgeColor: 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200',
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
      label: '3. Moderate / Medium Risk (1-Year Contract, 24 Mos Tenure)',
      badge: 'Moderate (~35-50%)',
      badgeColor: 'border-amber-500/50 bg-amber-500/20 text-amber-200',
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
      label: '4. Budget Customer (Phone Only, Two-Year Contract)',
      badge: 'Low Risk (~8-20%)',
      badgeColor: 'border-blue-500/50 bg-blue-500/20 text-blue-200',
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

  const fetchModelMetaAndSamples = async () => {
    setLoading(true);
    setError('');
    try {
      const [meta, ds] = await Promise.all([
        modelService.getActiveModel(),
        datasetService.getActiveDataset().catch(() => null)
      ]);
      setActiveModelMeta(meta);
      setActiveDataset(ds);

      // Load 6 diverse customer records from dataset preview
      if (ds?.id) {
        try {
          const previewData = await datasetService.getDatasetPreview(ds.id, 20);
          if (previewData?.rows?.length) {
            setSampleCustomers(previewData.rows.slice(0, 6));
          }
        } catch (e) {
          console.warn('Could not fetch dataset preview rows:', e);
        }
      }

      // Initialize form fields with extreme high risk preset as initial demo
      const initial = { ...defaultPresets.extremeHighRisk.data };
      setFormData(initial);
      setAutofillSource(defaultPresets.extremeHighRisk.label);
      setCustomerIdentifier(`CUST-${Math.floor(1000 + Math.random() * 9000)}`);
      
      // Auto run prediction on mount
      if (meta?.model_id) {
        predictionService.predictSingle(initial, meta.model_id, 'CUST-DEMO-001')
          .then((res) => setPredictionResult(res))
          .catch(() => {});
      }
    } catch (err) {
      setError('Please train a machine learning model before generating customer predictions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelMetaAndSamples();
  }, []);

  const executePredict = async (dataToPredict) => {
    if (!activeModelMeta) return;
    setPredicting(true);
    setError('');
    try {
      const res = await predictionService.predictSingle(
        dataToPredict,
        activeModelMeta.model_id,
        customerIdentifier || 'CUST-LIVE'
      );
      setPredictionResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed.');
    } finally {
      setPredicting(false);
    }
  };

  // Debounced live prediction when sliders change
  const handleFieldChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    
    // Auto-calculate TotalCharges when tenure or MonthlyCharges changes
    if (field === 'tenure' || field === 'MonthlyCharges') {
      const t = parseFloat(field === 'tenure' ? value : updated.tenure) || 1;
      const m = parseFloat(field === 'MonthlyCharges' ? value : updated.MonthlyCharges) || 50;
      updated.TotalCharges = roundToTwo(m * t);
    }
    
    setFormData(updated);
    setAutofillSource('Custom Live Adjusted');

    if (liveMode && activeModelMeta?.model_id) {
      executePredict(updated);
    }
  };

  const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

  const handleApplyPreset = (presetKey) => {
    const preset = defaultPresets[presetKey];
    if (!preset) return;

    const newForm = { ...formData, ...preset.data };
    setFormData(newForm);
    setAutofillSource(preset.label);
    setCustomerIdentifier(`CUST-${presetKey.toUpperCase().slice(0, 5)}-${Math.floor(100 + Math.random() * 900)}`);
    executePredict(newForm);
  };

  const handleLoadSampleRow = (row, idx) => {
    const newForm = { ...formData };
    activeModelMeta?.feature_columns?.forEach((col) => {
      if (col in row && row[col] !== '') {
        newForm[col] = row[col];
      }
    });
    setFormData(newForm);
    setAutofillSource(`Real Dataset Record #${idx + 1} (Ground Truth: ${row[activeDataset?.target_column || 'Churn'] || 'Unknown'})`);
    setCustomerIdentifier(row.customerID || `CUST-ROW-${idx + 1}`);
    executePredict(newForm);
  };

  const handleRandomFromDataset = async (churnType = null) => {
    if (!activeDataset) return;
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
        ? `Real Churned Customer from CSV (Actual Churn: ${res.actual_target || 'Yes'})`
        : churnType === 'loyal'
        ? `Real Loyal Customer from CSV (Actual Churn: ${res.actual_target || 'No'})`
        : 'Random Sample from Dataset';
      setAutofillSource(label);
      setCustomerIdentifier(sample.customerID || `CUST-DS-${Math.floor(1000 + Math.random() * 9000)}`);
      executePredict(newForm);
    } catch (err) {
      setError('Failed to fetch sample from dataset.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !activeModelMeta) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading Real-Time Prediction Engine...</p>
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white font-heading flex items-center gap-2.5">
            <span>Customer Churn Predictor & Real-Time Simulator</span>
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              <Activity className="h-3 w-3 animate-pulse" /> Live Real-Time
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Active Classifier: <strong className="text-emerald-400">{activeModelMeta?.algorithm_name}</strong> (F1-Score: {activeModelMeta?.f1_score}%, ROC-AUC: {activeModelMeta?.roc_auc}%)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleApplyPreset('extremeHighRisk')}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition"
          >
            <TrendingUp className="h-3.5 w-3.5" /> High Risk (~90%)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('loyalLowRisk')}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition"
          >
            <TrendingDown className="h-3.5 w-3.5" /> Loyal (~8%)
          </button>
        </div>
      </div>

      {/* 🌟 1-CLICK QUICK AUTOFILL & BENCHMARK CARDS */}
      <div className="rounded-2xl border-2 border-indigo-500/50 bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-blue-950/80 p-5 backdrop-blur-2xl space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-500/30 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 font-bold">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ⚡ 1-Click Quick Autofill Profiles & Real Dataset Records
              </h3>
              <p className="text-[11px] text-indigo-200">
                Click any profile to immediately see how the probability gauge responds!
              </p>
            </div>
          </div>
          {autofillSource && (
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full truncate max-w-md">
              ✓ {autofillSource}
            </span>
          )}
        </div>

        {/* 5 Prominent Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => handleApplyPreset('extremeHighRisk')}
            className="flex flex-col items-start p-3 rounded-xl border-2 border-rose-500/50 bg-rose-500/20 hover:bg-rose-500/35 hover:scale-[1.02] transition duration-200 text-left shadow-lg"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-extrabold text-rose-300 uppercase flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> High Risk Churner
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-200">
                ~90% Churn
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">Month-to-month, $110/mo, 1 Mo Tenure</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('loyalLowRisk')}
            className="flex flex-col items-start p-3 rounded-xl border-2 border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/35 hover:scale-[1.02] transition duration-200 text-left shadow-lg"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-extrabold text-emerald-300 uppercase flex items-center gap-1">
                <TrendingDown className="h-3.5 w-3.5" /> Loyal Customer
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-200">
                ~8% Churn
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">2-Year Contract, 70 Mos, Full Support</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('moderateRisk')}
            className="flex flex-col items-start p-3 rounded-xl border-2 border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/35 hover:scale-[1.02] transition duration-200 text-left shadow-lg"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-extrabold text-amber-300 uppercase flex items-center gap-1">
                <Sliders className="h-3.5 w-3.5" /> Moderate Risk
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-200">
                ~40% Churn
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">1-Year Contract, 24 Mos, $75/mo</p>
          </button>

          <button
            type="button"
            onClick={() => handleRandomFromDataset('churn')}
            className="flex flex-col items-start p-3 rounded-xl border-2 border-indigo-500/50 bg-indigo-500/20 hover:bg-indigo-500/35 hover:scale-[1.02] transition duration-200 text-left shadow-lg"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-extrabold text-indigo-300 uppercase flex items-center gap-1">
                <Shuffle className="h-3.5 w-3.5" /> Real Churner
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200">
                From CSV
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">Random Actual Churned Row</p>
          </button>

          <button
            type="button"
            onClick={() => handleRandomFromDataset('loyal')}
            className="flex flex-col items-start p-3 rounded-xl border-2 border-blue-500/50 bg-blue-500/20 hover:bg-blue-500/35 hover:scale-[1.02] transition duration-200 text-left shadow-lg"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-extrabold text-blue-300 uppercase flex items-center gap-1">
                <Shuffle className="h-3.5 w-3.5" /> Real Retained
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200">
                From CSV
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">Random Actual Retained Row</p>
          </button>
        </div>

        {/* Real Dataset Sample Table Picker (If dataset rows available) */}
        {sampleCustomers.length > 0 && (
          <div className="pt-2 border-t border-indigo-500/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 mb-2 block">
              Or Click a Specific Real Customer from Active Dataset:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {sampleCustomers.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleLoadSampleRow(c, i)}
                  className="flex flex-col p-2 rounded-lg border border-slate-700 bg-slate-950/70 hover:border-blue-400 hover:bg-slate-900 transition text-left"
                >
                  <span className="text-[11px] font-bold text-white truncate">{c.customerID || `Cust #${i + 1}`}</span>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>{c.Contract?.slice(0, 8)}</span>
                    <span className={c.Churn === 'Yes' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {c.Churn || 'No'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Form + Live Result Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Customer Input Form & Real-Time Sliders (Left 7 Cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Real-time Interactive Sliders Box */}
          <div className="rounded-2xl border border-blue-500/40 bg-slate-900/80 p-6 backdrop-blur-xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Live Real-Time Risk Driver Sliders</h3>
              </div>
              <span className="text-[10px] text-blue-400 font-medium">Drag sliders to watch percentage shift</span>
            </div>

            {/* Slider 1: Customer Tenure */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Customer Tenure (Months):</span>
                <span className="font-bold text-white px-2.5 py-0.5 rounded-lg bg-blue-600/30 border border-blue-500/40 font-mono">
                  {formData.tenure ?? 1} Months ({Math.round(((formData.tenure ?? 1) / 12) * 10) / 10} Years)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="72"
                step="1"
                value={formData.tenure ?? 1}
                onChange={(e) => handleFieldChange('tenure', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>1 Month (High Risk)</span>
                <span>36 Months</span>
                <span>72 Months (Loyal)</span>
              </div>
            </div>

            {/* Slider 2: Monthly Charges */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Monthly Bill / Charges ($):</span>
                <span className="font-bold text-white px-2.5 py-0.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 font-mono">
                  ${parseFloat(formData.MonthlyCharges ?? 50).toFixed(2)} / month
                </span>
              </div>
              <input
                type="range"
                min="18"
                max="125"
                step="0.5"
                value={formData.MonthlyCharges ?? 50}
                onChange={(e) => handleFieldChange('MonthlyCharges', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>$18.00 (Low Bill)</span>
                <span>$70.00</span>
                <span>$125.00 (High Bill)</span>
              </div>
            </div>

            {/* Quick Toggle: Contract Type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Contract Commitment:</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                {['Month-to-month', 'One year', 'Two year'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleFieldChange('Contract', c)}
                    className={`py-2 rounded-xl border transition ${
                      formData.Contract === c
                        ? 'border-blue-500 bg-blue-600 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Toggle: Tech Support & Online Security */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Tech Support:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['No', 'Yes'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleFieldChange('TechSupport', opt)}
                      className={`py-1.5 rounded-lg border transition ${
                        formData.TechSupport === opt
                          ? opt === 'Yes' ? 'border-emerald-500 bg-emerald-600/30 text-emerald-300 font-bold' : 'border-rose-500 bg-rose-600/30 text-rose-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Online Security:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['No', 'Yes'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleFieldChange('OnlineSecurity', opt)}
                      className={`py-1.5 rounded-lg border transition ${
                        formData.OnlineSecurity === opt
                          ? opt === 'Yes' ? 'border-emerald-500 bg-emerald-600/30 text-emerald-300 font-bold' : 'border-rose-500 bg-rose-600/30 text-rose-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Customer Attribute Dropdowns */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
            <h3 className="text-sm font-bold text-white pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>All Subscribed Services & Customer Details</span>
              <span className="text-xs text-slate-400 font-normal">Calculated Total Charges: ${formData.TotalCharges || 0}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {activeModelMeta?.feature_columns
                ?.filter((c) => !['tenure', 'MonthlyCharges', 'Contract', 'TechSupport', 'OnlineSecurity', 'TotalCharges'].includes(c))
                ?.map((col) => (
                  <div key={col} className="space-y-1.5">
                    <label className="text-slate-300 capitalize font-medium">{col}</label>
                    {activeModelMeta.categorical_cols.includes(col) ? (
                      <select
                        value={formData[col] ?? ''}
                        onChange={(e) => handleFieldChange(col, e.target.value)}
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
                        onChange={(e) => handleFieldChange(col, parseFloat(e.target.value))}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
            </div>

            <button
              type="button"
              onClick={() => executePredict(formData)}
              disabled={predicting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xl hover:from-blue-500 hover:to-purple-500 transition mt-4"
            >
              {predicting ? (
                <span>Recalculating...</span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Re-evaluate Churn Probability</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Prediction Results & Explanation Card (Right 5 Cols) */}
        <div className="space-y-6 lg:col-span-5">
          {predictionResult ? (
            <div className="sticky top-24 rounded-2xl border-2 border-slate-700 bg-slate-900/90 p-6 backdrop-blur-2xl space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">Live Prediction Output</h3>
                  <p className="text-[11px] text-slate-400">ID: {predictionResult.customer_identifier}</p>
                </div>
                <StatusBadge status={predictionResult.risk_level} size="lg" />
              </div>

              {/* Radial Probability Meter */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-4">
                <RiskGauge probability={predictionResult.churn_probability} size={210} />

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-center">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30">
                    <span className="text-[10px] uppercase font-bold text-rose-400">Churn Probability</span>
                    <p className="text-2xl font-extrabold text-white">{predictionResult.churn_probability}%</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Retention Probability</span>
                    <p className="text-2xl font-extrabold text-white">{predictionResult.retention_probability}%</p>
                  </div>
                </div>
              </div>

              {/* Explainable AI: Why is this customer at risk? */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Explainable AI Risk Factors
                  </h4>
                </div>

                <div className="space-y-2">
                  {predictionResult.top_factors?.map((factor, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white">{factor.feature}</span>
                        <p className="text-[11px] text-slate-400">Value: <strong className="text-slate-200">{String(factor.value)}</strong></p>
                      </div>
                      <span className={`text-[11px] font-semibold text-right shrink-0 ${
                        factor.impact.includes('Increases') ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {factor.impact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <button
                type="button"
                onClick={() => window.print()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                <Printer className="h-4 w-4" />
                <span>Print Customer Risk Report (PDF)</span>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center flex flex-col items-center justify-center">
              <Sparkles className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
              <h4 className="text-sm font-bold text-white mb-1">Awaiting Customer Profile</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Click any profile above to calculate real-time ML churn probabilities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
