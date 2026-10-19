"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "../lib/utils";
import { useNonce } from "../lib/nonce-context";

// Seletor de elementos que já entram no Tab. Se a viewport contém algum, quem
// usa teclado rola a área focando esses elementos e a viewport não precisa
// virar mais uma parada de Tab.
const FOCUSABLE_SELECTOR =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, summary, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

export interface ScrollAreaProps
  extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /** Nonce do estilo do Viewport; viewportProps.nonce prevalece sobre este e o SemecProvider. */
  nonce?: string;
  /**
   * TST-05 (WCAG 2.1.1): a região rolável precisa ser alcançável pelo teclado.
   * - `"auto"` (padrão): a viewport recebe `tabIndex={0}` e anel de foco só
   *   quando não há nada focável dentro dela (ex.: texto puro).
   * - `true`: a viewport é sempre focável.
   * - `false`: nunca (use só se o conteúdo garantir outro caminho de teclado).
   */
  focusable?: boolean | "auto";
  /** Props repassadas à viewport (ex.: `aria-label` da região rolável focável). */
  viewportProps?: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Viewport>;
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, focusable = "auto", viewportProps, nonce, ...props }, ref) => {
  const viewportNonce = useNonce(viewportProps?.nonce ?? nonce);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  // Começa focável (inclusive no HTML do servidor): sem JS, a área de texto
  // continua alcançável. O efeito retira a parada quando há conteúdo focável.
  const [hasFocusable, setHasFocusable] = React.useState(false);

  React.useEffect(() => {
    if (focusable !== "auto") return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const check = () => setHasFocusable(viewport.querySelector(FOCUSABLE_SELECTOR) !== null);
    check();
    if (typeof MutationObserver === "undefined") return;
    const observer = new MutationObserver(check);
    observer.observe(viewport, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href", "disabled", "tabindex", "contenteditable", "controls", "type"],
    });
    return () => observer.disconnect();
  }, [focusable]);

  const isFocusable = focusable === "auto" ? !hasFocusable : focusable;
  const { className: viewportClassName, ...restViewportProps } = viewportProps ?? {};

  return (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        tabIndex={isFocusable ? 0 : undefined}
        {...restViewportProps}
        nonce={viewportNonce}
        className={cn(
          // Anel por dentro (`ring-inset`): a raiz tem overflow-hidden e
          // cortaria um anel com offset.
          "h-full w-full rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          viewportClassName
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
});
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors duration-fast ease-standard",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
