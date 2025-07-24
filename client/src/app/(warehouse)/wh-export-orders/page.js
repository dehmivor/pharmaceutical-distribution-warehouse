// @next
import dynamic from 'next/dynamic';

// @project

const ManageImportOrders = dynamic(() => import('@/views/warehouse/wh-export-ord'));

/***************************  IMPORT ORDERS MANAGEMENT  ***************************/

export default function ImportOrdersPage() {
  return <ManageImportOrders />;
}
