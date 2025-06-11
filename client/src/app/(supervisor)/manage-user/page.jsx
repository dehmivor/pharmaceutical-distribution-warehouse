// @next
import dynamic from 'next/dynamic';

// @project

const ManageUser = dynamic(() => import('@/views/supervisor/manage-user'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <ManageUser />;
}
