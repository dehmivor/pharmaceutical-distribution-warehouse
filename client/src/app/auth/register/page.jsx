// @next
import dynamic from 'next/dynamic';

// @project
const AuthRegister = dynamic(() => import('@/views/admin/auth/register'));

/***************************  AUTH - REGISTER  ***************************/

export default function Register() {
  return <AuthRegister />;
}
