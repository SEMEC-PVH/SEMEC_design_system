---
title: "Botões"
code: "button"
slug: "botoes"
file: "src/components/button.tsx"
category: "acoes"
variants: "variant: primary · secondary · outline · ghost · destructive · success · link · size: sm (36px visual, alvo 44px) · md (44px) · lg (48px) · icon (44×44px) · loading: false (padrão) · true (Spinner decorativo, aria-busy, aria-disabled, clique bloqueado, continua focalizável) · loadingText (texto visível durante o carregamento) · com asChild, o spinner entra no link e o onClick do filho não dispara · o clique ainda sobe aos ancestrais (só envio e navegação são cancelados)"
---

# Botões — `button`

> Ação principal. Seis variantes e quatro tamanhos; `asChild` transforma o botão num link. Todos os tamanhos têm alvo de toque de 44px: `sm` mantém o visual de 36px com a área clicável estendida. `loading` mostra um Spinner decorativo, aplica `aria-busy` e `aria-disabled` e bloqueia o clique sem tirar o foco do botão; o nome acessível continua sendo o texto visível.

**Arquivo:** `src/components/button.tsx` | **Categoria:** Ações e links | **Rota:** `/componentes/botoes`

## Variantes

- **variant**: primary · secondary · outline · ghost · destructive · success · link
- **size**: sm (36px visual, alvo 44px) · md (44px) · lg (48px) · icon (44×44px)
- **loading**: false (padrão) · true (Spinner decorativo, aria-busy, aria-disabled, clique bloqueado, continua focalizável) · loadingText (texto visível durante o carregamento) · com asChild, o spinner entra no link e o onClick do filho não dispara · o clique ainda sobe aos ancestrais (só envio e navegação são cancelados)

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { Button } from "@semec/ds/react";
import Link from "next/link";
import { Plus } from "lucide-react";

<Button variant="primary">Emitir boleto</Button>
<Button variant="outline">Salvar rascunho</Button>
<Button variant="ghost">Cancelar</Button>

<Button variant="destructive">Excluir requerimento</Button>

<Button><Plus /> Adicionar serviço</Button>

<Button asChild>
  <Link href="/iptu">Ver meu IPTU</Link>
</Button>

// Envio em andamento: o foco fica no botão e o clique é ignorado
<Button type="submit" loading={enviando} loadingText="Enviando…">
  Enviar requerimento
</Button>
```

## Prompt para IA

```text
Use o componente `Button` (Botões) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Ação principal. Seis variantes e quatro tamanhos; `asChild` transforma o botão num link. Todos os tamanhos têm alvo de toque de 44px: `sm` mantém o visual de 36px com a área clicável estendida. `loading` mostra um Spinner decorativo, aplica `aria-busy` e `aria-disabled` e bloqueia o clique sem tirar o foco do botão; o nome acessível continua sendo o texto visível. API e variantes: variant: primary · secondary · outline · ghost · destructive · success · link · size: sm (36px visual, alvo 44px) · md (44px) · lg (48px) · icon (44×44px) · loading: false (padrão) · true (Spinner decorativo, aria-busy, aria-disabled, clique bloqueado, continua focalizável) · loadingText (texto visível durante o carregamento) · com asChild, o spinner entra no link e o onClick do filho não dispara · o clique ainda sobe aos ancestrais (só envio e navegação são cancelados). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import { ButtonLoadingIndicator } from "./button-loading";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium no-underline transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:
          "border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success:
          "bg-success text-white hover:bg-success/90 focus-visible:ring-success/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // AUD-10: o visual compacto (36px) é mantido, mas a área clicável é
        // estendida a 44×44px por um pseudo-elemento centralizado.
        sm: "h-9 px-4 text-sm relative after:absolute after:left-1/2 after:top-1/2 after:h-full after:min-h-11 after:w-full after:min-w-11 after:-translate-x-1/2 after:-translate-y-1/2",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Ação em andamento (AUD-63): mostra um Spinner decorativo, aplica
   * `aria-busy="true"` e `aria-disabled="true"` e ignora cliques (inclusive o
   * envio do formulário). O botão continua focalizável: o foco não se perde
   * durante o carregamento. O nome acessível segue sendo o texto do botão.
   */
  loading?: boolean;
  /**
   * Texto visível durante o `loading` (ex.: "Enviando…"), no lugar dos
   * `children`. Sem ele, o texto original permanece.
   */
  loadingText?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    // O elemento é o mesmo com e sem loading (sem remontar: o foco fica).
    // O bloqueio do clique mora no ButtonLoadingIndicator ("use client"),
    // para o Button seguir renderizando no servidor; o onClick de quem usa
    // não é repassado enquanto carrega.
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), loading && "cursor-progress")}
        ref={ref}
        onClick={loading ? undefined : onClick}
        {...props}
        aria-busy={loading ? true : props["aria-busy"]}
        aria-disabled={loading ? true : props["aria-disabled"]}
      >
        {!loading ? (
          children
        ) : asChild ? (
          [
            <ButtonLoadingIndicator key="loading" />,
            // O Slot mesclaria o onClick do filho (ex.: <a onClick>): durante o
            // loading ele também não é repassado.
            <Slottable key="child">
              {React.isValidElement<{ onClick?: unknown }>(children)
                ? React.cloneElement(children, { onClick: undefined })
                : children}
            </Slottable>,
          ]
        ) : (
          <>
            <ButtonLoadingIndicator />
            {loadingText ?? children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
