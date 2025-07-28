// @next
import dynamic from 'next/dynamic';

// @project
const InspectForUnknownOrder = dynamic(() => import('@/sections/warehouse/create-inspect/InspectForUnknownOrder'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPages() {
  return <InspectForUnknownOrder />;
}
