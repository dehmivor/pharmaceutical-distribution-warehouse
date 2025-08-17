import dynamic from 'next/dynamic';

const SupervisorLocationManagement = dynamic(() => import('@/views/supervisor/location-management'));

export default function Page() {
  return <SupervisorLocationManagement />;
}
