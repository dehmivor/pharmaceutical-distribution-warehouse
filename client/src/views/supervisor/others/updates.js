import React from 'react';
import useTrans from '@/hooks/useTrans';

function updates() {
  const trans = useTrans();
  return <div>{trans.placeholders.updates}</div>;
}

export default updates;
