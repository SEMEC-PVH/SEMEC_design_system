---
title: "Botão de ícone"
code: "icon-button"
slug: "botao-de-icone"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/icon-button.tsx"
category: "acoes"
variants: "variant: primary · secondary · outline · ghost · destructive · link · loading: false (padrão) · true (Spinner no lugar do ícone, aria-busy, aria-disabled, clique bloqueado)"
---

# Botão de ícone — `icon-button`

> Botão quadrado só com ícone. Exige `label` (vira `aria-label` e `title`). `loading` troca o ícone por um Spinner decorativo e mantém o `label` como nome.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/icon-button.tsx) | **Categoria:** Ações e links | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/botao-de-icone/

## Variantes

- **variant**: primary · secondary · outline · ghost · destructive · link
- **loading**: false (padrão) · true (Spinner no lugar do ícone, aria-busy, aria-disabled, clique bloqueado)

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

> Não publicado: este conteúdo vem do repositório e inclui 2 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.2.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.3.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { IconButton } from "@semec/ds/react";
import { Download, Search, Trash2 } from "lucide-react";

<IconButton label="Buscar requerimento"><Search /></IconButton>
<IconButton label="Baixar carnê"><Download /></IconButton>
<IconButton label="Excluir requerimento" variant="destructive"><Trash2 /></IconButton>
<IconButton label="Baixar carnê" loading={baixando}><Download /></IconButton>
```

## Prompt para IA

```text
Use o componente `IconButton` (Botão de ícone) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Botão quadrado só com ícone. Exige `label` (vira `aria-label` e `title`). `loading` troca o ícone por um Spinner decorativo e mantém o `label` como nome. API e variantes: variant: primary · secondary · outline · ghost · destructive · link · loading: false (padrão) · true (Spinner no lugar do ícone, aria-busy, aria-disabled, clique bloqueado). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { VariantFunction } from "../lib/variant-function";

import { Button } from "./button";

const iconButtonVariants: VariantFunction<{
  variant: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "link";
}> = cva("", {
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
  /**
   * Ação em andamento: troca o ícone por um Spinner decorativo e repassa
   * `loading` ao `Button` (`aria-busy`, `aria-disabled`, clique bloqueado,
   * foco mantido). O nome acessível continua sendo `label`.
   */
  loading?: boolean;
}

/**
 * Botão representado apenas por ícone. O rótulo acessível é obrigatório
 * (`label`) — sem ele, leitores de tela anunciam um botão vazio.
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { className, label, variant = "outline", type = "button", loading = false, children, ...props },
    ref
  ) => (
    <Button
      ref={ref}
      type={type}
      size="icon"
      variant={variant}
      aria-label={label}
      title={label}
      className={className}
      loading={loading}
      {...props}
    >
      {loading ? null : children}
    </Button>
  )
);
IconButton.displayName = "IconButton";

export { IconButton };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
