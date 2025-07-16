// @next
import dynamic from 'next/dynamic';

// @project
const CreateBill = dynamic(() => import('@/views/representative_manager/create-bill'));

/***************************  DASHBOARD PAGE  ***************************/

export default function CreateBillPages() {
  return <CreateBill />;
}
