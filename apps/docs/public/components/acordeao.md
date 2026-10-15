---
title: "Acordeão"
code: "accordion"
slug: "acordeao"
file: "src/components/accordion.tsx"
category: "conteudo-dados"
variants: "type: single · multiple · composição: Accordion · AccordionItem · AccordionTrigger · AccordionContent"
---

# Acordeão — `accordion`

> Seções expansíveis. Um item abre por vez (`single`) ou vários (`multiple`).

**Arquivo:** `src/components/accordion.tsx` | **Categoria:** Conteúdo e dados | **Rota:** `/componentes/acordeao`

## Variantes

- **type**: single · multiple
- **composição**: Accordion · AccordionItem · AccordionTrigger · AccordionContent

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@semec/ds/react";

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Pergunta frequente</AccordionTrigger>
    <AccordionContent>Resposta aqui.</AccordionContent>
  </AccordionItem>
</Accordion>
```

## Prompt para IA

```text
Use o componente `Accordion` (Acordeão) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Seções expansíveis. Um item abre por vez (`single`) ou vários (`multiple`). API e variantes: type: single · multiple · composição: Accordion · AccordionItem · AccordionTrigger · AccordionContent. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "../lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b border-border", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" aria-hidden="true" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
