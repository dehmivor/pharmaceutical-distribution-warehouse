import React from 'react';
import useTrans from '@/hooks/useTrans';

function yearly() {
  const trans = useTrans();
  return <div>{trans.placeholders.yearly}</div>;
}

export default yearly;
