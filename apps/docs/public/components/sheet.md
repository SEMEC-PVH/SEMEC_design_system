---
title: "Sheet"
code: "sheet"
slug: "sheet"
file: "src/components/sheet.tsx"
category: "feedback"
variants: "side: left · right · top · bottom · composição: Sheet · Trigger · Content · Header · Footer · Title · Description · Close · closeLabel: nome acessível do X de 44×44px (padrão 'Fechar') · rolagem: overflow-y-auto; top/bottom com max-h 85dvh"
---

# Sheet — `sheet`

> Painel lateral modal com overlay. Variantes left/right/top/bottom.

**Arquivo:** `src/components/sheet.tsx` | **Categoria:** Feedback e estados | **Rota:** `/componentes/sheet`

## Variantes

- **side**: left · right · top · bottom
- **composição**: Sheet · Trigger · Content · Header · Footer · Title · Description · Close
- **closeLabel**: nome acessível do X de 44×44px (padrão "Fechar")
- **rolagem**: overflow-y-auto; top/bottom com max-h 85dvh

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
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose, Button } from "@semec/ds/react";

<Sheet>
  <SheetTrigger asChild><Button variant="outline">Abrir filtros</Button></SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Filtros</SheetTitle>
      <SheetDescription>Refine sua busca.</SheetDescription>
    </SheetHeader>
    <div className="p-6">Filtros aqui</div>
    <SheetFooter>
      <SheetClose asChild><Button>Aplicar</Button></SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>

// Controlado SEM SheetTrigger (ex.: aberto por um item de tabela): o Radix
// não sabe para onde devolver o foco. Guarde a origem e devolva em onCloseAutoFocus.
function FiltrosControlados() {
  const [aberto, setAberto] = React.useState(false);
  const origemRef = React.useRef(null);
  return (
    <>
      <Button ref={origemRef} onClick={() => setAberto(true)}>Filtros</Button>
      <Sheet open={aberto} onOpenChange={setAberto}>
        <SheetContent
          closeLabel="Fechar filtros"
          onCloseAutoFocus={(e) => { e.preventDefault(); origemRef.current?.focus(); }}
        >
          <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
          {/* conteúdo longo rola dentro do painel (overflow-y-auto) */}
        </SheetContent>
      </Sheet>
    </>
  );
}
```

## Prompt para IA

```text
Use o componente `Sheet` (Sheet) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Painel lateral modal com overlay. Variantes left/right/top/bottom. API e variantes: side: left · right · top · bottom · composição: Sheet · Trigger · Content · Header · Footer · Title · Description · Close · closeLabel: nome acessível do X de 44×44px (padrão "Fechar") · rolagem: overflow-y-auto; top/bottom com max-h 85dvh. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const Sheet = DialogPrimitive.Root;

const SheetTrigger = DialogPrimitive.Trigger;

const SheetClose = DialogPrimitive.Close;

const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 overflow-y-auto bg-card p-6 shadow-elevation-3 duration-base ease-standard data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 max-h-[85dvh] border-b border-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 max-h-[85dvh] border-t border-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** Nome acessível do botão X de fechar. Padrão: "Fechar". */
  closeLabel?: string;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, closeLabel = "Fechar", ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-fast ease-standard hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">{closeLabel}</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-2 pr-8 text-left", className)}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
