// @next
import dynamic from 'next/dynamic';

// @project

const ManagerMedicine = dynamic(() => import('@/views/supervisor/manage-medicines'));

export default function ManageMedicine() {
  return <ManagerMedicine />;
}
