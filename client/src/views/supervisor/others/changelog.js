'use client';

import React from 'react';
import useTrans from '@/hooks/useTrans';

function Changelog() {
  const trans = useTrans();
  return <div>{trans.placeholders.changelog}</div>;
}

export default Changelog;
