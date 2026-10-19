---
title: "Gatilho da barra lateral"
code: "sidebar-trigger"
slug: "gatilho-da-barra-lateral"
file: "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/sidebar-trigger.tsx"
category: "navegacao"
variants: "props: open · onToggle · labelOpen · labelClosed · a11y: aria-expanded · aria-label dinâmico (Abrir/Fechar menu)"
---

# Gatilho da barra lateral — `sidebar-trigger`

> `SidebarToggleButton`: botão controlado (`open` + `onToggle`) para colapsar/expandir uma sidebar cujo estado vive no seu layout (ex.: Header). Alterna entre ícones PanelLeftOpen e PanelLeftClose. Dentro de `SidebarProvider`, use `SidebarTrigger` (ver Barra lateral), que não recebe `open`/`onToggle`.

**Arquivo:** [fonte no GitHub](https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/packages/react/src/components/sidebar-trigger.tsx) | **Categoria:** Navegação | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/gatilho-da-barra-lateral/

## Variantes

- **props**: open · onToggle · labelOpen · labelClosed
- **a11y**: aria-expanded · aria-label dinâmico (Abrir/Fechar menu)

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

> Não publicado: este conteúdo vem do repositório e inclui 1 changeset pendente (patch) que ainda não estão no npm. O @semec/ds@4.2.0 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.2.1. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { SidebarToggleButton } from "@semec/ds/react";

// Estado no seu layout; o rótulo acessível vem de labelOpen/labelClosed
<SidebarToggleButton open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

// Com SidebarProvider (componente Barra lateral), use <SidebarTrigger /> — sem open/onToggle
```

## Prompt para IA

```text
Use o componente `SidebarToggleButton` (Gatilho da barra lateral) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. `SidebarToggleButton`: botão controlado (`open` + `onToggle`) para colapsar/expandir uma sidebar cujo estado vive no seu layout (ex.: Header). Alterna entre ícones PanelLeftOpen e PanelLeftClose. Dentro de `SidebarProvider`, use `SidebarTrigger` (ver Barra lateral), que não recebe `open`/`onToggle`. API e variantes: props: open · onToggle · labelOpen · labelClosed · a11y: aria-expanded · aria-label dinâmico (Abrir/Fechar menu). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";

import { IconButton, type IconButtonProps } from "./icon-button";

/**
 * Gatilho para colapsar/expandir a sidebar. Deve ser usado dentro do
 * componente de layout que gerencia o estado da sidebar (ex.: Header).
 *
 * **Props herdadas de IconButton:** `open` controla qual ícone exibir
 * (PanelLeftClose quando aberto, PanelLeftOpen quando fechado). `onToggle`
 * é chamado ao clicar. `label` é opcional: sem ele, o nome acessível
 * alterna entre `labelOpen` e `labelClosed`; com ele, vira um rótulo fixo
 * (o estado continua anunciado por `aria-expanded`).
 */
export interface SidebarToggleButtonProps
  extends Omit<IconButtonProps, "icon" | "label"> {
  /** Rótulo acessível fixo. Opcional; padrão: `labelOpen`/`labelClosed` conforme o estado. */
  label?: string;
  /** Estado atual da sidebar (aberta = true). */
  open?: boolean;
  /** Callback chamado ao clicar no gatilho. */
  onToggle?: () => void;
  /** Rótulo acessível quando a sidebar está aberta. Padrão: "Fechar menu". */
  labelOpen?: string;
  /** Rótulo acessível quando a sidebar está fechada. Padrão: "Abrir menu". */
  labelClosed?: string;
}

const PanelLeftOpen = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    aria-hidden="true"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

const PanelLeftClose = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
    aria-hidden="true"
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
    <path d="m14 9 3 3-3 3" />
  </svg>
);

const SidebarToggleButton = React.forwardRef<HTMLButtonElement, SidebarToggleButtonProps>(
  (
    {
      open = false,
      onToggle,
      labelOpen = "Fechar menu",
      labelClosed = "Abrir menu",
      variant = "ghost",
      label,
      ...props
    },
    ref
  ) => (
    <IconButton
      ref={ref}
      variant={variant}
      label={label ?? (open ? labelOpen : labelClosed)}
      aria-expanded={open}
      onClick={onToggle}
      {...props}
    >
      {open ? <PanelLeftClose /> : <PanelLeftOpen />}
    </IconButton>
  )
);
SidebarToggleButton.displayName = "SidebarToggleButton";

export { SidebarToggleButton };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
