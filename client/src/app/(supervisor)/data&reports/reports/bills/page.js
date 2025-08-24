// @next
import dynamic from 'next/dynamic';

// @project

const Report = dynamic(() => import('@/views/supervisor/bill-report'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <Report />;
}
