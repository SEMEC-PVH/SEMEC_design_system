/* ------------------------------------------------------------------ */
/*  Helpers puros (sem Zod) — exportados pelo entry principal          */
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

  const chars = d.split("");
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(chars[i]) * (10 - i);
  let rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  if (rest !== Number(chars[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(chars[i]) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10) rest = 0;
  return rest === Number(chars[10]);
}

/** Valida CNPJ por cálculo dos dígitos verificadores. */
export function validateCNPJ(v: string): boolean {
  const d = digits(v);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const chars = d.split("");
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(chars[i]) * weights1[i]!;
  let rest = sum % 11;
  const digit1 = rest < 2 ? 0 : 11 - rest;
  if (Number(chars[12]) !== digit1) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) sum += Number(chars[i]) * weights2[i]!;
  rest = sum % 11;
  const digit2 = rest < 2 ? 0 : 11 - rest;
  return Number(chars[13]) === digit2;
}

export function validateEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export { digits };
