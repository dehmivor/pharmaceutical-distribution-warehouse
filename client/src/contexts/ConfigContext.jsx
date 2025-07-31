'use client';

import PropTypes from 'prop-types';
import { createContext, useCallback } from 'react';

import defaultConfig from '@/config';
import useLocalStorage from '@/hooks/useLocalStorage';

const initialState = { ...defaultConfig };

const ConfigContext = createContext({
  ...initialState,
  setI18n: () => {}
});

function ConfigProvider({ children }) {
  const [config, setConfig] = useLocalStorage('sass-able-react-mui-admin-next-ts', initialState);

  const setI18n = (newLocale) => {
    setConfig((prev) => ({ ...prev, i18n: newLocale }));
  };

  return <ConfigContext.Provider value={{ ...config, setI18n }}>{children}</ConfigContext.Provider>;
}

ConfigProvider.propTypes = {
  children: PropTypes.any
};

export { ConfigProvider, ConfigContext };
