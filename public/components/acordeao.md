---
title: "Acordeão"
code: "accordion"
slug: "acordeao"
file: "base/components/accordion.tsx"
category: "conteudo-dados"
variants: "type: single · multiple · composição: Accordion · AccordionItem · AccordionTrigger · AccordionContent"
---

# Acordeão — `accordion`

> Seções expansíveis. Um item abre por vez (`single`) ou vários (`multiple`).

**Arquivo:** `base/components/accordion.tsx` | **Categoria:** Conteúdo e dados | **Rota:** `/componentes/acordeao`

## Variantes

- **type**: single · multiple
- **composição**: Accordion · AccordionItem · AccordionTrigger · AccordionContent

## Instalação (kit @semec/base)

```bash
# 1. Copie base/ para seu projeto
# 2. Instale deps (ver base/README.md)
npm i class-variance-authority clsx tailwind-merge lucide-react \
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox \
  @radix-ui/react-radio-group @radix-ui/react-select @radix-ui/react-switch \
  @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-dialog \
  @radix-ui/react-toast @radix-ui/react-tooltip
```

```css
/* globals.css */
@import "tailwindcss";
@import "./base/tokens.css";
@import "./base/shadcn.css";
/* ou @config "./base/pv-preset.ts" */
```

## Uso

```tsx
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@semec/base";

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Pergunta frequente</AccordionTrigger>
    <AccordionContent>Resposta aqui.</AccordionContent>
  </AccordionItem>
</Accordion>
```

## Prompt para IA

```text
Crie um accordion (Acordeão) usando @semec/base (`base/components/accordion.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: type: single · multiple · composição: Accordion · AccordionItem · AccordionTrigger · AccordionContent. Seções expansíveis. Um item abre por vez (`single`) ou vários (`multiple`).
```

## Fonte

```tsx
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

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `base/tokens.css` e `base/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `lib/base-manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
