import crypto from "crypto";

/**
 * Meta Conversions API (server-side) — companion to the browser pixel.
 *
 * Sends the same conversion events server-to-server so tracking survives ad
 * blockers, iOS/ITP cookie limits, and network failures. Events are DEDUPLICATED
 * against the browser pixel: the client generates an `event_id`, fires the
 * browser event with `{ eventID }`, and forwards the same id here — Meta then
 * counts the pair once. See src/lib/meta-pixel.ts (Next.js) and
 * public/assets/meta-pixel.js (static site) for the browser side.
 *
 * Required env (server-only — the access token is a SECRET, never NEXT_PUBLIC):
 *   META_CAPI_ACCESS_TOKEN   Conversions API token (Events Manager → Settings)
 *   META_PIXEL_ID            Pixel/dataset id (falls back to NEXT_PUBLIC_META_PIXEL_ID)
 * Optional:
 *   META_GRAPH_VERSION       Graph API version (default v21.0)
 *   META_CAPI_TEST_CODE      Events Manager "Test Events" code, for verification
 *
 * If the token or pixel id is missing the module no-ops silently, so local dev
 * and previews are unaffected.
 */

const PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_CODE;

/** Standard events we allow the client to request (guards forwarded names). */
export const ALLOWED_EVENTS = new Set([
  "Lead",
  "CompleteRegistration",
  "Schedule",
  "Contact",
  "ViewContent",
  "SubmitApplication",
  "InitiateCheckout",
  "Purchase",
]);

export type MetaUserData = {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  /** _fbp cookie value (sent unhashed). */
  fbp?: string;
  /** _fbc cookie value / fbclid-derived (sent unhashed). */
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
};

export type MetaEvent = {
  eventName: string;
  /** Shared with the browser pixel for deduplication. */
  eventId?: string;
  eventSourceUrl?: string;
  actionSource?: "website" | "system_generated" | "app" | "email" | "phone_call" | "chat" | "physical_store" | "other";
  user?: MetaUserData;
  customData?: Record<string, unknown>;
};

function sha256(value?: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/** Phone must be digits only (incl. country code), no '+', before hashing. */
function sha256Phone(value?: string | null): string | undefined {
  if (!value) return undefined;
  let digits = String(value).replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  // Assume Indian numbers when a bare 10-digit is given.
  if (digits.length === 10) digits = "91" + digits;
  return crypto.createHash("sha256").update(digits).digest("hex");
}

/** ISO-3166 alpha-2, lowercased, hashed. Defaults India when unset. */
function sha256Country(value?: string | null): string | undefined {
  const v = (value || "in").trim().toLowerCase();
  const code = v === "india" ? "in" : v.length === 2 ? v : v.slice(0, 2);
  return crypto.createHash("sha256").update(code).digest("hex");
}

function buildUserData(user: MetaUserData = {}): Record<string, unknown> {
  const ud: Record<string, unknown> = {};
  const em = sha256(user.email);
  const ph = sha256Phone(user.phone);
  const fn = sha256(user.firstName);
  const ln = sha256(user.lastName);
  const ct = sha256(user.city);
  const st = sha256(user.state);
  const co = user.country ? sha256Country(user.country) : undefined;
  if (em) ud.em = [em];
  if (ph) ud.ph = [ph];
  if (fn) ud.fn = [fn];
  if (ln) ud.ln = [ln];
  if (ct) ud.ct = [ct];
  if (st) ud.st = [st];
  if (co) ud.country = [co];
  if (user.fbp) ud.fbp = user.fbp;
  if (user.fbc) ud.fbc = user.fbc;
  if (user.clientIp) ud.client_ip_address = user.clientIp;
  if (user.userAgent) ud.client_user_agent = user.userAgent;
  return ud;
}

/**
 * Send one event to the Conversions API. Never throws — resolves to a small
 * status object and logs failures, so a Meta outage can't break a form submit.
 * Awaited by callers (before the HTTP response) with an internal timeout guard.
 */
export async function sendMetaEvent(event: MetaEvent): Promise<{ ok: boolean; skipped?: boolean; status?: number }> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return { ok: false, skipped: true };
  }

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        ...(event.eventId ? { event_id: event.eventId } : {}),
        action_source: event.actionSource || "website",
        ...(event.eventSourceUrl ? { event_source_url: event.eventSourceUrl } : {}),
        user_data: buildUserData(event.user),
        ...(event.customData ? { custom_data: event.customData } : {}),
      },
    ],
    ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
  };

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[meta-capi] ${event.eventName} failed (${res.status}): ${detail.slice(0, 400)}`);
      return { ok: false, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    console.error(`[meta-capi] ${event.eventName} send error:`, err instanceof Error ? err.message : err);
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Request context helpers ──────────────────────────────────────────────
   Extract fbp/fbc cookies, client IP, user agent and source URL from either
   an App-Router Web `Request` or a Pages-API Node request. */

type HeaderBag = Headers | Record<string, string | string[] | undefined>;

function headerGet(headers: HeaderBag, name: string): string | undefined {
  const anyHeaders = headers as Headers;
  if (typeof anyHeaders.get === "function") {
    return anyHeaders.get(name) ?? undefined;
  }
  const bag = headers as Record<string, string | string[] | undefined>;
  const v = bag[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v ?? undefined;
}

function parseCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

export type MetaContext = {
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
  eventSourceUrl?: string;
};

/** Build Meta context from a header bag (+ optional source URL). */
export function metaContext(headers: HeaderBag, eventSourceUrl?: string): MetaContext {
  const cookie = headerGet(headers, "cookie");
  const xff = headerGet(headers, "x-forwarded-for");
  const clientIp = (xff ? xff.split(",")[0].trim() : undefined) || headerGet(headers, "x-real-ip");
  return {
    fbp: parseCookie(cookie, "_fbp"),
    fbc: parseCookie(cookie, "_fbc"),
    clientIp: clientIp || undefined,
    userAgent: headerGet(headers, "user-agent"),
    eventSourceUrl: eventSourceUrl || headerGet(headers, "referer"),
  };
}

/** Convenience for App-Router `Request`. */
export function metaContextFromRequest(req: Request): MetaContext {
  return metaContext(req.headers, req.url);
}
