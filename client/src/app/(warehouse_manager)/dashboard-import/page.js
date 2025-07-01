// @next
import dynamic from 'next/dynamic';

// @project

const WarehouseDashboard = dynamic(() => import('@/views/warehouse/WarehouseDashboard'));

/***************************  AUTH - LOGIN  ***************************/

export default function DashboardPages() {
  return <WarehouseDashboard />;
}
