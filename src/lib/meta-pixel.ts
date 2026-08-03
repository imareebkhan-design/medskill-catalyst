/**
 * Meta (Facebook) Pixel helper for the Next.js app.
 *
 * The base pixel + first PageView are loaded by <MetaPixel/> in the root
 * layout, gated on NEXT_PUBLIC_META_PIXEL_ID. `fbTrack` is a safe wrapper for
 * conversion events fired from client components — it no-ops if the pixel is
 * absent, blocked, or not yet loaded so page logic is never affected.
 */

type FbTrackParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * @param eventId Shared id for browser↔server (Conversions API) dedup. Pass the
 *                same value the server forwards to Meta so the pair counts once.
 */
export function fbTrack(event: string, params: FbTrackParams = {}, eventId?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (eventId) {
      window.fbq?.("track", event, params, { eventID: eventId });
    } else {
      window.fbq?.("track", event, params);
    }
  } catch {
    /* never let analytics break the page */
  }
}
