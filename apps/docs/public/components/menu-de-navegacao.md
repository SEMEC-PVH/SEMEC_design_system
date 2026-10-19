---
title: "Menu de navegação"
code: "navigation-menu"
slug: "menu-de-navegacao"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/navigation-menu.tsx"
category: "navegacao"
variants: "composição: NavigationMenu · List · Item · Trigger · Content · Link · Viewport · Indicator · estilos exportados: navigationMenuTriggerStyle() (visual de gatilho, ex.: link solto na lista) · navigationMenuLinkStyle() (estilo padrão do NavigationMenuLink, para links próprios) · a11y: aria-label padrão 'Menu principal' · Tab/ArrowDown entram no conteúdo aberto · Esc fecha e devolve o foco · aria-hidden-focus aberto é exceção EXC-01 (sentinela do Radix)"
---

# Menu de navegação — `navigation-menu`

> Navegação principal com mega-menu e viewport animado. O `<nav>` se chama "Menu principal" por padrão (sobrescreva com `aria-label`). Gatilhos de 44px. O `NavigationMenuLink` já vem estilizado: alvo de 44px (`min-h-11`), `px-4`, hover/foco em `tint` e anel de foco por dentro; `active` marca a página atual com `aria-current="page"`.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/navigation-menu.tsx) | **Categoria:** Navegação | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/menu-de-navegacao/

## Variantes

- **composição**: NavigationMenu · List · Item · Trigger · Content · Link · Viewport · Indicator
- **estilos exportados**: navigationMenuTriggerStyle() (visual de gatilho, ex.: link solto na lista) · navigationMenuLinkStyle() (estilo padrão do NavigationMenuLink, para links próprios)
- **a11y**: aria-label padrão "Menu principal" · Tab/ArrowDown entram no conteúdo aberto · Esc fecha e devolve o foco · aria-hidden-focus aberto é exceção EXC-01 (sentinela do Radix)

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

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (minor) que ainda não estão no npm. O @semec/ds@4.3.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink } from "@semec/ds/react";

<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem>
      <NavigationMenuTrigger>Serviços</NavigationMenuTrigger>
      <NavigationMenuContent className="p-2">
        {/* NavigationMenuLink já tem 44px de altura, px-4 e foco visível */}
        <NavigationMenuLink href="/iptu">IPTU</NavigationMenuLink>
        <NavigationMenuLink href="/alvara">Alvará</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

## Prompt para IA

```text
Use o componente `NavigationMenu` (Menu de navegação) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Navegação principal com mega-menu e viewport animado. O `<nav>` se chama "Menu principal" por padrão (sobrescreva com `aria-label`). Gatilhos de 44px. O `NavigationMenuLink` já vem estilizado: alvo de 44px (`min-h-11`), `px-4`, hover/foco em `tint` e anel de foco por dentro; `active` marca a página atual com `aria-current="page"`. API e variantes: composição: NavigationMenu · List · Item · Trigger · Content · Link · Viewport · Indicator · estilos exportados: navigationMenuTriggerStyle() (visual de gatilho, ex.: link solto na lista) · navigationMenuLinkStyle() (estilo padrão do NavigationMenuLink, para links próprios) · a11y: aria-label padrão "Menu principal" · Tab/ArrowDown entram no conteúdo aberto · Esc fecha e devolve o foco · aria-hidden-focus aberto é exceção EXC-01 (sentinela do Radix). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";

import { cn } from "../lib/utils";
import type { VariantFunction } from "../lib/variant-function";

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, "aria-label": ariaLabel = "Menu principal", ...props }, ref) => (
  // AUD-31: o Radix rotula o <nav> como "Main" (inglês). O padrão aqui é
  // "Menu principal"; passe `aria-label` para sobrescrever (ex.: "Menu do servidor").
  <NavigationMenuPrimitive.Root
    ref={ref}
    aria-label={ariaLabel}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle: VariantFunction = cva(
  "group inline-flex h-11 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
);

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-fast ease-standard group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  // V42-VITE-03: com `w-full`/`md:w-auto` o painel encolhia até a palavra
  // mais longa e cada link quebrava em 2 linhas ("Alvará de / funcionamento").
  // `w-max` dá ao painel a largura do link mais longo, limitada à tela.
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-max max-w-[calc(100vw-2rem)] data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute",
      className
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

// TST-08: o Link vinha cru (`NavigationMenuPrimitive.Link`) e media 23px de
// altura no painel. Agora tem alvo de 44px (`min-h-11`), respiro lateral
// (`px-4`), hover/foco em `tint` e anel de foco por dentro (o viewport tem
// overflow-hidden e cortaria um anel com offset). `active` (Radix) marca a
// página atual com `aria-current="page"` e ganha peso semibold.
// Quem passa `className={navigationMenuTriggerStyle()}` continua com o visual
// do gatilho: o tailwind-merge resolve display, padding e fundo a favor da
// classe recebida.
const navigationMenuLinkStyle: VariantFunction = cva(
  "flex min-h-11 select-none items-center rounded-md px-4 py-2 text-sm font-medium leading-snug text-foreground no-underline outline-none transition-colors duration-fast ease-standard hover:bg-tint hover:text-foreground focus:bg-tint focus:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[active]:font-semibold"
);

const NavigationMenuLink = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Link>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Link
    ref={ref}
    className={cn(navigationMenuLinkStyle(), className)}
    {...props}
  />
));
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName;

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-elevation-2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-elevation-1" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName;

export {
  navigationMenuTriggerStyle,
  navigationMenuLinkStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
