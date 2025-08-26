// contexts/AuthContext.js
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setLoading(false);
        return;
      }

      // ✅ Sửa: Gọi endpoint đúng /api/auth/me thay vì /auth/validate
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        setUser(result.data);
        // ✅ Lưu user data vào localStorage để đồng bộ với RoleContext
        localStorage.setItem('user', JSON.stringify(result.data));
      } else if (response.status === 401) {
        // ✅ Chỉ xóa token khi thực sự unauthorized (401), không phải 404
        console.log('Token expired or invalid, clearing storage');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');
        localStorage.removeItem('user');
        setUser(null);
      } else {
        // ✅ Các lỗi khác (404, 500...) không xóa token
        console.warn('Auth check failed with status:', response.status, 'but keeping token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // ✅ Chỉ xóa token khi có lỗi network nghiêm trọng
      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        console.warn('Network error during auth check, keeping token');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/auth/login');
    }
  };

  const hasRole = (role) => {
    return user?.role === role || user?.roles?.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        hasRole,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
