import type { TrackingFields } from "./types";

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const STORAGE_KEY = "msc_webinar_attribution";

/**
 * Capture attribution from the URL + referrer.
 * Persists first-touch in sessionStorage so it survives client nav
 * but never silently overwrites a fresh campaign click.
 *
 * URL params supported:
 *   utm_*            — standard
 *   amb / ambassador — ambassador ID  (student-ambassador links)
 *   cid / college    — college ID     (placement-officer links)
 *   src              — registration_source override
 */
export function captureTracking(): TrackingFields {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const fromUrl: TrackingFields = {};

  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) fromUrl[k] = v;
  }

  const amb = params.get("amb") || params.get("ambassador");
  if (amb) fromUrl.ambassador_id = amb;

  const cid = params.get("cid") || params.get("college");
  if (cid) fromUrl.college_id = cid;

  fromUrl.registration_source =
    params.get("src") || deriveSource(fromUrl, amb, cid);

  fromUrl.referrer_url = document.referrer || undefined;
  fromUrl.landing_path = window.location.pathname + window.location.search;

  // Merge with stored first-touch (URL wins when present).
  let stored: TrackingFields = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    /* ignore */
  }
  const merged = { ...stored, ...stripUndefined(fromUrl) };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
  return merged;
}

function deriveSource(
  utm: TrackingFields,
  amb: string | null,
  cid: string | null
): string {
  if (cid) return "placement_officer";
  if (amb) return "ambassador";
  const s = (utm.utm_source || "").toLowerCase();
  if (s.includes("linkedin"))
    return utm.utm_medium === "post" ? "linkedin_post" : "linkedin_dm";
  if (s) return s;
  return "direct";
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== "")
  ) as T;
}
