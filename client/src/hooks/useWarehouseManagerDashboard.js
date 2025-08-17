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

const useWarehouseManagerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentImportOrders: [],
    recentExportOrders: [],
    lowStockMedicines: [],
    chartData: null,
    detailedStats: {},
    topMedicines: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all dashboard data from APIs
      const [dashboardResponse, chartResponse, detailedStatsResponse, topMedicinesResponse, alertsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/dashboard/warehouse-manager`, {
          headers: getAuthHeaders()
        }),
        axios.get(`${API_BASE_URL}/api/dashboard/warehouse-manager/chart`, {
          headers: getAuthHeaders()
        }),
        axios.get(`${API_BASE_URL}/api/dashboard/warehouse-manager/stats`, {
          headers: getAuthHeaders()
        }),
        axios.get(`${API_BASE_URL}/api/dashboard/warehouse-manager/top-medicines`, {
          headers: getAuthHeaders()
        }),
        axios.get(`${API_BASE_URL}/api/dashboard/warehouse-manager/alerts`, {
          headers: getAuthHeaders()
        })
      ]);

      if (dashboardResponse.data.success && chartResponse.data.success) {
        setDashboardData({
          ...dashboardResponse.data.data,
          chartData: chartResponse.data.data,
          detailedStats: detailedStatsResponse.data.success ? detailedStatsResponse.data.data : {},
          topMedicines: topMedicinesResponse.data.success ? topMedicinesResponse.data.data : [],
          alerts: alertsResponse.data.success ? alertsResponse.data.data : []
        });
        setLastUpdated(new Date());
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.response?.data?.error || 'Failed to load dashboard data');
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
      console.error('Error refreshing dashboard:', error);
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

export default useWarehouseManagerDashboard;
