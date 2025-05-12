/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Enable React strict mode for better development practices
  reactStrictMode: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Development optimizations
  experimental: {
    // Enable optimized compilation
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui', '@heroicons', 'react-icons'],
    // Memory optimizations
    webpackMemoryOptimizations: true,
    // Server actions configuration - properly formatted as an object
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Optimize development build time
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
      
      // Add cache settings
      config.cache = {
        type: 'filesystem',
        version: `${process.env.NODE_ENV}-${isServer}`,
        cacheDirectory: path.resolve(__dirname, '.next/cache/webpack'),
        store: 'pack',
        buildDependencies: {
          config: [__filename],
        },
      }

      // Optimize module resolution
      config.resolve.cache = true
      
      // Reduce bundle size in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
    }

    return config
  },

  // Improve module resolution
  modularizeImports: {
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}',
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}',
    },
  },

  // External packages configuration
  serverExternalPackages: ['@prisma/client', '@trpc/server', 'ethers'],
  
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Environment variables that will be available at build time
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV,
  },

  // Configure headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 