// @next
import dynamic from 'next/dynamic';

// @project
const SupervisorDashboardPage = dynamic(() => import('@/views/supervisor/supervisor-dashboard'));

/***************************  SUPERVISOR DASHBOARD PAGE  ***************************/

export default function SupervisorDashboardPages() {
  return <SupervisorDashboardPage />;
}
