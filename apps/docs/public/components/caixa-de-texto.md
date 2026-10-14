---
title: "Caixa de texto"
code: "input"
slug: "caixa-de-texto"
file: "src/components/input.tsx"
category: "formularios"
variants: "estados: padrão · inválido (aria-invalid) · disabled"
---

# Caixa de texto — `input`

> Campo de texto. Estado de erro via `aria-invalid`.

**Arquivo:** `src/components/input.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/caixa-de-texto`

## Variantes

- **estados**: padrão · inválido (aria-invalid) · disabled

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { FormField, Input } from "@semec/ds/react";

// Todo campo precisa de rótulo visível (placeholder não substitui o rótulo)
<FormField label="Nome completo" htmlFor="nome-completo">
  <Input id="nome-completo" autoComplete="name" />
</FormField>

// Estado inválido: aria-invalid + mensagem ligada por aria-describedby (`<id do FormField>-error`)
<FormField id="cpf-campo" label="CPF" htmlFor="cpf" error="Informe os 11 dígitos do CPF.">
  <Input id="cpf" inputMode="numeric" aria-invalid="true" aria-describedby="cpf-campo-error" />
</FormField>
```

## Prompt para IA

```text
Crie um input (Caixa de texto) usando @semec/ds/react (`src/components/input.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: estados: padrão · inválido (aria-invalid) · disabled. Campo de texto. Estado de erro via `aria-invalid`.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
