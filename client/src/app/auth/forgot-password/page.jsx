// @next
import dynamic from 'next/dynamic';

// @project

const ForgotPassword = dynamic(() => import('@/views/auth/forgot-password'));

/***************************  AUTH - LOGIN  ***************************/

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
