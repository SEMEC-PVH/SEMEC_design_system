---
title: "Gatilho da barra lateral"
code: "sidebar-trigger"
slug: "gatilho-da-barra-lateral"
file: "src/components/sidebar-trigger.tsx"
category: "navegacao"
variants: "props: open · onToggle · labelOpen · labelClosed · a11y: aria-expanded · aria-label dinâmico (Abrir/Fechar menu)"
---

# Gatilho da barra lateral — `sidebar-trigger`

> Botão para colapsar/expandir a sidebar. Alterna entre ícones PanelLeftOpen e PanelLeftClose.

**Arquivo:** `src/components/sidebar-trigger.tsx` | **Categoria:** Navegação | **Rota:** `/componentes/gatilho-da-barra-lateral`

## Variantes

- **props**: open · onToggle · labelOpen · labelClosed
- **a11y**: aria-expanded · aria-label dinâmico (Abrir/Fechar menu)

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
import { SidebarTrigger } from "@semec/ds/react";

<SidebarTrigger open={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
```

## Prompt para IA

```text
Crie um sidebar-trigger (Gatilho da barra lateral) usando @semec/ds/react (`src/components/sidebar-trigger.tsx`), estilo shadcn (Radix + CVA + clsx + tailwind-merge) em React + Tailwind CSS v4. Variantes: props: open · onToggle · labelOpen · labelClosed · a11y: aria-expanded · aria-label dinâmico (Abrir/Fechar menu). Botão para colapsar/expandir a sidebar. Alterna entre ícones PanelLeftOpen e PanelLeftClose.
```

## Fonte

```tsx
import * as React from "react";

import { IconButton, type IconButtonProps } from "./icon-button";

/**
 * Gatilho para colapsar/expandir a sidebar. Deve ser usado dentro do
 * componente de layout que gerencia o estado da sidebar (ex.: Header).
 *
 * **Props herdadas de IconButton:** `open` controla qual ícone exibir
 * (PanelLeftClose quando aberto, PanelLeftOpen quando fechado). `onToggle`
 * é chamado ao clicar. `label` pode ser sobrescrito para rótulos
 * específicos.
 */
export interface SidebarToggleButtonProps
  extends Omit<IconButtonProps, "icon"> {
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
      label: _label,
      ...props
    },
    ref
  ) => (
    <IconButton
      ref={ref}
      variant={variant}
      label={open ? labelOpen : labelClosed}
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
