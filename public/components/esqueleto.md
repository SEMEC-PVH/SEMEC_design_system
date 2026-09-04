---
title: "Esqueleto"
code: "skeleton"
slug: "esqueleto"
file: "base/components/skeleton.tsx"
category: "feedback"
variants: "—"
---

# Esqueleto — `skeleton`

> Placeholder pulsante de carregamento.

**Arquivo:** `base/components/skeleton.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/esqueleto`

## Variantes

_Sem variantes_

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
import { Skeleton } from "@semec/base";

<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[180px]" />
```

## Prompt para IA

```text
Crie um skeleton (Esqueleto) usando @semec/base (`base/components/skeleton.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Placeholder pulsante de carregamento.
```

## Fonte

```tsx
import { cn } from "../lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `base/tokens.css` e `base/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `lib/base-manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
