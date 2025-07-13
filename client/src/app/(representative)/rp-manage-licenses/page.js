// @next
import dynamic from 'next/dynamic';

// @project
const LicensePage = dynamic(() => import('@/views/representative/license-page'));

/***************************  DASHBOARD PAGE  ***************************/

export default function LicensePages() {
  return <LicensePage />;
}
