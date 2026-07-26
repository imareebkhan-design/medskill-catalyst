import * as React from "react";
import { cn } from "@/src/lib/cn";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("mb-1.5 block text-sm font-medium text-brand-navy", className)}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
