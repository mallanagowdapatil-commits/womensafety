import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Disable the floating Next.js dev indicator badge (black 'N' icon)
  devIndicators: false,
};

export default nextConfig;
