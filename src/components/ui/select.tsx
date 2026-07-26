import * as React from "react";
import { cn } from "@/src/lib/cn";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 w-full appearance-none rounded-msc border border-brand-navy/15 bg-surface bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%236b7280%22 stroke-width=%222%22><path stroke-linecap=%22round%22 stroke-linejoin=%22round%22 d=%22M19 9l-7 7-7-7%22/></svg>')] bg-[length:1.1rem] bg-[right_0.75rem_center] bg-no-repeat px-3.5 py-2 pr-10 text-sm text-ink transition-colors focus-visible:border-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20 disabled:cursor-not-allowed disabled:opacity-50 [&:invalid]:text-muted/60",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

export { Select };
