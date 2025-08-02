// @next
import dynamic from 'next/dynamic';

// @project
const Support = dynamic(() => import('@/views/supervisor/support'));

/***************************  DASHBOARD PAGE  ***************************/

export default function ThingsboardPage() {
  return <Support />;
}
