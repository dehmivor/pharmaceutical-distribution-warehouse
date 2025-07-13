'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
// Setup axios default config
axios.defaults.baseURL = backendUrl;

const useImportOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiDebugInfo, setApiDebugInfo] = useState(null);

  // Fetch orders function
  const fetchOrders = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth-token');
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        ...params.filters
      });

      const url = `${backendUrl}/api/import-orders?${queryParams.toString()}`;
      console.log('📡 Fetching:', url);

      const response = await axios.get('/api/import-orders', {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...params.filters
        },
        headers,
        baseURL: backendUrl
      });

      setOrders(response.data.data || []);
      // ... rest of the logic
    } catch (error) {
      let errorMessage = 'Có lỗi xảy ra khi tải dữ liệu';

      if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = `Không thể kết nối tới server backend tại ${backendUrl}. Vui lòng kiểm tra:
        1. Server backend có đang chạy không?
        2. URL backend có đúng không?
        3. Firewall có chặn port 5000 không?`;
      }

      console.error('💥 Fetch error:', error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(
    (params) => {
      return fetchOrders(params);
    },
    [fetchOrders]
  );

  // Clear data function
  const clearOrders = useCallback(() => {
    setOrders([]);
    setError(null);
    setApiDebugInfo(null);
  }, []);

  return {
    // Data
    orders,
    loading,
    error,
    apiDebugInfo,

    // Methods
    fetchOrders,
    refreshOrders,
    clearOrders,

    // Helper getters
    hasOrders: orders.length > 0,
    isEmpty: !loading && orders.length === 0,
    hasError: !!error
  };
};

export default useImportOrders;
