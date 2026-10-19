"use client";

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
 * O preenchimento é `value / max` (padrão `max = 100`): com `value={3}` e
 * `max={4}`, a barra mostra 75%, o mesmo que o leitor de tela anuncia.
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, max, ...props }, ref) => {
  // O indicador segue a mesma proporção que o leitor de tela anuncia
  // (`value / max`), não `value` como se o máximo fosse sempre 100 (TST-14).
  const limite = typeof max === "number" && max > 0 ? max : 100;
  const percentual = Math.min(100, Math.max(0, ((value ?? 0) / limite) * 100));
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full border border-border-strong bg-surface",
        className
      )}
      value={value}
      max={max}
      aria-valuenow={value ?? undefined}
      {...props}
    >
      <ProgressPrimitive.Indicator asChild>
        {/* Atributos SVG funcionam no SSR com style-src-attr 'none'. */}
        <svg className="block h-full w-full" aria-hidden="true" focusable="false">
          <rect width={`${percentual}%`} height="100%" className="fill-primary" />
        </svg>
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
