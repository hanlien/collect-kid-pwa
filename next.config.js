const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
    // Use the supported excludes API to avoid micromatch stack overflows on Vercel
    outputFileTracingExcludes: {
      '*': [
        '**/ml/**',
        '**/ml_env/**',
        '**/.venv/**',
        '**/__pycache__/**',
        '**/*.py',
        // Heavy browser-only packages that shouldn't be traced for server output
        '**/node_modules/@tensorflow/**',
        '**/node_modules/canvas/**',
        '**/node_modules/canvas-confetti/**',
        '**/node_modules/lottie-react/**',
      ],
    },
  },
  
  // Expose app version to the client
  env: {
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
  },
  
  // Fix build trace collection issues
  outputFileTracing: true,
  
  // Exclude problematic directories from build traces
  excludeDefaultMomentLocales: true,
  
  // Webpack configuration to handle large dependency trees
  webpack: (config, { isServer }) => {
    // Ignore Python/ML directories during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/ml_env/**',
        '**/.venv/**',
        '**/ml/dataset/**',
        '**/ml/metrics/**',
        '**/__pycache__/**',
      ],
    };

    // Externalize heavy browser-only libs from server bundles
    if (isServer) {
      const externals = config.externals || [];
      config.externals = [
        ...externals,
        ({ request }, callback) => {
          const externalsList = [
            '@tensorflow/tfjs',
            '@tensorflow/tfjs-backend-webgl',
            '@tensorflow/tfjs-backend-cpu',
            'canvas-confetti',
            'lottie-react',
          ];
          if (request && externalsList.includes(request)) {
            return callback(null, 'commonjs ' + request);
          }
          callback();
        },
      ];
    }

    return config;
  },
  
  // Compress and optimize images
  images: {
    domains: ['upload.wikimedia.org', 'api.gbif.org'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Headers for performance and caching
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
