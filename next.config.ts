import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable strict mode to reduce hydration warnings
  images: {
    domains: [
      "profile.line-scdn.net", // LINE profile images
      "obs.line-scdn.net",     // LINE OBS images
      "theredpotion.com",
      "red1.theredpotion.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "theredpotion.com",
      },
      {
        protocol: "https",
        hostname: "red1.theredpotion.com",
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
