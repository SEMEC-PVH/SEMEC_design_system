---
title: "Caixa de texto"
code: "input"
slug: "caixa-de-texto"
file: "src/components/input.tsx"
category: "formularios"
variants: "estados: padrão · inválido (invalid / aria-invalid) · disabled · contrato: value · defaultValue · onValueChange(value) · onChange(evento nativo) · name · id · invalid · disabled · required"
---

# Caixa de texto — `input`

> Campo de texto. Estado de erro via `invalid` (vira `aria-invalid`). Dentro de um FormField, recebe `id`, `aria-describedby` (dica + erro) e `aria-invalid` automaticamente. `onChange` é o evento nativo; `onValueChange` recebe só a string.

**Arquivo:** `src/components/input.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/caixa-de-texto`

## Variantes

- **estados**: padrão · inválido (invalid / aria-invalid) · disabled
- **contrato**: value · defaultValue · onValueChange(value) · onChange(evento nativo) · name · id · invalid · disabled · required

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { FormField, Input } from "@semec/ds/react";

// Todo campo precisa de rótulo visível (placeholder não substitui o rótulo).
// Dentro do FormField, id, aria-describedby e aria-invalid são ligados sozinhos.
<FormField label="Nome completo" hint="Como no documento">
  <Input autoComplete="name" />
</FormField>

// Com id próprio (ex.: alvo do ErrorSummary): o rótulo e a mensagem seguem o id
<FormField label="CPF" error="Informe os 11 dígitos do CPF.">
  <Input id="cpf" inputMode="numeric" />
</FormField>
// → <label for="cpf">, aria-invalid="true", aria-describedby="cpf-error"

// Controlado: onValueChange recebe a string (onChange continua recebendo o evento)
<FormField label="E-mail">
  <Input type="email" name="email" value={email} onValueChange={setEmail} invalid={emailInvalido} />
</FormField>
```

## Prompt para IA

```text
Use o componente `Input` (Caixa de texto) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Campo de texto. Estado de erro via `invalid` (vira `aria-invalid`). Dentro de um FormField, recebe `id`, `aria-describedby` (dica + erro) e `aria-invalid` automaticamente. `onChange` é o evento nativo; `onValueChange` recebe só a string. API e variantes: estados: padrão · inválido (invalid / aria-invalid) · disabled · contrato: value · defaultValue · onValueChange(value) · onChange(evento nativo) · name · id · invalid · disabled · required. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Recebe o valor (string) a cada mudança, junto com o `onChange` nativo, que
   * continua recebendo o evento (contrato de formulário, ADR-015).
   */
  onValueChange?: (value: string) => void;
  /** `true` vira `aria-invalid="true"` e o estilo de erro. Dentro de FormField, vence o estado dele. */
  invalid?: boolean;
}

/** Campo de texto. Dentro de um `FormField`, recebe `id`, `aria-describedby` e `aria-invalid`. */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, onValueChange, ...props }, ref) => {
    const field = useFormFieldControl({ ...props, invalid }, { supportsRequired: true });
    const { onChange } = props;
    const handleChange =
      onChange || onValueChange
        ? (event: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(event);
            onValueChange?.(event.target.value);
          }
        : undefined;
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        {...props}
        {...field}
        onChange={handleChange}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
