// @next
import dynamic from 'next/dynamic';

// @project

const ManageImportOrder = dynamic(() => import('@/views/warehouse/ManageOrderPage'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <ManageImportOrder />;
}
