import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const useWarehouseManagerChart = (months = 6) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/api/dashboard/warehouse-manager/chart?months=${months}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setChartData(response.data.data);
      } else {
        setError('Failed to load chart data');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setError(error.response?.data?.error || 'Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const refreshChart = () => {
    fetchChartData();
  };

  useEffect(() => {
    fetchChartData();
  }, [months]);

  return {
    chartData,
    loading,
    error,
    refreshChart
  };
};

export default useWarehouseManagerChart;
