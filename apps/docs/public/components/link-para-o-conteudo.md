---
title: "Link para o conteúdo"
code: "skip-link"
slug: "link-para-o-conteudo"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/skip-link.tsx"
category: "navegacao"
variants: "props: href (padrão #conteudo) · children (padrão 'Pular para o conteúdo principal') · a11y: visível no foco · foco movido ao alvo (tabindex=-1 aplicado se preciso) · alvo de 44px"
---

# Link para o conteúdo — `skip-link`

> Link "Pular para o conteúdo principal" (WCAG 2.4.1): oculto até receber foco pelo teclado. Primeiro elemento focável da página; leva o foco ao alvo (padrão #conteudo).

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/skip-link.tsx) | **Categoria:** Navegação | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/link-para-o-conteudo/

## Variantes

- **props**: href (padrão #conteudo) · children (padrão "Pular para o conteúdo principal")
- **a11y**: visível no foco · foco movido ao alvo (tabindex=-1 aplicado se preciso) · alvo de 44px

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

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.4.2 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.3. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { SkipLink, Header } from "@semec/ds/react";

<body>
  <SkipLink />
  <Header>…</Header>
  <main id="conteudo">…</main>
</body>
```

## Prompt para IA

```text
Use o componente `SkipLink` (Link para o conteúdo) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Link "Pular para o conteúdo principal" (WCAG 2.4.1): oculto até receber foco pelo teclado. Primeiro elemento focável da página; leva o foco ao alvo (padrão #conteudo). API e variantes: props: href (padrão #conteudo) · children (padrão "Pular para o conteúdo principal") · a11y: visível no foco · foco movido ao alvo (tabindex=-1 aplicado se preciso) · alvo de 44px. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";

import { cn } from "../lib/utils";

export interface SkipLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Âncora do conteúdo principal. Padrão: `#conteudo`. */
  href?: string;
}

/**
 * Link "Pular para o conteúdo principal" (WCAG 2.4.1). Fica oculto até receber
 * foco pelo teclado e deve ser o primeiro elemento focável da página.
 * O alvo (ex.: `<main id="conteudo">`) recebe o foco ao ativar o link; se ele
 * não for focável, o componente aplica `tabindex="-1"` antes de focar.
 */
const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ className, href = "#conteudo", children, onClick, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented || !href.startsWith("#") || href.length < 2) {
        return;
      }
      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!target) return;
      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }
      target.focus();
    };

    return (
      <a
        ref={ref}
        href={href}
        onClick={handleClick}
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-hero focus:underline focus:shadow-elevation-2 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          className
        )}
        {...props}
      >
        {children ?? "Pular para o conteúdo principal"}
      </a>
    );
  }
);
SkipLink.displayName = "SkipLink";

export { SkipLink };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
