const avisados = new Set<string>();

/**
 * Aviso único em desenvolvimento para API depreciada (ADR-013: "aviso em
 * desenvolvimento" durante as duas minors antes da remoção). Um `console.warn`
 * por chave durante a vida do processo/página. Em produção (ou sem `process`,
 * fora de bundler) não faz nada.
 */
export function warnDeprecated(chave: string, mensagem: string) {
  if (avisados.has(chave)) return;
  let isDev = false;
  try {
    // Bundlers substituem `process.env.NODE_ENV` estaticamente; sem bundler
    // (e sem `process`), o acesso lança e o aviso é omitido.
    isDev = process.env.NODE_ENV !== "production";
  } catch {
    isDev = false;
  }
  if (!isDev) return;
  avisados.add(chave);
  console.warn(`[@semec/ds] ${mensagem}`);
}
