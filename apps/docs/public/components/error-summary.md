---
title: "ErrorSummary"
code: "error-summary"
slug: "error-summary"
file: "src/components/error-summary.tsx"
category: "formularios"
variants: "props: title · errors [{ id, message }] · autoFocus · focusKey"
---

# ErrorSummary — `error-summary`

> Resumo de erros de validação no topo do formulário, com links para cada campo. A11y: `role="alert"`, foco automático.

**Arquivo:** `src/components/error-summary.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/error-summary`

## Variantes

- **props**: title · errors [{ id, message }] · autoFocus · focusKey

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
import { ErrorSummary } from "semec-ds/react";

<ErrorSummary
  errors={[
    { id: "cpf", message: "O CPF precisa ter 11 dígitos." },
    { id: "email", message: "O e-mail precisa conter @." },
  ]}
  focusKey={tentativa}
/>
```

## Prompt para IA

```text
Crie um error-summary (ErrorSummary) usando semec-ds/react (`src/components/error-summary.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: title · errors [{ id, message }] · autoFocus · focusKey. Resumo de erros de validação no topo do formulário, com links para cada campo. A11y: `role="alert"`, foco automático.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import { useEffect, useRef } from "react";

import { cn } from "../lib/utils";

interface ErrorSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  errors?: Array<{ id: string; message: string }>;
  autoFocus?: boolean;
  focusKey?: unknown;
}

const ErrorSummary = React.forwardRef<HTMLDivElement, ErrorSummaryProps>(
  ({ title = "Há um problema", errors = [], autoFocus = true, focusKey, className, ...props }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;

    useEffect(() => {
      if (autoFocus && errors.length > 0) {
        resolvedRef.current?.focus();
      }
    }, [autoFocus, errors.length, focusKey, resolvedRef]);

    if (errors.length === 0) return null;

    function irParaCampo(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
      const alvo =
        document.getElementById(id) ??
        document.querySelector(`[name="${id}"]`);
      if (!alvo) return;

      event.preventDefault();

      const focavel = alvo.matches("input, select, textarea, button")
        ? alvo
        : alvo.querySelector("input, select, textarea, button") ?? alvo;

      (focavel as HTMLElement).focus({ preventScroll: true });

      const menosMovimento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      focavel.scrollIntoView({
        block: "center",
        behavior: menosMovimento ? "auto" : "smooth",
      });
    }

    return (
      <div
        ref={resolvedRef}
        role="alert"
        tabIndex={-1}
        aria-labelledby="ds-error-summary-title"
        className={cn(
          "border-2 border-l-[3px] border-destructive rounded-md bg-destructive/5 p-4 px-6 mb-6",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1",
          className
        )}
        {...props}
      >
        <h2
          id="ds-error-summary-title"
          className="text-xl font-semibold text-destructive mb-3"
        >
          {title}
        </h2>

        <ul className="space-y-2 ml-0 pl-6 text-base">
          {errors.map((erro) => (
            <li key={erro.id}>
              <a
                href={`#${erro.id}`}
                onClick={(event) => irParaCampo(event, erro.id)}
                className="text-destructive font-medium underline underline-offset-[0.2em] hover:decoration-2 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1 rounded-sm"
              >
                {erro.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);
ErrorSummary.displayName = "ErrorSummary";

export { ErrorSummary };

```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `packages/react/tokens.css` e `packages/react/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
