import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: false },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sentry-cdn.com https://static.cloudflareinsights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: https://*.r2.dev https://images.unsplash.com",
              "connect-src 'self' https: wss: https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://cloudflareinsights.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudflare.com",
        pathname: "/**",
      },
    ],
  },
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons", "recharts"],
  },
};

export default withSentryConfig(nextConfig, {
  // SEC-008: Remove hardcoded fallbacks — "ezana-group" / "printhub" were leaking
  // internal workspace names in the public source bundle. Require env vars explicitly;
  // the build will fail loudly if they are not set rather than silently using wrong values.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  silent: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,

  // SEC-009: automaticVercelMonitors is a top-level Sentry config option, NOT a
  // webpack option. Previously it was nested under `webpack:{}` where it was
  // silently ignored, meaning Vercel cron monitors were never set up.
  automaticVercelMonitors: true,
});
