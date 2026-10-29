import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The starter enabled Cache Components / partial prefetching. Every page in
  // this app depends on the signed-in user's cookie and live database rows, so
  // there is no static shell worth prerendering, and the mode made every
  // dashboard route throw "uncached data during prerendering".
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
