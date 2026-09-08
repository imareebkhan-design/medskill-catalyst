import { NextResponse } from "next/server";
import { renderHomepage } from "@/src/lib/homepage-content";

/**
 * The public homepage.
 *
 * Replaces the previous `{ source: "/", destination: "/index.html" }` rewrite.
 * It serves the same document, byte-for-byte, except that content between the
 * CMS sentinels is swapped for published CMS values.
 *
 * A route handler rather than a page component on purpose: the homepage is a
 * complete HTML document with its own <head>, inline CSS and scripts. Wrapping
 * it in the React tree would mean rebuilding all of that, which is precisely
 * the rewrite this approach exists to avoid.
 *
 * The CMS content is present in the response body — nothing is fetched from the
 * browser, so there is no client-side flash and crawlers see the real content.
 */

// Needs a request-time render so a publish shows up without a deploy. The cost
// is bounded: site-content caches the database reads behind tags, so a visit
// costs a file read and a string substitution, not a query.
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await renderHomepage();

  if (!result.ok) {
    // Only reachable if public/index.html is missing from the deployment.
    return new NextResponse("Service temporarily unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(result.html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Same posture as a static asset for intermediaries, while the server
      // still re-renders per request so a publish is picked up immediately.
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
