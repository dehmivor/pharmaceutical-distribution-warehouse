import useConfig from '@/hooks/useConfig';
import en from '../../public/lang/en';
import vi from '../../public/lang/vi';
import { ThemeI18n } from '@/config';

export default function useTrans() {
  const { i18n } = useConfig();
  console.log('i18n đã được cập nhật để lấy ngôn ngữ', i18n);

  return i18n === ThemeI18n.VN ? vi : en;
}
