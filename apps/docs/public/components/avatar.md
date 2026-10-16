---
title: "Avatar"
code: "avatar"
slug: "avatar"
file: "src/components/avatar.tsx"
category: "conteudo-dados"
variants: "composição: Avatar · AvatarImage · AvatarFallback · a11y: alt da AvatarImage = nome da pessoa (vale também para o fallback) · alt vazio para foto decorativa (o fallback não anuncia) · aria-label no AvatarFallback vence o alt · tamanhos: h-10 w-10 (padrão) — sobrescreva com className"
---

# Avatar — `avatar`

> Foto de perfil com fallback automático (iniciais). Com a foto quebrada, o `AvatarFallback` anuncia o `alt` da `AvatarImage` (as iniciais ficam só visuais); um `aria-label` no `AvatarFallback` continua aceito e tem prioridade.

**Arquivo:** `src/components/avatar.tsx` | **Categoria:** Conteúdo e dados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/avatar/

## Variantes

- **composição**: Avatar · AvatarImage · AvatarFallback
- **a11y**: alt da AvatarImage = nome da pessoa (vale também para o fallback) · alt vazio para foto decorativa (o fallback não anuncia) · aria-label no AvatarFallback vence o alt
- **tamanhos**: h-10 w-10 (padrão) — sobrescreva com className

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

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.2.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.2.1. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@semec/ds/react";

// Se a foto falhar, o leitor de tela continua ouvindo "João Silva" (não "JS")
<Avatar>
  <AvatarImage src="/foto.jpg" alt="João Silva" />
  <AvatarFallback>JS</AvatarFallback>
</Avatar>

// Sem foto: dê o nome no próprio fallback
<Avatar>
  <AvatarFallback aria-label="Maria Souza">MS</AvatarFallback>
</Avatar>
```

## Prompt para IA

```text
Use o componente `Avatar` (Avatar) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Foto de perfil com fallback automático (iniciais). Com a foto quebrada, o `AvatarFallback` anuncia o `alt` da `AvatarImage` (as iniciais ficam só visuais); um `aria-label` no `AvatarFallback` continua aceito e tem prioridade. API e variantes: composição: Avatar · AvatarImage · AvatarFallback · a11y: alt da AvatarImage = nome da pessoa (vale também para o fallback) · alt vazio para foto decorativa (o fallback não anuncia) · aria-label no AvatarFallback vence o alt · tamanhos: h-10 w-10 (padrão) — sobrescreva com className. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "../lib/utils";

/**
 * TST-26: guarda o `alt` da AvatarImage para o AvatarFallback. Com a foto
 * quebrada, o Radix desmonta a imagem e o leitor de tela lia só as iniciais
 * ("JS"), perdendo o nome da pessoa.
 */
const AvatarAltContext = React.createContext<{
  alt: string | undefined;
  setAlt: (alt: string | undefined) => void;
} | null>(null);

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => {
  const [alt, setAlt] = React.useState<string | undefined>(undefined);
  const value = React.useMemo(() => ({ alt, setAlt }), [alt]);
  return (
    <AvatarAltContext.Provider value={value}>
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
          className
        )}
        {...props}
      />
    </AvatarAltContext.Provider>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, alt, ...props }, ref) => {
  const setAlt = React.useContext(AvatarAltContext)?.setAlt;
  React.useEffect(() => {
    if (!setAlt) return;
    setAlt(alt);
    return () => setAlt(undefined);
  }, [alt, setAlt]);
  return (
    <AvatarPrimitive.Image
      ref={ref}
      alt={alt}
      className={cn("aspect-square h-full w-full", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, children, ...props }, ref) => {
  const alt = React.useContext(AvatarAltContext)?.alt;
  // Quando a foto tem `alt` e quem usa não deu nome ao fallback, o fallback
  // anuncia o mesmo nome da foto (texto `sr-only`) e esconde as iniciais do
  // leitor de tela. `alt=""` (foto decorativa) não muda nada.
  const named = Boolean(alt && !props["aria-label"] && !props["aria-labelledby"]);
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground",
        className
      )}
      {...props}
    >
      {named ? (
        <>
          <span aria-hidden="true">{children}</span>
          <span className="sr-only">{alt}</span>
        </>
      ) : (
        children
      )}
    </AvatarPrimitive.Fallback>
  );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
