// app/contexts/RoleContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('auth-token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          setUser(result.data);
          setUserRole(result.data.role);
          localStorage.setItem('user', JSON.stringify(result.data));
        } else {
          console.log('Auth failed:', response.status);
          localStorage.removeItem('auth-token');
          localStorage.removeItem('user');
          setUser(null);
          setUserRole('');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setUser(null);
        setUserRole('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
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
      warehouse: ['manage-inventory', 'view-stock']
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
