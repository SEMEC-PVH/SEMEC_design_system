---
title: "Progresso"
code: "progress"
slug: "progress"
file: "src/components/progress.tsx"
category: "feedback"
variants: "—"
---

# Progresso — `progress`

> Barra de progresso determinada. Trilha com contorno border-strong (3,77:1 sobre surface) e indicador primary.

**Arquivo:** `src/components/progress.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/progress`

## Variantes

_Sem variantes_

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers zod.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Progress } from "@semec/ds/react";

// Nome acessível obrigatório: aria-label ou aria-labelledby
<p id="envio-progresso" className="text-sm text-muted-foreground">Envio dos documentos: 60% concluído</p>
<Progress value={60} aria-labelledby="envio-progresso" />
```

## Prompt para IA

```text
Use o componente `Progress` (Progresso) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Barra de progresso determinada. Trilha com contorno border-strong (3,77:1 sobre surface) e indicador primary. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
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

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
