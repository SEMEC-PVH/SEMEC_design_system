---
title: "Botão de ícone"
code: "icon-button"
slug: "botao-de-icone"
file: "base/components/icon-button.tsx"
category: "acoes"
variants: "variant: primary · secondary · outline · ghost · destructive · link"
---

# Botão de ícone — `icon-button`

> Botão quadrado só com ícone. Exige `aria-label`.

**Arquivo:** `base/components/icon-button.tsx` | **Categoria:** Ações e links | **Rota:** `/componentes/botao-de-icone`

## Variantes

- **variant**: primary · secondary · outline · ghost · destructive · link

## Instalação (kit @semec/base)

```bash
# 1. Copie base/ para seu projeto
# 2. Instale deps (ver base/README.md)
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
import { IconButton } from "@semec/base";
import { Plus } from "lucide-react";

<IconButton aria-label="Adicionar"><Plus /></IconButton>
```

## Prompt para IA

```text
Crie um icon-button (Botão de ícone) usando @semec/base (`base/components/icon-button.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: variant: primary · secondary · outline · ghost · destructive · link. Botão quadrado só com ícone. Exige `aria-label`.
```

## Fonte

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "./button";

const iconButtonVariants = cva("", {
  variants: {
    variant: {
      primary: "",
      secondary: "",
      outline: "",
      ghost: "",
      destructive: "",
      link: "",
    },
  },
  defaultVariants: { variant: "outline" },
});

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  label: string;
}

/**
 * Botão representado apenas por ícone. O rótulo acessível é obrigatório
 * (`label`) — sem ele, leitores de tela anunciam um botão vazio.
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, variant = "outline", type = "button", ...props }, ref) => (
    <Button
      ref={ref}
      type={type}
      size="icon"
      variant={variant}
      aria-label={label}
      title={label}
      className={className}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";

export { IconButton };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `base/tokens.css` e `base/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `lib/base-manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
