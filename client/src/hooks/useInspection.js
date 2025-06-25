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

  // ✅ Helper function để lấy user ID
  // ✅ Sửa hàm getCurrentUserId
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

  // ✅ Debug helper function với user info
  const debugUserInfo = useCallback(() => {
    console.log('🔍 Debug User Info:');
    console.log('- User from context:', user);
    console.log('- User loading:', userLoading);
    console.log('- Current user ID:', getCurrentUserId());
    console.log('- Stored user:', localStorage.getItem('user'));

    return {
      contextUser: user,
      userLoading,
      currentUserId: getCurrentUserId(),
      hasValidUserId: !!getCurrentUserId()
    };
  }, [user, userLoading, getCurrentUserId]);

  // ✅ Test với user ID thực tế
  const testMinimalPost = useCallback(async () => {
    try {
      const currentUserId = getCurrentUserId();

      if (!currentUserId) {
        throw new Error('No user ID available for testing');
      }

      const headers = getAuthHeaders();
      const minimalData = {
        import_order_id: '677a1234567890abcdef1234',
        batch_id: '677a1234567890abcdef5678',
        actual_quantity: 1,
        rejected_quantity: 0,
        note: 'Test',
        created_by: currentUserId // ✅ Sử dụng user ID thực tế
      };

      console.log('🧪 Testing minimal POST:', minimalData);

      const response = await axios.post('/api/inspections', minimalData, {
        headers,
        baseURL: backendUrl
      });

      console.log('✅ Minimal POST successful:', response.status);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Minimal POST failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return { success: false, error: error.response?.data || error.message };
    }
  }, [getAuthHeaders, getCurrentUserId]);

  return {
    // States
    loading,
    error,
    apiDebugInfo,
    userLoading, // ✅ Expose user loading state

    // Methods
    createInspection,
    updateInspection: useCallback(
      async (id, updateData) => {
        // ... existing updateInspection code
      },
      [getAuthHeaders]
    ),
    deleteInspection: useCallback(
      async (id) => {
        // ... existing deleteInspection code
      },
      [getAuthHeaders]
    ),
    fetchInspections: useCallback(
      async (params = {}) => {
        // ... existing fetchInspections code
      },
      [getAuthHeaders]
    ),
    fetchInspectionDetail: useCallback(
      async (id) => {
        // ... existing fetchInspectionDetail code
      },
      [getAuthHeaders]
    ),
    fetchInspectionStats: useCallback(
      async (importOrderId) => {
        // ... existing fetchInspectionStats code
      },
      [getAuthHeaders]
    ),

    // Helpers
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

    // ✅ New debug helpers
    debugUserInfo,
    getCurrentUserId,

    // Debug
    debugRequest: useCallback(
      async (inspectionData) => {
        console.log('🧪 Debug request data:');
        console.log('- inspectionData:', inspectionData);
        console.log('- current user:', user);
        console.log('- current user ID:', getCurrentUserId());
        console.log('- import_order_id type:', typeof inspectionData.import_order_id);
        console.log('- import_order_id valid ObjectId:', /^[0-9a-fA-F]{24}$/.test(inspectionData.import_order_id));

        const headers = getAuthHeaders();
        console.log('- headers:', headers);
      },
      [getAuthHeaders, user, getCurrentUserId]
    ),
    testMinimalPost,

    // Helper getters
    hasError: !!error,
    isLoading: loading
  };
};

export default useInspection;
