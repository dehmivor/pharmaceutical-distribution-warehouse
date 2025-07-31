import en from '../public/lang/en.js';
import vi from '../public/lang/vi.js';
import useConfig from '@/hooks/useConfig';

const useTrans = () => {
  const { i18n } = useConfig();
  return i18n === 'vi' ? vi : en;
};

export default useTrans;
