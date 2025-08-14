import React from 'react';
import useTrans from '@/hooks/useTrans';

function weekly() {
  const trans = useTrans();
  return <div>{trans.placeholders.weekly}</div>;
}

export default weekly;
