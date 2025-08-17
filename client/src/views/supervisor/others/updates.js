'use client';

import React from 'react';
import useTrans from '@/hooks/useTrans';

function Updates() {
  const trans = useTrans();
  return <div>{trans.placeholders.updates}</div>;
}

export default Updates;
