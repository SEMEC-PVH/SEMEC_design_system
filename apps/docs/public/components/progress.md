---
title: "Progresso"
code: "progress"
slug: "progress"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/progress.tsx"
category: "feedback"
variants: "—"
---

# Progresso — `progress`

> Barra de progresso determinada. Trilha com contorno border-strong (3,77:1 sobre surface) e indicador primary.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/progress.tsx) | **Categoria:** Feedback e estados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/progress/

## Variantes

_Sem variantes_

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

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.4.2 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.3. Confira a versão instalada com `npm ls @semec/ds`.

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
        {/* Atributos SVG funcionam no SSR com style-src-attr 'none'. O rx/ry
            (metade da altura útil da trilha h-3) mantém a ponta arredondada. */}
        <svg className="block h-full w-full" aria-hidden="true" focusable="false">
          <rect width={`${percentual}%`} height="100%" rx={5} ry={5} className="fill-primary" />
        </svg>
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
