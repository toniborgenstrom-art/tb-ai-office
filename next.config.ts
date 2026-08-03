import type { NextConfig } from "next";

// Keep local development files separate from production builds. This prevents
// the development server from serving stale CSS after `next build` has run.
const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next"
};

export default nextConfig;
