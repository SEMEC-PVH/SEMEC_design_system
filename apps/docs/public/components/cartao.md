---
title: "Cartão"
code: "card"
slug: "cartao"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/card.tsx"
category: "conteudo-dados"
variants: "composição: Card · CardHeader · CardTitle · CardDescription · CardContent · CardFooter · FormHeader · SectionHeader · variante: default (padrão) · solid-brand (azul institucional de alto contraste) · solid-success (verde destaque) · títulos: CardTitle as: h1–h6 · div (padrão) · p · SectionHeader titleAs (padrão h2)"
---

# Cartão — `card`

> Superfície de conteúdo com header, corpo e footer. Sombra pelo token `shadow-elevation-1`.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/card.tsx) | **Categoria:** Conteúdo e dados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/cartao/

## Variantes

- **composição**: Card · CardHeader · CardTitle · CardDescription · CardContent · CardFooter · FormHeader · SectionHeader
- **variante**: default (padrão) · solid-brand (azul institucional de alto contraste) · solid-success (verde destaque)
- **títulos**: CardTitle as: h1–h6 · div (padrão) · p · SectionHeader titleAs (padrão h2)

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

## Uso

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button } from "@semec/ds/react";

// "as" escolhe o nível do título conforme a hierarquia da página
<Card>
  <CardHeader><CardTitle as="h2">IPTU 2026</CardTitle></CardHeader>
  <CardContent>Parcela em dia.</CardContent>
  <CardFooter><Button>Emitir boleto</Button></CardFooter>
</Card>

// Cartão sólido de alto contraste para seleção ou destaque
<Card variant="solid-brand">
  <CardHeader><CardTitle as="h3">Imóvel Urbano</CardTitle></CardHeader>
  <CardContent>Classificação por perímetro urbano.</CardContent>
</Card>
```

## Prompt para IA

```text
Use o componente `Card` (Cartão) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Superfície de conteúdo com header, corpo e footer. Sombra pelo token `shadow-elevation-1`. API e variantes: composição: Card · CardHeader · CardTitle · CardDescription · CardContent · CardFooter · FormHeader · SectionHeader · variante: default (padrão) · solid-brand (azul institucional de alto contraste) · solid-success (verde destaque) · títulos: CardTitle as: h1–h6 · div (padrão) · p · SectionHeader titleAs (padrão h2). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import type { HeadingTag } from "./heading";

const cardVariants = cva(
  "rounded-lg shadow-elevation-1 transition-colors duration-fast ease-standard",
  {
    variants: {
      variant: {
        default:
          "border border-border bg-card text-card-foreground ring-1 ring-foreground/5",
        "solid-brand":
          "border-transparent bg-primary text-primary-foreground ring-0",
        "solid-success":
          "border-transparent bg-feedback-success text-text-on-brand ring-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * Variação do cartão:
   * - `default` (padrão): fundo de superfície com borda sutil e sombra.
   * - `solid-brand`: fundo sólido azul institucional (--action-primary) com alto contraste (WCAG AA).
   * - `solid-success`: fundo sólido verde sucesso (--feedback-success) com alto contraste (WCAG AA).
   */
  variant?: "default" | "solid-brand" | "solid-success";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Elemento do título. Padrão: `div` (mantém o comportamento anterior e não
   * entra no sumário de títulos). Passe `h2`/`h3` conforme a hierarquia da
   * página quando o cartão representar uma seção.
   */
  as?: HeadingTag;
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, as: Tag = "div", ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn("text-lg font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

const FormHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-b border-border bg-surface-alt px-6 py-4 rounded-t-lg",
      className
    )}
    {...props}
  />
));
FormHeader.displayName = "FormHeader";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  /** Elemento do título. Padrão: `h2`. */
  titleAs?: HeadingTag;
}

const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
  ({ className, title, description, badge, titleAs: TitleTag = "h2", children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("pb-2 border-b border-border mb-6", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <TitleTag className="text-xl font-bold text-text-brand uppercase tracking-wide">
          {title}
        </TitleTag>
        {badge}
      </div>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </div>
  )
);
SectionHeader.displayName = "SectionHeader";

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  FormHeader,
  SectionHeader,
};
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
