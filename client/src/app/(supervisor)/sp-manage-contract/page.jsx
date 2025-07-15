// @next
import dynamic from 'next/dynamic';

// @project

const ContractManager = dynamic(() => import('@/views/supervisor/contract-manager'));

/***************************  AUTH - LOGIN  ***************************/

export default function ContractPages() {
  return <ContractManager />;
}
