// @next
import dynamic from 'next/dynamic';

// @project
const RepresentativeDashboard = dynamic(() => import('@/views/representative/dashboard'));

/***************************  DASHBOARD PAGE  ***************************/

export default function RepresentativeDashboardPage() {
  return <RepresentativeDashboard />;
} 