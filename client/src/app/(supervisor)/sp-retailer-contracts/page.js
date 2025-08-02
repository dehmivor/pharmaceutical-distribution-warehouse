// @next
import dynamic from 'next/dynamic';

// @project

const RetailerContracts = dynamic(() => import('@/views/supervisor/retailer-contracts'));

/***************************  SUPERVISOR - RETAILER CONTRACTS  ***************************/

export default function RetailerContractsPage() {
  return <RetailerContracts />;
} 