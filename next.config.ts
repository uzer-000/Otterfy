import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Keep serverless bundles small so Vercel "Functions Storage" stays inside the free tier.
  // The app only uses the Node.js "library" engine for PostgreSQL; every other Prisma
  // runtime (wasm/edge/react-native, other databases, source maps, CLI) is dead weight.
  outputFileTracingExcludes: {
    '/*': [
      'node_modules/@prisma/client/runtime/*.wasm-base64.*',
      'node_modules/@prisma/client/runtime/query_engine_bg.*',
      'node_modules/@prisma/client/runtime/query_compiler_bg.*',
      'node_modules/@prisma/client/runtime/*.map',
      'node_modules/@prisma/client/runtime/edge*',
      'node_modules/@prisma/client/runtime/react-native*',
      'node_modules/@prisma/client/runtime/wasm-*',
      'node_modules/@prisma/client/runtime/binary*',
      'node_modules/@prisma/client/runtime/index-browser*',
      'node_modules/@prisma/client/runtime/*.d.ts',
      'node_modules/@prisma/client/runtime/*.d.mts',
      'node_modules/.prisma/client/query_engine_bg.*',
      'node_modules/.prisma/client/*.tmp*',
      'node_modules/.prisma/client/query_engine-windows*',
      'node_modules/@prisma/engines/**',
      'node_modules/prisma/**',
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      ...(process.env.NODE_ENV === 'production'
        ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
        : []),
    ];
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
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
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
