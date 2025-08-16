// @next
import dynamic from 'next/dynamic';

// @project
const ContractPage = dynamic(() => import('@/views/representative_manager/medicine-performance'));

/***************************  DASHBOARD PAGE  ***************************/

export default function ContractPages() {
  return <ContractPage />;
}
