'use client';
import { ConfigContext } from '@/contexts/ConfigContext';
import { useContext } from 'react';

export default function useConfig() {
  return useContext(ConfigContext);
}
