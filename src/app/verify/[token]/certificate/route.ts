import { NextResponse } from "next/server";
import { clientKey } from "@/src/lib/rate-limit";
import { credentialStorage } from "@/src/modules/credentials/storage";
import { publicCertificatePdf, VERIFY_RATE_LIMIT_SURFACE } from "@/src/modules/credentials/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NOINDEX = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

/**
 * Public certificate PDF, streamed from the private bucket through the app
 * (no public or long-lived signed storage URL is ever handed out). Only for
 * credentials whose live status is VALID or EXPIRED.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await publicCertificatePdf(token, clientKey(req.headers, VERIFY_RATE_LIMIT_SURFACE));
  if (result.kind === "rate_limited") {
    return new NextResponse("Too many requests", { status: 429, headers: { ...NOINDEX, "Retry-After": String(result.retryAfterSeconds) } });
  }
  if (result.kind === "not_found") return new NextResponse("Credential not found", { status: 404, headers: NOINDEX });
  try {
    const bytes = await credentialStorage().get(result.pdfPath);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        ...NOINDEX,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${result.certificateId}.pdf"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    console.error("[verify] certificate download failed", e);
    return new NextResponse("Certificate temporarily unavailable", { status: 503, headers: NOINDEX });
  }
}
