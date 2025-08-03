import useConfig from '@/hooks/useConfig';
import en from '../../public/lang/en';
import vi from '../../public/lang/vi';
import { ThemeI18n } from '@/config';

export default function useTrans() {
  const { i18n } = useConfig();

  const trans = i18n === ThemeI18n.VN ? vi : en;

  return new Proxy(trans, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      return `{trans.${String(prop)}}`;
    },
  });
}
