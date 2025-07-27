// @next
import dynamic from 'next/dynamic';

// @project

const ManageImportOrders = dynamic(() => import('@/views/warehouse-manager/manage-export-orders'));

/***************************  IMPORT ORDERS MANAGEMENT  ***************************/

export default function ImportOrdersPage() {
  return <ManageImportOrders />;
}
