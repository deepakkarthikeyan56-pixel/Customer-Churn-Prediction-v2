import axios from 'axios';

const API_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('churn_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('churn_token');
      localStorage.removeItem('churn_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    return res.data;
  },
  register: async (name, email, password) => {
    const res = await api.post('/api/auth/register', { name, email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
  }
};

// Dataset Services
export const datasetService = {
  uploadDataset: async (file, targetColumnOverride) => {
    const formData = new FormData();
    formData.append('file', file);
    if (targetColumnOverride) {
      formData.append('target_column_override', targetColumnOverride);
    }
    const res = await api.post('/api/datasets/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  loadSampleDataset: async () => {
    const res = await api.post('/api/datasets/load-sample');
    return res.data;
  },
  getDatasets: async () => {
    const res = await api.get('/api/datasets/');
    return res.data;
  },
  getActiveDataset: async () => {
    const res = await api.get('/api/datasets/active');
    return res.data;
  },
  getDatasetPreview: async (datasetId, limit = 50) => {
    const res = await api.get(`/api/datasets/${datasetId}/preview?limit=${limit}`);
    return res.data;
  },
  getRandomSample: async (datasetId, churnType = null) => {
    const url = churnType ? `/api/datasets/${datasetId}/random-sample?churn_type=${churnType}` : `/api/datasets/${datasetId}/random-sample`;
    const res = await api.get(url);
    return res.data;
  },
  configureDataset: async (datasetId, config) => {
    const res = await api.post(`/api/datasets/${datasetId}/configure`, config);
    return res.data;
  },
  getDatasetAnalysis: async (datasetId) => {
    const res = await api.get(`/api/datasets/${datasetId}/analysis`);
    return res.data;
  },
  deleteDataset: async (datasetId) => {
    const res = await api.delete(`/api/datasets/${datasetId}`);
    return res.data;
  }
};

// Model Services
export const modelService = {
  trainModels: async (datasetId, algorithms = null, testSize = 0.2, randomState = 42) => {
    const res = await api.post('/api/models/train', {
      dataset_id: datasetId,
      algorithms,
      test_size: testSize,
      random_state: randomState
    });
    return res.data;
  },
  getModelComparison: async (datasetId) => {
    const res = await api.get(`/api/models/comparison/${datasetId}`);
    return res.data;
  },
  getActiveModel: async () => {
    const res = await api.get('/api/models/active');
    return res.data;
  },
  setDefaultModel: async (modelId) => {
    const res = await api.post(`/api/models/${modelId}/set-default`);
    return res.data;
  }
};

// Prediction Services
export const predictionService = {
  predictSingle: async (features, modelId = null, customerIdentifier = null) => {
    const res = await api.post('/api/predictions/predict', {
      features,
      model_id: modelId,
      customer_identifier: customerIdentifier
    });
    return res.data;
  },
  predictBatch: async (file, modelId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (modelId) {
      formData.append('model_id', modelId);
    }
    const res = await api.post('/api/predictions/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  getHistory: async (search = '', riskLevel = '', prediction = '', limit = 100, offset = 0) => {
    let url = `/api/predictions/history?limit=${limit}&offset=${offset}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (riskLevel) url += `&risk_level=${encodeURIComponent(riskLevel)}`;
    if (prediction) url += `&prediction=${encodeURIComponent(prediction)}`;
    const res = await api.get(url);
    return res.data;
  },
  deleteRecord: async (predictionId) => {
    const res = await api.delete(`/api/predictions/history/${predictionId}`);
    return res.data;
  },
  clearAllHistory: async () => {
    const res = await api.delete('/api/predictions/history/clear-all');
    return res.data;
  },
  getExportUrl: () => `${API_BASE}/api/predictions/export-csv`
};

// Dashboard Services
export const dashboardService = {
  getStats: async () => {
    const res = await api.get('/api/dashboard/stats');
    return res.data;
  }
};

export default api;
