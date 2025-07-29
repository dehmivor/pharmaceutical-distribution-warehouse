// @next
import dynamic from 'next/dynamic';

// @project

const CheckInspections = dynamic(() => import('@/views/warehouse/wh-check-inspections'));

/***************************  IMPORT ORDERS MANAGEMENT  ***************************/

export default function ImportOrdersPage() {
  return <CheckInspections />;
}
