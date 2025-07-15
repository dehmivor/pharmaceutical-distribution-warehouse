// @next
import dynamic from 'next/dynamic';

// @project
const RepresentativeManagerDashboard = dynamic(() => import('@/views/representative_manager/dashboard'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPage() {
  return <RepresentativeManagerDashboard />;
}
