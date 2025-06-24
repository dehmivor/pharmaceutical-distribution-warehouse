// @next
import dynamic from 'next/dynamic';

// @project
const ImportOrderPage = dynamic(() => import('@/views/representative/import-order-page'));

/***************************  IMPORT ORDER PAGE  ***************************/

export default function ImportOrderPages() {
  return <ImportOrderPage />;
}
