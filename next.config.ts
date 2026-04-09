import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    webpackBuildWorker: false,
  },
}

export default nextConfig