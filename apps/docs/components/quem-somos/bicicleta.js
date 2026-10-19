// Bicicleta conquistada na oficina do bicicletário (minigame OficinaBike),
// lembrada no navegador. Quem mostra (HUD) e quem monta a cena (VilaSemec)
// assinam as trocas: useSyncExternalStore(assinarBicicleta, lerBicicleta, () => false).
const CHAVE = "vila-semec-bicicleta";
// Sem armazenamento (navegação privada), vale o que foi ganho nesta visita.
let nestaVisita = false;

export function lerBicicleta() {
  try {
    return localStorage.getItem(CHAVE) === "1" || nestaVisita;
  } catch {
    return nestaVisita;
  }
}

const ouvintes = new Set();
export function assinarBicicleta(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

// on = false: "Recomeçar jornada" devolve a bicicleta ao bicicletário.
export function salvarBicicleta(on) {
  nestaVisita = on;
  try {
    if (on) localStorage.setItem(CHAVE, "1");
    else localStorage.removeItem(CHAVE);
  } catch {
    // Navegação privada/armazenamento bloqueado: vale só nesta visita.
  }
  for (const fn of ouvintes) fn();
}
