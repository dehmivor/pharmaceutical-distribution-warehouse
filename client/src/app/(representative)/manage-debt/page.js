// @next
import dynamic from 'next/dynamic';

// @project
const DebtPage = dynamic(() => import('@/views/representative/debt-page'));

/***************************  DASHBOARD PAGE  ***************************/

export default function DebtPages() {
  return <DebtPage />;
}
