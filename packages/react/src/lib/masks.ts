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

/** R$ 0.000,00 */
export const maskCurrency: MaskFn = (v) => {
  v = v.replace(/\D/g, "").slice(0, 12);
  const n = Number(v) / 100;
  return isNaN(n) ? "" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
