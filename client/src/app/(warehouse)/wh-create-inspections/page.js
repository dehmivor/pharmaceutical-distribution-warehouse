// @next
import dynamic from 'next/dynamic';

// @project
const InspectionModeView = dynamic(() => import('@/sections/warehouse/dashboard-import/InspectionModeView'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPages() {
  return <InspectionModeView />;
}
