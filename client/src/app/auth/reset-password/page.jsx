// @next
import dynamic from 'next/dynamic';

// @project

const ResetPassword = dynamic(() => import('@/views/auth/reset-password'));

/***************************  AUTH - LOGIN  ***************************/

export default function ForgotPasswordPage() {
  return <ResetPassword />;
}
