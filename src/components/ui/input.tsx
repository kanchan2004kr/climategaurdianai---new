import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-foreground-muted transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:border-brand",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-risk-high aria-invalid:ring-risk-high/30",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
