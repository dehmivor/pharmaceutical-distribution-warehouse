// @next
import dynamic from 'next/dynamic';

// @project

const AssignedInboundOrder = dynamic(() => import('@/views/warehouse-manager/assigned-inbound-order'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <AssignedInboundOrder />;
}
