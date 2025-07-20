'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { useRole } from '@/contexts/RoleContext'; // Import useRole

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
        if (userLoading) {
          throw new Error('Đang tải thông tin người dùng, vui lòng thử lại');
        }

        const currentUserId = getCurrentUserId();

        if (!currentUserId) {
          throw new Error('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        }

        // Kiểm tra dữ liệu đầu vào
        // Nếu inspectionData là mảng thì xử lý theo mảng
        let payload = [];

        if (Array.isArray(inspectionData)) {
          payload = inspectionData.map((item) => ({
            import_order_id: item.import_order_id,
            medicine_id: item.medicine_id,
            actual_quantity: Number(item.actual_quantity || 0),
            rejected_quantity: Number(item.rejected_quantity || 0),
            note: item.note || '',
            created_by: currentUserId
          }));
        } else if (typeof inspectionData === 'object' && inspectionData !== null) {
          // Nếu là object đơn, chuyển về mảng 1 phần tử
          payload = [
            {
              import_order_id: inspectionData.import_order_id,
              medicine_id: inspectionData.medicine_id || null,
              actual_quantity: Number(inspectionData.actual_quantity || 0),
              rejected_quantity: Number(inspectionData.rejected_quantity || 0),
              note: inspectionData.note || '',
              created_by: currentUserId
            }
          ];
        } else {
          throw new Error('Dữ liệu phiếu nhập không hợp lệ (phải là đối tượng hoặc mảng).');
        }

        // Validate số lượng không âm và rejected <= actual cho từng phần tử
        for (const item of payload) {
          if (item.actual_quantity < 0 || item.rejected_quantity < 0) {
            throw new Error('Số lượng không được âm');
          }
          if (item.rejected_quantity > item.actual_quantity) {
            throw new Error('Số lượng từ chối không được vượt quá số lượng thực nhận');
          }
          if (!item.import_order_id) {
            throw new Error('Import Order ID là bắt buộc');
          }
          if (!item.medicine_id) {
            throw new Error('Medicine ID là bắt buộc');
          }
        }

        const headers = getAuthHeaders();

        // Gọi API POST mảng
        const response = await axios.post('/api/inspections', payload, {
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
