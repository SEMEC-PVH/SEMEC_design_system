"use client";

import * as React from "react";

import { Input } from "./input";

/** Máscaras prontas. `telefone` alterna entre fixo e celular pelo número de dígitos. */
export type InputMaskPreset =
  | "cpf"
  | "cnpj"
  | "cep"
  | "data"
  | "telefone"
  | "telefone-fixo"
  | "celular";

/** Padrões das máscaras prontas (`9` = dígito). */
export const inputMaskPatterns: Record<Exclude<InputMaskPreset, "telefone">, string> = {
  cpf: "999.999.999-99",
  cnpj: "99.999.999/9999-99",
  cep: "99999-999",
  data: "99/99/9999",
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

/**
 * Formata `value` com uma máscara pronta ou um padrão próprio, em que `9` é
 * dígito, `A` é letra, `*` é letra ou dígito e o resto é literal
 * (ex.: `"AAA-9999"`). Aceita valor já formatado, sem formatação ou colado
 * com outra pontuação. Literais só aparecem quando há caractere depois deles.
 */
export function applyInputMask(value: string, mask: InputMaskPreset | string): InputMaskResult {
  const digitCount = value.replace(/\D/g, "").length;
  const pattern = resolvePattern(mask, digitCount);
  // Padrão só de dígitos: descarta a pontuação de quem colou ("(69) 3216-0000").
  const source = isNumericPattern(pattern) ? value.replace(/\D/g, "") : value;

  let masked = "";
  let raw = "";
  let pending = ""; // literais que só entram quando vier o próximo caractere
  let p = 0;

  for (const ch of source) {
    if (p >= pattern.length) break;
    if (!isSlot(pattern.charAt(p))) {
      // Valor já formatado: o caractere é um dos literais à frente; consome até ele.
      let q = p;
      while (q < pattern.length && !isSlot(pattern.charAt(q)) && pattern.charAt(q) !== ch) q++;
      if (q < pattern.length && !isSlot(pattern.charAt(q))) {
        pending += pattern.slice(p, q + 1);
        p = q + 1;
        continue;
      }
      while (p < pattern.length && !isSlot(pattern.charAt(p))) pending += pattern[p++];
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

const presetInputMode: Record<InputMaskPreset, React.HTMLAttributes<HTMLInputElement>["inputMode"]> = {
  cpf: "numeric",
  cnpj: "numeric",
  cep: "numeric",
  data: "numeric",
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
  ({ mask, value, defaultValue, onValueChange, onChange, inputMode, ...props }, ref) => {
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

    const fallbackMode =
      (presetInputMode as Record<string, React.HTMLAttributes<HTMLInputElement>["inputMode"]>)[mask] ??
      (isNumericPattern(mask) ? "numeric" : "text");

    return (
      <Input
        ref={ref}
        type="text"
        inputMode={inputMode ?? fallbackMode}
        value={display}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
InputMask.displayName = "InputMask";

export { InputMask };
