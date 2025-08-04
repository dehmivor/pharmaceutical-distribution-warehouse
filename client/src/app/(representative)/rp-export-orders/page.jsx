// @next
import dynamic from 'next/dynamic';

// @project
const ExportOrderPage = dynamic(() => import('@/views/representative/export-order-page'));

export default function Page() {
  return <ExportOrderPage />;
}
