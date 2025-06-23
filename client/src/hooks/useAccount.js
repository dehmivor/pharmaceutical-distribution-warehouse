import useSWR from 'swr';
import { useState, useCallback } from 'react';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ✅ Utility function để validate JWT token
const isValidJWT = (token) => {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  return parts.every((part) => part && part.length > 0);
};

// ✅ Fetcher function cho SWR
const fetcher = async (url) => {
  const token = localStorage.getItem('auth-token');

  if (!token) {
    throw new Error('No authentication token found - please login');
  }

  if (!isValidJWT(token)) {
    console.error('❌ Invalid token format detected');
    localStorage.removeItem('auth-token');
    throw new Error('Invalid token format - please login again');
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth-token');
      throw new Error('Unauthorized: Please login again');
    }
    if (response.status === 403) {
      throw new Error('Access denied: Insufficient permissions');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

// ✅ API helper function
const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('auth-token');

  if (!token || !isValidJWT(token)) {
    throw new Error('Invalid or missing authentication token');
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const response = await fetch(`${backendUrl}${url}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth-token');
      throw new Error('Unauthorized: Please login again');
    }
    if (response.status === 403) {
      throw new Error('Access denied: Insufficient permissions');
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

const useAccount = (filters = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  const shouldFetch = token && isValidJWT(token);

  // ✅ Build query string từ filters
  const buildQueryString = useCallback((params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    return searchParams.toString();
  }, []);

  const queryString = buildQueryString(filters);
  const accountsUrl = queryString ? `/api/accounts?${queryString}` : '/api/accounts';

  // ✅ Fetch danh sách accounts với SWR
  const {
    data: accountsData,
    error: fetchError,
    isLoading: isFetching,
    mutate: refetchAccounts
  } = useSWR(shouldFetch ? `${backendUrl}${accountsUrl}` : null, fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    fallbackData: { success: false, data: [], pagination: {} },
    errorRetryCount: 2,
    errorRetryInterval: 2000,
    onError: (error) => {
      console.error('SWR Error:', error.message);
      if (error.message.includes('login')) {
        window.location.href = '/auth/login';
      }
    }
  });

  // ✅ Fetch statistics với SWR
  const {
    data: statisticsData,
    error: statsError,
    mutate: refetchStatistics
  } = useSWR(shouldFetch ? `${backendUrl}/api/accounts/statistics` : null, fetcher, {
    refreshInterval: 60000, // Refresh mỗi phút
    revalidateOnFocus: false,
    fallbackData: { success: false, data: {} }
  });

  // ✅ 1. Cấp tài khoản đơn lẻ
  const provisionAccount = useCallback(
    async (accountData) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest('/api/accounts', {
          method: 'POST',
          body: JSON.stringify(accountData)
        });

        if (result.success) {
          await refetchAccounts(); // Refresh danh sách
          await refetchStatistics(); // Refresh statistics
          return result;
        } else {
          throw new Error(result.message || 'Failed to provision account');
        }
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchAccounts, refetchStatistics]
  );

  // ✅ 2. Cấp tài khoản hàng loạt
  const provisionBulkAccounts = useCallback(
    async (bulkData) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest('/api/accounts/bulk', {
          method: 'POST',
          body: JSON.stringify(bulkData)
        });

        if (result.success) {
          await refetchAccounts();
          await refetchStatistics();
          return result;
        } else {
          throw new Error(result.message || 'Failed to provision bulk accounts');
        }
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchAccounts, refetchStatistics]
  );

  // ✅ 3. Cấp tài khoản PDWA
  const provisionPdwaAccount = useCallback(
    async (accountData) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest('/api/accounts/pdwa', {
          method: 'POST',
          body: JSON.stringify(accountData)
        });

        if (result.success) {
          await refetchAccounts();
          await refetchStatistics();
          return result;
        } else {
          throw new Error(result.message || 'Failed to provision PDWA account');
        }
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchAccounts, refetchStatistics]
  );

  // ✅ 4. Cập nhật quyền tài khoản
  const updateAccountPermissions = useCallback(
    async (userId, updateData) => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiRequest(`/api/accounts/${userId}/permissions`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });

        if (result.success) {
          await refetchAccounts();
          return result;
        } else {
          throw new Error(result.message || 'Failed to update account permissions');
        }
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [refetchAccounts]
  );

  // ✅ 5. Đặt lại password
  const resetAccountPassword = useCallback(async (userId, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiRequest(`/api/accounts/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify(options)
      });

      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ 6. Lấy account theo ID
  const getAccountById = useCallback(async (userId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiRequest(`/api/accounts/${userId}`);

      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to get account');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ 7. Lấy accounts theo bí danh
  const getAccountsByAlias = useCallback(
    async (alias, additionalFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = buildQueryString(additionalFilters);
        const url = queryParams ? `/api/accounts/alias/${alias}?${queryParams}` : `/api/accounts/alias/${alias}`;

        const result = await apiRequest(url);

        if (result.success) {
          return result;
        } else {
          throw new Error(result.message || 'Failed to get accounts by alias');
        }
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [buildQueryString]
  );

  // ✅ 8. Lấy accounts theo role
  const getAccountsByRole = useCallback(
    async (role, additionalFilters = {}) => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = buildQueryString(additionalFilters);
        const url = queryParams ? `/api/accounts/role/${role}?${queryParams}` : `/api/accounts/role/${role}`;

        const result = await apiRequest(url);

        if (result.success) {
          return result;
        } else {
          throw new Error(result.message || 'Failed to get accounts by role');
        }
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [buildQueryString]
  );

  // ✅ Process data
  const accounts = accountsData?.success ? accountsData.data : [];
  const pagination = accountsData?.pagination || {};
  const statistics = statisticsData?.success ? statisticsData.data : {};

  console.log(`✅ useAccount: Fetched ${accounts.length} accounts`);

  return {
    // Data
    accounts,
    pagination,
    statistics,

    // Loading states
    loading: isFetching || loading,
    error: fetchError?.message || statsError?.message || error,

    // Actions
    provisionAccount,
    provisionBulkAccounts,
    provisionPdwaAccount,
    updateAccountPermissions,
    resetAccountPassword,
    getAccountById,
    getAccountsByAlias,
    getAccountsByRole,

    // Utilities
    refetch: refetchAccounts,
    refetchStatistics,
    hasValidToken: shouldFetch,
    tokenExists: !!token
  };
};

export default useAccount;
