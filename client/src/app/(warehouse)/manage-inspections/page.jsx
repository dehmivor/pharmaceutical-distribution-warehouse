// @next
import dynamic from 'next/dynamic';

// @project
const WarehouseDashboard = dynamic(() => import('@/views/warehouse/WarehouseDashboard'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPages() {
  return <WarehouseDashboard />;
}
