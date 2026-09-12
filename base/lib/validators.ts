import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Helpers puros (sem Zod) — úteis fora de schema context            */
/* ------------------------------------------------------------------ */

/** Remove tudo que não é dígito. */
function digits(v: string): string {
  return v.replace(/\D/g, "");
}

/** Valida CPF por cálculo dos dígitos verificadores. */
export function validateCPF(v: string): boolean {
  const d = digits(v);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(d[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== Number(d[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(d[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === Number(d[10]);
}

/** Valida CNPJ por cálculo dos dígitos verificadores. */
export function validateCNPJ(v: string): boolean {
  const d = digits(v);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d[i]) * weights1[i];
  let rest = sum % 11;
  const digit1 = rest < 2 ? 0 : 11 - rest;
  if (Number(d[12]) !== digit1) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += Number(d[i]) * weights2[i];
  rest = sum % 11;
  const digit2 = rest < 2 ? 0 : 11 - rest;
  return Number(d[13]) === digit2;
}

export function validateEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/* ------------------------------------------------------------------ */
/*  Schemas Zod                                                       */
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
    return d.length === 11 ? validateCPF(v) : d.length === 14 ? validateCNPJ(v) : false;
  },
  { message: "CPF ou CNPJ inválido" }
);

export const emailSchema = z
  .string()
  .email({ message: "E-mail inválido" });

export const cepSchema = z
  .string()
  .length(9, { message: "CEP deve ter 8 dígitos" })
  .refine((v) => /^\d{5}-\d{3}$/.test(v), { message: "CEP inválido (use 00000-000)" });
