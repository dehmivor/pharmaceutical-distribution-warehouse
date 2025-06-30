// @next
import dynamic from 'next/dynamic';

// @project
const CreateInspectionWithExistImportOrderId = dynamic(() => import('@/views/warehouse/CreateInspectionWithExistImportOrderId'));

/***************************  DASHBOARD PAGE  ***************************/

export default function InspectionPages() {
  return <CreateInspectionWithExistImportOrderId />;
}
