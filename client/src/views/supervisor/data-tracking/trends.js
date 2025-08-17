'use client';

import React from 'react';
import useTrans from '@/hooks/useTrans';

function Trends() {
  const trans = useTrans();
  return <div>{trans.placeholders.trends}</div>;
}

export default Trends;
