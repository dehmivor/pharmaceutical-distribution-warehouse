// @next
import dynamic from 'next/dynamic';

// @project
const RetailerContractPage = dynamic(() => import('@/views/representative/retailer-contract-page'));

/***************************  DASHBOARD PAGE  ***************************/

export default function RetailerContractPages() {
  return <RetailerContractPage />;
}
