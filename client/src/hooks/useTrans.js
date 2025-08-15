import useConfig from '@/hooks/useConfig';
import en from '../../public/lang/en';
import vi from '../../public/lang/vi';
import { ThemeI18n } from '@/config';

function createRecursiveProxy(target) {
  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) {
        const val = obj[prop];
        if (val && typeof val === 'object') {
          return createRecursiveProxy(val);
        }
        return val;
      }
      return `{trans.${String(prop)}}`;
    }
  });
}

export default function useTrans() {
  try {
    const { i18n } = useConfig();
    const langTrans = i18n === ThemeI18n.VN ? vi : en;

    // Tạo 2 proxy cho cả ngôn ngữ hiện tại và fallback en (đệ quy)
    const proxyLang = createRecursiveProxy(langTrans);
    const proxyEn = createRecursiveProxy(en);

    return new Proxy(
      {},
      {
        get(_, prop) {
          if (prop in langTrans) {
            return proxyLang[prop];
          }
          if (prop in en) {
            return proxyEn[prop];
          }

          return `{trans.${String(prop)}}`;
        }
      }
    );
  } catch (error) {
    console.warn('useTrans hook error, falling back to English:', error);
    return createRecursiveProxy(en);
  }
}
