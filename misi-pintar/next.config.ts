import type { NextConfig } from "next";
import path from "path";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    "*.pike.replit.dev",
    "*.replit.dev",
    "*.sisko.replit.dev",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.sandbox.midtrans.com" },
      { protocol: "https", hostname: "api.midtrans.com" },
      { protocol: "https", hostname: "*.midtrans.com" },
      { protocol: "https", hostname: "qris.online" },
    ],
  },
  serverExternalPackages: ["nodemailer"],
  // turbopack.root is needed in dev (Replit has two lockfiles and Turbopack
  // picks the wrong workspace root). In production (next build), we use
  // webpack which resolves modules via NODE_PATH — compatible with cPanel's
  // virtual env package layout.
  ...(isDev && {
    turbopack: {
      root: path.resolve(__dirname),
    },
  }),
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default nextConfig;
