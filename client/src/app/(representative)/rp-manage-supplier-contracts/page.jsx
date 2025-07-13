// @next
import dynamic from 'next/dynamic';

// @project
const SupplierContractPage = dynamic(() => import('@/views/representative/supplier-contract-page'));

/***************************  DASHBOARD PAGE  ***************************/

export default function SupplierContractPages() {
  return <SupplierContractPage />;
}
