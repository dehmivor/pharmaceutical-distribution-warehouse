'use client';

import { useState, useEffect } from 'react';

/**
 * Hook quản lý trạng thái và thông tin người dùng hiện tại
 * @returns {Object} Thông tin người dùng và các hàm liên quan
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Kiểm tra xác thực và lấy thông tin người dùng khi component mount
    const checkAuth = async () => {
      try {
        setLoading(true);

        // Kiểm tra xem có token không
        const authenticated = authService.isAuthenticated();
        setIsAuthenticated(authenticated);

        // Nếu có token, lấy thông tin người dùng
        if (authenticated) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);

          const validToken = await authService.verifyToken();
          if (!validToken) {
            logout();
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Đăng nhập và cập nhật trạng thái người dùng
   * @param {string} email - Email đăng nhập
   * @param {string} password - Mật khẩu đăng nhập
   * @returns {Promise<Object>} Kết quả đăng nhập
   */
  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);

      if (result.success) {
        // Cập nhật trạng thái người dùng
        setUser(result.data.user);
        setIsAuthenticated(true);
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Đăng ký và cập nhật trạng thái người dùng
   * @param {Object} userData - Thông tin đăng ký
   * @returns {Promise<Object>} Kết quả đăng ký
   */
  const register = async (userData) => {
    try {
      const result = await authService.register(userData);

      if (result.success) {
        // Cập nhật trạng thái người dùng
        setUser(result.data.user);
        setIsAuthenticated(true);
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Đăng xuất và xóa thông tin người dùng
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Kiểm tra người dùng có vai trò admin không
   * @returns {boolean} Kết quả kiểm tra
   */
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  /**
   * Cập nhật thông tin người dùng
   * @param {Object} newUserData - Thông tin người dùng mới
   */
  const updateUser = (newUserData) => {
    setUser((prev) => ({ ...prev, ...newUserData }));

    // Cập nhật thông tin trong localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        localStorage.setItem('user', JSON.stringify({ ...currentUser, ...newUserData }));
      }
    }
  };

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    isAdmin,
    updateUser
  };
};

export default useAuth;
