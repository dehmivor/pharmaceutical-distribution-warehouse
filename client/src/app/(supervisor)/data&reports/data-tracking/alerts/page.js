// @next
import dynamic from 'next/dynamic';

// @project

const Alerts = dynamic(() => import('@/views/supervisor/data-tracking/alerts'));

/***************************  ALERTS & DATA TRACKING  ***************************/

export default function AlertsPage() {
  return <Alerts />;
}
