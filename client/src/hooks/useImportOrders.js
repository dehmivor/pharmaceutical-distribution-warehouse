'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Enhanced fetcher with better error handling
const fetcher = async (url, signal) => {
  try {
    const token = localStorage.getItem('auth-token');
    const fullUrl = `${backendUrl}/api/import-orders${url}`;

    console.log('🔍 Fetching URL:', fullUrl);
    console.log('🔑 Auth Token:', token ? 'Present' : 'Missing');

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
      signal // For cancelling requests
    });

    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

    const contentType = response.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('❌ Response Text:', responseText);

      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        throw new Error(`Server returned HTML (Status: ${response.status}). Check if API endpoint exists and is accessible.`);
      }

      try {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
    }

    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('❌ Expected JSON but got:', contentType);
      console.error('❌ Response content:', responseText);
      throw new Error(`Expected JSON response but got ${contentType}. Response: ${responseText.substring(0, 200)}...`);
    }

    const data = await response.json();
    console.log('✅ API Response Data:', data);

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('🚫 Request was cancelled');
      throw new Error('Request cancelled');
    }
    console.error('💥 Fetcher Error:', error);
    throw error;
  }
};

const useImportOrders = (queryParams = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiDebugInfo, setApiDebugInfo] = useState(null);

  const fetchOrders = async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 10,
        ...params.filters
      });

      const url = `/api/import-orders?${queryParams.toString()}`;
      const token = localStorage.getItem('auth-token');
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      setApiDebugInfo({
        url,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        timestamp: new Date().toISOString()
      });

      if (data.success) {
        setOrders(data.data || []);
      } else {
        throw new Error(data.message || 'API response unsuccessful');
      }
    } catch (error) {
      setError(error.message);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using mock data as fallback');
      }
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, error, apiDebugInfo, fetchOrders };
};

export default useImportOrders;
