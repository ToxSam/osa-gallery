/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Remove the old i18n config
  // i18n: {
  //   locales: ['en', 'ja'],
  //   defaultLocale: 'en',
  //   domains: [
  //     {
  //       domain: 'opensourceavatars.com',
  //       defaultLocale: 'ja',
  //       locales: ['ja'],
  //     },
  //     {
  //       domain: 'opensourceavatars.com',
  //       defaultLocale: 'en',
  //       locales: ['en'],
  //     },
  //   ],
  // },

  // Add middleware configuration for i18n
  experimental: {
    // Keep existing experimental configs
    serverComponentsExternalPackages: ['@prisma/client'],
  },

  // Rest of your existing config...
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.opensourceavatars.com',
      },
      {
        protocol: 'https',
        hostname: 'assetsdev.opensourceavatars.com',
      }
    ],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  output: 'standalone',
  
  // Configure dynamic route handling
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      }
    ]
  },
  
  async headers() {
    return [
      {
        // Security headers for all pages
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' blob: https://*.ipfs.io https://dweb.link https://*.dweb.link https://gateway.pinata.cloud https://*.arweave.net https://arweave.net https://raw.githubusercontent.com https://api.github.com https://*.githubusercontent.com https://assets.opensourceavatars.com; frame-ancestors 'self';"
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ],
      },
      {
        // CORS headers for API routes (keep existing)
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  }
};

module.exports = nextConfig;