import type { NextConfig } from "next";
import path from "path";
import os from "os";

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

// Why use os.homedir() as turbopack.root?
//
// Next.js 16 uses Turbopack for BOTH `next dev` and `next build` — there is
// no config key or CLI flag to switch back to webpack.
//
// Problem on cPanel shared hosting:
//   cPanel's Node.js virtual env installs packages into nodevenv/:
//     /home/<user>/nodevenv/public_html/…/node_modules  (real packages here)
//   Then it creates a SYMLINK in the project directory:
//     /home/<user>/public_html/misipintar/node_modules -> ↑
//
//   Turbopack's Rust filesystem refuses to follow symlinks that point OUTSIDE
//   its declared root. If root = misipintar/, the nodevenv path is outside →
//   PANIC: "Symlink [project]/node_modules is invalid, points out of root".
//   If no root is set, Turbopack auto-detects parent dir via lockfile scan and
//   still can't find next/package.json → "couldn't find Next.js package".
//
// Fix: set root = $HOME (e.g. /home/smknwon2/).
//   Both the project directory AND the nodevenv symlink target live under
//   $HOME, so Turbopack can follow the symlink safely.
//   On Replit, $HOME is /home/runner and the workspace is inside it — same fix
//   also solves the two-lockfile workspace-root confusion.
const turbopackRoot = os.homedir();

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
  turbopack: {
    root: turbopackRoot,
  },
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
