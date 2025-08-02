// @next
import dynamic from 'next/dynamic';

// @project

const SupplierContracts = dynamic(() => import('@/views/supervisor/supplier-contracts'));

/***************************  SUPERVISOR - SUPPLIER CONTRACTS  ***************************/

export default function SupplierContractsPage() {
  return <SupplierContracts />;
} 