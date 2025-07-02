// @next
import dynamic from 'next/dynamic';

// @project

const ManageInventory = dynamic(() => import('@/views/warehouse-manager/manage-inventory'));

/***************************  INVENTORY MANAGEMENT  ***************************/

export default function InventoryPage() {
  return <ManageInventory/>;
}
