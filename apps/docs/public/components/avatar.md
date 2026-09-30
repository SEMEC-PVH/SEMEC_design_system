---
title: "Avatar"
code: "avatar"
slug: "avatar"
file: "src/components/avatar.tsx"
category: "conteudo-dados"
variants: "composição: Avatar · AvatarImage · AvatarFallback · tamanhos: h-10 w-10 (padrão) — sobrescreva com className"
---

# Avatar — `avatar`

> Foto de perfil com fallback automático (iniciais).

**Arquivo:** `src/components/avatar.tsx` | **Categoria:** Conteúdo e dados | **Rota:** `/componentes/avatar`

## Variantes

- **composição**: Avatar · AvatarImage · AvatarFallback
- **tamanhos**: h-10 w-10 (padrão) — sobrescreva com className

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@config "@semec/ds/react/pv-preset";
```

## Uso

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@semec/ds/react";

<Avatar>
  <AvatarImage src="/foto.jpg" alt="João Silva" />
  <AvatarFallback>JS</AvatarFallback>
</Avatar>
```

## Prompt para IA

```text
Crie um avatar (Avatar) usando @semec/ds/react (`src/components/avatar.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: composição: Avatar · AvatarImage · AvatarFallback · tamanhos: h-10 w-10 (padrão) — sobrescreva com className. Foto de perfil com fallback automático (iniciais).
```

## Fonte

```tsx
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "../lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
