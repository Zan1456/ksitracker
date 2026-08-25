import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "motion" ships many named exports from a single entry; this makes the
  // build only include the ones actually imported instead of the whole lib.
  experimental: {
    optimizePackageImports: ["motion"],
  },
};

export default nextConfig;
