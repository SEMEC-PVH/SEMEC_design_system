---
title: "Interruptor"
code: "switch"
slug: "interruptor"
file: "src/components/switch.tsx"
category: "formularios"
variants: "estados: off · on (checked) · disabled · inválido (invalid) · contrato: checked · defaultChecked · onCheckedChange · name · value (valor enviado) · id · invalid · disabled · required"
---

# Interruptor — `switch`

> Interruptor on/off para ativação imediata. API Radix (`checked`/`onCheckedChange`), equivalente a `value`/`onValueChange` no contrato de formulário; `invalid` vira `aria-invalid`.

**Arquivo:** `src/components/switch.tsx` | **Categoria:** Formulários | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/interruptor/

## Variantes

- **estados**: off · on (checked) · disabled · inválido (invalid)
- **contrato**: checked · defaultChecked · onCheckedChange · name · value (valor enviado) · id · invalid · disabled · required

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers zod.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

> Não publicado: este conteúdo vem do repositório e inclui 4 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.1.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.2.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Switch, Label } from "@semec/ds/react";

<div className="flex items-center gap-2">
  <Switch id="alertas" defaultChecked />
  <Label htmlFor="alertas">Receber alertas</Label>
</div>
```

## Prompt para IA

```text
Use o componente `Switch` (Interruptor) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Interruptor on/off para ativação imediata. API Radix (`checked`/`onCheckedChange`), equivalente a `value`/`onValueChange` no contrato de formulário; `invalid` vira `aria-invalid`. API e variantes: estados: off · on (checked) · disabled · inválido (invalid) · contrato: checked · defaultChecked · onCheckedChange · name · value (valor enviado) · id · invalid · disabled · required. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "../lib/utils";
import { useFormFieldControl } from "./form-field";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  /** Contrato de formulário (ADR-015): `true` vira `aria-invalid="true"` e o estilo de erro. */
  invalid?: boolean;
  }
>(({ className, invalid, ...props }, ref) => {
  // Dentro de um FormField: id, aria-describedby, aria-invalid e aria-required.
  const field = useFormFieldControl({ ...props, invalid }, { supportsRequired: true });
  return (
  <SwitchPrimitives.Root
    className={cn(
      "peer relative inline-flex h-6 w-11 shrink-0 before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input aria-[invalid=true]:border-destructive",
      className
    )}
    {...props}
    {...field}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-elevation-2 ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
