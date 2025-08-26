'use client';
// app/contexts/RoleContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeUserData = async () => {
      try {
        // ✅ Sửa: Không gọi API riêng, chỉ lấy từ localStorage
        // AuthContext đã gọi API và lưu user data rồi
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('auth-token');

        if (!token || !storedUser) {
          setIsLoading(false);
          return;
        }

        try {
          const userData = JSON.parse(storedUser);
          console.log('RoleContext - User data from localStorage:', userData);
          setUser(userData);
          setUserRole(userData.role || '');
        } catch (parseError) {
          console.error('Failed to parse stored user data:', parseError);
          // Nếu parse lỗi, gọi API để lấy data mới
          await fetchUserDataFromAPI();
        }
      } catch (error) {
        console.error('Failed to initialize user data:', error);
        setUser(null);
        setUserRole('');
      } finally {
        setIsLoading(false);
      }
    };

    // Fallback: gọi API nếu cần thiết
    const fetchUserDataFromAPI = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) return;

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
          console.log('RoleContext - API fallback response:', result);
          setUser(result.data);
          setUserRole(result.data.role || '');
          localStorage.setItem('user', JSON.stringify(result.data));
        } else if (response.status === 401) {
          // Chỉ xóa token khi thực sự unauthorized
          localStorage.removeItem('auth-token');
          localStorage.removeItem('user');
          setUser(null);
          setUserRole('');
        }
      } catch (error) {
        console.error('API fallback failed:', error);
      }
    };

    initializeUserData();
  }, []);

  const updateUserRole = (newUser) => {
    setUser(newUser);
    setUserRole(newUser.role || '');
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const hasRole = (allowedRoles) => {
    if (!userRole) return false;
    return Array.isArray(allowedRoles) ? allowedRoles.includes(userRole) : allowedRoles === userRole;
  };

  const hasPermission = (permission) => {
    const rolePermissions = {
      supervisor: ['manage-users'],
      representative: ['manage-license', 'view-clients'],
      representative_manager: ['create-bills', 'approve-import-orders'],
      warehouse: ['create-inspections', 'manage-import-orders', 'manage-location'],
      warehouse_manager: ['approve-inspections', 'manage-inventory']
    };

    return rolePermissions[userRole]?.includes(permission) || false;
  };

  return (
    <RoleContext.Provider
      value={{
        user,
        userRole,
        isLoading,
        updateUserRole,
        hasRole,
        hasPermission
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
