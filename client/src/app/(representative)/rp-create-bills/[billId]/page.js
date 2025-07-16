// @next
import dynamic from 'next/dynamic';

// @project
const CreateBillWithExistId = dynamic(() => import('@/views/representative_manager/create-bill-existed'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DashboardPage() {
  return <CreateBillWithExistId />;
}
