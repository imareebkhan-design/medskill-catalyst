import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, requirePermission } from "@/src/lib/auth";
import type { Permission } from "@/src/lib/permissions";
import type { StaffUser } from "@/src/generated/prisma/client";
import { CredentialError } from "./errors";

const STATUS: Record<CredentialError["code"], number> = {
  VALIDATION: 400,
  RENDER: 422,
  NOT_FOUND: 404,
  DUPLICATE: 409,
  CONFLICT: 409,
  NOT_ALLOWED: 409,
  IN_PROGRESS: 409,
  CONFIG: 422,
  RATE_LIMITED: 429,
};

/**
 * Cross-site request protection for cookie-authenticated JSON endpoints:
 *  - state-changing requests must be application/json (a cross-site HTML form
 *    cannot send that without a CORS preflight, which we never grant), and
 *  - the browser's Origin / Sec-Fetch-Site must say same-origin when present.
 */
export function assertSameOrigin(req: Request) {
  const ct = req.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().startsWith("application/json")) throw new CredentialError("Send application/json.", "VALIDATION");
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new AuthError(403, "Cross-site request refused");
  const origin = req.headers.get("origin");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      /* fallthrough */
    }
    if (!host || originHost !== host) throw new AuthError(403, "Cross-site request refused");
  }
}

export function apiError(err: unknown) {
  if (err instanceof AuthError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
  if (err instanceof CredentialError) {
    return NextResponse.json({ ok: false, error: err.message, code: err.code, ...(err.code === "DUPLICATE" ? { details: err.details } : {}) }, { status: STATUS[err.code] });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ ok: false, error: "Invalid request", issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  }
  console.error("[credentials api]", err);
  return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
}

/** Wrap an admin API handler: authorization + CSRF + uniform, non-leaky errors. */
export function adminHandler<C>(
  permission: Permission,
  opts: { mutating: boolean },
  handler: (req: Request, ctx: C, actor: StaffUser) => Promise<Response>,
) {
  return async (req: Request, ctx: C) => {
    try {
      if (opts.mutating) assertSameOrigin(req);
      const actor = await requirePermission(permission, { individual: opts.mutating });
      const res = await handler(req, ctx, actor);
      res.headers.set("Cache-Control", "private, no-store");
      return res;
    } catch (err) {
      return apiError(err);
    }
  };
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch {
    throw new CredentialError("Body must be a JSON object.", "VALIDATION");
  }
}
