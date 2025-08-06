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

const useDebtDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalDebt: 0,
      overdueDebt: 0,
      paidAmount: 0,
      upcomingDebt: 0,
      weeklyChange: {
        totalDebt: 0,
        overdueDebt: 0,
        paidAmount: 0,
        upcomingDebt: 0
      }
    },
    chartData: {
      monthly: [],
      quarterly: []
    },
    analysisData: {
      monthly: [],
      quarterly: []
    },
    receivablePayable: {
      receivable: { monthly: [], quarterly: [], total: 0 },
      payable: { monthly: [], quarterly: [], total: 0 }
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all debt dashboard data from APIs
      const [overviewResponse, chartResponse, analysisResponse, receivablePayableResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/debt/overview`, {
          headers: getAuthHeaders()
        }),
        axios.get(`${API_BASE_URL}/api/dashboard/debt/chart?months=12`, {
          headers: getAuthHeaders()
        }),
        axios.get(`${API_BASE_URL}/api/dashboard/debt/analysis?period=monthly`, {
          headers: getAuthHeaders()
        }),
        axios.get(`${API_BASE_URL}/api/dashboard/debt/receivable-payable`, {
          headers: getAuthHeaders()
        })
      ]);

      if (overviewResponse.data.success && chartResponse.data.success) {
        setDashboardData({
          overview: overviewResponse.data.data,
          chartData: chartResponse.data.data,
          analysisData: analysisResponse.data.success ? analysisResponse.data.data : { monthly: [], quarterly: [] },
          receivablePayable: receivablePayableResponse.data.success
            ? receivablePayableResponse.data.data
            : {
                receivable: { monthly: [], quarterly: [], total: 0 },
                payable: { monthly: [], quarterly: [], total: 0 }
              }
        });
        setLastUpdated(new Date());
      } else {
        setError('Failed to load debt dashboard data');
      }
    } catch (error) {
      console.error('Error fetching debt dashboard data:', error);
      setError(error.response?.data?.error || 'Failed to load debt dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    try {
      setRefreshing(true);
      setError(null);
      await fetchDashboardData();
    } catch (error) {
      console.error('Error refreshing debt dashboard:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(
      () => {
        fetchDashboardData();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, []);

  return {
    dashboardData,
    loading,
    refreshing,
    error,
    lastUpdated,
    refreshDashboard
  };
};

export default useDebtDashboard;
