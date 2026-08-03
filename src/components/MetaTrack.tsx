"use client";

import { useEffect, useRef } from "react";
import { fbTrack } from "@/src/lib/meta-pixel";

/**
 * Fires a single Meta Pixel event once on mount. Lets server components
 * (webinar / careers / thank-you / success pages) declare a conversion event
 * without becoming client components themselves.
 */
export function MetaTrackOnMount({
  event,
  params = {},
  eventId,
}: {
  event: string;
  params?: Record<string, unknown>;
  /** Shared id for browser↔server (Conversions API) deduplication. */
  eventId?: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fbTrack(event, params, eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
