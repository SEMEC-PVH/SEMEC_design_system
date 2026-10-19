const reported = new Set<string>();

const GUIDE = "https://github.com/SEMEC-PVH/SEMEC_design_system/blob/main/docs/migracao-4.0.md";

/**
 * Erro único em desenvolvimento quando chega um `onChange` removido na 4.0
 * (AUD-35) a `Calendar`, `Combobox`, `InputOTP` ou `FileUpload`. O componente
 * continua descartando a prop; isto só explica, em JavaScript sem tipos, por
 * que a seleção parou de atualizar. Um `console.error` por componente durante
 * a vida da página. Em produção (ou sem `process`, fora de bundler) não faz
 * nada.
 */
export function reportRemovedOnChange(component: string) {
  if (reported.has(component)) return;
  let isDev = false;
  try {
    // Bundlers substituem `process.env.NODE_ENV` estaticamente; sem bundler
    // (e sem `process`), o acesso lança e o erro é omitido.
    isDev = process.env.NODE_ENV !== "production";
  } catch {
    isDev = false;
  }
  if (!isDev) return;
  reported.add(component);
  console.error(
    `[@semec/ds] ${component}: onChange foi removido na 4.0; use onValueChange (ver guia de migração: ${GUIDE}).`
  );
}
