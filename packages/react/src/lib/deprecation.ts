const warned = new Set<string>();

/**
 * Aviso único de depreciação em desenvolvimento (ADR-013): um `console.warn`
 * por `key` durante a vida da página. Em produção (ou sem `process`, fora de
 * bundler) não faz nada.
 */
export function warnDeprecated(key: string, message: string) {
  if (warned.has(key)) return;
  let isDev = false;
  try {
    // Bundlers substituem `process.env.NODE_ENV` estaticamente; sem bundler
    // (e sem `process`), o acesso lança e o aviso é omitido.
    isDev = process.env.NODE_ENV !== "production";
  } catch {
    isDev = false;
  }
  if (!isDev) return;
  warned.add(key);
  console.warn(`[@semec/ds] ${message}`);
}
