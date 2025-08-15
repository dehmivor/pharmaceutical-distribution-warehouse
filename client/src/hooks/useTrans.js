import useConfig from '@/hooks/useConfig';
import en from '../../public/lang/en';
import vi from '../../public/lang/vi';
import { ThemeI18n } from '@/config';

function createRecursiveProxy(target, fallbackTarget) {
  return new Proxy(target, {
    get(obj, prop) {
      if (prop in obj) {
        const val = obj[prop];
        if (val && typeof val === 'object') {
          return createRecursiveProxy(val, fallbackTarget?.[prop]);
        }
        return val;
      }

      // ✅ FALLBACK: Kiểm tra fallback target trước
      if (fallbackTarget && prop in fallbackTarget) {
        const fallbackVal = fallbackTarget[prop];
        if (fallbackVal && typeof fallbackVal === 'object') {
          return createRecursiveProxy(fallbackVal);
        }
        return fallbackVal;
      }

      // ✅ FALLBACK CUỐI: Trả về prop name hoặc undefined
      return prop; // hoặc return undefined;
    }
  });
}

export default function useTrans() {
  try {
    const { i18n } = useConfig();
    const langTrans = i18n === ThemeI18n.VN ? vi : en;

    // ✅ Xử lý duplicate keys
    const cleanLangTrans = {};
    const cleanEn = {};

    // Lấy tất cả keys và merge
    Object.keys(langTrans).forEach((key) => {
      if (key === 'messages' || key === 'actions') {
        // Merge tất cả messages/actions
        cleanLangTrans[key] = { ...langTrans[key] };
      } else {
        cleanLangTrans[key] = langTrans[key];
      }
    });

    Object.keys(en).forEach((key) => {
      if (key === 'messages' || key === 'actions') {
        cleanEn[key] = { ...en[key] };
      } else {
        cleanEn[key] = en[key];
      }
    });

    return new Proxy(
      {},
      {
        get(_, prop) {
          if (prop in cleanLangTrans) {
            return cleanLangTrans[prop];
          }
          if (prop in cleanEn) {
            return cleanEn[prop];
          }
          return prop; // Fallback về key name
        }
      }
    );
  } catch (error) {
    console.warn('useTrans hook error:', error);
    return en;
  }
}
