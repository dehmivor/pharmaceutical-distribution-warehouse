// @next
import dynamic from 'next/dynamic';

// @project
const ManageEconomicContractPage = dynamic(() => import('@/views/supervisor/economic-contract-page'));

/***************************  DASHBOARD PAGE  ***************************/

export default function EconomicContractPage() {
  return <ManageEconomicContractPage />;
}
