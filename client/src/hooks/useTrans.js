import useConfig from '@/hooks/useConfig';
import en from '../../public/lang/en';
import vi from '../../public/lang/vi';
import { ThemeI18n } from '@/config';
import { useMemo } from 'react';

export default function useTrans() {
  const { i18n } = useConfig();

  return useMemo(() => {
    try {
      // Fallback to English if i18n is not available
      const trans = i18n === ThemeI18n.VN ? vi : en;

      // Return a function that can access nested properties
      return (key) => {
        if (!key) return '';
        
        // Handle nested keys like 'aiTrends.title'
        const keys = key.split('.');
        let value = trans;
        
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return key; // Return the key if not found
          }
        }
        
        return value || key;
      };
    } catch (error) {
      console.warn('useTrans hook error, falling back to English:', error);
      // Fallback to English if there's any error
      const trans = en;
      
      return (key) => {
        if (!key) return '';
        
        // Handle nested keys like 'aiTrends.title'
        const keys = key.split('.');
        let value = trans;
        
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return key; // Return the key if not found
          }
        }
        
        return value || key;
      };
    }
  }, [i18n]); // Chỉ tạo lại khi i18n thay đổi
}
