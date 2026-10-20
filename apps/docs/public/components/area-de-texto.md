---
title: "Área de texto"
code: "textarea"
slug: "area-de-texto"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/textarea.tsx"
category: "formularios"
variants: "estados: padrão · inválido (invalid) · disabled · contrato: value · defaultValue · onValueChange(value) · onChange(evento nativo) · name · id · invalid · disabled · required"
---

# Área de texto — `textarea`

> Campo multilinha com as mesmas variantes visuais e o mesmo contrato do campo de texto (`onValueChange`, `invalid`).

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/textarea.tsx) | **Categoria:** Formulários | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/area-de-texto/

## Variantes

- **estados**: padrão · inválido (invalid) · disabled
- **contrato**: value · defaultValue · onValueChange(value) · onChange(evento nativo) · name · id · invalid · disabled · required

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

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.4.2 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.3. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { FormField, Textarea } from "@semec/ds/react";

<FormField label="Descreva a demanda" hint="Até 500 caracteres">
  <Textarea id="demanda" name="demanda" rows={4} value={demanda} onValueChange={setDemanda} />
</FormField>
```

## Prompt para IA

```text
Use o componente `Textarea` (Área de texto) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Campo multilinha com as mesmas variantes visuais e o mesmo contrato do campo de texto (`onValueChange`, `invalid`). API e variantes: estados: padrão · inválido (invalid) · disabled · contrato: value · defaultValue · onValueChange(value) · onChange(evento nativo) · name · id · invalid · disabled · required. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Recebe o valor (string) a cada mudança, junto com o `onChange` nativo, que
   * continua recebendo o evento (contrato de formulário, ADR-015).
   */
  onValueChange?: (value: string) => void;
  /** `true` vira `aria-invalid="true"` e o estilo de erro. Dentro de FormField, vence o estado dele. */
  invalid?: boolean;
}

/** Campo multilinha. Dentro de um `FormField`, recebe `id`, `aria-describedby` e `aria-invalid`. */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, onValueChange, ...props }, ref) => {
    const field = useFormFieldControl({ ...props, invalid }, { supportsRequired: true });
    const { onChange } = props;
    const handleChange =
      onChange || onValueChange
        ? (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange?.(event);
            onValueChange?.(event.target.value);
          }
        : undefined;
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-surface px-4 py-3 text-base sm:text-sm text-foreground placeholder:text-muted-foreground transition-colors duration-fast ease-standard focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive",
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
Textarea.displayName = "Textarea";

export { Textarea };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
