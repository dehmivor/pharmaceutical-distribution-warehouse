// @next
import dynamic from 'next/dynamic';

// @project
const ReportMonthly = dynamic(() => import('@/views/supervisor/reports/monthly'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPages() {
  return <ReportMonthly />;
}
