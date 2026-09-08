import type { IconName } from "@/src/lib/cms-nav";

/**
 * Inline SVG icons.
 *
 * No icon library is installed, and adding one for a handful of glyphs would
 * mean a new dependency plus its bundle. These are stroke-based on a 24px grid
 * so they sit consistently next to text at any size.
 */

const PATHS: Record<IconName | "external" | "logout" | "menu" | "close" | "plus" | "chevron", string> = {
  dashboard: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
  calendar: "M8 3v3m8-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z",
  stories: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z",
  faculty: "M12 4 2.5 9 12 14l9.5-5L12 4Zm-6 7.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.5",
  activity: "M3 12h4l3 8 4-16 3 8h4",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8.4-2.2.1-1.3-.1-1.3 2-1.5-2-3.4-2.3 1a7.9 7.9 0 0 0-2.3-1.3L15.4 3H8.6l-.4 2.5a7.9 7.9 0 0 0-2.3 1.3l-2.3-1-2 3.4 2 1.5-.1 1.3.1 1.3-2 1.5 2 3.4 2.3-1c.7.6 1.5 1 2.3 1.3l.4 2.5h6.8l.4-2.5c.8-.3 1.6-.7 2.3-1.3l2.3 1 2-3.4-2-1.5Z",
  external: "M14 5h5v5m0-5-7 7M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  logout: "M15 17l5-5-5-5m5 5H9M12 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  chevron: "M6 9l6 6 6-6",
};

export function Icon({
  name,
  className = "h-5 w-5",
  filled = false,
}: {
  name: keyof typeof PATHS;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
