// @next
import dynamic from 'next/dynamic';

// @project

const ManageInventory = dynamic(() => import('@/views/warehouse-manager/manage-inventory'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <ManageInventory/>;
}
