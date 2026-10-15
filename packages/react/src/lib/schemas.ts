import { z } from "zod";

import {
  validateCPF,
  validateCNPJ,
  validateDateBR,
  validateDateMonthYear,
  validateTime,
} from "./validators";

/** Remove tudo que não é dígito. */
function digits(v: string): string {
  return v.replace(/\D/g, "");
}

/* ------------------------------------------------------------------ */
/*  Schemas Zod — entry @semec/ds/react/validacao                      */
/*  Único módulo do pacote que importa zod.                            */
/* ------------------------------------------------------------------ */

export const cpfSchema = z
  .string()
  .refine((v) => validateCPF(v), { message: "CPF inválido" });

export const cnpjSchema = z
  .string()
  .refine((v) => validateCNPJ(v), { message: "CNPJ inválido" });

export const cpfCnpjSchema = z.string().refine(
  (v) => {
    const d = digits(v);
    return d.length === 11
      ? validateCPF(v)
      : d.length === 14
        ? validateCNPJ(v)
        : false;
  },
  { message: "CPF ou CNPJ inválido" }
);

export const emailSchema = z.string().email({ message: "E-mail inválido" });

export const cepSchema = z
  .string()
  .length(9, { message: "CEP deve ter 8 dígitos" })
  .refine((v) => /^\d{5}-\d{3}$/.test(v), {
    message: "CEP inválido (use 00000-000)",
  });

/** Data em formato brasileiro DD/MM/AAAA. */
export const dateBRSchema = z
  .string()
  .refine((v) => validateDateBR(v), { message: "Data inválida (use DD/MM/AAAA)" });

/** Competência em formato MM/AAAA. */
export const dateMonthYearSchema = z
  .string()
  .refine((v) => validateDateMonthYear(v), { message: "Mês/ano inválido (use MM/AAAA)" });

/** Horário em formato HH:MM. */
export const timeSchema = z
  .string()
  .refine((v) => validateTime(v), { message: "Horário inválido (use HH:MM)" });

/**
 * Valida data tanto em formato brasileiro (DD/MM/AAAA) quanto ISO (AAAA-MM-DD).
 * Útil para campos que aceitam digitação mascarada ou valor de DatePicker nativo.
 */
export const dateSchema = z.string().refine(
  (v) => {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return validateDateBR(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [year, month, day] = v.split("-").map(Number);
      if (!year || !month || !day) return false;
      if (month < 1 || month > 12) return false;
      const daysInMonth = new Date(year, month, 0).getDate();
      return day >= 1 && day <= daysInMonth;
    }
    return false;
  },
  { message: "Data inválida" }
);
