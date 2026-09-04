---
title: "Aviso"
code: "alert"
slug: "aviso"
file: "base/components/alert.tsx"
category: "feedback"
variants: "variant: default · success · warning · destructive"
---

# Aviso — `alert`

> Mensagem de feedback em linha, com ícone automático por variante.

**Arquivo:** `base/components/alert.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/aviso`

## Variantes

- **variant**: default · success · warning · destructive

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
import { Alert, AlertTitle, AlertDescription } from "@semec/base";

<Alert variant="warning">
  <AlertTitle>Carnê indisponível</AlertTitle>
  <AlertDescription>O sistema volta às 14h.</AlertDescription>
</Alert>
```

## Prompt para IA

```text
Crie um alert (Aviso) usando @semec/base (`base/components/alert.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: variant: default · success · warning · destructive. Mensagem de feedback em linha, com ícone automático por variante.
```

## Fonte

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4",
  {
    variants: {
      variant: {
        default: "border-info/40 bg-info-surface text-foreground [&>svg]:text-info",
        success:
          "border-success/40 bg-success-surface text-foreground [&>svg]:text-success",
        warning:
          "border-warning/40 bg-warning-surface text-foreground [&>svg]:text-warning",
        destructive:
          "border-destructive/40 bg-destructive-surface text-foreground [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap: Record<NonNullable<VariantProps<typeof alertVariants>["variant"]>, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const Icon = iconMap[variant ?? "default"];
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), "pl-10", className)}
        {...props}
      >
        <Icon className="absolute left-4 top-4" aria-hidden="true" />
        {children}
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
```

## Tokens relacionados

Tokens semânticos usados: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--color-action-primary` etc. Ver `base/tokens.css` e `base/shadcn.css` no dump completo (`/llms-full.txt`).

---
Gerado a partir de `lib/base-manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
