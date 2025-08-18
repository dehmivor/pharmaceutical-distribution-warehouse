// @next
import dynamic from 'next/dynamic';

// @project
const ExportReport = dynamic(() => import('@/views/supervisor/export-report'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPages() {
  return <ExportReport />;
}
