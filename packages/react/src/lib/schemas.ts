import { z } from "zod";

import { validateCPF, validateCNPJ } from "./validators";

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
