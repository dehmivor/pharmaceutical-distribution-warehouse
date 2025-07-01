// @next
import dynamic from 'next/dynamic';

// @project

const ApproveInspection = dynamic(() => import('@/views/warehouse_manager/approve-inspection/ApproveInspection'));

/***************************  AUTH - LOGIN  ***************************/

export default function ApproveInspectionPages() {
  return <ApproveInspection />;
}
