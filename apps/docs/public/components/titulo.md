---
title: "Título"
code: "heading"
slug: "titulo"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/heading.tsx"
category: "conteudo-dados"
variants: "level: 1 · 2 (padrão) · 3 · 4 · 5 · 6 · size: 1–6 (padrão: igual ao level) · 1 = 32px · 2 = 24px · 3 = 20px · 4 = 16px · 5 = 14px · 6 = 12px"
---

# Título — `heading`

> Título semântico h1–h6 com a escala tipográfica do kit. O nível (level) segue a estrutura da página; o tamanho (size) segue o visual. Escala: 1 = `text-3xl` (32px, título da página), 2 = `text-2xl` (24px), 3 = `text-xl` (20px), 4 = `text-base`, 5 = `text-sm`, 6 = `text-xs` em caixa alta.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/heading.tsx) | **Categoria:** Conteúdo e dados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/titulo/

## Variantes

- **level**: 1 · 2 (padrão) · 3 · 4 · 5 · 6
- **size**: 1–6 (padrão: igual ao level) · 1 = 32px · 2 = 24px · 3 = 20px · 4 = 16px · 5 = 14px · 6 = 12px

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

> Não publicado: este conteúdo vem do repositório e inclui 3 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.2.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.3.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Heading } from "@semec/ds/react";

<Heading level={1}>Requerimento de matrícula</Heading>
<Heading level={2}>Dados do estudante</Heading>

// Nível semântico 3 com visual de nível 2
<Heading level={3} size={2}>Documentos</Heading>
```

## Prompt para IA

```text
Use o componente `Heading` (Título) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Título semântico h1–h6 com a escala tipográfica do kit. O nível (level) segue a estrutura da página; o tamanho (size) segue o visual. Escala: 1 = `text-3xl` (32px, título da página), 2 = `text-2xl` (24px), 3 = `text-xl` (20px), 4 = `text-base`, 5 = `text-sm`, 6 = `text-xs` em caixa alta. API e variantes: level: 1 · 2 (padrão) · 3 · 4 · 5 · 6 · size: 1–6 (padrão: igual ao level) · 1 = 32px · 2 = 24px · 3 = 20px · 4 = 16px · 5 = 14px · 6 = 12px. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";
import type { VariantFunction } from "../lib/variant-function";

/** Nível semântico de título (h1–h6). */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Elemento aceito pela prop `as` dos títulos do kit (AlertTitle, CardTitle,
 * TimelineTitle, `titleAs` de EmptyState/ErrorState/SectionHeader/FooterSection).
 * `div` e `p` servem para rótulos que não devem entrar no sumário de títulos.
 */
export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "p";

const headingVariants: VariantFunction<{
  size: 1 | 2 | 3 | 4 | 5 | 6;
}> = cva("text-foreground", {
  variants: {
    size: {
      // TST-16: alinhado à escala do tokens.css e à SKILL (3xl = título de
      // página/h1 32px · 2xl = seção/h2 24px · xl = subtítulo/h3 20px). Até a
      // 4.0.1 o h1 saía com 24px, o h2 com 20px e o h3 com 18px. A entrelinha
      // vem do par `--text-*--line-height` da escala.
      1: "text-3xl font-bold tracking-tight",
      2: "text-2xl font-bold",
      3: "text-xl font-semibold",
      4: "text-base font-semibold leading-normal",
      5: "text-sm font-semibold leading-normal",
      6: "text-xs font-semibold uppercase leading-normal tracking-wide",
    },
  },
  defaultVariants: {
    size: 2,
  },
});

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Nível semântico: define o elemento `h1`–`h6`. Padrão: 2. */
  level?: HeadingLevel;
  /**
   * Tamanho visual na escala do kit, independente do nível. Padrão: igual a
   * `level`. Use para manter a ordem dos títulos sem mudar o visual.
   */
  size?: HeadingLevel;
}

/**
 * Título semântico com a escala tipográfica do kit. O nível (`level`) segue a
 * estrutura da página; o tamanho (`size`) segue o visual.
 */
const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 2, size, ...props }, ref) => {
    const Tag = `h${level}` as const;
    return (
      <Tag
        ref={ref}
        className={cn(headingVariants({ size: size ?? level }), className)}
        {...props}
      />
    );
  }
);
Heading.displayName = "Heading";

export { Heading, headingVariants };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
