// @next
import dynamic from 'next/dynamic';

// @project
const Support = dynamic(() => import('@/views/supervisor/others/support'));

/***************************  DASHBOARD PAGE  ***************************/

export default function ThingsboardPage() {
  return <Support />;
}
