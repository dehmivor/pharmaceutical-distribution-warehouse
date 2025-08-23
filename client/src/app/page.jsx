'use client';

import { useEffect } from 'react';

// @next
import { useRouter } from 'next/navigation';

// @project
import { APP_DEFAULT_PATH } from '@/config';

/***************************  MAIN - DEFAULT PAGE  ***************************/

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Get user role from localStorage and redirect to appropriate home
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const role = user.role;

          // Map role to home URL
          const roleHomeMap = {
            supervisor: '/sp-dashboard',
            representative: '/rp-dashboard',
            warehouse: '/wh-dashboard',
            warehouse_manager: '/wm-dashboard',
            representative_manager: '/rm-dashboard'
          };

          const homeUrl = roleHomeMap[role] || APP_DEFAULT_PATH;
          router.replace(homeUrl);
          return;
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
    }

    // Fallback to default path
    router.replace(APP_DEFAULT_PATH);
  }, [router]);
}
