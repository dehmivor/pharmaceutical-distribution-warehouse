'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './useAuth';

const ROLE_ROUTES = {
  supervisor: {
    default: '/manage-users',
    allowed: '*'
  },
  representative: {
    default: '/manage-licenses',
    allowed: ['/manage-licenses', '/manage-contracts']
  },
  warehouse: {
    default: '/manage-inspections',
    allowed: ['/manage-inspections', '/profile']
  }
};

export const useRouteProtection = (options = {}) => {
  const { requireAuth = true, allowedRoles = null, redirectTo = null } = options;
  const { user, userRole, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Sử dụng useRef để tránh redirect loop
  const hasRedirected = useRef(false);

  useEffect(() => {
    // ✅ Reset redirect flag khi pathname thay đổi
    hasRedirected.current = false;
  }, [pathname]);

  useEffect(() => {
    // ✅ Chờ loading hoàn tất và tránh redirect loop
    if (loading || hasRedirected.current) return;

    console.log('🔍 Route Protection Check:', {
      pathname,
      userRole,
      isAuthenticated,
      allowedRoles,
      loading
    });

    try {
      // Kiểm tra authentication
      if (requireAuth && !isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to login');
        hasRedirected.current = true;
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // ✅ Redirect từ login page nếu đã đăng nhập - CHỈ KHI CẦN THIẾT
      if (isAuthenticated && pathname === '/auth/login') {
        const roleConfig = ROLE_ROUTES[userRole];
        const defaultRoute = roleConfig?.default || '/dashboard';
        console.log('✅ Already authenticated, redirecting to:', defaultRoute);
        hasRedirected.current = true;
        router.replace(defaultRoute); // ✅ Sử dụng replace thay vì push
        return;
      }

      // Kiểm tra authorization với allowedRoles parameter
      if (isAuthenticated && allowedRoles) {
        const hasAccess = Array.isArray(allowedRoles) ? allowedRoles.includes(userRole) : allowedRoles === userRole;

        console.log('🔐 Role check:', { userRole, allowedRoles, hasAccess });

        if (!hasAccess) {
          console.log('❌ Role not allowed, redirecting to unauthorized');
          hasRedirected.current = true;
          router.push(redirectTo || '/unauthorized');
          return;
        }
      }

      // ✅ Kiểm tra route có được phép truy cập không
      if (isAuthenticated && userRole) {
        const roleConfig = ROLE_ROUTES[userRole];

        if (roleConfig) {
          // Nếu allowed là '*', cho phép tất cả
          if (roleConfig.allowed === '*') {
            console.log('✅ Full access granted for role:', userRole);
            return;
          }

          // Nếu allowed là array, kiểm tra từng route
          if (Array.isArray(roleConfig.allowed)) {
            const isAllowed = roleConfig.allowed.some((route) => {
              if (route === '*') return true;

              const routePattern = route.replace(/:id/g, '[^/]+');
              const regex = new RegExp(`^${routePattern}$`);
              return regex.test(pathname);
            });

            console.log('📍 Route access check:', {
              pathname,
              allowedRoutes: roleConfig.allowed,
              isAllowed
            });

            if (!isAllowed) {
              console.log('❌ Route not allowed, redirecting to unauthorized');
              hasRedirected.current = true;
              router.push('/unauthorized');
              return;
            }
          }
        }
      }

      console.log('✅ Route protection passed');
    } catch (error) {
      console.error('❌ Route protection error:', error);
      hasRedirected.current = true;
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, userRole, pathname, requireAuth, allowedRoles, redirectTo, router]);

  return {
    loading,
    isAuthenticated,
    userRole,
    hasAccess: !loading && isAuthenticated && !hasRedirected.current
  };
};
