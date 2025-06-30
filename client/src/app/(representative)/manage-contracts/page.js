// @next
import dynamic from 'next/dynamic';

// @project
const ContractPage = dynamic(() => import('@/views/representative/contract-page'));

/***************************  DASHBOARD PAGE  ***************************/

export default function ContractPages() {
  return <ContractPage />;
}
