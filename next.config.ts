import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The service worker and its manifest must never be served stale.
  async headers() {
    return ["/sw.js", "/sw-manifest.js"].map((source) => ({
      source,
      headers: [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
      ],
    }));
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
