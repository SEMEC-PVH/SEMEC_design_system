---
title: "Botão de ícone"
code: "icon-button"
slug: "botao-de-icone"
file: "src/components/icon-button.tsx"
category: "acoes"
variants: "variant: primary · secondary · outline · ghost · destructive · link"
---

# Botão de ícone — `icon-button`

> Botão quadrado só com ícone. Exige `label` (vira `aria-label` e `title`).

**Arquivo:** `src/components/icon-button.tsx` | **Categoria:** Ações e links | **Rota:** `/componentes/botao-de-icone`

## Variantes

- **variant**: primary · secondary · outline · ghost · destructive · link

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
import { IconButton } from "@semec/ds/react";
import { Download, Search, Trash2 } from "lucide-react";

<IconButton label="Buscar requerimento"><Search /></IconButton>
<IconButton label="Baixar carnê"><Download /></IconButton>
<IconButton label="Excluir requerimento" variant="destructive"><Trash2 /></IconButton>
```

## Prompt para IA

```text
Use o componente `IconButton` (Botão de ícone) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Botão quadrado só com ícone. Exige `label` (vira `aria-label` e `title`). API e variantes: variant: primary · secondary · outline · ghost · destructive · link. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
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

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
