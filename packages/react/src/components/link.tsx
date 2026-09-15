import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const linkVariants = cva(
  "inline-flex items-center gap-1 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary: "text-primary underline-offset-4 hover:underline",
        onSurface: "text-foreground underline-offset-4 hover:underline",
        muted: "text-muted-foreground underline-offset-4 hover:text-foreground hover:underline",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  }
);

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof linkVariants> {}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(linkVariants({ variant, className }))}
      {...props}
    />
  )
);
Link.displayName = "Link";

export { Link, linkVariants };