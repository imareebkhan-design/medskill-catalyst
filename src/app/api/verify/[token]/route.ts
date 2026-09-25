import { NextResponse } from "next/server";
import { clientKey } from "@/src/lib/rate-limit";
import { VERIFY_RATE_LIMIT_SURFACE, verifyByToken } from "@/src/modules/credentials/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/verify/:token — public; returns only approved public fields (PRD §13). */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const outcome = await verifyByToken(token, clientKey(req.headers, VERIFY_RATE_LIMIT_SURFACE));
  if (outcome.kind === "rate_limited") {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(outcome.retryAfterSeconds) } });
  }
  if (outcome.kind === "not_found") return NextResponse.json({ ok: false, error: "Credential not found" }, { status: 404 });
  return NextResponse.json({ ok: true, credential: outcome.credential });
}
