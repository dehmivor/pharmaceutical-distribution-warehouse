// @next
import dynamic from 'next/dynamic';

// @project

const Alerts = dynamic(() => import('@/views/supervisor/alerts'));

/***************************  IMPORT ORDERS MANAGEMENT  ***************************/

export default function ImportOrdersPage() {
  return <Alerts />;
}
