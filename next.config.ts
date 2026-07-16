import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the lockfile workspace-root warning on machines with a parent package-lock.json
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      // Serve existing static pages from public/ at their clean URLs.
      { source: "/",              destination: "/index.html"         },
      { source: "/linkedin-plan", destination: "/linkedin-plan.html" },
      { source: "/refund-policy", destination: "/refund-policy.html" },
      { source: "/qnaregistration", destination: "/qnaregistration.html" },
    ];
  },
};

export default nextConfig;
