---
title: "Campo com máscara"
code: "input-mask"
slug: "campo-com-mascara"
file: "src/components/input-mask.tsx"
category: "formularios"
variants: "mask: cpf · cnpj · cep · data (DD/MM/AAAA) · data-mes-ano (MM/AAAA) · data-hora (DD/MM/AAAA HH:MM) · hora (HH:MM) · telefone (fixo ou celular pelo nº de dígitos) · telefone-fixo · celular · padrão próprio (ex.: 'AAA-9*99') · valor: defaultValue · value + onValueChange(masked, raw) · inputMode: numeric (CPF, CNPJ, CEP, data, data-mes-ano, data-hora, hora) · tel (telefones) · sobrescrevível"
---

# Campo com máscara — `input-mask`

> Campo sobre o `Input` que formata enquanto a pessoa digita: CPF, CNPJ, CEP, data (DD/MM/AAAA, MM/AAAA, DD/MM/AAAA HH:MM ou HH:MM), telefone (fixo ou celular, automático) ou padrão próprio (`9` dígito, `A` letra, `*` letra ou dígito). O cursor não pula ao editar no meio; Backspace/Delete junto de um literal apagam o dígito vizinho (também no teclado virtual do Android, via `beforeinput`); colar valor com outra pontuação funciona (nos telefones, o `+55` de país é descartado; num padrão com prefixo fixo, como `0800-999-9999`, um valor colado que já começa com o prefixo não o repete) e o `inputMode` vem da máscara. `onValueChange(masked, raw)` entrega o valor formatado e o sem máscara.

**Arquivo:** `src/components/input-mask.tsx` | **Categoria:** Formulários | **Rota:** `/componentes/campo-com-mascara`

## Variantes

- **mask**: cpf · cnpj · cep · data (DD/MM/AAAA) · data-mes-ano (MM/AAAA) · data-hora (DD/MM/AAAA HH:MM) · hora (HH:MM) · telefone (fixo ou celular pelo nº de dígitos) · telefone-fixo · celular · padrão próprio (ex.: "AAA-9*99")
- **valor**: defaultValue · value + onValueChange(masked, raw)
- **inputMode**: numeric (CPF, CNPJ, CEP, data, data-mes-ano, data-hora, hora) · tel (telefones) · sobrescrevível

## Instalação (@semec/ds)

```bash
npm install @semec/ds lucide-react
```

lucide-react é peer obrigatório (não dependência): o npm 7+ instala peer ausente sozinho, o pnpm só com auto-install-peers=true e o Yarn nunca, então instale-o junto. tailwindcss ^4 também é peer, com o plugin do bundler (@tailwindcss/vite ou @tailwindcss/postcss). zod (^3.23.0 || ^4.0.0) é peer opcional, só para @semec/ds/react/validacao.

```css
@import "tailwindcss";
@import "@semec/ds/react/fonts.css";
@import "@semec/ds/react/tokens.css";
@source "../node_modules/@semec/ds/dist/react";
```

## Uso

```tsx
import { FormField, InputMask } from "@semec/ds/react";

<FormField label="CPF" hint="Somente números">
  <InputMask mask="cpf" onValueChange={(masked, raw) => setCpf(raw)} />
</FormField>

<FormField label="Data de nascimento" hint="DD/MM/AAAA">
  <InputMask mask="data" placeholder="DD/MM/AAAA" />
</FormField>

<FormField label="Competência" hint="MM/AAAA">
  <InputMask mask="data-mes-ano" placeholder="MM/AAAA" />
</FormField>

<FormField label="Telefone">
  <InputMask mask="telefone" autoComplete="tel-national" />
</FormField>

<FormField label="CEP">
  <InputMask mask="cep" autoComplete="postal-code" />
</FormField>

// Padrão próprio: placa de veículo (9 dígito, A letra, * letra ou dígito)
<FormField label="Placa do veículo">
  <InputMask mask="AAA-9*99" />
</FormField>
```

## Prompt para IA

```text
Use o componente `InputMask` (Campo com máscara) importado de `@semec/ds/react`; não reimplemente, não copie o código-fonte e não recrie o estilo com outras classes. Campo sobre o `Input` que formata enquanto a pessoa digita: CPF, CNPJ, CEP, data (DD/MM/AAAA, MM/AAAA, DD/MM/AAAA HH:MM ou HH:MM), telefone (fixo ou celular, automático) ou padrão próprio (`9` dígito, `A` letra, `*` letra ou dígito). O cursor não pula ao editar no meio; Backspace/Delete junto de um literal apagam o dígito vizinho (também no teclado virtual do Android, via `beforeinput`); colar valor com outra pontuação funciona (nos telefones, o `+55` de país é descartado; num padrão com prefixo fixo, como `0800-999-9999`, um valor colado que já começa com o prefixo não o repete) e o `inputMode` vem da máscara. `onValueChange(masked, raw)` entrega o valor formatado e o sem máscara. API e variantes: mask: cpf · cnpj · cep · data (DD/MM/AAAA) · data-mes-ano (MM/AAAA) · data-hora (DD/MM/AAAA HH:MM) · hora (HH:MM) · telefone (fixo ou celular pelo nº de dígitos) · telefone-fixo · celular · padrão próprio (ex.: "AAA-9*99") · valor: defaultValue · value + onValueChange(masked, raw) · inputMode: numeric (CPF, CNPJ, CEP, data, data-mes-ano, data-hora, hora) · tel (telefones) · sobrescrevível. Parta do exemplo de uso do componente, com rótulos em PT-BR e tokens do tokens.css (sem hex). Se faltar alguma capacidade, componha com outros componentes do kit ou proponha a mudança por issue no repositório do design system.
```

## Fonte

```tsx
"use client";

import * as React from "react";

import { Input } from "./input";

/** Máscaras prontas. `telefone` alterna entre fixo e celular pelo número de dígitos. */
export type InputMaskPreset =
  | "cpf"
  | "cnpj"
  | "cep"
  | "data"
  | "data-mes-ano"
  | "data-hora"
  | "hora"
  | "telefone"
  | "telefone-fixo"
  | "celular";

/** Padrões das máscaras prontas (`9` = dígito). */
export const inputMaskPatterns: Record<Exclude<InputMaskPreset, "telefone">, string> = {
  cpf: "999.999.999-99",
  cnpj: "99.999.999/9999-99",
  cep: "99999-999",
  data: "99/99/9999",
  "data-mes-ano": "99/9999",
  "data-hora": "99/99/9999 99:99",
  hora: "99:99",
  "telefone-fixo": "(99) 9999-9999",
  celular: "(99) 99999-9999",
};

const SLOT_TESTS: Record<string, RegExp> = {
  "9": /\d/,
  A: /[A-Za-zÀ-ÖØ-öø-ÿ]/,
  "*": /[0-9A-Za-zÀ-ÖØ-öø-ÿ]/,
};

const isSlot = (ch: string) => ch in SLOT_TESTS;

const isNumericPattern = (pattern: string) =>
  [...pattern].every((ch) => !isSlot(ch) || ch === "9");

function resolvePattern(mask: InputMaskPreset | string, digits: number): string {
  if (mask === "telefone") {
    return digits > 10 ? inputMaskPatterns.celular : inputMaskPatterns["telefone-fixo"];
  }
  return (inputMaskPatterns as Record<string, string>)[mask] ?? mask;
}

/** Resultado de `applyInputMask`: valor formatado e só os caracteres digitados. */
export interface InputMaskResult {
  masked: string;
  raw: string;
}

const TELEFONE_PRESETS = new Set(["telefone", "telefone-fixo", "celular"]);

/**
 * Telefone colado com código do país (`+55 69 99999-1234` ou
 * `5569999991234`): descarta o `55` inicial. Não mexe em valor já formatado
 * pela máscara (`(55) …`, DDD 55), para não comer o DDD de quem digita.
 */
function stripCountryCode(value: string, mask: InputMaskPreset | string): string {
  if (!TELEFONE_PRESETS.has(mask)) return value;
  const digits = value.replace(/\D/g, "");
  const trimmed = value.trimStart();
  const hasPlus = trimmed.startsWith("+55");
  const looksInternational =
    digits.startsWith("55") && digits.length >= 12 && digits.length <= 13 && !trimmed.startsWith("(");
  return hasPlus || looksInternational ? digits.slice(2) : value;
}

const isAlphanumeric = (ch: string) => /[0-9A-Za-zÀ-ÖØ-öø-ÿ]/.test(ch);

/**
 * Formata `value` com uma máscara pronta ou um padrão próprio, em que `9` é
 * dígito, `A` é letra, `*` é letra ou dígito e o resto é literal
 * (ex.: `"AAA-9999"`, `"+55 (99) 99999-9999"`). Aceita valor já formatado,
 * sem formatação ou colado com outra pontuação. Literais só aparecem quando
 * há caractere depois deles. Nos telefones, um `+55`/`55` de país colado é
 * descartado.
 */
export function applyInputMask(value: string, mask: InputMaskPreset | string): InputMaskResult {
  const normalized = stripCountryCode(value, mask);
  const digitCount = normalized.replace(/\D/g, "").length;
  const pattern = resolvePattern(mask, digitCount);
  // Pontuação do próprio padrão no valor: ele já veio formatado, e um
  // caractere igual a um literal (ex.: o "5" de "+55") é o literal.
  const punctuation = new Set([...pattern].filter((ch) => !isSlot(ch) && !isAlphanumeric(ch)));
  // Entrada que começa com toda a sequência literal inicial do padrão
  // (ex.: "0800" em "0800-999-9999", ignorando pontuação) também conta como
  // formatada: o "0800" colado é o prefixo, não os primeiros dígitos.
  let firstSlot = 0;
  while (firstSlot < pattern.length && !isSlot(pattern.charAt(firstSlot))) firstSlot++;
  const leadingLiteral = [...pattern.slice(0, firstSlot)].filter(isAlphanumeric).join("");
  const startsWithLeading =
    leadingLiteral.length > 0 &&
    [...normalized].filter(isAlphanumeric).join("").startsWith(leadingLiteral);
  const looksFormatted =
    startsWithLeading || [...normalized].some((ch) => punctuation.has(ch));
  // Padrão só de dígitos: descarta a pontuação de quem colou ("(69) 3216-0000").
  const source = isNumericPattern(pattern) ? normalized.replace(/\D/g, "") : normalized;

  let masked = "";
  let raw = "";
  let pending = ""; // literais que só entram quando vier o próximo caractere
  let p = 0;

  for (const ch of source) {
    if (p >= pattern.length) break;
    if (!isSlot(pattern.charAt(p))) {
      let nextSlot = p;
      while (nextSlot < pattern.length && !isSlot(pattern.charAt(nextSlot))) nextSlot++;
      const canFill =
        nextSlot < pattern.length && Boolean(SLOT_TESTS[pattern.charAt(nextSlot)]?.test(ch));
      let q = p;
      while (q < nextSlot && pattern.charAt(q) !== ch) q++;
      // Só consome como literal se o valor parece formatado ou se o
      // caractere não cabe na próxima posição editável.
      if (q < nextSlot && (looksFormatted || !canFill)) {
        pending += pattern.slice(p, q + 1);
        p = q + 1;
        continue;
      }
      pending += pattern.slice(p, nextSlot);
      p = nextSlot;
      if (p >= pattern.length) break;
    }
    if (SLOT_TESTS[pattern.charAt(p)]?.test(ch)) {
      masked += pending + ch;
      raw += ch;
      pending = "";
      p++;
    }
  }
  return { masked, raw };
}

/** Posição logo depois do `n`-ésimo caractere editável de `masked`. */
function caretAfterRaw(masked: string, mask: InputMaskPreset | string, n: number): number {
  if (n <= 0) return 0;
  const pattern = resolvePattern(mask, masked.replace(/\D/g, "").length);
  let count = 0;
  for (let i = 0; i < masked.length; i++) {
    if (isSlot(pattern.charAt(i))) {
      count++;
      if (count === n) return i + 1;
    }
  }
  return masked.length;
}

/**
 * Backspace logo depois de um literal (ou Delete logo antes) apagaria só a
 * pontuação, que a máscara repõe: o cursor andaria sem apagar nada. Aqui o
 * literal é pulado e o caractere editável vizinho é apagado. Devolve `true`
 * quando fez a exclusão (quem chamou cancela o evento original).
 */
function deleteAcrossLiteral(
  el: HTMLInputElement,
  mask: InputMaskPreset | string,
  direction: "backward" | "forward"
): boolean {
  const start = el.selectionStart;
  if (start === null || start !== el.selectionEnd) return false;
  const current = el.value;
  const pattern = resolvePattern(mask, current.replace(/\D/g, "").length);
  const literalAt = (i: number) => i >= 0 && i < current.length && !isSlot(pattern.charAt(i));

  let target = -1;
  if (direction === "backward" && literalAt(start - 1)) {
    target = start - 1;
    while (target >= 0 && literalAt(target)) target--;
  } else if (direction === "forward" && literalAt(start)) {
    target = start;
    while (target < current.length && literalAt(target)) target++;
    if (target >= current.length) target = -1;
  }
  if (target < 0) return false;

  const next = current.slice(0, target) + current.slice(target + 1);
  const caret = direction === "backward" ? target : start;
  // Setter nativo + evento "input": o React trata como digitação (onChange).
  const view = el.ownerDocument.defaultView ?? window;
  const setter = Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(el, next);
  else el.value = next;
  el.setSelectionRange(caret, caret);
  el.dispatchEvent(new view.Event("input", { bubbles: true }));
  return true;
}

const presetInputMode: Record<InputMaskPreset, React.HTMLAttributes<HTMLInputElement>["inputMode"]> = {
  cpf: "numeric",
  cnpj: "numeric",
  cep: "numeric",
  data: "numeric",
  "data-mes-ano": "numeric",
  "data-hora": "numeric",
  hora: "numeric",
  telefone: "tel",
  "telefone-fixo": "tel",
  celular: "tel",
};

export interface InputMaskProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof Input>,
    "value" | "defaultValue" | "onValueChange"
  > {
  /**
   * Máscara pronta (`cpf`, `cnpj`, `cep`, `data`, `telefone`,
   * `telefone-fixo`, `celular`) ou padrão próprio com `9` (dígito), `A`
   * (letra) e `*` (letra ou dígito).
   */
  mask: InputMaskPreset | string;
  /** Valor controlado (formatado ou não; é formatado ao exibir). */
  value?: string;
  /** Valor inicial (não controlado). */
  defaultValue?: string;
  /** Chamado a cada mudança com o valor formatado e o valor sem máscara. */
  onValueChange?: (masked: string, raw: string) => void;
}

/**
 * Campo com máscara de digitação, sobre o `Input` do kit. O cursor fica no
 * lugar ao digitar, apagar ou colar no meio do valor; colar um valor com
 * outra pontuação funciona. `inputMode` vem da máscara (`numeric` ou `tel`)
 * e pode ser sobrescrito. Sem dependência externa.
 */
const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ mask, value, defaultValue, onValueChange, onChange, onKeyDown, inputMode, ...props }, ref) => {
    const isControlled = value !== undefined;
    const [inner, setInner] = React.useState(
      () => applyInputMask(defaultValue ?? "", mask).masked
    );
    const display = isControlled ? applyInputMask(value, mask).masked : inner;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const el = event.currentTarget;
      const typed = el.value;
      const caret = el.selectionStart ?? typed.length;
      const { masked, raw } = applyInputMask(typed, mask);
      const rawBefore = Math.min(
        applyInputMask(typed.slice(0, caret), mask).raw.length,
        raw.length
      );
      const atEnd = caret >= typed.length;

      if (el.value !== masked) el.value = masked;
      // ownerDocument: o campo pode estar num iframe (portal).
      if (el.ownerDocument.activeElement === el) {
        const next = atEnd ? masked.length : caretAfterRaw(masked, mask, rawBefore);
        el.setSelectionRange(next, next);
      }

      if (!isControlled) setInner(masked);
      onValueChange?.(masked, raw);
      onChange?.(event);
    };

    // Backspace/Delete junto de literal: ver deleteAcrossLiteral.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key !== "Backspace" && event.key !== "Delete") return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (deleteAcrossLiteral(event.currentTarget, maskRef.current, event.key === "Backspace" ? "backward" : "forward")) {
        // Cancelar o keydown também cancela o beforeinput: sem exclusão dupla.
        event.preventDefault();
      }
    };

    // Teclado virtual do Android manda key "Unidentified" (229) no keydown:
    // ali só o beforeinput (inputType) diz que é Backspace/Delete.
    const maskRef = React.useRef(mask);
    maskRef.current = mask;
    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const setRefs = React.useCallback(
      (el: HTMLInputElement | null) => {
        inputRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      },
      [ref]
    );
    React.useEffect(() => {
      const el = inputRef.current;
      if (!el) return;
      const onBeforeInput = (event: Event) => {
        const { inputType } = event as InputEvent;
        if (inputType !== "deleteContentBackward" && inputType !== "deleteContentForward") return;
        if (event.defaultPrevented) return;
        const direction = inputType === "deleteContentBackward" ? "backward" : "forward";
        if (deleteAcrossLiteral(el, maskRef.current, direction)) event.preventDefault();
      };
      el.addEventListener("beforeinput", onBeforeInput);
      return () => el.removeEventListener("beforeinput", onBeforeInput);
    }, []);

    const fallbackMode =
      (presetInputMode as Record<string, React.HTMLAttributes<HTMLInputElement>["inputMode"]>)[mask] ??
      (isNumericPattern(mask) ? "numeric" : "text");

    return (
      <Input
        ref={setRefs}
        type="text"
        inputMode={inputMode ?? fallbackMode}
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);
InputMask.displayName = "InputMask";

export { InputMask };

```

## Tokens relacionados

Tokens semânticos: `--bg`, `--fg`, `--surface`, `--border`, `--focus-ring`, `--action-primary` etc. Ver `tokens.css` no dump completo.

---
Gerado a partir de `packages/react/manifest.js` — não edite manualmente. Conteúdo PT-BR, código EN (ADR-016).
