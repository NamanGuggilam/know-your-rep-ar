import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Candidate positions and officials' records are JSON files read at request time. Ship them with every route.
  outputFileTracingIncludes: {
    "/**": ["./src/data/**/*.json"],
  },
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
