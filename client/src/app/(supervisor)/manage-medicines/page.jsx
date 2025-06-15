// @next
import dynamic from 'next/dynamic';

// @project

const ManageMedicine = dynamic(() => import('@/views/supervisor/manage-mediciness'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <ManageMedicine />;
}
