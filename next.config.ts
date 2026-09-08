import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the lockfile workspace-root warning on machines with a parent package-lock.json
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      // Serve existing static pages from public/ at their clean URLs.
      // NOTE: "/" is deliberately absent. It is served by
      // src/app/(home)/route.ts, which returns this same document with
      // CMS content injected into its sentinels. A rewrite here would
      // shadow that route and silently restore the hardcoded content.
      { source: "/linkedin-plan", destination: "/linkedin-plan.html" },
      { source: "/refund-policy", destination: "/refund-policy.html" },
      { source: "/qnaregistration", destination: "/qnaregistration.html" },
      { source: "/invoice",       destination: "/invoice.html"       },
      { source: "/envoice",       destination: "/invoice.html"       },
      // Old passcode dashboard (invoice generation) until CRM reaches parity.
      { source: "/admin-legacy",  destination: "/admin-legacy.html"  },
    ];
  },
  // Ported from vercel.json, which Firebase App Hosting does not read.
  async headers() {
    return [
      {
        source: "/MedSkills-Catalyst-Brochure.pdf",
        headers: [
          {
            key: "Content-Disposition",
            value: 'inline; filename="MedSkills-Catalyst-Brochure.pdf"',
          },
          { key: "Content-Type", value: "application/pdf" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
