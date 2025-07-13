'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import QualityCheckPage from '../components/QualityCheckPage';

export default function Page() {
  const { id } = useParams(); // next/navigation hook for dynamic segments
  if (!id) return <p>Loading…</p>;
  return <QualityCheckPage id={id} />;
}
