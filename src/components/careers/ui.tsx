import React from "react";

/* Shared careers-flow primitives that mirror the homepage design system
   (public/index.html .btn / .btn-chip / .pill / SVG icon language).
   Tokens only — colors, radii and shadows come from tailwind.config.ts. */

// Homepage .btn base: pill radius, 700 weight, eased hover lift
export const btnPrimary =
  "inline-flex items-center justify-center gap-2.5 rounded-pill bg-teal-mid px-[35px] py-[17px] font-body text-[0.95rem] font-bold tracking-[-0.005em] text-white shadow-msc-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-dark active:translate-y-0 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-mid";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2.5 rounded-pill border border-[rgba(10,42,67,0.15)] bg-white px-[35px] py-[16px] font-body text-[0.95rem] font-bold tracking-[-0.005em] text-teal-deep shadow-msc-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-msc-md active:translate-y-0 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-mid";

export const btnCompact =
  "inline-flex items-center justify-center gap-2 rounded-pill bg-teal-mid px-6 py-3 font-body text-[0.875rem] font-bold tracking-[-0.005em] text-white shadow-msc-glow transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-dark active:translate-y-0 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-mid";

// Homepage .btn-chip — the circular arrow inside primary CTAs
export function BtnChip({ dark = false }: { dark?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`-mr-2 inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full ${
        dark ? "bg-teal-deep/10" : "bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)]"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

// Homepage .hero-card — navy surface, 32px radius, subtle 24px grid texture
export const heroCardClass =
  "relative overflow-hidden rounded-msc-xl border border-white/[0.06] bg-teal-deep text-white shadow-msc-float";
export const heroCardTexture: React.CSSProperties = {
  backgroundImage:
    "radial-gradient(ellipse 70% 55% at 85% -10%, rgba(74,208,255,.09), transparent 60%), radial-gradient(ellipse 60% 45% at 8% 112%, rgba(0,88,158,.30), transparent 62%), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
  backgroundSize: "100% 100%, 100% 100%, 24px 24px, 24px 24px",
};

/* ── Icon set — 1.5px stroke outline SVGs, consistent with the homepage's
      inline-SVG icon language. Every icon is decorative next to a text label. */

type IconProps = { className?: string };

function Svg({ className = "h-4 w-4", children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconMapPin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const IconBriefcase = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.5 10 17l9-10" />
  </Svg>
);

export const IconTarget = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </Svg>
);

export const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" />
    <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M18.5 14.9c1.8.9 3 2.4 3 4.6" />
  </Svg>
);

export const IconKey = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="15" r="4.5" />
    <path d="M11.5 11.5 20 3M16 7l3 3M13.5 9.5l2 2" />
  </Svg>
);

export const IconTrendingUp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </Svg>
);

export const IconBanknote = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.75" />
    <path d="M6 10v4M18 10v4" />
  </Svg>
);

export const IconFileBadge = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5" />
    <path d="m9.5 14.5 1.8 1.5 3.2-3.5" />
  </Svg>
);

export const IconAward = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="9" r="5.5" />
    <path d="m8.7 13.5-1.7 7 5-2.5 5 2.5-1.7-7" />
  </Svg>
);

export const IconGraduationCap = (p: IconProps) => (
  <Svg {...p}>
    <path d="m2.5 9 9.5-4.5L21.5 9 12 13.5 2.5 9Z" />
    <path d="M6.5 11.5v4.5c0 1.4 2.5 2.75 5.5 2.75s5.5-1.35 5.5-2.75v-4.5" />
  </Svg>
);

export const IconFastForward = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5.5v13l8-6.5-8-6.5ZM13 5.5v13l8-6.5-8-6.5Z" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3.5 10.5h17" />
  </Svg>
);

export const IconPhone = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 4h4l1.5 4.5L8 10c1 2.5 3.5 5 6 6l1.5-2.5L20 15v4a2 2 0 0 1-2 2C10 20.5 3.5 14 3 6a2 2 0 0 1 2-2Z" />
  </Svg>
);

export const IconMail = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

// WhatsApp mark — same filled path used across the homepage
export const IconWhatsApp = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M11.999 2.001C6.476 2.001 2 6.477 2 12c0 1.936.549 3.744 1.501 5.278L2 22l4.835-1.469A9.96 9.96 0 0 0 12 22c5.523 0 10-4.477 10-10S17.522 2.001 11.999 2.001zm0 18a7.969 7.969 0 0 1-4.065-1.112l-.291-.173-3.012.915.915-2.936-.19-.303A7.97 7.97 0 0 1 4 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.588 8-7.999 8h-.002z" />
  </svg>
);
