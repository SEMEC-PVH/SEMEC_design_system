// Corrida de bicicleta da Pista (mapa separado da Vila): metas das medalhas,
// formatação do tempo e o recorde lembrado no navegador.
//
// Puro (sem React): quem mostra o recorde (HUD da corrida, resultado) assina
// as trocas: useSyncExternalStore(assinarCorrida, lerCorrida, lerCorridaServidor).
// Testes: batalha/__tests__/corrida.test.js (npm run test:batalha).

export const CHAVE_CORRIDA = "vila-semec-corrida-v1";

// Metas das medalhas (ms, tempo total das 2 voltas). Provisórias: ajustar
// depois de cronometrar a pista de verdade.
// Calibradas com a bicicleta em direção livre: um piloto automático só com as
// setas (8 direções, mirando 3 tiles à frente) fez 47,1 s nas 2 voltas. Ouro
// exige pilotar bem (~10% acima); bronze é para quem completa.
export const METAS = Object.freeze({ ouro: 52000, prata: 60000, bronze: 75000 });

export const MEDALHAS = ["ouro", "prata", "bronze"];
export const ROTULO_MEDALHA = { ouro: "Ouro", prata: "Prata", bronze: "Bronze" };

const tempoValido = (ms) => typeof ms === "number" && Number.isFinite(ms) && ms > 0;

// "ouro" | "prata" | "bronze" | null (acima do bronze ou tempo inválido).
export function medalhaDe(ms, metas = METAS) {
  if (!tempoValido(ms)) return null;
  return MEDALHAS.find((m) => ms <= metas[m]) ?? null;
}

// Partes inteiras do tempo (centésimos truncados: 47,329 s vira 47,32 s,
// como um cronômetro de verdade).
function partes(ms) {
  const cs = tempoValido(ms) ? Math.floor(ms / 10) : 0;
  return { min: Math.floor(cs / 6000), seg: Math.floor(cs / 100) % 60, cs: cs % 100 };
}

// 47329 → "0:47.32"; 65030 → "1:05.03". Inválido ou negativo → "0:00.00".
export function formatarTempo(ms) {
  const { min, seg, cs } = partes(ms);
  return `${min}:${String(seg).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

// Versão falada (leitor de tela): 47329 → "47 segundos e 32 centésimos";
// 61000 → "1 minuto e 1 segundo"; 0 → "0 segundos".
export function formatarTempoFalado(ms) {
  const { min, seg, cs } = partes(ms);
  const ditas = [];
  if (min) ditas.push(`${min} ${min === 1 ? "minuto" : "minutos"}`);
  if (seg || (!min && !cs)) ditas.push(`${seg} ${seg === 1 ? "segundo" : "segundos"}`);
  if (cs) ditas.push(`${cs} ${cs === 1 ? "centésimo" : "centésimos"}`);
  if (ditas.length === 1) return ditas[0];
  return `${ditas.slice(0, -1).join(", ")} e ${ditas[ditas.length - 1]}`;
}

// ---- Recorde no navegador ------------------------------------------------------

export const corridaInicial = () => ({ recorde: null, medalhas: { ouro: 0, prata: 0, bronze: 0 }, vezes: 0 });

const contagem = (n) => (Number.isInteger(n) && n > 0 ? n : 0);

// Aceita só o formato esperado (o localStorage pode ter lixo ou edição à mão).
export function normalizarCorrida(bruto) {
  const base = corridaInicial();
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return base;
  if (tempoValido(bruto.recorde)) base.recorde = bruto.recorde;
  const m = bruto.medalhas;
  if (m && typeof m === "object") for (const k of MEDALHAS) base.medalhas[k] = contagem(m[k]);
  base.vezes = contagem(bruto.vezes);
  return base;
}

// Sem armazenamento (navegação privada), vale o que foi feito nesta visita.
let nestaVisita = null;
// Foto estável para o useSyncExternalStore (mesmo objeto até a próxima troca).
let foto = null;

function lerDoArmazenamento() {
  try {
    const txt = localStorage.getItem(CHAVE_CORRIDA);
    if (txt != null) return normalizarCorrida(JSON.parse(txt));
  } catch {
    // JSON quebrado ou armazenamento bloqueado: cai no que vale nesta visita.
  }
  return nestaVisita ?? corridaInicial();
}

// { recorde: ms | null, medalhas: { ouro, prata, bronze }, vezes }
export function lerCorrida() {
  if (!foto) foto = lerDoArmazenamento();
  return foto;
}

// Snapshot do servidor (export estático): nada corrido ainda.
const VAZIA = corridaInicial();
export const lerCorridaServidor = () => VAZIA;

// Atalho: só o recorde (ms) ou null.
export const lerRecorde = () => lerCorrida().recorde;

const ouvintes = new Set();
export function assinarCorrida(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

function gravar(dados) {
  nestaVisita = dados;
  foto = dados;
  try {
    if (dados) localStorage.setItem(CHAVE_CORRIDA, JSON.stringify(dados));
    else localStorage.removeItem(CHAVE_CORRIDA);
  } catch {
    // Navegação privada/armazenamento bloqueado: vale só nesta visita.
  }
  if (!dados) foto = null;
  for (const fn of ouvintes) fn();
}

// Registra uma chegada (ms). Devolve
// { tempo, medalha, novoRecorde, recordeAnterior, recorde, ganhouStack }
// ganhouStack: primeiro ouro desta jornada (quem chama entrega a Stack do Pedal).
// Tempo inválido não grava nada.
export function salvarResultado(ms) {
  const antes = lerDoArmazenamento();
  if (!tempoValido(ms)) {
    return { tempo: ms, medalha: null, novoRecorde: false, recordeAnterior: antes.recorde, recorde: antes.recorde, ganhouStack: false };
  }
  const medalha = medalhaDe(ms);
  const novoRecorde = antes.recorde == null || ms < antes.recorde;
  const depois = {
    recorde: novoRecorde ? ms : antes.recorde,
    medalhas: { ...antes.medalhas },
    vezes: antes.vezes + 1,
  };
  if (medalha) depois.medalhas[medalha] += 1;
  gravar(depois);
  return {
    tempo: ms,
    medalha,
    novoRecorde,
    recordeAnterior: antes.recorde,
    recorde: depois.recorde,
    ganhouStack: medalha === "ouro" && antes.medalhas.ouro === 0,
  };
}

// "Recomeçar jornada": apaga recorde, medalhas e contagem de corridas.
export function reiniciarCorrida() {
  nestaVisita = null;
  gravar(null);
}
