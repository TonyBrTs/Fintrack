import type { NextConfig } from "next";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const apiUrl = rawApiUrl.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
};

export default nextConfig;
