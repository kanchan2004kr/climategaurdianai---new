import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-foreground-muted",
        brand: "bg-brand-soft text-brand",
        low: "bg-risk-low/15 text-risk-low",
        moderate: "bg-risk-moderate/15 text-risk-moderate",
        elevated: "bg-risk-elevated/15 text-risk-elevated",
        high: "bg-risk-high/15 text-risk-high",
        extreme: "bg-risk-extreme/15 text-risk-extreme",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export function riskVariant(level: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "EXTREME") {
  return level.toLowerCase() as "low" | "moderate" | "elevated" | "high" | "extreme";
}
