---
title: "Aviso"
code: "alert"
slug: "aviso"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/alert.tsx"
category: "feedback"
variants: "variant: default · success · warning · destructive · announce: assertive (role=alert) · polite (role=status) · off (sem região viva) — padrão: destructive → assertive, demais → polite; role explícito tem precedência · AlertTitle as: div (padrão) · p · h1–h6"
---

# Aviso — `alert`

> Mensagem de feedback em linha, com ícone automático por variante. Só destructive interrompe o leitor de tela (role=alert); as demais usam role=status.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/alert.tsx) | **Categoria:** Feedback e estados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/aviso/

## Variantes

- **variant**: default · success · warning · destructive
- **announce**: assertive (role=alert) · polite (role=status) · off (sem região viva) — padrão: destructive → assertive, demais → polite; role explícito tem precedência
- **AlertTitle as**: div (padrão) · p · h1–h6

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
import { Alert, AlertTitle, AlertDescription } from "@semec/ds/react";

<Alert variant="warning">
  <AlertTitle>Carnê indisponível</AlertTitle>
  <AlertDescription>O sistema volta às 14h.</AlertDescription>
</Alert>

// Erro que pede ação imediata: role=alert automático
<Alert variant="destructive">
  <AlertTitle>Pagamento recusado</AlertTitle>
  <AlertDescription>Confira os dados do cartão.</AlertDescription>
</Alert>

// Aviso estático, presente desde o carregamento: sem região viva
<Alert announce="off">
  <AlertTitle as="h2">Como funciona</AlertTitle>
  <AlertDescription>O protocolo é analisado em até 5 dias úteis.</AlertDescription>
</Alert>
```

## Prompt para IA

```text
Use o componente `Alert` (Aviso) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Mensagem de feedback em linha, com ícone automático por variante. Só destructive interrompe o leitor de tela (role=alert); as demais usam role=status. API e variantes: variant: default · success · warning · destructive · announce: assertive (role=alert) · polite (role=status) · off (sem região viva) — padrão: destructive → assertive, demais → polite; role explícito tem precedência · AlertTitle as: div (padrão) · p · h1–h6. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "../lib/utils";
import type { VariantFunction } from "../lib/variant-function";
import type { HeadingTag } from "./heading";

const alertVariants: VariantFunction<{
  variant: "default" | "success" | "warning" | "destructive";
}> = cva(
  "relative w-full rounded-lg border border-border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4",
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

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>["variant"]>;

const iconMap: Record<AlertVariant, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

/**
 * Como o aviso é anunciado por leitor de tela:
 * - `assertive`: `role="alert"` (interrompe a leitura; só para erro que pede ação imediata);
 * - `polite`: `role="status"` (lido na próxima pausa);
 * - `off`: sem região viva (aviso estático, já presente ao carregar a página).
 */
export type AlertAnnounce = "assertive" | "polite" | "off";

/**
 * Padrão por variante: só `destructive` interrompe. `warning` é `polite` porque
 * avisos (indisponibilidade, prazo) raramente exigem ação imediata e vários
 * `role="alert"` na mesma tela geram anúncios assertivos em excesso (AUD-22).
 */
const announceByVariant: Record<AlertVariant, AlertAnnounce> = {
  default: "polite",
  success: "polite",
  warning: "polite",
  destructive: "assertive",
};

const roleByAnnounce: Record<AlertAnnounce, "alert" | "status" | undefined> = {
  assertive: "alert",
  polite: "status",
  off: undefined,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Sobrescreve o anúncio padrão da variante (`destructive` → `assertive`;
   * demais → `polite`). Uma prop `role` explícita tem precedência.
   */
  announce?: AlertAnnounce;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", announce, role, children, ...props }, ref) => {
    const resolvedVariant: AlertVariant = variant ?? "default";
    const Icon = iconMap[resolvedVariant];
    const resolvedRole =
      role ?? roleByAnnounce[announce ?? announceByVariant[resolvedVariant]];
    return (
      <div
        ref={ref}
        role={resolvedRole}
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

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Elemento do título. Padrão: `div` — o título do aviso é um rótulo, não
   * uma seção da página, e o antigo `<h5>` fixo quebrava a ordem dos títulos
   * (`heading-order`). Passe `h2`–`h6` quando o aviso abrir uma seção.
   */
  as?: HeadingTag;
}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, as: Tag = "div", ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("mb-1 font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-sm [&_p]:leading-relaxed [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-1.5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-1.5",
      className
    )}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
