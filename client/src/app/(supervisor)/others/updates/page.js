// @next
import dynamic from 'next/dynamic';

// @project
const Updates = dynamic(() => import('@/views/supervisor/others/updates'));

/***************************  DASHBOARD PAGE  ***************************/

export default function ThingsboardPage() {
  return <Support />;
}
