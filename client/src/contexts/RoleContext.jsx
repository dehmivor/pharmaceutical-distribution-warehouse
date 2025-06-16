// app/contexts/RoleContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lấy user data từ localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setUserRole(parsedUser.role || '');
    }
    setIsLoading(false);
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
    // Logic kiểm tra permission dựa trên role
    const rolePermissions = {
      supervisor: ['manage-users', 'view-reports', 'manage-settings'],
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
