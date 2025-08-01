// @next
import dynamic from 'next/dynamic';

// @project

const CheckOrderDetail = dynamic(() => import('@/views/warehouse-manager/wm-check-order-detail'));

/***************************  IMPORT ORDERS MANAGEMENT  ***************************/

export default function ImportOrdersPage() {
  return <CheckOrderDetail />;
}
