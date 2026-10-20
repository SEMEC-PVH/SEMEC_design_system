---
title: "Cabeçalho"
code: "header"
slug: "cabecalho"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/header.tsx"
category: "navegacao"
variants: "composição: Header · HeaderBrand · HeaderNav · HeaderNavLink · props: HeaderBrand: orgName · serviceName · logo · href ('' = sem link) · truncate · homeLabel · HeaderNavLink: current · a11y: sem logo: placeholder decorativo (aria-hidden) e aviso em dev · nome quebra linha no mobile (truncate opcional) · com Sidebar: Header dentro do SidebarInset (as='div'), antes do <main id='conteudo'>; SkipLink antes do SidebarProvider. Antes do provider o Header fica sob a Sidebar fixa e a marca recebe foco sem aparecer"
---

# Cabeçalho — `header`

> Topo do portal: marca, navegação e CTA. Composição Header + Brand + Nav.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/header.tsx) | **Categoria:** Navegação | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/cabecalho/

## Variantes

- **composição**: Header · HeaderBrand · HeaderNav · HeaderNavLink
- **props**: HeaderBrand: orgName · serviceName · logo · href ("" = sem link) · truncate · homeLabel · HeaderNavLink: current
- **a11y**: sem logo: placeholder decorativo (aria-hidden) e aviso em dev · nome quebra linha no mobile (truncate opcional)
- **com Sidebar**: Header dentro do SidebarInset (as="div"), antes do <main id="conteudo">; SkipLink antes do SidebarProvider. Antes do provider o Header fica sob a Sidebar fixa e a marca recebe foco sem aparecer

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

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.4.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.4.1. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Header, HeaderBrand, HeaderNav, HeaderNavLink } from "@semec/ds/react";
import { Button } from "@semec/ds/react";

<Header>
  <HeaderBrand
    orgName="SEMEC"
    serviceName="Nome do serviço"
    // A logo não vem no pacote: peça o SVG oficial à SEMEC e salve em public/marca.svg.
    logo={<img src="/marca.svg" alt="Prefeitura de Porto Velho" className="h-9 w-auto" />}
  />
  <div className="flex items-center gap-2">
    <HeaderNav>
      <HeaderNavLink href="/prefeitura" current>Prefeitura</HeaderNavLink>
      <HeaderNavLink href="/servicos">Serviços</HeaderNavLink>
    </HeaderNav>
    <Button asChild>
      <a href="/contato">Fale Conosco</a>
    </Button>
  </div>
</Header>
```

## Prompt para IA

```text
Use o componente `Header` (Cabeçalho) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Topo do portal: marca, navegação e CTA. Composição Header + Brand + Nav. API e variantes: composição: Header · HeaderBrand · HeaderNav · HeaderNavLink · props: HeaderBrand: orgName · serviceName · logo · href ("" = sem link) · truncate · homeLabel · HeaderNavLink: current · a11y: sem logo: placeholder decorativo (aria-hidden) e aviso em dev · nome quebra linha no mobile (truncate opcional) · com Sidebar: Header dentro do SidebarInset (as="div"), antes do <main id="conteudo">; SkipLink antes do SidebarProvider. Antes do provider o Header fica sob a Sidebar fixa e a marca recebe foco sem aparecer. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";

import { cn } from "../lib/utils";

const Header = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "flex w-full max-w-full flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6",
        className
      )}
      {...props}
    >
      {children}
    </header>
  )
);
Header.displayName = "Header";

export interface HeaderBrandProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Destino do link da marca. Padrão: `/`. Passe `""` (ou `null`) para
   * renderizar a marca sem link (ex.: já na página inicial).
   */
  href?: string | null;
  /** Nome do órgão. @default "SEMEC" */
  orgName?: string;
  serviceName?: string;
  /**
   * Logo do órgão (ex.: `<img src="/marca.svg" alt="Prefeitura de Porto Velho" />`).
   * Sem logo, aparece um placeholder decorativo e um aviso no console em
   * desenvolvimento.
   */
  logo?: React.ReactNode;
  /**
   * Corta o nome em uma linha com reticências. Padrão: `false` — o nome quebra
   * linha no mobile para não esconder o serviço.
   */
  truncate?: boolean;
  /** Texto para leitor de tela anexado ao link. Padrão: "ir para o início". */
  homeLabel?: string;
}

const HeaderBrand = React.forwardRef<HTMLElement, HeaderBrandProps>(
  (
    {
      className,
      href = "/",
      orgName = "SEMEC",
      serviceName = "Nome do serviço",
      logo,
      truncate = false,
      homeLabel = "ir para o início",
      children,
      ...props
    },
    ref
  ) => {
    const hasLogo = logo !== undefined && logo !== null;

    React.useEffect(() => {
      if (hasLogo) return;
      let isDev = false;
      try {
        // Bundlers substituem `process.env.NODE_ENV` estaticamente; sem
        // bundler (e sem `process`), o acesso lança e o aviso é omitido.
        isDev = process.env.NODE_ENV !== "production";
      } catch {
        isDev = false;
      }
      if (isDev) {
        console.warn(
          "[@semec/ds] HeaderBrand sem `logo`: exibindo placeholder decorativo. Passe o logo do órgão com texto alternativo (ex.: <img alt=\"Prefeitura de Porto Velho\" />)."
        );
      }
    }, [hasLogo]);

    const content = (
      <>
        {hasLogo ? (
          logo
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-[90px] shrink-0 items-center justify-center rounded-md border border-dashed border-border-strong bg-surface-alt text-xs font-medium text-muted-foreground"
          >
            Logo
          </span>
        )}
        {/* Espaços em texto: num contêiner flex não aparecem na tela, mas
            separam as palavras no nome acessível do link (TST-12). */}{" "}
        <span aria-hidden="true" className="h-7 w-px shrink-0 bg-border" />{" "}
        {children ?? (
          <span
            className={cn(
              "min-w-0 text-base font-bold leading-snug text-brand-hero",
              truncate ? "truncate" : "break-words"
            )}
          >
            {/* O "|" é só visual; os espaços separam os nomes (TST-12). */}
            {orgName}{" "}
            <span aria-hidden="true" className="font-normal text-muted-foreground">
              |
            </span>{" "}
            <span className="font-semibold text-foreground">{serviceName}</span>
          </span>
        )}
      </>
    );

    const rootClass = cn(
      "flex min-h-11 min-w-0 items-center gap-3 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      className
    );

    if (href) {
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={rootClass} {...props}>
          {content}{" "}
          <span className="sr-only">— {homeLabel}</span>
        </a>
      );
    }

    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className={rootClass} {...props}>
        {content}
      </div>
    );
  }
);
HeaderBrand.displayName = "HeaderBrand";

const HeaderNav = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="Menu principal"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      {children}
    </nav>
  )
);
HeaderNav.displayName = "HeaderNav";

export interface HeaderNavLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  current?: boolean;
}

const HeaderNavLink = React.forwardRef<HTMLAnchorElement, HeaderNavLinkProps>(
  ({ className, current, ...props }, ref) => (
    <a
      ref={ref}
      aria-current={current ? "page" : undefined}
      className={cn(
        "inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-foreground no-underline transition-colors duration-fast ease-standard hover:text-brand-hero focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        current && "font-semibold text-brand-hero",
        className
      )}
      {...props}
    />
  )
);
HeaderNavLink.displayName = "HeaderNavLink";

export { Header, HeaderBrand, HeaderNav, HeaderNavLink };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
