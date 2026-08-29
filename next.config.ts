import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // tfjs and the basic-pitch model loader read from disk; keep them out of the bundle.
  serverExternalPackages: ["@spotify/basic-pitch", "@tensorflow/tfjs"],
};

export default nextConfig;
