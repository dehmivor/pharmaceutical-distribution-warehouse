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
  const { page = 1, limit = 10, search, ...filters } = queryParams;

  // State management
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchParams, setLastFetchParams] = useState(null);

  // Ref để track abort controller
  const abortControllerRef = useRef(null);

  // Process filters
  const processedFilters = { ...filters };
  if (filters.status && typeof filters.status === 'string' && filters.status.includes(',')) {
    processedFilters.status = filters.status;
  }

  if (search) {
    processedFilters.search = search;
  }

  // Build query params
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...processedFilters
  }).toString();

  const url = `/?${params}`;

  // Fetch function
  const fetchData = useCallback(
    async (fetchUrl, force = false) => {
      // Prevent duplicate requests
      if (!force && lastFetchParams === fetchUrl && data && !error) {
        console.log('🔄 Using cached data for:', fetchUrl);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Cancel previous request if exists
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        console.log('🚀 Fetching data for:', fetchUrl);

        const result = await fetcher(fetchUrl, abortControllerRef.current.signal);

        setData(result);
        setLastFetchParams(fetchUrl);
        setError(null);

        console.log('✅ Fetch Success:', result);
      } catch (err) {
        if (err.message !== 'Request cancelled') {
          setError(err);
          console.error('❌ Fetch Error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [lastFetchParams, data, error]
  );

  // Manual refresh function (equivalent to SWR's mutate)
  const mutate = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await fetchData(url, true); // Force refresh
  }, [fetchData, url]);

  // Effect to fetch data when params change
  useEffect(() => {
    fetchData(url);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    importOrders: data?.data || [],
    pagination: data?.pagination || {
      current_page: page,
      total_pages: 1,
      total_items: 0,
      items_per_page: limit,
      has_next: false,
      has_prev: false
    },
    isLoading,
    error,
    mutate,
    success: data?.success || false,
    // Additional utilities
    refetch: mutate, // Alias for mutate
    isIdle: !isLoading && !error && !data, // When no request has been made
    isSuccess: !isLoading && !error && !!data, // Successful state
    isError: !!error // Error state
  };
};

export default useImportOrders;
