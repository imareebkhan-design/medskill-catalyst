import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "MedSkills Content", template: "%s · MedSkills Content" },
  // The CMS must never be indexed, at any depth.
  robots: { index: false, follow: false },
};

/**
 * Layout is presentation only. It performs NO auth check by design: in the App
 * Router a layout can be skipped on client-side navigation, so treating it as
 * a security boundary would be a false guarantee. Every page under /cms calls
 * requireCmsUser() itself.
 */
export default function CmsLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-canvas font-body text-ink">{children}</div>;
}
