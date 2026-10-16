---
title: "Título"
code: "heading"
slug: "titulo"
file: "src/components/heading.tsx"
category: "conteudo-dados"
variants: "level: 1 · 2 (padrão) · 3 · 4 · 5 · 6 · size: 1–6 (padrão: igual ao level)"
---

# Título — `heading`

> Título semântico h1–h6 com a escala tipográfica do kit. O nível (level) segue a estrutura da página; o tamanho (size) segue o visual.

**Arquivo:** `src/components/heading.tsx` | **Categoria:** Conteúdo e dados | **Rota:** `/componentes/titulo`

## Variantes

- **level**: 1 · 2 (padrão) · 3 · 4 · 5 · 6
- **size**: 1–6 (padrão: igual ao level)

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao. A receita de formulário (React Hook Form + Zod + FormField + ErrorSummary) usa ainda react-hook-form e @hookform/resolvers, opcionais e fora do kit: npm install react-hook-form @hookform/resolvers zod.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

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
Use o componente `Heading` (Título) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Título semântico h1–h6 com a escala tipográfica do kit. O nível (level) segue a estrutura da página; o tamanho (size) segue o visual. API e variantes: level: 1 · 2 (padrão) · 3 · 4 · 5 · 6 · size: 1–6 (padrão: igual ao level). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "../lib/utils";

/** Nível semântico de título (h1–h6). */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Elemento aceito pela prop `as` dos títulos do kit (AlertTitle, CardTitle,
 * TimelineTitle, `titleAs` de EmptyState/ErrorState/SectionHeader/FooterSection).
 * `div` e `p` servem para rótulos que não devem entrar no sumário de títulos.
 */
export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "p";

const headingVariants = cva("text-foreground", {
  variants: {
    size: {
      1: "text-2xl font-bold leading-tight tracking-tight",
      2: "text-xl font-bold leading-snug",
      3: "text-lg font-semibold leading-snug",
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
