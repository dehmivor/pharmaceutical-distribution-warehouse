'use client';

import PropTypes from 'prop-types';

// @project
import Notistack from '@/components/third-party/Notistack';
import { ConfigProvider } from '@/contexts/ConfigContext';
import ThemeCustomization from '@/themes';
import { RoleProvider } from '@/contexts/RoleContext';
import { AuthProvider } from '@/contexts/AuthContext';

/***************************  LAYOUT - CONFIG, THEME  ***************************/

export default function ProviderWrapper({ children }) {
  return (
    <ConfigProvider>
      <ThemeCustomization>
        <AuthProvider>
          <RoleProvider>
            <Notistack>{children}</Notistack>
          </RoleProvider>
        </AuthProvider>
      </ThemeCustomization>
    </ConfigProvider>
  );
}

ProviderWrapper.propTypes = { children: PropTypes.any };
