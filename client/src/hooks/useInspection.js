'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useRole } from '@/contexts/RoleContext'; // Import useRole

const backendUrl = 'http://localhost:5000';

const useInspection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiDebugInfo, setApiDebugInfo] = useState(null);

  // ✅ Sử dụng useRole để lấy thông tin user
  const { user, isLoading: userLoading } = useRole();

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('auth-token');
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token found:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No auth token found in localStorage');
    }

    return headers;
  }, []);

  const getCurrentUserId = useCallback(() => {
    // Fallback: lấy từ localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.userId || parsedUser._id || parsedUser.id; // ✅ Thêm các trường khác
      } catch (e) {
        console.warn('⚠️ Failed to parse stored user data');
      }
    }

    // Fallback cuối: hardcode (chỉ dùng cho development)
    console.warn('⚠️ Using fallback user ID - this should not happen in production');
    return '685aba038d7e1e2eb3d86bd1';
  }, [user]);

  const createInspection = useCallback(
    async (inspectionData) => {
      setLoading(true);
      setError(null);

      try {
        console.log('🔍 Raw inspection data:', inspectionData);

        if (userLoading) {
          throw new Error('Đang tải thông tin người dùng, vui lòng thử lại');
        }

        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
          throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        }

        if (!inspectionData.import_order_id) {
          throw new Error('Import Order ID is required');
        }

        // ✅ Sử dụng user ID thực tế thay vì hardcode
        const transformedData = {
          import_order_id: inspectionData.import_order_id, // ✅ Sử dụng giá trị thực
          batch_id: inspectionData.batch_id || null,
          actual_quantity: Number(inspectionData.total_received || inspectionData.actual_quantity || 0),
          rejected_quantity: Number(inspectionData.total_returned || inspectionData.rejected_quantity || 0),
          note: String(inspectionData.notes || inspectionData.note || ''),
          created_by: currentUserId // ✅ Sử dụng user ID thực tế
        };

        console.log('📤 Transformed data:', transformedData);
        console.log('👤 Current user:', { id: currentUserId, name: user?.name || 'Unknown' });

        if (transformedData.actual_quantity < 0 || transformedData.rejected_quantity < 0) {
          throw new Error('Số lượng không được âm');
        }

        const headers = getAuthHeaders();
        const response = await axios.post('/api/inspections', transformedData, {
          headers,
          baseURL: backendUrl
        });

        console.log('✅ Create inspection success:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Create inspection error:', {
          originalData: inspectionData,
          currentUser: user,
          error: error.response?.data || error.message
        });

        let errorMessage = 'Có lỗi xảy ra khi tạo phiếu kiểm hàng';

        if (error.response?.status === 500) {
          errorMessage = `Lỗi server: ${error.response?.data?.message || 'Kiểm tra dữ liệu gửi lên'}`;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, getCurrentUserId, user, userLoading]
  );

  const fetchInspectionForApprove = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);
      try {
        const headers = getAuthHeaders();
        const response = await axios.get('/api/inspections/inspection-for-approve', {
          headers,
          baseURL: backendUrl,
          params
        });
        return response.data;
      } catch (error) {
        let errorMessage = 'Có lỗi khi lấy danh sách kiểm hàng chờ duyệt';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  return {
    loading,
    error,
    apiDebugInfo,
    userLoading,

    createInspection,
    fetchInspectionForApprove,

    clearError: useCallback(() => setError(null), []),
    checkAuthStatus: useCallback(() => {
      const token = localStorage.getItem('auth-token');
      return {
        isAuthenticated: !!token,
        token: token ? token.substring(0, 20) + '...' : null,
        user: user,
        userId: getCurrentUserId()
      };
    }, [user, getCurrentUserId]),

    getCurrentUserId
  };
};

export default useInspection;
