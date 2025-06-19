import dynamic from 'next/dynamic';

// @project
const PurchaseOrderPage = dynamic(() => import('@/views/representative/purchase-order-page'));

/***************************  DASHBOARD PAGE  ***************************/

export default function PurchaseOrderPages() {
  return <PurchaseOrderPage />;
} 