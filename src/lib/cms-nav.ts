import { CmsRole } from "@/src/generated/prisma/enums";
import { roleCan, type Capability } from "@/src/lib/cms-roles";

/**
 * The CMS navigation model.
 *
 * Kept pure and free of React so the role filtering can be unit-tested. The
 * filtering here is presentation only — it decides what a person is offered,
 * never what they are allowed to do. Every route still guards itself
 * server-side; see src/lib/cms-guard.ts.
 */

export type IconName =
  | "dashboard"
  | "calendar"
  | "stories"
  | "faculty"
  | "activity"
  | "settings";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Omitted means every signed-in CMS user sees it. */
  capability?: Capability;
  /** Marks the item as the dashboard root, which needs exact-match highlighting. */
  exact?: boolean;
};

export type NavSection = {
  /** Section heading. Omitted for the first, unlabelled group. */
  title?: string;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ href: "/cms", label: "Dashboard", icon: "dashboard", exact: true }],
  },
  {
    title: "Content",
    items: [
      { href: "/cms/cohort", label: "Cohort Settings", icon: "calendar" },
      { href: "/cms/success-stories", label: "Success Stories", icon: "stories" },
      { href: "/cms/faculty", label: "Faculty", icon: "faculty" },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/cms/activity",
        label: "Activity Log",
        icon: "activity",
        capability: "activity:view",
      },
      {
        href: "/cms/settings",
        label: "Settings",
        icon: "settings",
        capability: "settings:access",
      },
    ],
  },
];

/**
 * The sections a given role should be offered, with empty sections dropped so
 * a Content Editor never sees a bare "System" heading with nothing under it.
 */
export function navFor(role: CmsRole): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.capability || roleCan(role, item.capability),
    ),
  })).filter((section) => section.items.length > 0);
}

/** Flat list of hrefs a role may see — convenient for tests. */
export function visibleHrefs(role: CmsRole): string[] {
  return navFor(role).flatMap((s) => s.items.map((i) => i.href));
}

/** Whether a nav item should render as the current page. */
export function isActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
