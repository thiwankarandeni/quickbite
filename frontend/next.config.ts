import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: pages are prerendered into a static "shell" by default.
  // Anything that needs request data (cookies, params, uncached fetches) must sit
  // inside a <Suspense> boundary and streams in at request time.
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // next/image only optimizes images from hosts listed here. Admins can enter
    // any image URL, so we allow every https host. A real app would restrict this.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
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
