import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
