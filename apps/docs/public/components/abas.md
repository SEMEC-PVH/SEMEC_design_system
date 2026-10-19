---
title: "Abas"
code: "tabs"
slug: "abas"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/tabs.tsx"
category: "navegacao"
variants: "composição: Tabs · TabsList · TabsTrigger · TabsContent · a11y: role=tablist · role=tab · aria-selected · role=tabpanel · navegação teclado (setas, Home/End) · indicador não cromático da aba ativa"
---

# Abas — `tabs`

> Abas para alternar conteúdo na mesma tela. Gerenciamento de foco e roving tabindex via Radix. A aba ativa tem barra inferior de 3px em `primary` (≥4,97:1) e peso semibold, além do fundo: não depende só de cor. Alvo de 44px.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/tabs.tsx) | **Categoria:** Navegação | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/abas/

## Variantes

- **composição**: Tabs · TabsList · TabsTrigger · TabsContent
- **a11y**: role=tablist · role=tab · aria-selected · role=tabpanel · navegação teclado (setas, Home/End) · indicador não cromático da aba ativa

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

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.2.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.2.1. Confira a versão instalada com `npm ls @semec/ds`.

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
      // TST-29: sem quebra nem rolagem própria, a lista vazava 5px em 320px e
      // rolava a página. Agora não passa da largura do pai (`max-w-full`) e
      // rola na horizontal dentro de si (`overflow-x-auto`). `justify-center-safe`
      // centraliza só quando cabe: com overflow, a primeira aba não fica cortada
      // à esquerda. O `p-1` acomoda o anel de foco (2px + offset 2px).
      "inline-flex min-h-11 max-w-full items-center justify-center-safe overflow-x-auto rounded-lg bg-muted p-1 text-muted-foreground",
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
