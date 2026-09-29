import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Hide the Next.js dev-tools badge in the corner during development.
  devIndicators: false,
  images: {
    // Lot photos and verification documents are uploaded to Cloudinary by the backend.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  experimental: {
    optimizePackageImports: ["react-icons", "recharts"],
  },
};

export default nextConfig;
