import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "c94c1600-5b3b-4338-a137-b8253b6a2c33-00-257lpz35565p3.pike.replit.dev",
    "*.pike.replit.dev",
    "*.replit.dev",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;
