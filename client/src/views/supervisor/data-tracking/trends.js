import React from 'react';
import useTrans from '@/hooks/useTrans';

function trends() {
  const trans = useTrans();
  return <div>{trans.placeholders.trends}</div>;
}

export default trends;
