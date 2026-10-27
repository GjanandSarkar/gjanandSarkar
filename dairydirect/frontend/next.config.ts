import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import path from "path";

const nextConfig: NextConfig = {
  /* Production optimizations */
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Silence the multiple lockfiles warning
  outputFileTracingRoot: path.join(__dirname, '../..'),

  // Keep heavy server-only packages out of the edge bundle for faster cold starts.
  // maplibre-gl is massive (~5 MB raw); it must never be bundled into any
  // customer-facing chunk.  The OrderTrackingMap component is already wrapped
  // in Next.js dynamic() (ssr: false), but adding it here provides a hard
  // safety net at the build level.
  serverExternalPackages: ['pg', 'ioredis', 'maplibre-gl'],

  allowedDevOrigins: [
    "scary-porcupine-headsman.ngrok-free.dev",
  ],
  /* Image optimization */
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Supabase Storage — scoped to the project host (not all supabase.co subdomains)
      {
        protocol: 'https',
        hostname: 'lnjdlpfbglrczcmiwlfg.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'awiyxxbzqjluoqowoiqk.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Google profile avatars (OAuth)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  /* Rewrites */
  async rewrites() {
    return {
      beforeFiles: [
        // The landing URL used to be a client component that rendered an empty
        // div, waited for React to hydrate, waited for the Supabase auth
        // session to resolve, and only then client-side navigated to /home.
        // Every first-time visitor therefore stared at a blank page for the
        // length of: JS download + hydration + auth round-trip + a second
        // route transition — before any content existed.
        //
        // A rewrite serves the real (statically rendered) storefront HTML at
        // `/` immediately, with no redirect hop and no JS required to paint.
        { source: '/', destination: '/home' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },

  /* Security + caching headers */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          // HSTS: 1 year, include subdomains, preload-ready
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // CSP: restrictive but workable for this stack.
          // 'unsafe-inline' on script-src is required by Next.js inline scripts.
          // Tighten further (nonce/hash) once Sentry tunnel and analytics are confirmed.
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://api.razorpay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://ik.imagekit.io https://lnjdlpfbglrczcmiwlfg.supabase.co https://awiyxxbzqjluoqowoiqk.supabase.co https://lh3.googleusercontent.com https://*.googleusercontent.com",
              "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://*.sentry.io wss://*.supabase.co",
              "frame-src https://api.razorpay.com https://checkout.razorpay.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // Cache public product API responses for 60s at CDN/browser level
        source: '/api/products',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
      {
        // Search result pages: cache per URL (each ?q= is a distinct URL).
        // 60 s is short enough that a newly added product appears quickly.
        source: '/search',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ];
  },

  /* Experimental features for performance */
  experimental: {
    // Tree-shake named exports from these packages so only the icons/components
    // actually used are included in each chunk.
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', 'date-fns'],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "gjanand-sarkar",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
