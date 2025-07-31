// @next
import dynamic from 'next/dynamic';

// @project

const ResetPassword = dynamic(() => import('@/views/admin/auth/reset-password'));

/***************************  AUTH - LOGIN  ***************************/

export default function ForgotPasswordPage() {
  return <ResetPassword />;
}
