---
title: "Popover"
code: "popover"
slug: "popover"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/popover.tsx"
category: "feedback"
variants: "composição: Popover · PopoverTrigger · PopoverContent · PopoverAnchor · props: sideOffset · align · side (top/right/bottom/left)"
---

# Popover — `popover`

> Camada flutuante ancorada a um elemento. Tooltips interativos, filtros, menus.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/popover.tsx) | **Categoria:** Feedback e estados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/popover/

## Variantes

- **composição**: Popover · PopoverTrigger · PopoverContent · PopoverAnchor
- **props**: sideOffset · align · side (top/right/bottom/left)

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

> Não publicado: este conteúdo vem do repositório e inclui 2 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.2.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.3.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Popover, PopoverTrigger, PopoverContent, Button } from "@semec/ds/react";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Filtros</Button>
  </PopoverTrigger>
  {/* PopoverContent é role=dialog: dê um nome com aria-label ou aria-labelledby */}
  <PopoverContent aria-label="Filtros">
    <p>Opções de filtro aqui.</p>
  </PopoverContent>
</Popover>
```

## Prompt para IA

```text
Use o componente `Popover` (Popover) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Camada flutuante ancorada a um elemento. Tooltips interativos, filtros, menus. API e variantes: composição: Popover · PopoverTrigger · PopoverContent · PopoverAnchor · props: sideOffset · align · side (top/right/bottom/left). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "../lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-elevation-2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
