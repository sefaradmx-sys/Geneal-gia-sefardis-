import type { NextConfig } from "next";

const basePath = process.env.NEXT_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: basePath || undefined,
  allowedDevOrigins: ["127.0.0.1", "*.trycloudflare.com"],
  experimental: {
    serverActions: {
      allowedOrigins: ["108.181.203.225:10049", "108.181.203.225:10050", "localhost:3000", "127.0.0.1:3000"],
    },
  },
};

export default nextConfig;
