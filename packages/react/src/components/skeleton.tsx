import * as React from "react";

import { cn } from "../lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Placeholder pulsante de carregamento. É decorativo (`aria-hidden` por
 * padrão): anuncie o carregamento no contêiner com `aria-busy="true"` e um
 * texto ou `Spinner` com `role="status"`.
 */
const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-sunken", className)}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

export { Skeleton };
