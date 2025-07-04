// @next
import dynamic from 'next/dynamic';

// @project
const EconomicContractPage = dynamic(() => import('@/views/representative/economic-contract-page'));

/***************************  DASHBOARD PAGE  ***************************/

export default function EconomicContractPagesRepresentative() {
  return <EconomicContractPage />;
}