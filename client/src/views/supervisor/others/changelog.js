import React from 'react';
import useTrans from '@/hooks/useTrans';

function changelog() {
  const trans = useTrans();
  return <div>{trans.placeholders.changelog}</div>;
}

export default changelog;
