import { describe, expect, it } from "vitest";

import { maskCEP, maskCNPJ, maskCPF, maskCurrency } from "../src/index";

/** Máscaras puras de `lib/masks` (exportadas por `@semec/ds/react`). */

// toLocaleString usa NBSP entre "R$" e o número.
const reais = (s: string) => s.replace(/\u00a0/g, " ");

describe("maskCurrency", () => {
  it("dígitos viram centavos com separadores PT-BR", () => {
    expect(reais(maskCurrency("5"))).toBe("R$ 0,05");
    expect(reais(maskCurrency("123456"))).toBe("R$ 1.234,56");
    expect(reais(maskCurrency("R$ 1.234,567"))).toBe("R$ 12.345,67");
  });

  it("limita a 12 dígitos significativos", () => {
    expect(reais(maskCurrency("1234567890123"))).toBe("R$ 1.234.567.890,12");
  });

  // TST-20 (#54): devolvia "R$ 0,00" e o campo nunca voltava a ficar vazio,
  // passando em z.string().min(1).
  it.each([
    ["vazio", ""],
    ["sem dígitos", "abc"],
    ["só zeros", "000"],
    ["apagando com Backspace a partir de R$ 0,01", "R$ 0,0"],
  ])("TST-20: %s devolve string vazia", (_caso, entrada) => {
    expect(maskCurrency(entrada)).toBe("");
  });

  it("zeros à esquerda não mudam o valor", () => {
    expect(reais(maskCurrency("R$ 0,012"))).toBe("R$ 0,12");
  });
});

describe("demais máscaras", () => {
  it("CPF, CNPJ e CEP formatam e ignoram não dígitos", () => {
    expect(maskCPF("123.456.789-0912")).toBe("123.456.789-09");
    expect(maskCNPJ("12345678000195")).toBe("12.345.678/0001-95");
    expect(maskCEP("76801abc000")).toBe("76801-000");
    expect(maskCPF("")).toBe("");
  });
});
