"use client";

import { useEffect } from "react";
import { initAnalytics, trackPageVisit } from "@/lib/analytics";
import { captureTracking } from "@/lib/tracking";

/** Mount once at the top of the page: inits analytics + fires page_visit. */
export function AnalyticsBoot() {
  useEffect(() => {
    initAnalytics();
    const attribution = captureTracking();
    trackPageVisit(attribution);
  }, []);
  return null;
}
