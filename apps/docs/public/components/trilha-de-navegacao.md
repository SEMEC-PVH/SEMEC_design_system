---
title: "Trilha de navegação"
code: "breadcrumb"
slug: "trilha-de-navegacao"
file: "src/components/breadcrumb.tsx"
category: "navegacao"
variants: "props: items: { label, href? }[] · a11y: aria-label=Trilha de navegação · aria-current=page no último item · aria-hidden nos separadores · abaixo de sm, links com alvo mínimo de 44×44px (min-h-11 + ::after de largura)"
---

# Trilha de navegação — `breadcrumb`

> Trilha com o item atual marcado (`current`). Separadores visuais ocultos de leitor de tela.

**Arquivo:** `src/components/breadcrumb.tsx` | **Categoria:** Navegação | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/trilha-de-navegacao/

## Variantes

- **props**: items: { label, href? }[]
- **a11y**: aria-label=Trilha de navegação · aria-current=page no último item · aria-hidden nos separadores · abaixo de sm, links com alvo mínimo de 44×44px (min-h-11 + ::after de largura)

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

No CSS global do app (src/index.css no Vite, app/globals.css no Next.js), nunca via import em JS: o tokens.css tem @theme inline e @utility, que só o Tailwind processa. fonts.css antes do tokens.css. O caminho do @source é relativo ao arquivo CSS (src/app/globals.css usa ../../node_modules/...).

> Não publicado: este conteúdo vem do repositório e inclui 4 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.0.1 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.1.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Breadcrumb } from "@semec/ds/react";

<Breadcrumb items={[
  { label: "Início", href: "/" },
  { label: "Serviços", href: "/servicos" },
  { label: "IPTU" },
]} />
```

## Prompt para IA

```text
Use o componente `Breadcrumb` (Trilha de navegação) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Trilha com o item atual marcado (`current`). Separadores visuais ocultos de leitor de tela. API e variantes: props: items: { label, href? }[] · a11y: aria-label=Trilha de navegação · aria-current=page no último item · aria-hidden nos separadores · abaixo de sm, links com alvo mínimo de 44×44px (min-h-11 + ::after de largura). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "../lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, ...props }, ref) => (
    <nav ref={ref} aria-label="Trilha de navegação" className={className} {...props}>
      <ol className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          // O separador vem no fim do item anterior (dentro do mesmo `li`, que
          // não quebra entre texto e separador): quando a trilha quebra no
          // mobile, a linha nova começa pelo item, nunca por um "›" solto.
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-4">
              {isLast || !item.href ? (
                <span aria-current={isLast ? "page" : undefined} className={cn(isLast && "font-medium text-foreground")}>
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="transition-colors duration-fast ease-standard hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {item.label}
                </a>
              )}
              {!isLast ? (
                <ChevronRight
                  className="h-3.5 w-3.5 shrink-0 opacity-50"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  )
);
Breadcrumb.displayName = "Breadcrumb";

export { Breadcrumb };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
