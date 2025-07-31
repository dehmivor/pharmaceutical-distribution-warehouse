// @next
import ManageUsers from '@/views/supervisor/manage-users';
import dynamic from 'next/dynamic';

// @project

// const ManageUsers = dynamic(() => import('@/views/supervisor/manage-users'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <ManageUsers />;
}
