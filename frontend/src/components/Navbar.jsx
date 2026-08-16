import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, User, Sparkles, Database, CheckCircle2 } from 'lucide-react';

export const Navbar = ({ activeTab, isCollapsed, setIsCollapsed, activeDataset, activeModel }) => {
  const { user, logout } = useAuth();

  const tabTitles = {
    dashboard: 'System Overview & Churn Analytics',
    upload: 'Dataset Upload & Validation Suite',
    analysis: 'Exploratory Data Analysis (EDA)',
    training: 'Machine Learning Training Studio',
    comparison: 'Algorithm Comparison & Evaluation',
    predict: 'Customer Churn Predictor & XAI',
    batch: 'Batch Customer Churn Inference',
    history: 'Prediction History & Audit Logs',
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 backdrop-blur-md">
      {/* Left section: Toggle & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          title="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white font-heading">
            {tabTitles[activeTab] || 'Customer Churn System'}
          </h1>
        </div>
      </div>

      {/* Right section: System Status & User Profile */}
      <div className="flex items-center gap-4">
        {/* Active Dataset Badge */}
        {activeDataset && (
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
            <Database className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-medium truncate max-w-[140px]">{activeDataset.filename}</span>
            <span className="rounded-full bg-blue-500/20 px-1.5 py-0.2 text-[10px]">{activeDataset.rows_count} rows</span>
          </div>
        )}

        {/* Active Model Badge */}
        {activeModel && (
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium">Model: {activeModel.algorithm_name}</span>
            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px]">{activeModel.accuracy || activeModel.f1_score}%</span>
          </div>
        )}

        {/* User Card & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-white leading-none">{user?.name || 'Student'}</p>
              <p className="text-[10px] text-slate-400 leading-none mt-1">{user?.email || 'user@example.com'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400 transition duration-150"
            title="Log Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
