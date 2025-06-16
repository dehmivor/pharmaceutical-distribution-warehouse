'use client';
import Loader from '@/components/Loader';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import React from 'react';

function ContractPage() {
  const { isLoading, hasAccess } = useRouteProtection(['representative']);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return <Loader />;
  }
  return <div>contract-page</div>;
}

export default ContractPage;
