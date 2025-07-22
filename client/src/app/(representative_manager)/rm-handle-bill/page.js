// @next
import dynamic from 'next/dynamic';

// @project
const HandleBill = dynamic(() => import('@/views/representative_manager/handle-bill'));

/***************************  DASHBOARD PAGE  ***************************/

export default function ContractPages() {
  return <HandleBill />;
}
