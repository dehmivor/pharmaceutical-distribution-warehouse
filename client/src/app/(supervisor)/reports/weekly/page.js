// @next
import dynamic from 'next/dynamic';

// @project
const ReportMonthly = dynamic(() => import('@/views/supervisor/reports/weekly'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPages() {
  return <ReportMonthly />;
}
