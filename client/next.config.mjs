/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false,
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}'
    },
    '@mui/lab': {
      transform: '@mui/lab/{{member}}'
    }
  },
  async rewrites() {
    const apiUrl =
      process.env.NODE_ENV === 'production' ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*` : 'http://localhost:5000/api/:path*';
    return [
      {
        source: '/api/:path*',
        destination: apiUrl
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '**'
      },
      {
        protocol: 'https',
        hostname: 'js.stripe.com',
        pathname: '**'
      }
    ]
  },
  async headers() {
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://flagcdn.com https://*.stripe.com;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-src 'self' https://js.stripe.com;
      connect-src 'self' http://localhost:5000 https://api.stripe.com ${process.env.NEXT_PUBLIC_API_URL || ''};
    `
      .replace(/\s{2,}/g, ' ')
      .trim();

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  },
  output: 'standalone'
};

export default nextConfig;
