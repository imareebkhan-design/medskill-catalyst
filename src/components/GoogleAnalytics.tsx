"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { isTrackingExcludedPath } from "@/src/lib/tracking-exclusions";

/**
 * GA4 tag, moved out of the root layout unchanged so it can skip credential
 * verification pages (their URLs carry the verification token).
 */
export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  if (isTrackingExcludedPath(pathname)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
      </Script>
    </>
  );
}
