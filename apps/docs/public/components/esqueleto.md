---
title: "Esqueleto"
code: "skeleton"
slug: "esqueleto"
file: "src/components/skeleton.tsx"
category: "feedback"
variants: "—"
---

# Esqueleto — `skeleton`

> Placeholder pulsante de carregamento.

**Arquivo:** `src/components/skeleton.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/esqueleto`

## Variantes

_Sem variantes_

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
import { Skeleton } from "semec-ds/react";

<Skeleton className="h-4 w-[250px]" />
<Skeleton className="h-4 w-[180px]" />
```

## Prompt para IA

```text
Crie um skeleton (Esqueleto) usando semec-ds/react (`src/components/skeleton.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Placeholder pulsante de carregamento.
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

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
