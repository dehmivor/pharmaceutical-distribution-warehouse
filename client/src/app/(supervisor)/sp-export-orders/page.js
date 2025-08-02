import dynamic from 'next/dynamic';

const SupervisorExportOrders = dynamic(() => import('@/views/supervisor/export-order-supervisor'));

export default function ImportOrdersPage() {
  return <SupervisorExportOrders />;
}
