// @next
import dynamic from 'next/dynamic';

// @project

const Trends = dynamic(() => import('@/views/supervisor/data-tracking/trends'));

/***************************  IMPORT ORDERS MANAGEMENT  ***************************/

export default function Pages() {
  return <Trends />;
}
