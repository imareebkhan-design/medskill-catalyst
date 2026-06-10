"use client";

import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Common = { variant?: Variant; children: ReactNode; className?: string };

// Match the live site's .btn system exactly:
// border-radius: 8px (--radius-sm), padding: .9rem 2rem, font-size: .95rem, font-weight: 700
const base =
  "inline-flex items-center justify-center gap-2 rounded-msc font-body " +
  "text-[0.95rem] font-bold tracking-[-0.005em] whitespace-nowrap " +
  "px-8 py-[0.9rem] min-h-[48px] " +
  "transition-all duration-200 ease-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]";

const variants: Record<Variant, string> = {
  // .btn--amber / --blue: solid brand-blue, lifts on hover
  primary:
    "bg-emerald text-white hover:bg-emerald-dark hover:-translate-y-0.5 " +
    "hover:shadow-[0_8px_24px_rgba(10,42,67,0.18)]",
  // .btn--outline: transparent with border
  secondary:
    "bg-white text-teal-deep border-2 border-teal-deep/20 " +
    "hover:bg-teal-pale hover:border-teal-deep/40 hover:-translate-y-0.5",
  // .btn--ghost
  ghost: "bg-transparent text-teal-deep hover:bg-teal-deep/5",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  className = "",
  children,
  ...rest
}: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </a>
  );
}
