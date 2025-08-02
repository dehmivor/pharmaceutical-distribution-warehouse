// @next
import dynamic from 'next/dynamic';

// @project
const ReportMonthly = dynamic(() => import('@/views/supervisor/reports/yearly'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPages() {
  return <ReportMonthly />;
}
