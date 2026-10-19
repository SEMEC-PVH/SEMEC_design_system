// Paleta neon da Vila 2030 (cyberpunk). Os tokens pv-* não têm magenta nem
// ciano: as cores saem de misturas dos tokens com saturação/brilho ajustados,
// nunca de hex literal. Todos os módulos de futuro/ usam esta paleta para a
// cidade falar a mesma língua (ciano + magenta, com roxo de fundo).
//
// createCores(pal) -> { ciano, magenta, roxo, violeta, ambar, verde, branco,
//                       noite, asfalto } (THREE.Color; clone antes de mudar)
export function createCores({ pv, mix, white }) {
  return {
    ciano: pv("blue-300").clone().offsetHSL(-0.05, 0.45, 0.04),
    magenta: mix(pv("red-500"), pv("blue-600"), 0.42).offsetHSL(0, 0.35, 0.1),
    roxo: mix(pv("blue-700"), pv("red-700"), 0.5).offsetHSL(0, 0.2, 0),
    violeta: mix(pv("blue-500"), pv("red-400"), 0.5).offsetHSL(0, 0.3, 0.05),
    ambar: pv("yellow-400").clone().offsetHSL(-0.02, 0.2, 0),
    verde: pv("green-500").clone().offsetHSL(0.03, 0.3, 0.05),
    branco: white.clone(),
    // Fundo da noite cyberpunk (névoa/céu) e chão molhado.
    noite: mix(pv("blue-950"), pv("red-900"), 0.3).offsetHSL(0, 0, -0.04),
    asfalto: mix(pv("gray-900"), pv("blue-950"), 0.5),
  };
}
