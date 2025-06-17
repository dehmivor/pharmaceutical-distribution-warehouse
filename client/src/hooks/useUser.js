import useSWR from 'swr';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ✅ Utility function để validate JWT token
const isValidJWT = (token) => {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  return parts.every((part) => part && part.length > 0);
};

const fetcher = async (url) => {
  const token = localStorage.getItem('auth-token');

  // ✅ Kiểm tra token trước khi gửi request
  if (!token) {
    throw new Error('No authentication token found - please login');
  }

  // ✅ Validate token format
  if (!isValidJWT(token)) {
    console.error('❌ Invalid token format detected:', {
      tokenExists: !!token,
      tokenParts: token ? token.split('.').length : 0,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
    });

    // Xóa token lỗi
    localStorage.removeItem('auth-token');
    throw new Error('Invalid token format - please login again');
  }

  console.log('✅ Valid token found, making request to:', url);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired hoặc invalid
      localStorage.removeItem('auth-token');
      throw new Error('Unauthorized: Please login again');
    }
    if (response.status === 403) {
      throw new Error('Access denied: Insufficient permissions');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (data.success) {
    return Array.isArray(data.data) ? data.data : Object.values(data.data || {});
  } else {
    throw new Error(data.message || 'Failed to fetch users');
  }
};

const useUsers = () => {
  // ✅ Kiểm tra token trước khi tạo SWR hook
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  console.log(`Token exists: ${!!token}`, token ? `Token preview: ${token.substring(0, 20)}...` : 'No token found');
  const shouldFetch = token && isValidJWT(token);

  const {
    data: users,
    error,
    isLoading,
    mutate
  } = useSWR(
    // ✅ Chỉ fetch khi có token hợp lệ
    shouldFetch ? `${backendUrl}/api/supervisor/users` : null,
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      fallbackData: [],
      errorRetryCount: 2, // Giảm retry count
      errorRetryInterval: 2000,
      // ✅ Thêm error handling
      onError: (error) => {
        console.error('SWR Error:', error.message);
        if (error.message.includes('login')) {
          // Redirect to login page
          window.location.href = '/auth/login';
        }
      }
    }
  );

  const safeUsers = Array.isArray(users) ? users : [];
  console.log(`Fetched ${safeUsers.length} users`, safeUsers.length > 0 ? `First user: ${JSON.stringify(safeUsers[0])}` : 'No users found');

  return {
    users: safeUsers,
    loading: isLoading,
    error: error?.message || error,
    refetch: mutate,
    // ✅ Thêm helper functions
    hasValidToken: shouldFetch,
    tokenExists: !!token
  };
};

export default useUsers;
