import type { NextConfig } from "next";

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

// Satu sumber kebenaran untuk paket yang tidak boleh di-bundle:
// - CJS-heavy / native binaries (Prisma, nodemailer, bullmq)
// - ESM-only / type:"module" (nanoid v5, @react-pdf/renderer)
// Dipakai oleh serverExternalPackages (Turbopack) DAN webpack externals.
// Tambahkan paket baru di sini saja — keduanya otomatis sinkron.
const SERVER_EXTERNAL_PACKAGES = [
  "nodemailer",
  "bullmq",
  "@prisma/client",
  "@prisma/adapter-pg",
  "@prisma/engines",
  "prisma",
  "@react-pdf/renderer",
  "nanoid",
  "firebase-admin",
  "ioredis",
] as const;

const nextConfig: NextConfig = {
  output: "standalone",
  staticPageGenerationTimeout: 60,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: [
    "*.pike.replit.dev",
    "*.replit.dev",
    "*.sisko.replit.dev",
    "mp.jobenapp.cloud",
    "*.jobenapp.cloud",
  ],
  images: {
    // unoptimized: cegah Sharp (native module) crash di cPanel shared hosting
    // (ulimit -u rendah → compile native addon gagal → SIGSEGV di runtime)
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "api.sandbox.midtrans.com" },
      { protocol: "https", hostname: "api.midtrans.com" },
      { protocol: "https", hostname: "*.midtrans.com" },
      { protocol: "https", hostname: "qris.online" },
    ],
  },
  // Satu sumber kebenaran — dipakai oleh serverExternalPackages (Turbopack/dev)
  // dan webpack externals (--webpack build untuk cPanel) sekaligus.
  // Tambahkan paket baru di sini saja; keduanya otomatis sinkron.
  serverExternalPackages: SERVER_EXTERNAL_PACKAGES,
  webpack: (config, { isServer }) => {
    // Batasi parallelism — cPanel shared hosting punya ulimit -u rendah
    config.parallelism = 1;

    // Native .node binaries (Prisma engine, grpc, etc.) — jangan di-bundle,
    // cukup skip; mereka di-load via require() di runtime oleh package-nya sendiri.
    // Tanpa ini webpack memanggil WasmHash.update(undefined) → crash build.
    config.module.rules.push({
      test: /\.node$/,
      loader: "node-loader",
    });

    // Externals resolver: tangkap semua import yang berakhiran .node
    // dan semua sub-path dari package yang sudah diexternalize.
    const nativeExternalFn = (
      { request }: { request?: string },
      callback: (err?: Error | null, result?: string) => void
    ) => {
      if (request && request.endsWith(".node")) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    };

    if (isServer) {
      const existing = config.externals || [];
      config.externals = Array.isArray(existing)
        ? [...existing, ...SERVER_EXTERNAL_PACKAGES, nativeExternalFn]
        : [existing, ...SERVER_EXTERNAL_PACKAGES, nativeExternalFn];
    } else {
      // Client build: hanya perlu mencegah .node files masuk bundle
      const existing = config.externals || [];
      config.externals = Array.isArray(existing)
        ? [...existing, nativeExternalFn]
        : [existing, nativeExternalFn];
    }

    return config;
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
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
