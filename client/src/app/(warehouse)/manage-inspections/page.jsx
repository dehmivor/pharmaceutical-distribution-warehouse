// @next
import dynamic from 'next/dynamic';

// @project
const ImportOrderListTab = dynamic(() => import('@/sections/warehouse/ImportOrderListTab'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPages() {
  return <ImportOrderListTab />;
}
