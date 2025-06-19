// @style
import './globals.css';

// @mui
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

// @project
import branding from '@/branding.json';
import ProviderWrapper from './ProviderWrapper';

export const viewport = {
  userScalable: false // Disables user scaling of the viewport.
};

export const metadata = {
  title: branding.brandName,
  description: `${branding.brandName} Pharmaceutical Distribution Warehouse`
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="mdl-js">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ProviderWrapper>{children}</ProviderWrapper>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
