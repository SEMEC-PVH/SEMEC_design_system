---
title: "Estado de erro"
code: "error-state"
slug: "estado-de-erro"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/error-state.tsx"
category: "feedback"
variants: "variant: default · inline · props: title · description · icon · action · onRetry · retryLabel · variant · titleAs (padrão h3; p no inline) · a11y: role=alert · aria-live=assertive · ícones com aria-hidden"
---

# Estado de erro — `error-state`

> Estado de erro com anúncio acessível (role=alert), mensagem explicativa e ação de recuperação (onRetry ou ação personalizada).

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/error-state.tsx) | **Categoria:** Feedback e estados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/estado-de-erro/

## Variantes

- **variant**: default · inline
- **props**: title · description · icon · action · onRetry · retryLabel · variant · titleAs (padrão h3; p no inline)
- **a11y**: role=alert · aria-live=assertive · ícones com aria-hidden

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

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.4.1 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.2. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { ErrorState, Button } from "@semec/ds/react";

// Variante padrão com atalho onRetry
<ErrorState
  title="Não foi possível carregar os protocolos"
  description="Houve uma falha na conexão com o servidor. Verifique sua rede e tente novamente."
  onRetry={() => recarregarDados()}
/>

// Variante inline para seções menores
<ErrorState
  variant="inline"
  title="Falha ao atualizar indicador"
  description="Serviço temporariamente indisponível."
  onRetry={() => atualizar()}
/>
```

## Prompt para IA

```text
Use o componente `ErrorState` (Estado de erro) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Estado de erro com anúncio acessível (role=alert), mensagem explicativa e ação de recuperação (onRetry ou ação personalizada). API e variantes: variant: default · inline · props: title · description · icon · action · onRetry · retryLabel · variant · titleAs (padrão h3; p no inline) · a11y: role=alert · aria-live=assertive · ícones com aria-hidden. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";
import type { HeadingTag } from "./heading";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "default" | "inline";
  /**
   * Elemento do título. Padrão: `h3` na variante `default` e `p` na `inline`
   * (comportamento anterior). Ajuste ao nível da página.
   */
  titleAs?: HeadingTag;
}

const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      className,
      title,
      description,
      icon,
      action,
      onRetry,
      retryLabel = "Tentar novamente",
      variant = "default",
      titleAs,
      ...props
    },
    ref
  ) => {
    const isInline = variant === "inline";

    const defaultIcon = (
      <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
    );

    const renderAction = () => {
      if (action) return action;
      if (onRetry) {
        return (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {retryLabel}
          </Button>
        );
      }
      return null;
    };

    if (isInline) {
      return (
        <div
          ref={ref}
          role="alert"
          aria-live="assertive"
          className={cn(
            "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive-surface px-4 py-3 text-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0" aria-hidden="true">
              {icon ?? defaultIcon}
            </div>
            <div className="space-y-0.5 text-left">
              {React.createElement(
                titleAs ?? "p",
                { className: "text-sm font-semibold text-foreground leading-tight" },
                title
              )}
              {description ? (
                <p className="text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          {renderAction() ? (
            <div className="shrink-0 self-end sm:self-center">{renderAction()}</div>
          ) : null}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-destructive/40 bg-destructive-surface/40 px-6 py-12 text-center",
          className
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive-surface text-destructive [&>svg]:h-6 [&>svg]:w-6"
        >
          {icon ?? <AlertCircle aria-hidden="true" />}
        </div>
        <div className="space-y-1 max-w-md">
          {React.createElement(
            titleAs ?? "h3",
            { className: "text-lg font-semibold text-foreground" },
            title
          )}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {renderAction() ? <div className="mt-2">{renderAction()}</div> : null}
      </div>
    );
  }
);
ErrorState.displayName = "ErrorState";

export { ErrorState };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
