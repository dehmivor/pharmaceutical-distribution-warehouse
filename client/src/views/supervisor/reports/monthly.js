import React from 'react';
import useTrans from '@/hooks/useTrans';

function monthly() {
  const trans = useTrans();
  return <div>{trans.placeholders.monthly}</div>;
}

export default monthly;
