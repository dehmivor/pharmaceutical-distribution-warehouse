'use client';

import dynamic from 'next/dynamic';
// @project

const SupplierManagement = dynamic(() => import('@/views/supervisor/supplier-management'));

/***************************  SUPERVISOR - SUPPLIER MANAGEMENT  ***************************/

export default function Page() {
  return <SupplierManagement />;
}
