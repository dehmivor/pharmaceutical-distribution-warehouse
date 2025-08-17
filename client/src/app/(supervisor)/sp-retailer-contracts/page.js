'use client';

import dynamic from 'next/dynamic';
// @project

const RetailerManagement = dynamic(() => import('@/views/supervisor/retailer-management'));

/***************************  SUPERVISOR - RETAILER MANAGEMENT  ***************************/

export default function Page() {
  return <RetailerManagement />;
}
