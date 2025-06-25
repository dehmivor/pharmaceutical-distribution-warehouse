import dynamic from 'next/dynamic';

const InventoryPage = dynamic(() => import('@/views/warehouse_manager/InventoryPage'));

export default function InventoryPages() {
  return <InventoryPage />;
}
