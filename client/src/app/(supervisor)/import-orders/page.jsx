import dynamic from 'next/dynamic';

const SupervisorImportOrders = dynamic(() => import('@/views/supervisor/import-order-supervisor'));

export default function ImportOrdersPage() {
  return <SupervisorImportOrders />;
} 