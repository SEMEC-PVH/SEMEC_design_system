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
    expect(bad.error?.issues[0]?.message).toBe("CPF inválido");
  });

  it("cnpjSchema", () => {
    expect(cnpjSchema.safeParse("11.222.333/0001-81").success).toBe(true);
    expect(cnpjSchema.safeParse("11.222.333/0001-82").error?.issues[0]?.message).toBe("CNPJ inválido");
  });

  it("cpfCnpjSchema escolhe pelo número de dígitos", () => {
    expect(cpfCnpjSchema.safeParse("52998224725").success).toBe(true);
    expect(cpfCnpjSchema.safeParse("11222333000181").success).toBe(true);
    expect(cpfCnpjSchema.safeParse("123").error?.issues[0]?.message).toBe("CPF ou CNPJ inválido");
  });

  it("emailSchema e cepSchema mantêm as mensagens PT-BR", () => {
    expect(emailSchema.safeParse("a@b.com").success).toBe(true);
    expect(emailSchema.safeParse("a@").error?.issues[0]?.message).toBe("E-mail inválido");
    expect(cepSchema.safeParse("76801-000").success).toBe(true);
    expect(cepSchema.safeParse("76801000").error?.issues[0]?.message).toBe("CEP deve ter 8 dígitos");
    expect(cepSchema.safeParse("7680a-000").error?.issues[0]?.message).toBe("CEP inválido (use 00000-000)");
  });

  it("validadores puros (sem zod) continuam no entry", () => {
    expect(validateCPF("529.982.247-25")).toBe(true);
    expect(validateCNPJ("11.222.333/0001-81")).toBe(true);
  });

  it("dateBRSchema valida formato DD/MM/AAAA e calendário gregoriano", async () => {
    const { dateBRSchema, validateDateBR } = await import("../src/validacao");
    expect(validateDateBR("15/10/2026")).toBe(true);
    expect(validateDateBR("29/02/2024")).toBe(true); // bissexto
    expect(validateDateBR("29/02/2023")).toBe(false); // não bissexto
    expect(validateDateBR("31/04/2026")).toBe(false); // abril tem 30 dias
    expect(validateDateBR("32/01/2026")).toBe(false);
    expect(dateBRSchema.safeParse("15/10/2026").success).toBe(true);
    expect(dateBRSchema.safeParse("31/02/2026").success).toBe(false);
  });

  it("dateMonthYearSchema valida formato MM/AAAA", async () => {
    const { dateMonthYearSchema, validateDateMonthYear } = await import("../src/validacao");
    expect(validateDateMonthYear("10/2026")).toBe(true);
    expect(validateDateMonthYear("13/2026")).toBe(false);
    expect(dateMonthYearSchema.safeParse("10/2026").success).toBe(true);
    expect(dateMonthYearSchema.safeParse("00/2026").success).toBe(false);
  });

  it("timeSchema valida formato HH:MM", async () => {
    const { timeSchema, validateTime } = await import("../src/validacao");
    expect(validateTime("14:30")).toBe(true);
    expect(validateTime("23:59")).toBe(true);
    expect(validateTime("24:00")).toBe(false);
    expect(validateTime("12:60")).toBe(false);
    expect(timeSchema.safeParse("14:30").success).toBe(true);
    expect(timeSchema.safeParse("25:00").success).toBe(false);
  });

  it("dateSchema aceita tanto DD/MM/AAAA quanto AAAA-MM-DD", async () => {
    const { dateSchema } = await import("../src/validacao");
    expect(dateSchema.safeParse("15/10/2026").success).toBe(true);
    expect(dateSchema.safeParse("2026-10-15").success).toBe(true);
    expect(dateSchema.safeParse("2026-02-31").success).toBe(false);
    expect(dateSchema.safeParse("invalido").success).toBe(false);
  });
});
