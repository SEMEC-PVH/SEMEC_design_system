---
title: "Abas"
code: "tabs"
slug: "abas"
file: "src/components/tabs.tsx"
category: "navegacao"
variants: "composição: Tabs · TabsList · TabsTrigger · TabsContent · a11y: role=tablist · role=tab · aria-selected · role=tabpanel · navegação teclado (setas)"
---

# Abas — `tabs`

> Abas para alternar conteúdo na mesma tela. Gerenciamento de foco e roving tabindex via Radix.

**Arquivo:** `src/components/tabs.tsx` | **Categoria:** Navegação | **Rota:** `/componentes/abas`

## Variantes

- **composição**: Tabs · TabsList · TabsTrigger · TabsContent
- **a11y**: role=tablist · role=tab · aria-selected · role=tabpanel · navegação teclado (setas)

## Instalação (semec-ds/react)

```bash
# 1. Copie packages/react/ para seu projeto (ou instale semec-ds/react pelo registry)
# 2. Instale deps (ver packages/react/README.md)
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "semec-ds/react";

<Tabs defaultValue="resumo">
  <TabsList>
    <TabsTrigger value="resumo">Resumo</TabsTrigger>
    <TabsTrigger value="debitos">Débitos</TabsTrigger>
  </TabsList>
  <TabsContent value="resumo">…</TabsContent>
  <TabsContent value="debitos">…</TabsContent>
</Tabs>
```

## Prompt para IA

```text
Crie um tabs (Abas) usando semec-ds/react (`src/components/tabs.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: composição: Tabs · TabsList · TabsTrigger · TabsContent · a11y: role=tablist · role=tab · aria-selected · role=tabpanel · navegação teclado (setas). Abas para alternar conteúdo na mesma tela. Gerenciamento de foco e roving tabindex via Radix.
```

## Fonte

```tsx
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
