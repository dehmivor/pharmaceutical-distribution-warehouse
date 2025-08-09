'use client';
import dynamic from 'next/dynamic';

const InternalImportOrderDetailWH = dynamic(() => import('@/views/warehouse/InternalImportOrderDetail'));

export default function Page() {
  return <InternalImportOrderDetailWH />;
}
