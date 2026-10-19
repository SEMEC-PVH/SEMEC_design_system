---
title: "Etiqueta"
code: "badge"
slug: "etiqueta"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/badge.tsx"
category: "conteudo-dados"
variants: "variant: default · secondary · outline · success · warning · danger · info"
---

# Etiqueta — `badge`

> Etiqueta curta de status ou contagem.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/badge.tsx) | **Categoria:** Conteúdo e dados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/etiqueta/

## Variantes

- **variant**: default · secondary · outline · success · warning · danger · info

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
import { Badge } from "@semec/ds/react";

<Badge>Pendente</Badge>
<Badge variant="success">Deferido</Badge>
<Badge variant="danger">Indeferido</Badge>
```

## Prompt para IA

```text
Use o componente `Badge` (Etiqueta) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Etiqueta curta de status ou contagem. API e variantes: variant: default · secondary · outline · success · warning · danger · info. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import type { VariantFunction } from "../lib/variant-function";

const badgeVariants: VariantFunction<{
  variant: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "info";
}> = cva(
  "inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-success-surface text-success",
        warning: "border-transparent bg-warning-surface text-warning",
        danger: "border-transparent bg-destructive-surface text-destructive",
        info: "border-transparent bg-info-surface text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
