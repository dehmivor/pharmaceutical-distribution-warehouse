// @next
import dynamic from 'next/dynamic';

// @project

const ActiveAccount = dynamic(() => import('@/views/admin/auth/active-account'));

/***************************  AUTH - LOGIN  ***************************/

export default function ForgotPasswordPage() {
  return <ActiveAccount />;
}
