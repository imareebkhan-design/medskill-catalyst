import * as React from "react";
import { cn } from "@/src/lib/cn";

/**
 * Native checkbox styled to the brand. Works directly with react-hook-form's
 * `register` (it forwards the ref and native change events).
 */
const Checkbox = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn(
      "h-4.5 w-4.5 shrink-0 cursor-pointer rounded-[5px] border border-brand-navy/25 bg-surface accent-brand-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
