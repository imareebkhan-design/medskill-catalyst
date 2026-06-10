import { ReactNode } from "react";

interface SectionProps {
  id?: string;
  /** "light" = canvas bg, "dark" = deep navy, "pale" = pale-blue tint */
  tone?: "light" | "dark" | "pale";
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}

const toneMap = {
  light: "bg-canvas text-ink",
  pale:  "bg-teal-pale text-ink",
  dark:  "bg-teal-deep text-white",
} as const;

export function Section({
  id,
  tone = "light",
  eyebrow,
  title,
  subtitle,
  children,
  className = "",
}: SectionProps) {
  return (
    // Match the live site's generous section padding: clamp(6rem, 11vw, 9.5rem)
    <section
      id={id}
      className={`${toneMap[tone]} px-5 py-24 sm:px-8 sm:py-28 lg:py-36 ${className}`}
    >
      <div className="mx-auto max-w-6xl">
        {(eyebrow || title || subtitle) && (
          <header className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
            {eyebrow && (
              // Match .section-eyebrow: 0.72rem, 700, tracking 0.15em, + 40px rule after
              <p
                className={`mb-4 inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.15em] ${
                  tone === "dark" ? "text-teal-leg" : "text-emerald"
                } after:block after:h-px after:w-10 ${
                  tone === "dark" ? "after:bg-teal-leg" : "after:bg-emerald"
                }`}
              >
                {eyebrow}
              </p>
            )}
            {title && (
              // Match .t-h2: clamp(1.8rem,3.8vw,2.8rem), 700, line-height 1.15, tracking -.02em
              <h2
                className={`font-display font-bold leading-[1.15] tracking-[-0.02em] [font-size:clamp(1.8rem,3.8vw,2.8rem)] ${
                  tone === "dark" ? "text-white" : "text-teal-deep"
                }`}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              // Match .section-sub: 1.15rem, line-height 1.7, ink-muted
              <p
                className={`mt-5 text-[1.15rem] leading-[1.7] font-normal max-w-[680px] mx-auto ${
                  tone === "dark" ? "text-white/70" : "text-ink/60"
                }`}
              >
                {subtitle}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}
