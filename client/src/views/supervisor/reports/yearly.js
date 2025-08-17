'use client';

import React from 'react';
import useTrans from '@/hooks/useTrans';

function Yearly() {
  const trans = useTrans();
  return <div>{trans.placeholders.yearly}</div>;
}

export default Yearly;
