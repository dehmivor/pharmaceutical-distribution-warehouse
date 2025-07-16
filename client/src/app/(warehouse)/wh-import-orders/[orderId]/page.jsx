// @next
import dynamic from 'next/dynamic';

// @project

const AssignedInboundOrderDetail = dynamic(() => import('@/views/warehouse/ImportOrderDetail'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <AssignedInboundOrderDetail />;
}
