'use client';

import { useState, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';

/**
 * Hook quản lý authentication - tích hợp với RoleContext
 */
export const useAuth = () => {
  const { user, userRole, isLoading } = useRole();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  /**
   * Đăng nhập
   */
  const login = async (email, password) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.success) {
        // Store tokens
        localStorage.setItem('auth-token', result.data.token);
        localStorage.setItem('refresh-token', result.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        return result;
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Không thể kết nối đến server');
    }
  };
  const register = async (userData) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (result.success) {
        if (result.data?.token) {
          localStorage.setItem('auth-token', result.data.token);
          localStorage.setItem('refresh-token', result.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(result.data.user));
        }
        return result;
      }

      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw new Error('Không thể kết nối đến server');
    }
  };

  const logout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const hasRole = (role) => {
    if (!userRole) return false;

    if (Array.isArray(role)) {
      return role.includes(userRole);
    }
    return userRole === role;
  };

  const isSupervisor = () => hasRole('supervisor');

  const isRepresentative = () => hasRole('representative');

  const isWarehouse = () => hasRole('warehouse');

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refresh-token');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${backendUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem('auth-token', result.data.token);
        return result.data.token;
      }

      throw new Error(result.message || 'Failed to refresh token');
    } catch (error) {
      console.error('Refresh token error:', error);
      logout();
      throw error;
    }
  };

  const isTokenValid = () => {
    const token = localStorage.getItem('auth-token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;

      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  };

  return {
    user,
    userRole,
    loading: isLoading,
    isAuthenticated,

    login,
    register,
    logout,
    refreshToken,

    hasRole,
    isRepresentative,
    isWarehouse,
    isSupervisor,

    isTokenValid
  };
};
