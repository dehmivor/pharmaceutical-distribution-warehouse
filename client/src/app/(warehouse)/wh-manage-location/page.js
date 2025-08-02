// @next
import dynamic from 'next/dynamic';

// @project

const ViewListLocation = dynamic(() => import('@/views/warehouse/wh-location'));

/***************************  IMPORT ORDERS MANAGEMENT  ***************************/

export default function ImportOrdersPage() {
  return <ViewListLocation />;
}
