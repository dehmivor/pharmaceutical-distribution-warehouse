// hooks/usePurchaseOrders.js
import useSWR from 'swr';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Hàm helper để xây dựng URL đầy đủ
const buildUrl = (endpoint) => {
  // Nếu endpoint đã có protocol, trả về nguyên
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  // Nếu endpoint bắt đầu bằng /, loại bỏ nó để tránh double slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${backendUrl}/${cleanEndpoint}`;
};

// Hàm helper để lấy token
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth-token') || localStorage.getItem('auth-token');
};

// Fetcher function với error handling cải thiện
const fetcher = async (url) => {
  try {
    const fullUrl = buildUrl(url);
    const token = getAuthToken();

    console.log('Fetching:', fullUrl); // Debug log

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    // Kiểm tra status code
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorData = null;

      try {
        // Thử parse JSON error response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          // Nếu không phải JSON, lấy text
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
      }

      const error = new Error(errorMessage);
      error.status = response.status;
      error.statusText = response.statusText;
      error.data = errorData;

      console.error('API Error:', {
        url: fullUrl,
        status: response.status,
        message: errorMessage,
        data: errorData
      });

      throw error;
    }

    // Kiểm tra Content-Type cho response thành công
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('Non-JSON response:', responseText);
      throw new Error('Server did not return JSON');
    }

    const data = await response.json();
    console.log('API Response:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export function usePurchaseOrders(options = {}) {
  const { status, supplierId, page = 1, limit = 10 } = options;

  // Xây dựng query string
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && status !== 'all' && { status }),
    ...(supplierId && { supplierId })
  });

  const endpoint = `api/purchase-orders?${queryParams}`;

  const { data, error, isLoading, mutate } = useSWR(endpoint, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 30000, // Refresh mỗi 30 giây
    // Cấu hình retry
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      // Không retry cho lỗi client (4xx)
      if (error.status >= 400 && error.status < 500) {
        return;
      }

      // Chỉ retry tối đa 3 lần
      if (retryCount >= 3) return;

      // Retry với exponential backoff
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
      setTimeout(() => revalidate({ retryCount }), retryDelay);
    }
  });

  return {
    purchaseOrders: data?.data || [],
    pagination: data?.pagination || {},
    isLoading,
    isError: error,
    mutate
  };
}

// Hook để lấy chi tiết purchase order
export function usePurchaseOrder(id) {
  const endpoint = id ? `api/purchase-orders/${id}` : null;

  const { data, error, isLoading, mutate } = useSWR(endpoint, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true
  });

  return {
    purchaseOrder: data?.data || null,
    isLoading,
    isError: error,
    mutate
  };
}

// Hook để cập nhật trạng thái
export function usePurchaseOrderActions() {
  const makeRequest = async (endpoint, method, body = null) => {
    try {
      const fullUrl = buildUrl(endpoint);
      const token = getAuthToken();

      console.log(`${method} request to:`, fullUrl); // Debug log

      const response = await fetch(fullUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        ...(body && { body: JSON.stringify(body) })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData = null;

        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return response.json();
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  };

  const updateStatus = async (id, status, notes = '') => {
    return await makeRequest(`api/purchase-orders/${id}/status`, 'PATCH', {
      status,
      notes
    });
  };

  const sendForApproval = async (id) => {
    return await makeRequest(`api/purchase-orders/${id}/submit`, 'PATCH');
  };

  const approve = async (id, notes = '') => {
    return await makeRequest(`api/purchase-orders/${id}/approve`, 'PATCH', {
      notes
    });
  };

  const reject = async (id, notes = '') => {
    return await makeRequest(`api/purchase-orders/${id}/reject`, 'PATCH', {
      notes
    });
  };

  const createPurchaseOrder = async (data) => {
    return await makeRequest('api/purchase-orders', 'POST', data);
  };

  const updatePurchaseOrder = async (id, data) => {
    return await makeRequest(`api/purchase-orders/${id}`, 'PUT', data);
  };

  const deletePurchaseOrder = async (id) => {
    return await makeRequest(`api/purchase-orders/${id}`, 'DELETE');
  };

  return {
    updateStatus,
    sendForApproval,
    approve,
    reject,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder
  };
}

// Hook để search
export function useSearchPurchaseOrders() {
  const searchPurchaseOrders = async (keyword, options = {}) => {
    const queryParams = new URLSearchParams({
      page: (options.page || 1).toString(),
      limit: (options.limit || 10).toString(),
      ...(options.sortBy && { sortBy: options.sortBy }),
      ...(options.sortOrder && { sortOrder: options.sortOrder })
    });

    const fullUrl = buildUrl(`api/purchase-orders/search/${encodeURIComponent(keyword)}?${queryParams}`);
    const token = getAuthToken();

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignore parse error, use default message
      }
      throw new Error(errorMessage);
    }

    return response.json();
  };

  return { searchPurchaseOrders };
}

// Hook để export data
export function useExportPurchaseOrders() {
  const exportToExcel = async (filters = {}) => {
    const queryParams = new URLSearchParams(filters);
    const fullUrl = buildUrl(`api/purchase-orders/export/excel?${queryParams}`);
    const token = getAuthToken();

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignore parse error, use default message
      }
      throw new Error(errorMessage);
    }

    // Xử lý download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-orders-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const exportToPDF = async (id) => {
    const fullUrl = buildUrl(`api/purchase-orders/export/pdf/${id}`);
    const token = getAuthToken();

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        // Ignore parse error, use default message
      }
      throw new Error(errorMessage);
    }

    // Xử lý download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase-order-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return { exportToExcel, exportToPDF };
}
