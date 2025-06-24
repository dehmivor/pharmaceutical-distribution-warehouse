// client/src/hooks/useThingsBoard.js
import useSWR from 'swr';
import { useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Fetcher function sử dụng fetch
const fetcher = async (url) => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('auth-token') || ''}`
    }
  });

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await response.json().catch(() => ({ message: 'Unknown error' }));
    error.status = response.status;
    throw error;
  }

  return response.json();
};

// Device hooks
export const useThingsBoardDevices = (pageSize = 10, page = 0, textSearch = '') => {
  const { data, error, isLoading, mutate } = useSWR(
    `/thingsboard/devices?pageSize=${pageSize}&page=${page}&textSearch=${textSearch}`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  return {
    devices: data?.data?.data || [],
    totalElements: data?.data?.totalElements || 0,
    hasNext: data?.data?.hasNext || false,
    isLoading,
    isError: error,
    refresh: mutate
  };
};

export const useThingsBoardDevice = (deviceId) => {
  const { data, error, isLoading, mutate } = useSWR(deviceId ? `/thingsboard/devices/${deviceId}` : null, fetcher, {
    revalidateOnFocus: true
  });

  return {
    device: data?.data,
    isLoading,
    isError: error,
    refresh: mutate
  };
};

// Telemetry hooks
export const useDeviceTelemetry = (deviceId, keys, timeRange = 24) => {
  const endTs = Date.now();
  const startTs = endTs - timeRange * 60 * 60 * 1000;

  const { data, error, isLoading, mutate } = useSWR(
    deviceId && keys.length > 0
      ? `/thingsboard/telemetry/DEVICE/${deviceId}/timeseries?keys=${keys.join(',')}&startTs=${startTs}&endTs=${endTs}`
      : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      errorRetryCount: 2
    }
  );

  return {
    telemetryData: data?.data || {},
    isLoading,
    isError: error,
    refresh: mutate
  };
};

export const useLatestTelemetry = (deviceId, keys) => {
  const { data, error, isLoading, mutate } = useSWR(
    deviceId && keys.length > 0 ? `/thingsboard/telemetry/DEVICE/${deviceId}/latest?keys=${keys.join(',')}` : null,
    fetcher,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      dedupingInterval: 2000
    }
  );

  return {
    latestData: data?.data || {},
    isLoading,
    isError: error,
    refresh: mutate
  };
};

export const useDeviceAttributes = (deviceId, keys) => {
  const { data, error, isLoading, mutate } = useSWR(
    deviceId && keys.length > 0 ? `/thingsboard/telemetry/DEVICE/${deviceId}/attributes?keys=${keys.join(',')}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000
    }
  );

  return {
    attributes: data?.data || {},
    isLoading,
    isError: error,
    refresh: mutate
  };
};

// Dashboard hooks
export const useThingsBoardDashboards = (pageSize = 10, page = 0, textSearch = '') => {
  const { data, error, isLoading, mutate } = useSWR(
    `/thingsboard/dashboards?pageSize=${pageSize}&page=${page}&textSearch=${textSearch}`,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false
    }
  );

  return {
    dashboards: data?.data?.data || [],
    totalElements: data?.data?.totalElements || 0,
    isLoading,
    isError: error,
    refresh: mutate
  };
};

export const useThingsBoardDashboard = (dashboardId) => {
  const { data, error, isLoading, mutate } = useSWR(dashboardId ? `/thingsboard/dashboards/${dashboardId}` : null, fetcher, {
    revalidateOnFocus: true
  });

  return {
    dashboard: data?.data,
    isLoading,
    isError: error,
    refresh: mutate
  };
};

// Asset hooks
export const useThingsBoardAssets = (pageSize = 10, page = 0, textSearch = '') => {
  const { data, error, isLoading, mutate } = useSWR(
    `/thingsboard/assets?pageSize=${pageSize}&page=${page}&textSearch=${textSearch}`,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: false
    }
  );

  return {
    assets: data?.data?.data || [],
    totalElements: data?.data?.totalElements || 0,
    isLoading,
    isError: error,
    refresh: mutate
  };
};

// Customer hooks
export const useThingsBoardCustomers = (pageSize = 10, page = 0, textSearch = '') => {
  const { data, error, isLoading, mutate } = useSWR(
    `/thingsboard/customers?pageSize=${pageSize}&page=${page}&textSearch=${textSearch}`,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: false
    }
  );

  return {
    customers: data?.data?.data || [],
    totalElements: data?.data?.totalElements || 0,
    isLoading,
    isError: error,
    refresh: mutate
  };
};

// Warehouse specific hooks
export const useWarehouseConditions = () => {
  const { data, error, isLoading, mutate } = useSWR('/thingsboard/warehouse/conditions', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true
  });

  return {
    conditions: data?.data || {},
    isLoading,
    isError: error,
    refresh: mutate
  };
};

export const useWarehouseAlerts = () => {
  const { data, error, isLoading, mutate } = useSWR('/thingsboard/warehouse/alerts', fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: true
  });

  return {
    alerts: data?.data || [],
    isLoading,
    isError: error,
    refresh: mutate
  };
};

// Mutation hooks sử dụng fetch
export const useThingsBoardMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth-token') || ''}`,
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createDevice = async (deviceData) => {
    return makeRequest('/thingsboard/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData)
    });
  };

  const updateDevice = async (deviceId, deviceData) => {
    return makeRequest(`/thingsboard/devices/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(deviceData)
    });
  };

  const deleteDevice = async (deviceId) => {
    return makeRequest(`/thingsboard/devices/${deviceId}`, {
      method: 'DELETE'
    });
  };

  const sendTelemetry = async (deviceId, telemetryData) => {
    return makeRequest(`/thingsboard/telemetry/devices/${deviceId}`, {
      method: 'POST',
      body: JSON.stringify(telemetryData)
    });
  };

  const saveAttributes = async (entityType, entityId, attributes) => {
    return makeRequest(`/thingsboard/telemetry/${entityType}/${entityId}/attributes`, {
      method: 'POST',
      body: JSON.stringify(attributes)
    });
  };

  const sendRpcCommand = async (deviceId, rpcData) => {
    return makeRequest(`/thingsboard/devices/${deviceId}/rpc`, {
      method: 'POST',
      body: JSON.stringify(rpcData)
    });
  };

  const createAsset = async (assetData) => {
    return makeRequest('/thingsboard/assets', {
      method: 'POST',
      body: JSON.stringify(assetData)
    });
  };

  const createCustomer = async (customerData) => {
    return makeRequest('/thingsboard/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  };

  const createDashboard = async (dashboardData) => {
    return makeRequest('/thingsboard/dashboards', {
      method: 'POST',
      body: JSON.stringify(dashboardData)
    });
  };

  return {
    createDevice,
    updateDevice,
    deleteDevice,
    sendTelemetry,
    saveAttributes,
    sendRpcCommand,
    createAsset,
    createCustomer,
    createDashboard,
    loading,
    error
  };
};

// Real-time polling hook (alternative to WebSocket)
export const useRealTimeTelemetry = (deviceId, keys, interval = 5000) => {
  const { data, error, isLoading } = useSWR(
    deviceId && keys.length > 0 ? `/thingsboard/telemetry/DEVICE/${deviceId}/latest?keys=${keys.join(',')}&realtime=true` : null,
    fetcher,
    {
      refreshInterval: interval,
      revalidateOnFocus: true,
      dedupingInterval: 1000
    }
  );

  return {
    realTimeData: data?.data || {},
    isConnected: !error && !isLoading,
    isLoading,
    isError: error
  };
};

// Health check hook
export const useThingsBoardHealth = () => {
  const { data, error, isLoading } = useSWR('/thingsboard/health', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
    errorRetryCount: 3
  });

  return {
    health: data?.data,
    isHealthy: data?.success && !error,
    isLoading,
    isError: error
  };
};

// Custom hook for conditional SWR
export const useConditionalSWR = (condition, key, options = {}) => {
  const { data, error, isLoading, mutate } = useSWR(condition ? key : null, fetcher, {
    revalidateOnFocus: true,
    ...options
  });

  return {
    data,
    error,
    isLoading,
    refresh: mutate
  };
};
