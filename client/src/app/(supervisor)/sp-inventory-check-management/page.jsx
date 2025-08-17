import dynamic from 'next/dynamic';

const SupervisorInventoryCheckManagement = dynamic(() => import('@/views/supervisor/inventory-check-management'));

export default function Page() {
  return <SupervisorInventoryCheckManagement />;
}
