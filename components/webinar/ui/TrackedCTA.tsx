"use client";

import { ButtonLink } from "./Button";
import { trackCtaClick } from "@/lib/analytics";

interface Props {
  label: string;
  location: string;
  href?: string; // defaults to #register
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  children?: React.ReactNode;
}

/** Anchor CTA that fires cta_click then jumps to the form. */
export function TrackedCTA({
  label,
  location,
  href = "#register",
  variant = "primary",
  className = "",
  children,
}: Props) {
  return (
    <ButtonLink
      href={href}
      variant={variant}
      className={className}
      onClick={() => trackCtaClick(label, location)}
    >
      {children ?? label}
    </ButtonLink>
  );
}
