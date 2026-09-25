import { NextResponse } from "next/server";
import { clientKey } from "@/src/lib/rate-limit";
import { VERIFY_RATE_LIMIT_SURFACE, verifyByCertificateId } from "@/src/modules/credentials/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/verify/search { certificateId } — exact, normalized match only; rate limited. */
export async function POST(req: Request) {
  let certificateId = "";
  try {
    const body = (await req.json()) as { certificateId?: unknown };
    if (typeof body.certificateId === "string") certificateId = body.certificateId.slice(0, 64);
  } catch {
    return NextResponse.json({ ok: false, error: "Send JSON: { \"certificateId\": \"...\" }" }, { status: 400 });
  }
  const outcome = await verifyByCertificateId(certificateId, clientKey(req.headers, VERIFY_RATE_LIMIT_SURFACE));
  if (outcome.kind === "rate_limited") {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(outcome.retryAfterSeconds) } });
  }
  if (outcome.kind === "not_found") return NextResponse.json({ ok: false, error: "Credential not found" }, { status: 404 });
  return NextResponse.json({ ok: true, credential: outcome.credential });
}
