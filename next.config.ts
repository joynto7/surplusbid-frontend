import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Hide the Next.js dev-tools badge in the corner during development.
  devIndicators: false,
  images: {
    remotePatterns: [
      // Lot photos and verification documents uploaded through the app live on Cloudinary.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Catalogue, hero and blog photography (free Unsplash images, sized by query string).
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["react-icons", "recharts"],
  },
};

export default nextConfig;
