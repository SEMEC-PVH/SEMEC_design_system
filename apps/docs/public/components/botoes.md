---
title: "Botões"
code: "button"
slug: "botoes"
file: "src/components/button.tsx"
category: "acoes"
variants: "variant: primary · secondary · outline · ghost · destructive · link · size: sm · md · lg · icon"
---

# Botões — `button`

> Ação principal. Seis variantes e quatro tamanhos; `asChild` transforma o botão num link.

**Arquivo:** `src/components/button.tsx` | **Categoria:** Ações e links | **Rota:** `/componentes/botoes`

## Variantes

- **variant**: primary · secondary · outline · ghost · destructive · link
- **size**: sm · md · lg · icon

## Instalação (@semec/ds)

```bash
npm install @semec/ds
```

```css
@import "tailwindcss";
@import "@semec/ds/react/tokens.css";
@config "@semec/ds/react/pv-preset";
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
```

## Prompt para IA

```text
Crie um button (Botões) usando @semec/ds/react (`src/components/button.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: variant: primary · secondary · outline · ghost · destructive · link · size: sm · md · lg · icon. Ação principal. Seis variantes e quatro tamanhos; `asChild` transforma o botão num link.
```

## Fonte

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
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
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
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
