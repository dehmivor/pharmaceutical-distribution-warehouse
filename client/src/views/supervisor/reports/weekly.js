'use client';

import React from 'react';
import useTrans from '@/hooks/useTrans';

function Weekly() {
  const trans = useTrans();
  return <div>{trans.placeholders.weekly}</div>;
}

export default Weekly;
