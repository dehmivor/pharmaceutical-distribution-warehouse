// @next
import dynamic from 'next/dynamic';

// @project
const DashboardDebt = dynamic(() => import('@/views/general/DashboardDebt'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPages() {
  return <DashboardDebt />;
}
