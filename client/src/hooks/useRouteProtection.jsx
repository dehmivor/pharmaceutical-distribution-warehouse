// app/hooks/useRouteProtection.js
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '../contexts/RoleContext';

export const useRouteProtection = (allowedRoles) => {
  const { userRole, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && userRole) {
      const hasAccess = Array.isArray(allowedRoles) ? allowedRoles.includes(userRole) : allowedRoles === userRole;

      if (!hasAccess) {
        router.push('/unauthorized');
      }
    }
  }, [userRole, isLoading, allowedRoles, router]);

  return { isLoading, hasAccess: allowedRoles.includes(userRole) };
};
