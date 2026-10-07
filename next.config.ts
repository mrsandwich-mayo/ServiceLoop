import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "ais-dev-iiswqtcjuu34hx32w3kzzb-926867417279.asia-east1.run.app",
    "ais-pre-iiswqtcjuu34hx32w3kzzb-926867417279.asia-east1.run.app",
    "*.run.app",
  ],
};

export default nextConfig;
