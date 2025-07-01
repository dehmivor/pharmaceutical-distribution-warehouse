// @next
import dynamic from 'next/dynamic';

// @project

const AssignedInboundOrderDetail = dynamic(() => import('@/views/warehouse-manager/assigned-inbound-order-detail'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <AssignedInboundOrderDetail/>;
}
