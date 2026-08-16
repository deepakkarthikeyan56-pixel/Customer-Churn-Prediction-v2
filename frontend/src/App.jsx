import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { datasetService, modelService } from './services/api';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { DatasetUpload } from './pages/DatasetUpload';
import { DatasetAnalysis } from './pages/DatasetAnalysis';
import { ModelTraining } from './pages/ModelTraining';
import { ModelComparison } from './pages/ModelComparison';
import { PredictCustomer } from './pages/PredictCustomer';
import { BatchPrediction } from './pages/BatchPrediction';
import { PredictionHistory } from './pages/PredictionHistory';

export function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeDataset, setActiveDataset] = useState(null);
  const [activeModel, setActiveModel] = useState(null);

  const fetchGlobalState = async () => {
    try {
      const ds = await datasetService.getActiveDataset();
      setActiveDataset(ds);
    } catch {
      setActiveDataset(null);
    }

    try {
      const meta = await modelService.getActiveModel();
      setActiveModel(meta);
    } catch {
      setActiveModel(null);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchGlobalState();
    }
  }, [isAuthenticated, activeTab]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Initializing AI System...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <Register onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Navbar
          activeTab={activeTab}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          activeDataset={activeDataset}
          activeModel={activeModel}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <Dashboard onNavigate={setActiveTab} onRefreshGlobal={fetchGlobalState} />
          )}
          {activeTab === 'upload' && (
            <DatasetUpload
              onNavigate={setActiveTab}
              onDatasetLoaded={(ds) => {
                setActiveDataset(ds);
                fetchGlobalState();
              }}
            />
          )}
          {activeTab === 'analysis' && (
            <DatasetAnalysis onNavigate={setActiveTab} />
          )}
          {activeTab === 'training' && (
            <ModelTraining
              onNavigate={setActiveTab}
              onModelTrained={() => fetchGlobalState()}
            />
          )}
          {activeTab === 'comparison' && (
            <ModelComparison
              onNavigate={setActiveTab}
              onModelSelected={() => fetchGlobalState()}
            />
          )}
          {activeTab === 'predict' && (
            <PredictCustomer onNavigate={setActiveTab} />
          )}
          {activeTab === 'batch' && (
            <BatchPrediction onNavigate={setActiveTab} />
          )}
          {activeTab === 'history' && (
            <PredictionHistory onNavigate={setActiveTab} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
