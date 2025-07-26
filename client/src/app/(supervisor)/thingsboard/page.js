// @next
import dynamic from 'next/dynamic';

// @project
const MonitoringPage = dynamic(() => import('@/views/general/MonitoringPage'));

/***************************  DASHBOARD PAGE  ***************************/

export default function ThingsboardPage() {
  return <MonitoringPage />;
}
