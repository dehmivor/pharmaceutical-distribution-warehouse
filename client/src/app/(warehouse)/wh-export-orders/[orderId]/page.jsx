// @next
import dynamic from 'next/dynamic';

// @project

const AssignedExportOrderDetail = dynamic(() => import('@/views/warehouse/ExportOrderDetail'));

/***************************  AUTH - LOGIN  ***************************/

export default function Login() {
  return <AssignedExportOrderDetail />;
}
