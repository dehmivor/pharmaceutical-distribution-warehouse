// @next
import dynamic from 'next/dynamic';

// @project

const CheckOrders = dynamic(() => import('@/views/warehouse/wh-check-orders'));

/***************************  IMPORT ORDERS MANAGEMENT  ***************************/

export default function ImportOrdersPage() {
  return <CheckOrders />;
}
