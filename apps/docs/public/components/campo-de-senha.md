---
title: "Campo de senha"
code: "password-input"
slug: "campo-de-senha"
file: "src/components/password-input.tsx"
category: "formularios"
variants: "visibilidade: defaultVisible · visible + onVisibleChange (controlado) · labels: show (padrão 'Mostrar senha') · autoComplete: current-password (login) · new-password (cadastro e troca de senha)"
---

# Campo de senha — `password-input`

> Campo de senha sobre o `Input`, com botão de 44px para mostrar ou ocultar o texto. O botão tem nome fixo ("Mostrar senha") e `aria-pressed` (pressionado = senha visível), além de `aria-controls` para o campo. Desliga corretor e maiúscula automática (`spellCheck={false}`, `autoCapitalize="none"`, `autoCorrect="off"`, sobrescrevíveis), que alterariam a senha visível. Repassa todas as props do `Input`, inclusive `autoComplete`.

**Arquivo:** `src/components/password-input.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/campo-de-senha`

## Variantes

- **visibilidade**: defaultVisible · visible + onVisibleChange (controlado)
- **labels**: show (padrão "Mostrar senha")
- **autoComplete**: current-password (login) · new-password (cadastro e troca de senha)

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
import { FormField, PasswordInput } from "@semec/ds/react";

<FormField label="Senha" hint="Mínimo de 8 caracteres">
  <PasswordInput autoComplete="current-password" />
</FormField>

<FormField label="Nova senha">
  <PasswordInput autoComplete="new-password" />
</FormField>
```

## Prompt para IA

```text
Use o componente `PasswordInput` (Campo de senha) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Campo de senha sobre o `Input`, com botão de 44px para mostrar ou ocultar o texto. O botão tem nome fixo ("Mostrar senha") e `aria-pressed` (pressionado = senha visível), além de `aria-controls` para o campo. Desliga corretor e maiúscula automática (`spellCheck={false}`, `autoCapitalize="none"`, `autoCorrect="off"`, sobrescrevíveis), que alterariam a senha visível. Repassa todas as props do `Input`, inclusive `autoComplete`. API e variantes: visibilidade: defaultVisible · visible + onVisibleChange (controlado) · labels: show (padrão "Mostrar senha") · autoComplete: current-password (login) · new-password (cadastro e troca de senha). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "../lib/utils";
import { Input } from "./input";

export interface PasswordInputLabels {
  /**
   * Nome acessível do botão de alternar. Padrão: "Mostrar senha". O nome não
   * muda com o estado: quem diz se a senha está visível é `aria-pressed`
   * (padrão de botão alternável da APG: trocar o nome junto com o estado
   * faria o leitor anunciar "Ocultar senha, pressionado").
   */
  show: string;
}

const defaultLabels: PasswordInputLabels = {
  show: "Mostrar senha",
};

export interface PasswordInputProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Input>, "type"> {
  /** Senha visível (controlado). */
  visible?: boolean;
  /** Senha visível no primeiro render (não controlado). Padrão: `false`. */
  defaultVisible?: boolean;
  /** Chamado quando o botão alterna a visibilidade. */
  onVisibleChange?: (visible: boolean) => void;
  /** Textos fixos (PT-BR por padrão). */
  labels?: Partial<PasswordInputLabels>;
}

/**
 * Campo de senha: o `Input` do kit com um botão de 44px que mostra ou oculta
 * o texto. O botão tem `aria-pressed` (pressionado = senha visível) e
 * `aria-controls` apontando para o campo. Todas as props do `Input` são
 * repassadas (inclusive `autoComplete`; use `current-password` no login e
 * `new-password` no cadastro).
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      id,
      visible: visibleProp,
      defaultVisible = false,
      onVisibleChange,
      labels,
      disabled,
      ...props
    },
    ref
  ) => {
    const text = { ...defaultLabels, ...labels };
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const [visibleState, setVisibleState] = React.useState(defaultVisible);
    const visible = visibleProp ?? visibleState;

    const toggle = () => {
      const next = !visible;
      if (visibleProp === undefined) setVisibleState(next);
      onVisibleChange?.(next);
    };

    const Icon = visible ? EyeOff : Eye;

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          id={inputId}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn("pr-12 [&::-ms-reveal]:hidden", className)}
          // Com a senha visível (type="text"), corretor e maiúscula automática
          // alterariam a senha. Sobrescrevíveis por props.
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          {...props}
        />
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-label={text.show}
          aria-pressed={visible}
          aria-controls={inputId}
          className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast ease-standard hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none"
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
