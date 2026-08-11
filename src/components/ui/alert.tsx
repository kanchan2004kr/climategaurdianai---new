import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva("flex gap-3 rounded-lg border p-4 text-sm", {
  variants: {
    variant: {
      info: "border-brand/30 bg-brand-soft text-brand",
      warning: "border-risk-moderate/30 bg-risk-moderate/10 text-risk-moderate",
      error: "border-risk-high/30 bg-risk-high/10 text-risk-high",
    },
  },
  defaultVariants: { variant: "info" },
});

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, role = "status", ...props }: AlertProps) {
  return <div role={role} className={cn(alertVariants({ variant }), className)} {...props} />;
}
