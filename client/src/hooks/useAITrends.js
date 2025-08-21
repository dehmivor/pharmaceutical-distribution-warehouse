import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const useAITrends = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API call helper
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios({
        method: options.method || 'GET',
        url: `${API_BASE_URL}/api/ai-trends${endpoint}`,
        headers: getAuthHeaders(),
        ...options
      });

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    apiCall,
    clearError: () => setError(null)
  };
};

export const useAIDemandPredictions = (months = 6) => {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching AI predictions from:', `${API_BASE_URL}/api/ai-trends/predictions?months=${months}`);
      console.log('🔑 Auth headers:', getAuthHeaders());

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/predictions?months=${months}`, { headers: getAuthHeaders() });

      console.log('📊 AI Predictions API Response:', response.data);
      console.log('📈 Predictions data:', response.data.data);

      setPredictions(response.data.data);
    } catch (err) {
      console.error('❌ AI Predictions API Error:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);

      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch predictions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  return {
    predictions,
    loading,
    error,
    refetch: fetchPredictions
  };
};

export const useAIImportRecommendations = (priority = 'all') => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = priority === 'all' ? '/recommendations' : `/recommendations/priority/${priority}`;

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends${endpoint}`, { headers: getAuthHeaders() });

      setRecommendations(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch recommendations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [priority]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations
  };
};

export const useAIMarketTrends = () => {
  const [marketTrends, setMarketTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMarketTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/market-trends`, { headers: getAuthHeaders() });

      setMarketTrends(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch market trends';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketTrends();
  }, [fetchMarketTrends]);

  return {
    marketTrends,
    loading,
    error,
    refetch: fetchMarketTrends
  };
};

export const useAIDemandAnomalies = () => {
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnomalies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/anomalies`, { headers: getAuthHeaders() });

      setAnomalies(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch anomalies';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  return {
    anomalies,
    loading,
    error,
    refetch: fetchAnomalies
  };
};

export const useAIDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/dashboard`, { headers: getAuthHeaders() });

      setDashboardData(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboard
  };
};

export const useAIQuickInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/quick-insights`, { headers: getAuthHeaders() });

      setInsights(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch quick insights';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    loading,
    error,
    refetch: fetchInsights
  };
};

export const useAIStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/statistics`, { headers: getAuthHeaders() });

      setStatistics(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch statistics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
};

// ==================== OPENAI INTEGRATION HOOKS ====================

export const useOpenAIStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/openai/status`, { headers: getAuthHeaders() });

      setStatus(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch OpenAI status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus
  };
};

export const useAIPoweredMarketTrends = () => {
  const [marketTrends, setMarketTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMarketTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/openai/market-trends`, { headers: getAuthHeaders() });

      setMarketTrends(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch AI-powered market trends';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketTrends();
  }, [fetchMarketTrends]);

  return {
    marketTrends,
    loading,
    error,
    refetch: fetchMarketTrends
  };
};

export const useAIPoweredImportRecommendations = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/openai/import-recommendations`, { headers: getAuthHeaders() });

      setRecommendations(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch AI-powered import recommendations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations
  };
};

export const useAIPoweredDemandPrediction = (medicineId, months = 6) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrediction = useCallback(async () => {
    if (!medicineId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/openai/demand-prediction/${medicineId}?months=${months}`, {
        headers: getAuthHeaders()
      });

      setPrediction(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch AI-powered demand prediction';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [medicineId, months]);

  useEffect(() => {
    fetchPrediction();
  }, [fetchPrediction]);

  return {
    prediction,
    loading,
    error,
    refetch: fetchPrediction
  };
};

export const useAIPoweredAnomalies = () => {
  const [anomalies, setAnomalies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnomalies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/ai-trends/openai/anomalies`, { headers: getAuthHeaders() });

      setAnomalies(response.data.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch AI-powered anomalies';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  return {
    anomalies,
    loading,
    error,
    refetch: fetchAnomalies
  };
};
