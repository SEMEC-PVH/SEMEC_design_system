import * as z from "zod";

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

/**
 * Schema de string com duas mensagens (V42-VITE-06): campo vazio pede o dado
 * ("Informe o CPF.") e valor preenchido inválido explica o problema. Sempre um
 * item só por campo, para o ErrorSummary listar uma linha por campo.
 */
function textoValidado(vazio: string, validar: (v: string) => string | null) {
  return z.string().superRefine((v, ctx) => {
    const message = v.trim() === "" ? vazio : validar(v);
    if (message) ctx.addIssue({ code: "custom", message });
  });
}

const emailFormato = z.string().email();

export const cpfSchema = textoValidado("Informe o CPF.", (v) =>
  validateCPF(v) ? null : "CPF inválido. Confira os 11 dígitos."
);

export const cnpjSchema = textoValidado("Informe o CNPJ.", (v) =>
  validateCNPJ(v) ? null : "CNPJ inválido. Confira os 14 dígitos."
);

export const cpfCnpjSchema = textoValidado("Informe o CPF ou o CNPJ.", (v) => {
  const d = digits(v);
  const ok = d.length === 11 ? validateCPF(v) : d.length === 14 ? validateCNPJ(v) : false;
  return ok ? null : "CPF ou CNPJ inválido. Confira os dígitos.";
});

export const emailSchema = textoValidado("Informe o e-mail.", (v) =>
  emailFormato.safeParse(v).success ? null : "E-mail inválido. Use o formato nome@exemplo.com."
);

export const cepSchema = textoValidado("Informe o CEP.", (v) =>
  v.length !== 9
    ? "O CEP deve ter 8 dígitos."
    : /^\d{5}-\d{3}$/.test(v)
      ? null
      : "CEP inválido. Use o formato 00000-000."
);

/** Data em formato brasileiro DD/MM/AAAA. */
export const dateBRSchema = textoValidado("Informe a data.", (v) =>
  validateDateBR(v) ? null : "Data inválida. Use o formato DD/MM/AAAA."
);

/** Competência em formato MM/AAAA. */
export const dateMonthYearSchema = textoValidado("Informe o mês e o ano.", (v) =>
  validateDateMonthYear(v) ? null : "Mês/ano inválido. Use o formato MM/AAAA."
);

/** Horário em formato HH:MM. */
export const timeSchema = textoValidado("Informe o horário.", (v) =>
  validateTime(v) ? null : "Horário inválido. Use o formato HH:MM."
);

/**
 * Valida data tanto em formato brasileiro (DD/MM/AAAA) quanto ISO (AAAA-MM-DD).
 * Útil para campos que aceitam digitação mascarada ou valor de DatePicker nativo.
 */
export const dateSchema = textoValidado("Informe a data.", (v) => {
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return validateDateBR(v) ? null : "Data inválida. Use o formato DD/MM/AAAA.";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [year, month, day] = v.split("-").map(Number);
    if (!year || !month || !day || month < 1 || month > 12) return "Data inválida.";
    const daysInMonth = new Date(year, month, 0).getDate();
    return day >= 1 && day <= daysInMonth ? null : "Data inválida.";
  }
  return "Data inválida. Use o formato DD/MM/AAAA.";
});
