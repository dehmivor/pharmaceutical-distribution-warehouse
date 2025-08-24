// components/guards/RoleGuard.jsx
'use client';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loader from '@/components/Loader';

export const RoleGuard = ({ children, allowedRoles, fallback = '/unauthorized', showLoader = true }) => {
  const { userRole, isLoading } = useRole();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const hasAccess = Array.isArray(allowedRoles) ? allowedRoles.includes(userRole) : allowedRoles === userRole;

      if (!hasAccess) {
        router.push(fallback);
      } else {
        setIsAuthorized(true);
      }
    }
  }, [userRole, isLoading, allowedRoles, router, fallback]);

  if (isLoading && showLoader) return <Loader />;
  if (!isAuthorized) return null;

  return children;
};
