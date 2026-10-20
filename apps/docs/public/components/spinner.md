---
title: "Spinner"
code: "spinner"
slug: "spinner"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/spinner.tsx"
category: "feedback"
variants: "label: texto anunciado (padrão 'Carregando') · decorative: false (padrão, role=status) · true (aria-hidden, sem nome; raiz <span>)"
---

# Spinner — `spinner`

> Indicador de carregamento inline (role=status). Com `decorative`, é só visual (sem role, aria-label nem texto sr-only), para quando outro elemento já anuncia o carregamento; é o que o `Button` com `loading` usa.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/spinner.tsx) | **Categoria:** Feedback e estados | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/spinner/

## Variantes

- **label**: texto anunciado (padrão "Carregando")
- **decorative**: false (padrão, role=status) · true (aria-hidden, sem nome; raiz <span>)

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
import { Spinner } from "@semec/ds/react";

<Spinner label="Carregando protocolos" />
<p className="text-muted-foreground">Carregando dados…</p>

// Só visual: o texto ao lado já diz o que está acontecendo
<p className="flex items-center gap-2"><Spinner decorative /> Atualizando a lista…</p>
```

## Prompt para IA

```text
Use o componente `Spinner` (Spinner) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Indicador de carregamento inline (role=status). Com `decorative`, é só visual (sem role, aria-label nem texto sr-only), para quando outro elemento já anuncia o carregamento; é o que o `Button` com `loading` usa. API e variantes: label: texto anunciado (padrão "Carregando") · decorative: false (padrão, role=status) · true (aria-hidden, sem nome; raiz <span>). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Texto anunciado por leitor de tela. Padrão: "Carregando". */
  label?: string;
  /**
   * Só visual: sem `role="status"`, sem `aria-label` e sem texto `sr-only`
   * (raiz `<span aria-hidden="true">`). Use quando outro elemento já comunica
   * o carregamento, como o `Button` com `loading` (o nome do botão não ganha
   * "Carregando"). Padrão: `false`.
   */
  decorative?: boolean;
}

const spinnerIcon = (
  <svg
    className="h-5 w-5 animate-spin text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, label = "Carregando", decorative = false, ...props }, ref) => {
    if (decorative) {
      // <span>: conteúdo fraseado, válido dentro de <button>.
      return (
        <span
          ref={ref as React.Ref<HTMLSpanElement>}
          aria-hidden="true"
          className={cn("inline-flex items-center justify-center", className)}
          {...props}
        >
          {spinnerIcon}
        </span>
      );
    }
    return (
      <div
        ref={ref}
        role="status"
        aria-label={label}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        {spinnerIcon}
        <span className="sr-only">{label}</span>
      </div>
    );
  }
);
Spinner.displayName = "Spinner";

export { Spinner };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
