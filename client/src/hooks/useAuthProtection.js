'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useRole } from '@/contexts/RoleContext';

/**
 * Hook bảo vệ route, chỉ cho phép truy cập nếu người dùng đã đăng nhập
 * @param {boolean} requireAuth - Route có yêu cầu authentication không
 * @returns {boolean} isLoading - Trạng thái loading
 */
export const useAuthProtection = (requireAuth = true) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, userRole, isLoading: roleLoading } = useRole(); // ✅ Sử dụng RoleContext
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Chờ RoleContext load xong
    if (roleLoading) return;

    const checkAuth = () => {
      const isLoggedIn = !!user;

      if (requireAuth && !isLoggedIn) {
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (isLoggedIn && pathname.includes('/auth/login')) {
        const defaultRoutes = {
          supervisor: '/manage-users',
          representative: '/manage-licenses',
          warehouse: '/manage-inspections'
        };
        router.push(defaultRoutes[userRole] || '/dashboard');
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, requireAuth, router, user, userRole, roleLoading]);

  return { isLoading: isLoading || roleLoading };
};

/**
 * HOC bảo vệ các component cần authentication
 * @param {React.Component} Component - Component cần bảo vệ
 * @param {Object} props - Props của component
 * @returns {React.Component} Protected component
 */
export const withAuth = (Component, requireAuth = true) => {
  return function ProtectedRoute(props) {
    const { isLoading } = useAuthProtection(requireAuth);

    if (isLoading) {
      // Hiển thị loading khi đang kiểm tra trạng thái đăng nhập
      return <div>Loading...</div>;
    }

    return <Component {...props} />;
  };
};

export default useAuthProtection;
