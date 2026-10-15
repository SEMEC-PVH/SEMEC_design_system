---
title: "ErrorSummary"
code: "error-summary"
slug: "error-summary"
file: "src/components/error-summary.tsx"
category: "formularios"
variants: "props: title · errors [{ id, message }] · autoFocus · focusKey"
---

# ErrorSummary — `error-summary`

> Resumo de erros de validação no topo do formulário, com links para cada campo (`id` do campo, ou `name` como recuo). A11y: `role="alert"`, foco automático, título ligado por id gerado. Sem margem externa: espace pelo layout (ex.: `className="mb-6"`).

**Arquivo:** `src/components/error-summary.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/error-summary`

## Variantes

- **props**: title · errors [{ id, message }] · autoFocus · focusKey

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { ErrorSummary } from "@semec/ds/react";

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
Use o componente `ErrorSummary` (ErrorSummary) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Resumo de erros de validação no topo do formulário, com links para cada campo (`id` do campo, ou `name` como recuo). A11y: `role="alert"`, foco automático, título ligado por id gerado. Sem margem externa: espace pelo layout (ex.: `className="mb-6"`). API e variantes: props: title · errors [{ id, message }] · autoFocus · focusKey. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";

import { cn } from "../lib/utils";

export interface ErrorSummaryItem {
  /** `id` do campo com erro (ou `name`, como recuo). */
  id: string;
  message: string;
}

export interface ErrorSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  errors?: ErrorSummaryItem[];
  autoFocus?: boolean;
  focusKey?: unknown;
}

// Primeiro elemento focável dentro do alvo (input hidden não conta).
const FOCUSABLE =
  'input:not([type="hidden"]), select, textarea, button, [tabindex]:not([tabindex="-1"])';

const ErrorSummary = React.forwardRef<HTMLDivElement, ErrorSummaryProps>(
  (
    { title = "Há um problema", errors = [], autoFocus = true, focusKey, className, id, ...props },
    ref
  ) => {
    const internalRef = React.useRef<HTMLDivElement | null>(null);
    const generatedId = React.useId();
    const titleId = `${id ?? generatedId}-title`;

    const setRefs = React.useCallback(
      (el: HTMLDivElement | null) => {
        internalRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref]
    );

    React.useEffect(() => {
      if (autoFocus && errors.length > 0) {
        internalRef.current?.focus();
      }
    }, [autoFocus, errors.length, focusKey]);

    if (errors.length === 0) return null;

    function irParaCampo(event: React.MouseEvent<HTMLAnchorElement>, alvoId: string) {
      const doc = event.currentTarget.ownerDocument;
      const alvo =
        doc.getElementById(alvoId) ??
        doc.querySelector(`[name="${CSS.escape(alvoId)}"]:not([type="hidden"])`);
      if (!alvo) return;

      event.preventDefault();

      const focavel = alvo.matches(FOCUSABLE)
        ? alvo
        : alvo.querySelector(FOCUSABLE) ?? alvo;

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
        ref={setRefs}
        id={id}
        role="alert"
        tabIndex={-1}
        aria-labelledby={titleId}
        className={cn(
          "border-2 border-l-[3px] border-destructive rounded-md bg-destructive/5 p-4 px-6",
          "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-1",
          className
        )}
        {...props}
      >
        <h2
          id={titleId}
          className="text-xl font-semibold text-destructive mb-3"
        >
          {title}
        </h2>

        <ul className="space-y-2 ml-0 pl-6 text-base">
          {errors.map((erro, index) => (
            <li key={erro.id || index}>
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

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
