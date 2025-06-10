'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/services/auth.service.js';

/**
 * Hook bảo vệ route, chỉ cho phép truy cập nếu người dùng đã đăng nhập
 * @param {boolean} requireAuth - Route có yêu cầu authentication không
 * @returns {boolean} isLoading - Trạng thái loading
 */
export const useAuthProtection = (requireAuth = true) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xác thực
    const checkAuth = async () => {
      const isLoggedIn = authService.isAuthenticated();

      // Nếu route yêu cầu auth và người dùng chưa đăng nhập
      if (requireAuth && !isLoggedIn) {
        // Chuyển hướng đến trang đăng nhập và lưu URL hiện tại để quay lại sau
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      }
      // Nếu đã đăng nhập nhưng đang ở trang login/register
      else if (isLoggedIn && (pathname.includes('/auth/login') || pathname.includes('/not-found'))) {
        // Chuyển hướng về dashboard
        router.push('/(admin)');
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, requireAuth, router]);

  return { isLoading };
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
