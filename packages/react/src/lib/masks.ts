export type MaskFn = (value: string) => string;

/** 000.000.000-00 */
export const maskCPF: MaskFn = (v) => {
  v = v.replace(/\D/g, "").slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
};

/** 00.000.000/0000-00 */
export const maskCNPJ: MaskFn = (v) => {
  v = v.replace(/\D/g, "").slice(0, 14);
  v = v.replace(/^(\d{2})(\d)/, "$1.$2");
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
  v = v.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  return v;
};

/** 00000-000 */
export const maskCEP: MaskFn = (v) => {
  v = v.replace(/\D/g, "").slice(0, 8);
  v = v.replace(/(\d{5})(\d)/, "$1-$2");
  return v;
};

/**
 * Moeda em reais para campo de digitação: os dígitos viram centavos.
 * `maskCurrency("123456")` → `"R$ 1.234,56"`; até 12 dígitos.
 *
 * Sem dígitos significativos devolve `""` — `maskCurrency("")`,
 * `maskCurrency("abc")` e `maskCurrency("R$ 0,0")` (apagando com Backspace) —
 * para o campo poder voltar a ficar vazio e falhar em `z.string().min(1)`
 * (TST-20). Use `placeholder="R$ 0,00"` para indicar o formato.
 */
export const maskCurrency: MaskFn = (v) => {
  v = v.replace(/\D/g, "").replace(/^0+/, "").slice(0, 12);
  if (!v) return "";
  return (Number(v) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
