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

// Detect whether this config is loaded for a production build or dev server.
// process.argv is checked directly (more reliable than NODE_ENV timing):
//   next build  → argv contains "build"  → use webpack (no turbopack key)
//   next dev    → argv contains "dev"    → include turbopack.root so
//                 Turbopack picks the right workspace root on Replit
//                 (two lockfiles confuse the auto-detection).
const isProductionBuild = process.argv.some((a) => a === "build");

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
  // Only include turbopack config in dev — cPanel creates node_modules as a
  // symlink outside the project root, which causes Turbopack's Rust resolver
  // to panic. Webpack (used when this key is absent) follows symlinks fine.
  ...(!isProductionBuild && {
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
