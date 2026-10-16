---
title: "Campo de formulário"
code: "form-field"
slug: "campo-de-formulario"
file: "src/components/form-field.tsx"
category: "formularios"
variants: "props: label · htmlFor · required · hint · error (mensagem; implica invalid) · invalid (sem mensagem) · errorRole ('alert' | undefined) · id · hooks: useFormField · useFormFieldControl (para campos próprios) · padrões: 1. Inline (FormField error) · 2. Resumo topo (ErrorSummary) · 3. Servidor (Alert destructive) · Legenda de ação no botão"
---

# Campo de formulário — `form-field`

> Estrutura do campo: label, obrigatório (*), dica e mensagem de erro na ordem a11y correta. Integra-se ao react-hook-form (via Controller ou register) e esquemas Zod (@semec/ds/react/validacao). Liga o campo filho pelo contexto (`FormFieldContext`): `id` (gerado com `useId` se faltar), `aria-describedby` (dica + erro) e `aria-invalid`. Suporta três padrões de erro: inline, resumo no topo com ErrorSummary e falha de servidor com Alert. Inclui padrão para legenda auxiliar de ação/download em botões de envio.

**Arquivo:** `src/components/form-field.tsx` | **Categoria:** Formulários | **Página:** https://semec-pvh.github.io/SEMEC_design_system/componentes/campo-de-formulario/

## Variantes

- **props**: label · htmlFor · required · hint · error (mensagem; implica invalid) · invalid (sem mensagem) · errorRole ("alert" | undefined) · id
- **hooks**: useFormField · useFormFieldControl (para campos próprios)
- **padrões**: 1. Inline (FormField error) · 2. Resumo topo (ErrorSummary) · 3. Servidor (Alert destructive) · Legenda de ação no botão

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

> Não publicado: este conteúdo vem do repositório e inclui 8 changesets pendentes (minor) que ainda não estão no npm. O @semec/ds@4.0.1 do npm pode não ter o que está descrito aqui; a próxima versão prevista é a 4.1.0. Confira a versão instalada com `npm ls @semec/ds`.

## Uso

```tsx
import { FormField, Input, ErrorSummary, Button, useToast, maskCurrency } from "@semec/ds/react";
import { cpfSchema, emailSchema } from "@semec/ds/react/validacao";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

// npm install react-hook-form @hookform/resolvers zod (opcionais, só para esta receita)
const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  email: emailSchema,
  cpf: cpfSchema,
  valor: z.string().min(1, "Informe o valor"),
});

type FormValues = z.infer<typeof formSchema>;

// Ordem dos campos na tela: o ErrorSummary segue esta lista (não a ordem do objeto errors)
const ORDEM_CAMPOS = ["nome", "email", "cpf", "valor"] as const satisfies readonly (keyof FormValues)[];

export function FormularioExemplo() {
  const { toast } = useToast();
  const [tentativa, setTentativa] = useState(0);
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: "", email: "", cpf: "", valor: "" },
    // Sem isto o RHF foca o 1º campo inválido e o ErrorSummary nunca recebe o foco
    shouldFocusError: false,
  });

  // Padrão 2: Resumo consolidado no topo, na ordem da tela
  const errorSummaryItems = ORDEM_CAMPOS.flatMap((id) => {
    const message = errors[id]?.message;
    return message ? [{ id, message }] : [];
  });

  const onSubmit = (data: FormValues) => {
    void data;
    // Padrão de sucesso via Toast:
    toast({ variant: "success", title: "Sucesso!", description: "Dados gravados com sucesso." });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => setTentativa((t) => t + 1))}
      noValidate
      className="max-w-xl space-y-4"
    >
      {errorSummaryItems.length > 0 && (
        <ErrorSummary title="Corrija os erros destacados" errors={errorSummaryItems} focusKey={tentativa} />
      )}

      {/* Padrão 1: Erro inline ligado via aria-describedby e aria-invalid */}
      <FormField label="Nome completo" htmlFor="nome" required error={errors.nome?.message}>
        <Input id="nome" {...register("nome")} />
      </FormField>

      <FormField label="E-mail" htmlFor="email" required error={errors.email?.message}>
        <Input id="email" type="email" {...register("email")} />
      </FormField>

      {/* Uso canônico com Controller para componentes controlados ou máscaras */}
      <Controller
        name="cpf"
        control={control}
        render={({ field }) => (
          <FormField label="CPF" htmlFor="cpf" required error={errors.cpf?.message}>
            <Input id="cpf" inputMode="numeric" {...field} />
          </FormField>
        )}
      />

      {/* Campo R$: maskCurrency("") devolve "", então min(1) barra o vazio */}
      <Controller
        name="valor"
        control={control}
        render={({ field }) => (
          <FormField label="Valor da taxa" htmlFor="valor" required error={errors.valor?.message}>
            <Input
              id="valor"
              inputMode="numeric"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={field.value}
              onValueChange={(v) => field.onChange(maskCurrency(v))}
            />
          </FormField>
        )}
      />

      {/* Padrão de Ação com Legenda Auxiliar de Ação / Download */}
      <div className="pt-2 space-y-2">
        <Button type="submit" variant="primary">Gerar requerimento</Button>
        <p className="text-xs text-text-muted">
          Ao clicar, o arquivo PDF do requerimento será gerado e baixado automaticamente.
        </p>
      </div>
    </form>
  );
}
```

## Prompt para IA

```text
Use o componente `FormField` (Campo de formulário) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Estrutura do campo: label, obrigatório (*), dica e mensagem de erro na ordem a11y correta. Integra-se ao react-hook-form (via Controller ou register) e esquemas Zod (@semec/ds/react/validacao). Liga o campo filho pelo contexto (`FormFieldContext`): `id` (gerado com `useId` se faltar), `aria-describedby` (dica + erro) e `aria-invalid`. Suporta três padrões de erro: inline, resumo no topo com ErrorSummary e falha de servidor com Alert. Inclui padrão para legenda auxiliar de ação/download em botões de envio. API e variantes: props: label · htmlFor · required · hint · error (mensagem; implica invalid) · invalid (sem mensagem) · errorRole ("alert" | undefined) · id · hooks: useFormField · useFormFieldControl (para campos próprios) · padrões: 1. Inline (FormField error) · 2. Resumo topo (ErrorSummary) · 3. Servidor (Alert destructive) · Legenda de ação no botão. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

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
  /**
   * Contrato de formulário (ADR-015, AUD-35): `true` vira `aria-invalid="true"`
   * (e o estilo de erro do campo). Passado explicitamente, vence o estado do
   * FormField; `aria-invalid` passado à mão vence os dois.
   */
  invalid?: boolean;
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
  const ownInvalid = props.invalid ? true : undefined;
  const register = ctx?.registerControl;

  useIsomorphicLayoutEffect(() => {
    if (!register) return;
    return register({ id: explicitId, labelable });
  }, [register, explicitId, labelable]);

  // Fora de um FormField, só o `invalid` próprio vira atributo.
  if (!ctx) return withoutUndefined({ "aria-invalid": props["aria-invalid"] ?? ownInvalid });

  const hasOwnName = props["aria-label"] !== undefined || props["aria-labelledby"] !== undefined;
  return withoutUndefined({
    id: props.id ?? ctx.controlId,
    // `invalid={false}` explícito: a mensagem de erro do FormField não descreve
    // este controle (fica só a dica, se houver).
    "aria-describedby": joinIds(
      props["aria-describedby"],
      props.invalid === false ? ctx.hintId : ctx.describedBy
    ),
    "aria-invalid":
      props["aria-invalid"] ??
      (props.invalid !== undefined ? ownInvalid : ctx.invalid ? true : undefined),
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
  /** Mensagem de erro. Com ela, o campo fica inválido (`invalid` implícito). */
  error?: string;
  /**
   * Marca o campo filho como inválido sem mensagem própria (ex.: erro mostrado
   * em outro lugar). `error="..."` equivale a `invalid` + mensagem.
   */
  invalid?: boolean;
  hint?: string;
  /**
   * Base dos ids da dica (`<id>-hint`) e do erro (`<id>-error`). Sem ela, a
   * base é o `id` do controle (ex.: `cpf-error`). Não vai para a `div`.
   */
  id?: string;
  /**
   * Papel ARIA do elemento de mensagem de erro. Por padrão é `undefined` (sem `role="alert"`),
   * pois o erro é anunciado ao focar o campo via `aria-describedby` + `aria-invalid`, e o anúncio
   * assertivo inicial em formulários consolidados fica a cargo do `ErrorSummary` (AUD-22).
   * Em campos isolados onde se deseje anúncio imediato, passe `errorRole="alert"`.
   */
  errorRole?: "alert";
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      htmlFor,
      required,
      error,
      invalid,
      hint,
      id,
      errorRole,
      children,
      ...props
    },
    ref
  ) => {
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
        invalid: Boolean(error) || Boolean(invalid),
        required: Boolean(required),
        registerControl,
      }),
      [controlId, labelId, hintId, errorId, error, invalid, required, registerControl]
    );

    return (
      <FormFieldContext.Provider value={contextValue}>
        {/*
          `content-start`: num grid de colunas (ex.: `md:grid-cols-2`), a linha
          estica o FormField mais curto até a altura do vizinho com dica/erro;
          sem isso as linhas internas esticam e o controle desce. Fora desse
          caso não muda nada: o espaçamento entre rótulo, campo e dica é o gap.
        */}
        <div ref={ref} className={cn("grid content-start gap-1.5", className)} {...props}>
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
            Sem role="alert" por padrão: o erro é lido ao focar o campo (aria-describedby +
            aria-invalid). O anúncio imediato fica com o ErrorSummary (AUD-22).
            Pode ser ativado com errorRole="alert" em campos isolados.
          */}
          {errorId ? (
            <p id={errorId} role={errorRole} className="text-xs text-destructive">
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
