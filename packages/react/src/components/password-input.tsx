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
          className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast ease-standard hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none"
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
