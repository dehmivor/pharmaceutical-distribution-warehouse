// @next
import dynamic from 'next/dynamic';

// @project
const InspectionPage = dynamic(() => import('@/views/warehouse/InspectionPage'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPages() {
  return <InspectionPage />;
}
