---
adr: 15
titulo: "Formulários com API controlada, sem acoplar biblioteca de formulário"
status: Aceito
data: 2026-08-20
---

# ADR-015 — Formulários com API controlada, sem acoplar biblioteca de formulário

**Status:** Aceito

**Contexto.** SIGO e Cartão Cidade podem escolher bibliotecas diferentes (React Hook Form, Formik) e esquemas de validação diferentes.

**Decisão.** Componentes de formulário expõem API controlada padrão (`value`/`onChange`/`name`/`error`), encaminham `ref` e não dependem de nenhuma biblioteca de formulário. Adaptadores opcionais podem ser publicados depois, em subpath separado.

**Alternativas descartadas.** Acoplar a React Hook Form (impõe escolha a todos os projetos).

**Consequências.** Um pouco mais de código de ligação em cada app, em troca de neutralidade.

---

> **Emenda (15/10/2026, AUD-35; não altera a decisão, fixa o contrato).** A auditoria de 2026-10 achou o contrato heterogêneo: `onChange(evento)`, `onChange(valor)`, `onValueChange` e `onCheckedChange` conviviam, só `FormField` e `FileUpload` aceitavam erro e o `InputOTP` não tinha `name`. A partir da **3.2.0** (aditiva, sem remover nada), o contrato de todo controle de formulário do kit é:
>
> `value` / `defaultValue` · `onValueChange(valor)` · `name` · `id` · `invalid` · `disabled` · `required`
>
> Regras:
>
> 1. **`onValueChange(valor)` é o callback do contrato.** Recebe o valor já extraído (string, `File[]`, `Date`, `number[]`), nunca o evento.
> 2. **`onChange` nos controles nativos (`Input`, `Textarea`) é o evento do DOM** e não é depreciado; eles ganham `onValueChange(string)` além dele. Onde o kit usava `onChange` para entregar o valor (`Combobox`, `InputOTP`, `DatePicker`, `FileUpload`, `Calendar`), esse `onChange` fica `@deprecated` (aviso único em desenvolvimento) e sai na 4.0. No `DatePicker`, a 4.0 devolve ao `onChange` o significado nativo (evento do `<input type="date">`).
> 3. **Nomes próprios do Radix ficam como estão**, sem alias: `checked`/`defaultChecked`/`onCheckedChange` (`Checkbox`, `Switch`) e `pressed`/`onPressedChange` (`Toggle`). Motivo: nesses primitivos `value` já é o **valor enviado no formulário** (padrão `"on"`), e um `onValueChange(boolean)` ao lado de `value: string` confundiria. A equivalência é documental: `checked` ≡ `value`, `onCheckedChange` ≡ `onValueChange`.
> 4. **`invalid: boolean` → `aria-invalid="true"`** e o estilo de erro do campo. Passado explicitamente, vence o estado do `FormField` (inclusive `invalid={false}`); `aria-invalid` passado à mão vence os dois. A ligação é a mesma do `FormFieldContext` (AUD-21), em `useFormFieldControl`.
> 5. **Erro com mensagem é `error: string`** e existe só onde o componente desenha o texto (`FormField`, `FileUpload`). `error="…"` equivale a `invalid` + mensagem. Nenhum componente aceita `error: boolean`; para marcar sem texto, use `invalid`. O `FormField` também ganhou `invalid` (sem mensagem).
> 6. **`name` envia em `<form>` nativo.** Nos controles que não são `<input>` (`Combobox`, `InputOTP`), `name` gera um `<input type="hidden">` com o valor (aceitam também `form`).
>
> | Componente | Valor | Callback do contrato | Callback antigo (status) | `name` | `invalid` | `required` | Observação |
> |---|---|---|---|---|---|---|---|
> | `Input` | `value` / `defaultValue` (string) | `onValueChange(string)` | `onChange(evento)` — nativo, mantido | nativo | sim | nativo | — |
> | `Textarea` | `value` / `defaultValue` (string) | `onValueChange(string)` | `onChange(evento)` — nativo, mantido | nativo | sim | nativo | — |
> | `DatePicker` | `value` / `defaultValue` (ISO `AAAA-MM-DD`) | `onValueChange(string)` | `onChange(string)` — **deprecated**, vira evento nativo na 4.0 | nativo | sim | nativo | — |
> | `Select` | `value` / `defaultValue` (raiz) | `onValueChange(string)` (Radix) | — | raiz (Radix) | `SelectTrigger` | raiz (Radix) | `id`/`invalid` no gatilho |
> | `Combobox` | `value` / `defaultValue` | `onValueChange(string)` | `onChange(string)` — **deprecated**, sai na 4.0 | input oculto | sim | `aria-required` na busca | — |
> | `InputOTP` | `value` / `defaultValue` | `onValueChange(string)` | `onChange(string)` — **deprecated**, sai na 4.0 | input oculto (+ `form`) | sim (cada dígito) | `aria-required` em cada dígito | `defaultValue`, `name`, `form`, `required` novos |
> | `FileUpload` | `value` (`File[]`) | `onValueChange(File[])` | `onChange(File[])` — **deprecated**, sai na 4.0 | `name` ou `inputProps.name` | sim (+ `error: string`) | `required` ou `inputProps.required` | `disabled` novo |
> | `Checkbox` | `checked` / `defaultChecked` | `onCheckedChange` (Radix) ≡ `onValueChange` | — | Radix | sim | Radix | `value` = valor enviado |
> | `Switch` | `checked` / `defaultChecked` | `onCheckedChange` (Radix) ≡ `onValueChange` | — | Radix | sim | Radix | `value` = valor enviado |
> | `RadioGroup` | `value` / `defaultValue` | `onValueChange(string)` (Radix) | — | Radix | sim | Radix | — |
> | `Slider` | `value` / `defaultValue` (`number[]`) | `onValueChange(number[])` (Radix) | — | Radix | sim (polegares) | — | sempre tem valor |
> | `Calendar` | `value` (`Date`) | `onValueChange(Date)` | `onChange(Date)` — **deprecated**, sai na 4.0 | — | — | — | grade de seleção, não envia em `<form>`; use `DatePicker` |
> | `Toggle` | `pressed` / `defaultPressed` | `onPressedChange` (Radix) | — | — | — | — | botão de barra de ferramentas, não é controle de formulário |
> | `FormField` | — | — | — | — | sim (+ `error: string`) | sim (repassa ao filho) | invólucro; liga `id`, `aria-describedby`, `aria-invalid`, `aria-required` |
> | `Label` | — | — | — | — | — | — | rótulo; sem contrato próprio |
>
> Testes: `packages/react/test/contrato-formulario.test.tsx`. Depreciações: [CONTRIBUTING.md](../../CONTRIBUTING.md) § *Depreciações anunciadas*.
