---
title: "Abas"
code: "tabs"
slug: "abas"
file: "src/components/tabs.tsx"
category: "navegacao"
variants: "composição: Tabs · TabsList · TabsTrigger · TabsContent · a11y: role=tablist · role=tab · aria-selected · role=tabpanel · navegação teclado (setas, Home/End) · indicador não cromático da aba ativa"
---

# Abas — `tabs`

> Abas para alternar conteúdo na mesma tela. Gerenciamento de foco e roving tabindex via Radix. A aba ativa tem barra inferior de 3px em `primary` (≥4,97:1) e peso semibold, além do fundo: não depende só de cor. Alvo de 44px.

**Arquivo:** `src/components/tabs.tsx` | **Categoria:** Navegação | **Rota:** `/componentes/abas`

## Variantes

- **composição**: Tabs · TabsList · TabsTrigger · TabsContent
- **a11y**: role=tablist · role=tab · aria-selected · role=tabpanel · navegação teclado (setas, Home/End) · indicador não cromático da aba ativa

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@semec/ds/react";

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
Use o componente `Tabs` (Abas) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Abas para alternar conteúdo na mesma tela. Gerenciamento de foco e roving tabindex via Radix. A aba ativa tem barra inferior de 3px em `primary` (≥4,97:1) e peso semibold, além do fundo: não depende só de cor. Alvo de 44px. API e variantes: composição: Tabs · TabsList · TabsTrigger · TabsContent · a11y: role=tablist · role=tab · aria-selected · role=tabpanel · navegação teclado (setas, Home/End) · indicador não cromático da aba ativa. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

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
      "inline-flex min-h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
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
      // AUD-38: a aba ativa não depende só de cor. Além do fundo, ganha peso
      // semibold e uma barra de 3px em `primary` na base (4,97:1 contra a
      // lista `muted` e 5,00:1 contra o fundo da aba ativa; mínimo 3:1).
      // AUD-10: alvo mínimo de 44px (`min-h-11`).
      "relative inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-fast ease-standard after:pointer-events-none after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-elevation-1 data-[state=active]:after:bg-primary",
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

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
