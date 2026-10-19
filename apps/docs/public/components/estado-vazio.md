---
title: "Estado vazio"
code: "empty-state"
slug: "estado-vazio"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/empty-state.tsx"
category: "feedback"
variants: "props: icon · title · description · action · titleAs (padrão h3)"
---

# Estado vazio — `empty-state`

> Estado vazio com ícone, título, descrição e ação opcional.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/empty-state.tsx) | **Categoria:** Feedback e estados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/estado-vazio/

## Variantes

- **props**: icon · title · description · action · titleAs (padrão h3)

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

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (minor) que ainda não estão no npm. O @semec/ds@4.3.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { EmptyState, Button } from "@semec/ds/react";
import { Inbox } from "lucide-react";

<EmptyState
  icon={<Inbox />}
  title="Nenhum protocolo encontrado"
  titleAs="h2"
  description="Ajuste os filtros ou abra um novo requerimento."
  action={<Button>Abrir requerimento</Button>}
/>
```

## Prompt para IA

```text
Use o componente `EmptyState` (Estado vazio) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Estado vazio com ícone, título, descrição e ação opcional. API e variantes: props: icon · title · description · action · titleAs (padrão h3). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";
import type { HeadingTag } from "./heading";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  /**
   * Elemento do título. Padrão: `h3` (comportamento anterior). Ajuste ao
   * nível da página para não pular níveis (ex.: `h2` logo abaixo do `h1`).
   */
  titleAs?: HeadingTag;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, titleAs: TitleTag = "h3", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface-alt/50 px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon ? (
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&>svg]:h-6 [&>svg]:w-6"
        >
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <TitleTag className="text-lg font-semibold text-foreground">{title}</TitleTag>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  )
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
