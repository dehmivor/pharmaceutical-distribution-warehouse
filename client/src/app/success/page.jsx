'use client';

// @project
import Success from '@/components/Success';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/***************************  SUCCESS - DATA  ***************************/

const data = {
  heading: 'You have successfully completed transaction payment'
};

/***************************  SUCCESS - AUTO REDIRECT WITH COUNTDOWN  ***************************/

export default function SuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Đảm bảo component đã mount hoàn toàn
    let isMounted = true;

    // Countdown timer
    const countdownTimer = setInterval(() => {
      if (isMounted) {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    // Redirect timer riêng biệt
    const redirectTimer = setTimeout(() => {
      if (isMounted) {
        router.push('/sp-manage-bills');
      }
    }, 3000);

    // Cleanup timers khi component unmount
    return () => {
      isMounted = false;
      clearInterval(countdownTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  // Cập nhật data với countdown message
  const updatedData = {
    ...data,
    primaryBtn: {
      children: `Redirecting to Manage Bills in ${countdown} seconds...`,
      href: '#',
      disabled: true,
      sx: {
        cursor: 'default',
        opacity: 0.7,
        '&:hover': { backgroundColor: 'primary.main' }
      }
    }
  };

  return <Success {...updatedData} />;
}
