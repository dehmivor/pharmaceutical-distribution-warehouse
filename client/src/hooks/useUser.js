// hooks/useUsers.js - PHIÊN BẢN CẢI THIỆN
import useSWR from 'swr';

const fetcher = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // ✅ Xử lý response từ API
  if (data.success) {
    // Đảm bảo trả về array
    return Array.isArray(data.data) ? data.data : Object.values(data.data || {});
  } else {
    throw new Error(data.message || 'Failed to fetch users');
  }
};

const useUsers = () => {
  const {
    data: users,
    error,
    isLoading,
    mutate
  } = useSWR('http://localhost:5000/api/users', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    // ✅ Thêm fallback data
    fallbackData: [],
    // ✅ Retry on error
    errorRetryCount: 3,
    errorRetryInterval: 1000
  });

  // ✅ Đảm bảo users luôn là array trước khi filter
  const safeUsers = Array.isArray(users) ? users : [];

  // Phân loại users theo organization với error handling
  const fundOrgUsers = safeUsers.filter((user) => user && user.organization === 'Fund.Org');

  const consultantsUsers = safeUsers.filter((user) => user && user.organization === 'Consultants');

  return {
    users: safeUsers,
    fundOrgUsers,
    consultantsUsers,
    loading: isLoading,
    error: error?.message || error,
    refetch: mutate
  };
};

export default useUsers;
