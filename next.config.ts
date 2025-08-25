import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable strict mode to reduce hydration warnings
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during build
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "obs.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "theredpotion.com",
      },
      {
        protocol: "https",
        hostname: "red1.theredpotion.com",
      },
      {
        protocol: "https",
        hostname: "corgi.theredpotion.com",
      },
      {
        protocol: "https",
        hostname: "whatdadog.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL", // Allow embedding in LINE LIFF
          },
        ],
      },
    ];
  },
};

export default nextConfig;
