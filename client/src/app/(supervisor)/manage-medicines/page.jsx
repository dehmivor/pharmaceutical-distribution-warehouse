// @next
import dynamic from 'next/dynamic';

// @project

const ManageMedicine = dynamic(() => import('@/views/supervisor/manage-medicines'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <ManageMedicine />;
}
