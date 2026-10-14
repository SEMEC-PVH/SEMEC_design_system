---
title: "Campo de formulário"
code: "form-field"
slug: "campo-de-formulario"
file: "src/components/form-field.tsx"
category: "formularios"
variants: "props: label · htmlFor · required · hint · error · id (base dos ids <id>-hint/<id>-error) · hooks: useFormField · useFormFieldControl (para campos próprios)"
---

# Campo de formulário — `form-field`

> Casaco do campo: label, obrigatório, dica e mensagem de erro na ordem certa. Liga o campo filho pelo contexto (`FormFieldContext`): `id` (gerado com `useId` se faltar), `aria-describedby` (dica + erro) e `aria-invalid` com erro, sem sobrescrever o que for passado. Funciona com Input, Textarea, SelectTrigger, Combobox, DatePicker, Checkbox, RadioGroup, Switch, InputOTP, FileUpload e Slider. O erro não usa `role="alert"`: é lido ao focar o campo, e o anúncio fica com o ErrorSummary. Para sucesso após envio, use Toast.

**Arquivo:** `src/components/form-field.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/campo-de-formulario`

## Variantes

- **props**: label · htmlFor · required · hint · error · id (base dos ids <id>-hint/<id>-error)
- **hooks**: useFormField · useFormFieldControl (para campos próprios)

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
import { FormField, Input, Button, useToast } from "@semec/ds/react";

// Em formulários: erros ficam inline no FormField (+ ErrorSummary no topo).
// Sucesso na submissão dispara notificação via toast:
function Formulario() {
  const { toast } = useToast();
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      toast({ variant: "success", title: "Salvo com sucesso", description: "Alterações registradas." });
    }}>
      {/* id, aria-describedby (dica/erro) e aria-invalid chegam ao Input pelo contexto */}
      <FormField label="E-mail" required hint="Usado para o comprovante" error={erro}>
        <Input id="email" type="email" />
      </FormField>
      <Button type="submit">Salvar</Button>
    </form>
  );
}
```

## Prompt para IA

```text
Use o componente `FormField` (Campo de formulário) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Casaco do campo: label, obrigatório, dica e mensagem de erro na ordem certa. Liga o campo filho pelo contexto (`FormFieldContext`): `id` (gerado com `useId` se faltar), `aria-describedby` (dica + erro) e `aria-invalid` com erro, sem sobrescrever o que for passado. Funciona com Input, Textarea, SelectTrigger, Combobox, DatePicker, Checkbox, RadioGroup, Switch, InputOTP, FileUpload e Slider. O erro não usa `role="alert"`: é lido ao focar o campo, e o anúncio fica com o ErrorSummary. Para sucesso após envio, use Toast. API e variantes: props: label · htmlFor · required · hint · error · id (base dos ids <id>-hint/<id>-error) · hooks: useFormField · useFormFieldControl (para campos próprios). Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
import * as React from "react";

import { cn } from "../lib/utils";

// useLayoutEffect sem aviso no SSR (renderToString).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** Como o controle dentro do FormField se registra (ver `useFormFieldControl`). */
export interface FormFieldControlInfo {
  /** `id` que o consumidor passou explicitamente ao controle. */
  id?: string;
  /**
   * `false` quando o elemento que recebe o `id` não é rotulável por
   * `<label for>` (ex.: `div role="radiogroup"`, polegar do Slider, grupo do
   * InputOTP). Nesse caso o rótulo sai sem `for` e o controle usa
   * `aria-labelledby`.
   */
  labelable: boolean;
}

export interface FormFieldContextValue {
  /** `id` do controle (alvo do `<label for>`). */
  controlId: string;
  /** `id` do `<label>` do FormField (para `aria-labelledby`), se houver rótulo. */
  labelId?: string;
  /** `id` da dica, quando ela está visível. */
  hintId?: string;
  /** `id` da mensagem de erro, quando há erro. */
  errorId?: string;
  /** Dica + erro, na ordem em que aparecem, para `aria-describedby`. */
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  /** Registra o controle filho. Devolve a função de limpeza. */
  registerControl: (info: FormFieldControlInfo) => () => void;
}

/**
 * Contexto do FormField. Os campos do kit (Input, Textarea, SelectTrigger,
 * Combobox, DatePicker, Checkbox, RadioGroup, Switch, InputOTP, FileUpload e
 * Slider) leem este contexto e recebem `id`, `aria-describedby` e
 * `aria-invalid` sem que o consumidor precise montar os ids à mão.
 */
export const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

/** Lê o contexto do FormField mais próximo (ou `null` fora de um FormField). */
export function useFormField() {
  return React.useContext(FormFieldContext);
}

const joinIds = (...ids: Array<string | undefined | null | false>) => {
  const unique = Array.from(
    new Set(
      ids
        .filter(Boolean)
        .join(" ")
        .split(/\s+/)
        .filter(Boolean)
    )
  );
  return unique.length ? unique.join(" ") : undefined;
};

export interface UseFormFieldControlProps {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-labelledby"?: string;
  "aria-label"?: string;
  "aria-required"?: React.AriaAttributes["aria-required"];
  required?: boolean;
}

/** Atributos que `useFormFieldControl` devolve (só as chaves com valor). */
export interface FormFieldControlAttributes {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  "aria-labelledby"?: string;
  "aria-required"?: React.AriaAttributes["aria-required"];
}

// Chaves sem valor ficam de fora, para não apagar defaults de quem recebe o
// spread (ex.: o `aria-required` que o Radix já põe no gatilho).
const withoutUndefined = (attrs: FormFieldControlAttributes): FormFieldControlAttributes => {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(attrs)) if (val !== undefined) out[key] = val;
  return out as FormFieldControlAttributes;
};

export interface UseFormFieldControlOptions {
  /** Ver `FormFieldControlInfo.labelable`. Padrão: `true`. */
  labelable?: boolean;
  /** O papel ARIA do controle aceita `aria-required`. Padrão: `false`. */
  supportsRequired?: boolean;
}

/**
 * Liga um controle ao FormField que o envolve. O que o consumidor passou
 * explicitamente vence: `id` e `aria-invalid` passados não são trocados, e o
 * `aria-describedby` passado é mantido (somado aos ids de dica e erro, sem
 * repetir). Fora de um FormField, devolve as props como vieram.
 */
export function useFormFieldControl(
  props: UseFormFieldControlProps,
  { labelable = true, supportsRequired = false }: UseFormFieldControlOptions = {}
): FormFieldControlAttributes {
  const ctx = React.useContext(FormFieldContext);
  const explicitId = props.id;
  const register = ctx?.registerControl;

  useIsomorphicLayoutEffect(() => {
    if (!register) return;
    return register({ id: explicitId, labelable });
  }, [register, explicitId, labelable]);

  // Fora de um FormField não há nada a acrescentar.
  if (!ctx) return {} as FormFieldControlAttributes;

  const hasOwnName = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  return withoutUndefined({
    id: props.id ?? ctx.controlId,
    "aria-describedby": joinIds(props["aria-describedby"], ctx.describedBy),
    "aria-invalid": props["aria-invalid"] ?? (ctx.invalid ? true : undefined),
    // Elemento não rotulável por <label for>: o nome vem do rótulo do FormField.
    "aria-labelledby":
      props["aria-labelledby"] ?? (!labelable && !hasOwnName ? ctx.labelId : undefined),
    "aria-required":
      props["aria-required"] ??
      (supportsRequired && ctx.required && props.required === undefined ? true : undefined),
  });
}

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  /**
   * `id` do controle. Opcional: sem ele, o FormField usa o `id` passado ao
   * controle filho ou gera um com `useId` e o entrega ao filho pelo contexto.
   */
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  /**
   * Base dos ids da dica (`<id>-hint`) e do erro (`<id>-error`). Sem ela, a
   * base é o `id` do controle (ex.: `cpf-error`). Não vai para a `div`.
   */
  id?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, htmlFor, required, error, hint, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const [control, setControl] = React.useState<FormFieldControlInfo | null>(null);

    const registerControl = React.useCallback((info: FormFieldControlInfo) => {
      setControl((prev) =>
        prev && prev.id === info.id && prev.labelable === info.labelable ? prev : info
      );
      return () => setControl(null);
    }, []);

    const controlId = htmlFor ?? control?.id ?? id ?? generatedId;
    const base = id ?? controlId;
    const labelId = label ? `${base}-label` : undefined;
    const hintId = hint && !error ? `${base}-hint` : undefined;
    const errorId = error ? `${base}-error` : undefined;
    // Sem `for` quando o filho não é rotulável (o filho usa aria-labelledby).
    const labelFor = control && !control.labelable && !htmlFor ? undefined : controlId;

    const contextValue = React.useMemo<FormFieldContextValue>(
      () => ({
        controlId,
        labelId,
        hintId,
        errorId,
        describedBy: joinIds(hintId, errorId),
        invalid: Boolean(error),
        required: Boolean(required),
        registerControl,
      }),
      [controlId, labelId, hintId, errorId, error, required, registerControl]
    );

    return (
      <FormFieldContext.Provider value={contextValue}>
        <div ref={ref} className={cn("grid gap-1.5", className)} {...props}>
          {label ? (
            <label
              id={labelId}
              htmlFor={labelFor}
              className="text-sm font-medium text-foreground"
            >
              {label}
              {required ? <span className="text-destructive"> *</span> : null}
            </label>
          ) : null}
          {children}
          {hintId ? (
            <p id={hintId} className="text-xs text-muted-foreground">
              {hint}
            </p>
          ) : null}
          {/*
            Sem role="alert": o erro é lido ao focar o campo (aria-describedby +
            aria-invalid). O anúncio imediato fica com o ErrorSummary (AUD-22).
          */}
          {errorId ? (
            <p id={errorId} className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </FormFieldContext.Provider>
    );
  }
);
FormField.displayName = "FormField";

export { FormField };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
