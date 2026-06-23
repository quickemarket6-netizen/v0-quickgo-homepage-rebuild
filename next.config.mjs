import withPWA from "@ducanh2912/next-pwa"

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },

  // Images optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      { protocol: "https", hostname: "**.vercel-storage.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Performance
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "framer-motion", "@radix-ui/react-icons"],
  },

  // ── Security & caching headers ──────────────────────────────────────────────
  async headers() {
    const isProd = process.env.NODE_ENV === "production"

    const globalHeaders = [
      { key: "X-DNS-Prefetch-Control",   value: "on" },
      { key: "X-Content-Type-Options",   value: "nosniff" },
      { key: "X-Frame-Options",          value: "DENY" },
      { key: "X-XSS-Protection",         value: "1; mode=block" },
      { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: [
          "camera=()",
          "microphone=()",
          "geolocation=(self)",
          "payment=(self)",
          "usb=()",
          "bluetooth=()",
          "midi=()",
          "magnetometer=()",
          "gyroscope=()",
          "accelerometer=()",
        ].join(", "),
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          // 'unsafe-inline' required: JSON-LD dangerouslySetInnerHTML + Framer Motion inline styles
          "script-src 'self' 'unsafe-inline' https://vercel.live",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https://*.vercel-storage.com https://*.supabase.co https://images.unsplash.com",
          "font-src 'self'",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io https://vitals.vercel-insights.com https://vercel.live",
          "media-src 'self' https://*.vercel-storage.com",
          "frame-src 'none'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "upgrade-insecure-requests",
        ].join("; "),
      },
      // HSTS — only in production (avoids breaking localhost https redirects)
      ...(isProd
        ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
        : []),
    ]

    return [
      { source: "/:path*", headers: globalHeaders },

      // Private routes: no indexing
      {
        source: "/(admin|dashboard|vendor/dashboard|driver/dashboard|wallet)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },

      // Long-lived cache for static assets
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ]
  },

  // ── SEO redirects ────────────────────────────────────────────────────────────
  async redirects() {
    return [
      { source: "/home",  destination: "/", permanent: true },
      { source: "/index", destination: "/", permanent: true },
    ]
  },
}

const withPWAConfig = withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})

export default withPWAConfig(nextConfig)
