---
title: "Campo de formulário"
code: "form-field"
slug: "campo-de-formulario"
file: "src/components/form-field.tsx"
category: "formularios"
variants: "props: label · htmlFor · required · hint · error"
---

# Campo de formulário — `form-field`

> Casaco do campo: label, obrigatório, dica e mensagem de erro na ordem certa.

**Arquivo:** `src/components/form-field.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/campo-de-formulario`

## Variantes

- **props**: label · htmlFor · required · hint · error

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
import { FormField, Input } from "@semec/ds/react";

<FormField label="E-mail" htmlFor="email" required hint="Usado para o comprovante" error="Informe um e-mail válido">
  <Input id="email" aria-invalid />
</FormField>
```

## Prompt para IA

```text
Crie um form-field (Campo de formulário) usando @semec/ds/react (`src/components/form-field.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: label · htmlFor · required · hint · error. Casaco do campo: label, obrigatório, dica e mensagem de erro na ordem certa.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  id?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, htmlFor, required, error, hint, id, children, ...props }, ref) => {
    const errorId = id ? `${id}-error` : undefined;
    const hintId = id ? `${id}-hint` : undefined;
    return (
      <div ref={ref} className={cn("grid gap-1.5", className)} {...props}>
        {label ? (
          <label
            htmlFor={htmlFor}
            className="text-sm font-medium text-foreground"
          >
            {label}
            {required ? <span className="text-destructive"> *</span> : null}
          </label>
        ) : null}
        {children}
        {hint && !error ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export { FormField };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
