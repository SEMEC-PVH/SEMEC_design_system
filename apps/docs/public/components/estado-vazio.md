---
title: "Estado vazio"
code: "empty-state"
slug: "estado-vazio"
file: "src/components/empty-state.tsx"
category: "feedback"
variants: "props: icon · title · description · action"
---

# Estado vazio — `empty-state`

> Estado vazio com ícone, título, descrição e ação opcional.

**Arquivo:** `src/components/empty-state.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/estado-vazio`

## Variantes

- **props**: icon · title · description · action

## Instalação (@semec/ds/react)

```bash
# 1. Copie packages/react/ para seu projeto (ou instale @semec/ds/react pelo registry)
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
import { EmptyState, Button } from "semec-ds/react";
import { Inbox } from "lucide-react";

<EmptyState
  icon={<Inbox />}
  title="Nenhum protocolo encontrado"
  description="Ajuste os filtros ou abra um novo requerimento."
  action={<Button>Abrir requerimento</Button>}
/>
```

## Prompt para IA

```text
Crie um empty-state (Estado vazio) usando semec-ds/react (`src/components/empty-state.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: icon · title · description · action. Estado vazio com ícone, título, descrição e ação opcional.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface-alt/50 px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:h-6 [&>svg]:w-6">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
