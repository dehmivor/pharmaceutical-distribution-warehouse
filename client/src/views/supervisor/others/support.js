import React from 'react';
import useTrans from '@/hooks/useTrans';

function support() {
  const trans = useTrans();
  return <div>{trans.placeholders.support}</div>;
}

export default support;
