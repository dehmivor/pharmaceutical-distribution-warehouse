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

      return new Proxy(trans, {
        get(target, prop) {
          if (prop in target) {
            return target[prop];
          }
          // Trả về undefined thay vì raw text để component có thể fallback
          return undefined;
        }
      });
    } catch (error) {
      console.warn('useTrans hook error, falling back to English:', error);
      // Fallback to English if there's any error
      return new Proxy(en, {
        get(target, prop) {
          if (prop in target) {
            return target[prop];
          }
          // Trả về undefined thay vì raw text để component có thể fallback
          return undefined;
        }
      });
    }
  }, [i18n]); // Chỉ tạo lại khi i18n thay đổi
}
