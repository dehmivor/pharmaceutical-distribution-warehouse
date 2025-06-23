import useSWR from 'swr';
import { useState, useCallback } from 'react';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ✅ Enhanced JWT validation
const isValidJWT = (token) => {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  // Check if each part is not empty and has valid base64 characters
  return parts.every((part) => {
    if (!part || part.length === 0) return false;
    // Basic base64 character check
    return /^[A-Za-z0-9_-]+$/.test(part);
  });
};

// ✅ Enhanced fetcher with comprehensive error handling
const fetcher = async (url) => {
  console.log('🚀 Fetcher called with URL:', url);

  try {
    // Token validation
    const token = localStorage.getItem('auth-token');

    if (!token) {
      console.error('❌ No token found');
      const error = new Error('No authentication token found');
      error.status = 401;
      error.code = 'NO_TOKEN';
      throw error;
    }

    if (!isValidJWT(token)) {
      console.error('❌ Invalid token format:', {
        tokenExists: !!token,
        tokenLength: token.length,
        tokenParts: token.split('.').length,
        tokenPreview: token.substring(0, 20) + '...'
      });

      localStorage.removeItem('auth-token');
      const error = new Error('Invalid token format');
      error.status = 401;
      error.code = 'INVALID_TOKEN';
      throw error;
    }

    console.log('✅ Valid token found, making request...');

    // Enhanced fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('📡 Response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });

    // Enhanced error handling
    if (!response.ok) {
      let errorData = null;

      try {
        errorData = await response.json();
        console.error('❌ Error response data:', errorData);
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }

      // Handle specific status codes
      if (response.status === 401) {
        console.warn('🔐 Unauthorized - removing token');
        localStorage.removeItem('auth-token');
        const error = new Error(errorData.message || 'Unauthorized access');
        error.status = 401;
        error.code = 'UNAUTHORIZED';
        throw error;
      }

      if (response.status === 403) {
        console.warn('🚫 Forbidden access');
        const error = new Error(errorData.message || 'Access denied');
        error.status = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }

      if (response.status === 404) {
        console.warn('🔍 Endpoint not found');
        const error = new Error(errorData.message || 'API endpoint not found');
        error.status = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      if (response.status >= 500) {
        const error = new Error(errorData.message || `Server error: ${response.status}`);
        error.status = response.status;
        error.code = 'SERVER_ERROR';
        error.details = errorData;
        throw error;
      }

      // Generic client error
      const error = new Error(errorData.message || `HTTP error: ${response.status}`);
      error.status = response.status;
      error.code = 'HTTP_ERROR';
      error.details = errorData;
      throw error;
    }

    // Parse response data
    let data;
    try {
      data = await response.json();
      console.log('📋 Response data structure:', {
        hasSuccess: 'success' in data,
        hasData: 'data' in data,
        dataType: typeof data.data,
        isArray: Array.isArray(data.data)
      });
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      const error = new Error('Invalid JSON response from server');
      error.status = 500;
      error.code = 'PARSE_ERROR';
      throw error;
    }

    // Handle different response structures
    if (data.success === false) {
      console.error('❌ API returned success: false:', data);
      const error = new Error(data.message || 'API request failed');
      error.status = 400;
      error.code = 'API_ERROR';
      error.details = data;
      throw error;
    }

    // Extract users data with multiple fallback strategies
    let users = [];

    if (data.success && data.data) {
      users = Array.isArray(data.data) ? data.data : [data.data];
    } else if (Array.isArray(data)) {
      users = data;
    } else if (data.users && Array.isArray(data.users)) {
      users = data.users;
    } else if (data.data && typeof data.data === 'object') {
      users = Object.values(data.data);
    } else {
      console.warn('⚠️ Unexpected data structure, using empty array');
      users = [];
    }

    console.log(`✅ Successfully fetched ${users.length} users`);
    return users;
  } catch (error) {
    // Enhanced error logging
    console.error('💥 Fetcher error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
      stack: error.stack,
      details: error.details
    });

    // Handle network errors
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Request timeout');
      timeoutError.status = 408;
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Network connection failed');
      networkError.status = 0;
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    }

    // Re-throw with original error
    throw error;
  }
};

// ✅ Enhanced useUsers hook
const useUsers = () => {
  const [retryCount, setRetryCount] = useState(0);

  // Check token availability
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  const shouldFetch = token && isValidJWT(token);

  console.log('🔍 useUsers state:', {
    tokenExists: !!token,
    tokenValid: shouldFetch,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
    backendUrl
  });

  const {
    data: users,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR(
    shouldFetch ? `${backendUrl}/api/accounts` : null, // Updated endpoint
    fetcher,
    {
      // Enhanced SWR configuration
      refreshInterval: 0, // Disable auto refresh for debugging
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      fallbackData: [],

      // Custom retry logic
      shouldRetryOnError: (error) => {
        console.log('🤔 Checking if should retry:', {
          errorStatus: error.status,
          errorCode: error.code,
          retryCount
        });

        // Don't retry auth errors
        if (error.status === 401 || error.status === 403) {
          return false;
        }

        // Don't retry client errors (except timeout)
        if (error.status >= 400 && error.status < 500 && error.status !== 408) {
          return false;
        }

        // Don't retry if max attempts reached
        if (retryCount >= 3) {
          return false;
        }

        return true;
      },

      errorRetryCount: 3,
      errorRetryInterval: (error) => {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        console.log(`⏱️ Retry in ${delay}ms (attempt ${retryCount + 1})`);
        return delay;
      },

      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        setRetryCount(retryCount);
      },

      onError: (error, key) => {
        console.error('🔥 SWR Error Handler:', {
          error: {
            message: error.message,
            status: error.status,
            code: error.code
          },
          key,
          retryCount
        });

        // Handle auth errors
        if (error.status === 401) {
          console.log('🔐 Redirecting to login due to auth error');
          localStorage.removeItem('auth-token');
          window.location.href = '/auth/login';
        }
      },

      onSuccess: (data, key, config) => {
        console.log('✅ SWR Success:', {
          dataLength: Array.isArray(data) ? data.length : 'not array',
          key
        });
        setRetryCount(0); // Reset retry count on success
      }
    }
  );

  // Enhanced refetch function
  const refetch = useCallback(async () => {
    console.log('🔄 Manual refetch triggered');
    setRetryCount(0);
    try {
      return await mutate();
    } catch (error) {
      console.error('❌ Manual refetch failed:', error);
      throw error;
    }
  }, [mutate]);

  // Safe data processing
  const safeUsers = Array.isArray(users) ? users : [];

  console.log('📊 useUsers result:', {
    usersCount: safeUsers.length,
    isLoading,
    hasError: !!error,
    errorMessage: error?.message,
    hasValidToken: shouldFetch,
    retryCount
  });

  return {
    users: safeUsers,
    loading: isLoading,
    isLoading,
    isValidating,
    error: error?.message || error,
    errorDetails: error,
    refetch,
    mutate,
    hasValidToken: shouldFetch,
    tokenExists: !!token,
    retryCount,

    // Status helpers
    isNetworkError: error?.code === 'NETWORK_ERROR',
    isServerError: error?.status >= 500,
    isAuthError: error?.status === 401 || error?.status === 403,
    isEmpty: !isLoading && !error && safeUsers.length === 0
  };
};

export default useUsers;
