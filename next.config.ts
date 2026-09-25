import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence the lockfile workspace-root warning on machines with a parent package-lock.json
  outputFileTracingRoot: __dirname,
  // Credential verification surfaces: never indexed (PRD §7 default), never
  // cached (a revocation must show immediately), never framed, and the
  // token-bearing URL is never sent onward as a Referer.
  async headers() {
    const verifyHeaders = [
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "Cache-Control", value: "no-store, max-age=0" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ];
    return [
      { source: "/verify", headers: verifyHeaders },
      { source: "/verify/:path*", headers: verifyHeaders },
      { source: "/api/verify/:path*", headers: verifyHeaders },
    ];
  },
  async rewrites() {
    return [
      // Serve existing static pages from public/ at their clean URLs.
      { source: "/",              destination: "/index.html"         },
      { source: "/linkedin-plan", destination: "/linkedin-plan.html" },
      { source: "/refund-policy", destination: "/refund-policy.html" },
      { source: "/qnaregistration", destination: "/qnaregistration.html" },
      { source: "/invoice",       destination: "/invoice.html"       },
      { source: "/envoice",       destination: "/invoice.html"       },
      // Old passcode dashboard (invoice generation) until CRM reaches parity.
      { source: "/admin-legacy",  destination: "/admin-legacy.html"  },
    ];
  },
};

export default nextConfig;
