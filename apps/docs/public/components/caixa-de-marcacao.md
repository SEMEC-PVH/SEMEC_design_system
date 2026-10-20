---
title: "Caixa de marcação"
code: "checkbox"
slug: "caixa-de-marcacao"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/checkbox.tsx"
category: "formularios"
variants: "estados: desmarcado · marcado (checked) · indeterminado · disabled · inválido (invalid) · contrato: checked · defaultChecked · onCheckedChange · name · value (valor enviado) · id · invalid · disabled · required"
---

# Caixa de marcação — `checkbox`

> Caixa de marcação com estado indeterminado. Mantém a API Radix (`checked`/`onCheckedChange`), equivalente a `value`/`onValueChange` no contrato de formulário; `invalid` vira `aria-invalid`.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/checkbox.tsx) | **Categoria:** Formulários | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/caixa-de-marcacao/

## Variantes

- **estados**: desmarcado · marcado (checked) · indeterminado · disabled · inválido (invalid)
- **contrato**: checked · defaultChecked · onCheckedChange · name · value (valor enviado) · id · invalid · disabled · required

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

## Uso

```tsx
import { Checkbox, Label } from "@semec/ds/react";

<div className="flex min-h-11 items-center gap-2">
  <Checkbox id="termos" />
  <Label htmlFor="termos">Aceito os termos</Label>
</div>

// Controlado, com envio em <form> e erro (checked/onCheckedChange = value/onValueChange)
<div className="flex min-h-11 items-center gap-2">
  <Checkbox id="aceite" name="aceite" checked={aceito} onCheckedChange={(v) => setAceito(v === true)} invalid={!aceito && enviado} />
  <Label htmlFor="aceite">Li e aceito o regulamento</Label>
</div>
```

## Prompt para IA

```text
Use o componente `Checkbox` (Caixa de marcação) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Caixa de marcação com estado indeterminado. Mantém a API Radix (`checked`/`onCheckedChange`), equivalente a `value`/`onValueChange` no contrato de formulário; `invalid` vira `aria-invalid`. API e variantes: estados: desmarcado · marcado (checked) · indeterminado · disabled · inválido (invalid) · contrato: checked · defaultChecked · onCheckedChange · name · value (valor enviado) · id · invalid · disabled · required. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  /** Contrato de formulário (ADR-015): `true` vira `aria-invalid="true"` e o estilo de erro. */
  invalid?: boolean;
  }
>(({ className, invalid, ...props }, ref) => {
  // Dentro de um FormField: id, aria-describedby, aria-invalid e aria-required.
  const field = useFormFieldControl({ ...props, invalid }, { supportsRequired: true });
  return (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border border-input bg-surface shadow-elevation-1 transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground aria-[invalid=true]:border-destructive",
      className
    )}
    {...props}
    {...field}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" aria-hidden="true" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
