// @next
import dynamic from 'next/dynamic';

// @project
const PackageManagement = dynamic(() => import('@/sections/components/package/PackageManagement'));

export default function PackageManagementPage() {
  return <PackageManagement />;
}
