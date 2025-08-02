import { useContext } from 'react';
import { ConfigContext } from '@/contexts/ConfigContext';

export default function useConfig() {
  return useContext(ConfigContext);
}
