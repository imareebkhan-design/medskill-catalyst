"use client";

import * as React from "react";
import { cn } from "@/src/lib/cn";

/**
 * Lightweight accordion on native <details> — no positioning JS, fully
 * accessible, zero layout shift. Styled to shadcn conventions.
 */
export function Accordion({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("divide-y divide-brand-navy/10", className)} {...props} />;
}

export function AccordionItem({
  question,
  children,
}: {
  question: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group py-1">
      <summary className="flex cursor-pointer select-none items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-brand-navy marker:content-none [&::-webkit-details-marker]:hidden">
        {question}
        <span
          aria-hidden
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-pale text-brand-blue transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="pb-4 pr-10 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}
