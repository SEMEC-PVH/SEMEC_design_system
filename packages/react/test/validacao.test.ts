import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  cepSchema,
  cnpjSchema,
  cpfCnpjSchema,
  cpfSchema,
  emailSchema,
  validateCNPJ,
  validateCPF,
} from "../src/validacao";

/**
 * Roda duas vezes (vitest.config.ts): projeto "kit" com zod 4 e projeto
 * "zod3" com `zod` apontando para zod 3 — o peer aceita `^3.23.0 || ^4.0.0`
 * (AUD-44).
 */
describe(`@semec/ds/react/validacao com zod ${process.env.ZOD_MAJOR}`, () => {
  it("usa a versão de zod esperada neste projeto", () => {
    // zod 4 expõe `_zod` nas instâncias; zod 3 não.
    const isV4 = "_zod" in z.string();
    expect(isV4 ? "4" : "3").toBe(process.env.ZOD_MAJOR);
  });

  it("cpfSchema", () => {
    expect(cpfSchema.safeParse("529.982.247-25").success).toBe(true);
    const bad = cpfSchema.safeParse("111.111.111-11");
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0]?.message).toBe("CPF inválido. Confira os 11 dígitos.");
  });

  it("cnpjSchema", () => {
    expect(cnpjSchema.safeParse("11.222.333/0001-81").success).toBe(true);
    expect(cnpjSchema.safeParse("11.222.333/0001-82").error?.issues[0]?.message).toBe("CNPJ inválido. Confira os 14 dígitos.");
  });

  it("cpfCnpjSchema escolhe pelo número de dígitos", () => {
    expect(cpfCnpjSchema.safeParse("52998224725").success).toBe(true);
    expect(cpfCnpjSchema.safeParse("11222333000181").success).toBe(true);
    expect(cpfCnpjSchema.safeParse("123").error?.issues[0]?.message).toBe("CPF ou CNPJ inválido. Confira os dígitos.");
  });

  it("emailSchema e cepSchema mantêm as mensagens PT-BR", () => {
    expect(emailSchema.safeParse("a@b.com").success).toBe(true);
    expect(emailSchema.safeParse("a@").error?.issues[0]?.message).toBe("E-mail inválido. Use o formato nome@exemplo.com.");
    expect(cepSchema.safeParse("76801-000").success).toBe(true);
    expect(cepSchema.safeParse("76801000").error?.issues[0]?.message).toBe("O CEP deve ter 8 dígitos.");
    expect(cepSchema.safeParse("7680a-000").error?.issues[0]?.message).toBe("CEP inválido. Use o formato 00000-000.");
  });

  it("campo vazio pede o dado, com uma mensagem só, em vez de dizer que é inválido (V42-VITE-06)", () => {
    const casos: [z.ZodTypeAny, string][] = [
      [cpfSchema, "Informe o CPF."],
      [cnpjSchema, "Informe o CNPJ."],
      [cpfCnpjSchema, "Informe o CPF ou o CNPJ."],
      [emailSchema, "Informe o e-mail."],
      [cepSchema, "Informe o CEP."],
    ];
    for (const [schema, mensagem] of casos) {
      for (const vazio of ["", "   "]) {
        const r = schema.safeParse(vazio);
        expect(r.success).toBe(false);
        expect(r.error?.issues.map((i) => i.message)).toEqual([mensagem]);
      }
    }
    // Inválido também gera um único item (o ErrorSummary lista um por campo).
    expect(cpfSchema.safeParse("123").error?.issues).toHaveLength(1);
  });

  it("validadores puros (sem zod) continuam no entry", () => {
    expect(validateCPF("529.982.247-25")).toBe(true);
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
  });
});
