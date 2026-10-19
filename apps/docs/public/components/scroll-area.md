---
title: "Área de scroll"
code: "scroll-area"
slug: "scroll-area"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/scroll-area.tsx"
category: "navegacao"
variants: "composição: ScrollArea · ScrollBar · orientation: vertical · horizontal · focusable: 'auto' (padrão: focável só sem conteúdo focável dentro) · true (sempre) · false (nunca; só se o conteúdo garantir outro caminho de teclado) · viewportProps: props da viewport (ex.: aria-label da região focável, className)"
---

# Área de scroll — `scroll-area`

> Scroll customizado e consistente entre navegadores. A região rolável é alcançável pelo teclado: sem nada focável dentro (ex.: texto puro), a viewport vira parada de Tab com anel de foco (`focusable="auto"`, o padrão). Dê nome à região com `viewportProps={{ "aria-label": "…" }}`.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/scroll-area.tsx) | **Categoria:** Navegação | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/scroll-area/

## Variantes

- **composição**: ScrollArea · ScrollBar
- **orientation**: vertical · horizontal
- **focusable**: "auto" (padrão: focável só sem conteúdo focável dentro) · true (sempre) · false (nunca; só se o conteúdo garantir outro caminho de teclado)
- **viewportProps**: props da viewport (ex.: aria-label da região focável, className)

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers@^5 zod@^4.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

## Uso

```tsx
import { ScrollArea } from "@semec/ds/react";

// Texto puro: a viewport recebe tabIndex=0; o aria-label nomeia a região
<ScrollArea className="h-48" viewportProps={{ "aria-label": "Termos de uso" }}>
  <div className="p-4">Conteúdo longo aqui…</div>
</ScrollArea>
```

## Prompt para IA

```text
Use o componente `ScrollArea` (Área de scroll) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Scroll customizado e consistente entre navegadores. A região rolável é alcançável pelo teclado: sem nada focável dentro (ex.: texto puro), a viewport vira parada de Tab com anel de foco (`focusable="auto"`, o padrão). Dê nome à região com `viewportProps={{ "aria-label": "…" }}`. API e variantes: composição: ScrollArea · ScrollBar · orientation: vertical · horizontal · focusable: "auto" (padrão: focável só sem conteúdo focável dentro) · true (sempre) · false (nunca; só se o conteúdo garantir outro caminho de teclado) · viewportProps: props da viewport (ex.: aria-label da região focável, className). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
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

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
