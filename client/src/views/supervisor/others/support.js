'use client';

import React from 'react';
import useTrans from '@/hooks/useTrans';

function Support() {
  const trans = useTrans();
  return <div>{trans.placeholders.support}</div>;
}

export default Support;
