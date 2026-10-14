---
title: "Estado de erro"
code: "error-state"
slug: "estado-de-erro"
file: "src/components/error-state.tsx"
category: "feedback"
variants: "variant: default · inline · props: title · description · icon · action · onRetry · retryLabel · variant · a11y: role=alert · aria-live=assertive · ícones com aria-hidden"
---

# Estado de erro — `error-state`

> Estado de erro com anúncio acessível (role=alert), mensagem explicativa e ação de recuperação (onRetry ou ação personalizada).

**Arquivo:** `src/components/error-state.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/estado-de-erro`

## Variantes

- **variant**: default · inline
- **props**: title · description · icon · action · onRetry · retryLabel · variant
- **a11y**: role=alert · aria-live=assertive · ícones com aria-hidden

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

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
Crie um error-state (Estado de erro) usando @semec/ds/react (`src/components/error-state.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: variant: default · inline · props: title · description · icon · action · onRetry · retryLabel · variant · a11y: role=alert · aria-live=assertive · ícones com aria-hidden. Estado de erro com anúncio acessível (role=alert), mensagem explicativa e ação de recuperação (onRetry ou ação personalizada).
```

## Fonte

```tsx
import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: "default" | "inline";
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
            <div className="mt-0.5 shrink-0">
              {icon ?? defaultIcon}
            </div>
            <div className="space-y-0.5 text-left">
              <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
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
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive-surface text-destructive [&>svg]:h-6 [&>svg]:w-6">
          {icon ?? <AlertCircle aria-hidden="true" />}
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
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
