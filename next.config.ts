import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const uploadTransportBodySizeLimit = "30mb";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "object-src 'none'",
      // React / Next dev tooling (Fast Refresh, overlays) needs eval; never in production builds.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.stripe.com https://js.stripe.com",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
      "media-src 'self' blob: https:"
    ].join("; ")
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  }
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],

  // Enable gzip/brotli compression for all responses
  compress: true,

  // Optimize image handling
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  experimental: {
    // Keep the Next.js request buffering limit aligned with the Server Action body cap.
    // This app uses proxy, so both limits must stay above the app-level 10 MB validation.
    proxyClientMaxBodySize: uploadTransportBodySizeLimit,
    serverActions: {
      bodySizeLimit: uploadTransportBodySizeLimit,
    },
  },

  async headers() {
    const cacheHeaders = isDev
      ? []
      : [
          // Aggressive caching for static assets (JS, CSS, fonts, images)
          {
            source: "/_next/static/:path*",
            headers: [
              {
                key: "Cache-Control",
                value: "public, max-age=31536000, immutable",
              },
            ],
          },
          // Cache public assets (images, icons, manifests)
          {
            source: "/(.*)\\.(ico|png|jpg|jpeg|svg|webp|avif|woff|woff2|ttf|otf)",
            headers: [
              {
                key: "Cache-Control",
                value: "public, max-age=86400, stale-while-revalidate=604800",
              },
            ],
          },
        ];
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      ...cacheHeaders,
    ];
  },
};

export default nextConfig;
