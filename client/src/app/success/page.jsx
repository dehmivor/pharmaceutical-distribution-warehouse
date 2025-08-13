'use client';

// @project
import Success from '@/components/Success';
import { useRouter } from 'next/navigation';

/***************************  ERROR 500 - DATA  ***************************/

const data = {
  primaryBtn: { children: 'Back to Manage Bills', href: '/sp-manage-bills' },
  heading: 'You have successfully completed transaction payment'
};

/***************************  ERROR - INTERNAL SERVER ERROR  ***************************/

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Tự động redirect sau 0.3 giây
    const timer = setTimeout(() => {
      router.push('/sp-manage-bills');
    }, 300);

    // Cleanup timer khi component unmount
    return () => clearTimeout(timer);
  }, [router]);

  return <Success {...data} />;
}
