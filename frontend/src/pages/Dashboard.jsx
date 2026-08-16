import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  Users,
  UserX,
  UserCheck,
  Percent,
  Sparkles,
  TrendingUp,
  History,
  ArrowRight,
  Database,
  Cpu,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const CHURN_COLORS = ['#3b82f6', '#f43f5e'];
const BAR_COLORS = {
  No: '#3b82f6',
  Yes: '#f43f5e'
};

export const Dashboard = ({ onNavigate, onRefreshGlobal }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardService.getStats();
      setStats(data);
      if (onRefreshGlobal) onRefreshGlobal();
    } catch (err) {
      setError('Could not load dashboard statistics. Please upload a dataset to begin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Loading AI Dashboard Analytics...</p>
        </div>
      </div>
    );
  }

  const pieData = stats?.charts?.target_distribution?.map((item) => ({
    name: item.name === '1' || item.name.toLowerCase() === 'yes' ? 'Churned' : 'Retained',
    value: item.count,
    percentage: item.percentage
  })) || [
    { name: 'Retained', value: stats?.non_churned_customers || 1, percentage: 100 - (stats?.churn_rate || 0) },
    { name: 'Churned', value: stats?.churned_customers || 0, percentage: stats?.churn_rate || 0 }
  ];

  // Contract vs Churn data
  const contractData = stats?.charts?.breakdown_contract?.data || [];
  // Payment vs Churn data
  const paymentData = stats?.charts?.breakdown_paymentmethod?.data || [];
  // Tenure Histogram data
  const tenureData = stats?.charts?.hist_tenure?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-indigo-950/40 p-6 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              AI Analytics Engine Active
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-heading">
            Executive Churn Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time customer risk segmentation, model performance tracking, and distribution analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Stats</span>
          </button>

          <button
            onClick={() => onNavigate('predict')}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Predict Customer Churn</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => onNavigate('upload')}
            className="font-semibold underline hover:text-white ml-4 shrink-0"
          >
            Go to Dataset Upload &rarr;
          </button>
        </div>
      )}

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Customers"
          value={stats?.total_customers?.toLocaleString() || '0'}
          subtitle="Processed in Active Dataset"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Customer Churn Rate"
          value={`${stats?.churn_rate || 0}%`}
          subtitle={`${stats?.churned_customers || 0} churned records`}
          icon={Percent}
          color={stats?.churn_rate > 35 ? 'rose' : 'amber'}
        />
        <MetricCard
          title="Best ML Model"
          value={stats?.current_best_model || 'None Trained'}
          subtitle={stats?.best_model_f1 ? `F1-Score: ${stats.best_model_f1}%` : 'Train models in ML Studio'}
          icon={Cpu}
          color="emerald"
        />
        <MetricCard
          title="Predictions Logged"
          value={stats?.total_predictions || 0}
          subtitle="Total saved inference runs"
          icon={History}
          color="purple"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Donut Chart: Churn vs Retained */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-white">Churn vs Non-Churn</h3>
              <p className="text-xs text-slate-400">Customer base distribution</p>
            </div>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
              {stats?.total_customers || 0} total
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            {stats?.total_customers > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHURN_COLORS[index % CHURN_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                Upload dataset to view distribution chart
              </div>
            )}
          </div>
        </div>

        {/* Contract Type vs Churn */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl lg:col-span-2">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-white">Contract Type vs Churn</h3>
              <p className="text-xs text-slate-400">Churn impact across Month-to-month, 1-Year, and 2-Year contracts</p>
            </div>
          </div>

          <div className="h-64 w-full pt-4">
            {contractData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contractData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-300">{val === 'Yes' || val === '1' ? 'Churned' : 'Retained'}</span>}
                  />
                  <Bar dataKey="No" fill="#3b82f6" name="No" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Yes" fill="#f43f5e" name="Yes" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                Contract breakdown chart will appear when Telco churn dataset is loaded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts: Tenure & Payment Method Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Customer Tenure Distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-white">Customer Tenure Distribution (Months)</h3>
              <p className="text-xs text-slate-400">Frequency of customer tenure periods</p>
            </div>
          </div>
          <div className="h-60 w-full pt-4">
            {tenureData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tenureData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="bin" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} name="Customers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                Tenure distribution available upon dataset upload
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-white">Payment Method vs Churn</h3>
              <p className="text-xs text-slate-400">Churn rates by customer billing method</p>
            </div>
          </div>
          <div className="h-60 w-full pt-4">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={9} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Bar dataKey="No" fill="#3b82f6" name="No" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Yes" fill="#f43f5e" name="Yes" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500">
                Payment method breakdown available upon dataset upload
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Latest Predictions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-base font-bold text-white">Recent Customer Predictions</h3>
            <p className="text-xs text-slate-400">Latest single & batch inference activity</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            <span>View Full History</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {stats?.latest_predictions?.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Model</th>
                  <th className="py-3 px-4">Prediction</th>
                  <th className="py-3 px-4">Churn Probability</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {stats.latest_predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-white">{p.customer_identifier || `CUST-${p.id}`}</td>
                    <td className="py-3 px-4">{p.model_name || 'Random Forest'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.prediction} />
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{p.churn_probability}%</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={p.risk_level} />
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <History className="h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400">No predictions recorded yet.</p>
              <button
                onClick={() => onNavigate('predict')}
                className="mt-3 rounded-lg bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/30 transition"
              >
                Run First Prediction
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
