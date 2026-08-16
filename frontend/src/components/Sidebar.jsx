import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  BarChart3,
  Cpu,
  Layers,
  UserCheck,
  FileSpreadsheet,
  History,
  Sparkles,
  Database
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Overview' },
    { id: 'upload', label: 'Dataset Upload', icon: UploadCloud, category: 'Data Management' },
    { id: 'analysis', label: 'Data Analytics & EDA', icon: BarChart3, category: 'Data Management' },
    { id: 'training', label: 'Model Training', icon: Cpu, category: 'Machine Learning' },
    { id: 'comparison', label: 'Model Comparison', icon: Layers, category: 'Machine Learning' },
    { id: 'predict', label: 'Predict Churn', icon: UserCheck, category: 'Inference & AI' },
    { id: 'batch', label: 'Batch Prediction', icon: FileSpreadsheet, category: 'Inference & AI' },
    { id: 'history', label: 'Prediction History', icon: History, category: 'Inference & AI' },
  ];

  const categories = ['Overview', 'Data Management', 'Machine Learning', 'Inference & AI'];

  return (
    <aside className={`fixed left-0 top-0 z-40 h-screen border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/80 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20">
          <Sparkles className="h-5 w-5 text-white animate-pulse-subtle" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-base font-bold tracking-tight text-white font-heading">
              Churn<span className="text-blue-400">AI</span> Studio
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              AI & Data Science System
            </span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col justify-between h-[calc(100vh-4rem)] p-3 overflow-y-auto">
        <div className="space-y-6">
          {categories.map((cat) => {
            const items = navItems.filter((i) => i.category === cat);
            return (
              <div key={cat} className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    {cat}
                  </p>
                )}
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        title={isCollapsed ? item.label : undefined}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                        }`}
                      >
                        <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* System Info Footnote */}
        {!isCollapsed && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 text-slate-300 font-medium mb-1">
              <Database className="h-3.5 w-3.5 text-blue-400" />
              <span>Full-Stack AI Engine</span>
            </div>
            <p className="text-[11px] text-slate-400">FastAPI + Scikit-Learn + React + MySQL ORM</p>
          </div>
        )}
      </div>
    </aside>
  );
};
