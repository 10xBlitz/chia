import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    loader: "custom",
    loaderFile: "./src/lib/next/image-loader.ts",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "hmhtqgzcqoxssuhtmscp.supabase.co",
      },
    ],
  },
};

export default nextConfig;
