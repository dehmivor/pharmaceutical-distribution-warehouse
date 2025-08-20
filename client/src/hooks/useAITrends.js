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
      
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-trends/predictions?months=${months}`,
        { headers: getAuthHeaders() }
      );
      
      setPredictions(response.data.data);
    } catch (err) {
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
      
      const endpoint = priority === 'all' 
        ? '/recommendations' 
        : `/recommendations/priority/${priority}`;
      
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-trends${endpoint}`,
        { headers: getAuthHeaders() }
      );
      
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
      
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-trends/market-trends`,
        { headers: getAuthHeaders() }
      );
      
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
      
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-trends/anomalies`,
        { headers: getAuthHeaders() }
      );
      
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
      
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-trends/dashboard`,
        { headers: getAuthHeaders() }
      );
      
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
      
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-trends/quick-insights`,
        { headers: getAuthHeaders() }
      );
      
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
      
      const response = await axios.get(
        `${API_BASE_URL}/api/ai-trends/statistics`,
        { headers: getAuthHeaders() }
      );
      
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
