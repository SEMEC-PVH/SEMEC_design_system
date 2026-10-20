import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import type { VariantFunction } from "../lib/variant-function";

const badgeVariants: VariantFunction<{
  variant: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info";
}> = cva(
  "inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-success-surface text-success",
        warning: "border-transparent bg-warning-surface text-warning",
        danger: "border-transparent bg-destructive-surface text-destructive",
        info: "border-transparent bg-info-surface text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };