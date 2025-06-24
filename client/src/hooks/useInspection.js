// hooks/useInspection.js
import useSWR from 'swr';
import axios from 'axios';
import { useCallback } from 'react';

// Cấu hình Axios mặc định
const api = axios.create({
  baseURL: '/api/import-inspections',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

export default function useInspection() {
  // SWR fetcher
  const fetcher = (url) => api.get(url).then((res) => res.data);

  // Tạo mới phiếu kiểm hàng
  const createInspection = useCallback(async (inspectionData) => {
    try {
      const response = await api.post('/', inspectionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }, []);

  // Cập nhật phiếu kiểm hàng
  const updateInspection = useCallback(async (id, updateData) => {
    try {
      const response = await api.put(`/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }, []);

  // Xóa phiếu kiểm hàng
  const deleteInspection = useCallback(async (id) => {
    try {
      await api.delete(`/${id}`);
      return true;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }, []);

  // Hook lấy danh sách kiểm hàng
  const useInspections = (queryParams = {}) => {
    const { page = 1, limit = 10, ...filters } = queryParams;
    const params = new URLSearchParams({ page, limit, ...filters }).toString();

    const { data, error, mutate, isLoading } = useSWR(`?${params}`, fetcher, {
      revalidateOnFocus: false,
      shouldRetryOnError: false
    });

    return {
      inspections: data?.inspections || [],
      pagination: data?.pagination,
      isLoading,
      error,
      mutate
    };
  };

  // Hook lấy chi tiết 1 phiếu kiểm hàng
  const useInspectionDetail = (id) => {
    const { data, error, mutate, isLoading } = useSWR(id ? `/${id}` : null, fetcher, {
      revalidateOnFocus: false
    });

    return {
      inspection: data,
      isLoading,
      error,
      mutate
    };
  };

  // Hook lấy thống kê kiểm hàng
  const useInspectionStats = (importOrderId) => {
    const { data, error, isLoading } = useSWR(importOrderId ? `/statistics/${importOrderId}` : null, fetcher);

    return {
      stats: data,
      isLoading,
      error
    };
  };

  return {
    createInspection,
    updateInspection,
    deleteInspection,
    useInspections,
    useInspectionDetail,
    useInspectionStats
  };
}
