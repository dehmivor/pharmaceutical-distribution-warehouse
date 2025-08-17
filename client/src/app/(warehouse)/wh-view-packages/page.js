'use client';

import dynamic from 'next/dynamic';

const PackageManagement = dynamic(() => import('@/sections/components/package/PackageManagement'), {
  ssr: false
});

export default function WarehousePackagePage() {
  return <PackageManagement />;
}
