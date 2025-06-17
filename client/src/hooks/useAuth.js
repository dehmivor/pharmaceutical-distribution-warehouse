'use client';

import { useState, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';

/**
 * Hook quản lý authentication - tích hợp với RoleContext
 */
export const useAuth = () => {
  const { user, userRole, isLoading, updateUser: updateRoleUser } = useRole();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  /**
   * Đăng nhập
   */
  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        // RoleContext sẽ tự động cập nhật user
        return result;
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Đăng ký
   */
  const register = async (userData) => {
    try {
      const result = await authService.register(userData);

      if (result.success) {
        // RoleContext sẽ tự động cập nhật user
        return result;
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Đăng xuất
   */
  const logout = () => {
    authService.logout();
    // RoleContext sẽ tự động cập nhật
  };

  /**
   * Kiểm tra role
   */
  const hasRole = (role) => {
    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  };

  const isAdmin = () => hasRole('admin');
  const isSupervisor = () => hasRole('supervisor');
  const isRepresentative = () => hasRole('representative');
  const isWarehouse = () => hasRole('warehouse');

  return {
    user,
    userRole,
    loading: isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    hasRole,
    isAdmin,
    isSupervisor,
    isRepresentative,
    isWarehouse,
    updateUser: updateRoleUser
  };
};
