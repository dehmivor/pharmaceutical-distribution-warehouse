// @next
import dynamic from 'next/dynamic';

// @project

const ManageBills = dynamic(() => import('@/views/supervisor/manage-bills'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <ManageBills />;
}
