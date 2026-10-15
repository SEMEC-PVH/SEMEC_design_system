import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "../lib/utils";

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {}

/**
 * Barra de progresso determinada. A trilha tem contorno `border-strong`
 * (3,77:1 sobre `surface`, 3,49:1 sobre `bg`) para ser percebida como
 * componente gráfico (WCAG 1.4.11); o indicador `primary` tem 5,42:1 sobre a
 * trilha `surface`. Dê nome com `aria-label` ou `aria-labelledby`.
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-3 w-full overflow-hidden rounded-full border border-border-strong bg-surface",
      className
    )}
    value={value}
    aria-valuenow={value ?? undefined}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 rounded-full bg-primary transition-all duration-base ease-standard"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
