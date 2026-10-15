// Nível gráfico da Vila SEMEC: detecção da placa de vídeo e preferência do
// jogador.
//
// Níveis (do mais caro ao mais barato; o que cada um liga está em
// scene/lighting.js, QUALITY):
//   "high"     oclusão de ambiente, sombras 2048, antialias
//   "medium"   sombras 2048, antialias
//   "low"      sombras 1024, sem antialias, modelos e vegetação leves
//   "minimal"  sem sombras, sem antialias, resolução 0,75x, modelos leves
//
// Alvo: os PCs da prefeitura (i3 de 2ª a 4ª geração com vídeo Intel HD
// integrado). Em "auto", a placa decide o ponto de partida; durante o jogo o
// motor ainda desce de nível se o quadro ficar lento e guarda esse nível para
// a próxima visita.

export const NIVEIS = ["high", "medium", "low", "minimal"];

export const ROTULO = { auto: "Automático", high: "Alto", medium: "Médio", low: "Baixo", minimal: "Mínimo" };

// Ordem do seletor do menu (Enter avança).
export const OPCOES = ["auto", ...NIVEIS];

const CHAVE = "vila-semec-graficos";
const CHAVE_AUTO = "vila-semec-graficos-auto";

function ler(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave, valor) {
  try {
    if (valor == null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
  } catch {
    // Sem armazenamento (aba privada, bloqueio): vale só nesta visita.
  }
}

// Preferência do jogador: "auto" ou um dos NIVEIS.
export function lerPreferencia() {
  const v = ler(CHAVE);
  return NIVEIS.includes(v) ? v : "auto";
}

// Quem mostra a preferência (menu) e quem monta a cena (VilaSemec) assinam
// as trocas: useSyncExternalStore(assinarPreferencia, lerPreferencia, () => "auto").
const ouvintes = new Set();
export function assinarPreferencia(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function salvarPreferencia(v) {
  gravar(CHAVE, v === "auto" ? null : v);
  // Trocar a preferência zera o que o modo automático tinha aprendido.
  gravar(CHAVE_AUTO, null);
  for (const fn of ouvintes) fn();
}

// O motor desceu de nível sozinho (quadro lento): a próxima visita em
// "auto" já começa nele.
export function lembrarNivelAuto(nivel) {
  if (NIVEIS.includes(nivel)) gravar(CHAVE_AUTO, nivel);
}

// Intel HD integrada de 2ª a 4ª geração (Sandy Bridge, Ivy Bridge, Haswell)
// e as Atom/Celeron antigas. "HD Graphics" sem número também entra (drivers
// antigos do Windows mostram assim).
const INTEL_MUITO_FRACA = /intel.*(hd graphics (2000|2500|3000|4000)|gma|hd graphics(?! ?\d)|bay ?trail)/i;
// Haswell/Broadwell (4ª e 5ª geração): aguentam o nível baixo.
const INTEL_FRACA = /intel.*hd graphics (4[2-6]00|5[0-6]00|6000)\b/i;
// Renderização por software: o Chrome caiu na CPU (sem aceleração de vídeo).
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i;

// Lê a placa de vídeo num canvas descartável (antes de criar o renderer).
// { webgl2, gpu, software }
export function detectarGpu() {
  const out = { webgl2: false, gpu: "", software: false };
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return out;
    out.webgl2 = true;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    out.gpu = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || "");
    out.software = SOFTWARE.test(out.gpu);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    // Sem WebGL2: o chamador mostra a equipe em lista.
  }
  return out;
}

// Nível que o modo automático escolhe para esta máquina.
export function nivelAutomatico(gpu = detectarGpu()) {
  const lembrado = ler(CHAVE_AUTO);
  const cores = navigator.hardwareConcurrency || 4;
  const dpr = window.devicePixelRatio || 1;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  let nivel = "high";
  if (gpu.software || INTEL_MUITO_FRACA.test(gpu.gpu) || cores <= 2) nivel = "minimal";
  else if (INTEL_FRACA.test(gpu.gpu) || coarse) nivel = "low";
  else if (dpr > 1.5 || cores <= 4) nivel = "medium";
  // O que o motor já aprendeu numa visita anterior só pode baixar o nível.
  if (NIVEIS.includes(lembrado) && NIVEIS.indexOf(lembrado) > NIVEIS.indexOf(nivel)) nivel = lembrado;
  return nivel;
}

// Resolve a preferência num nível concreto. { nivel, auto, gpu }
export function resolverNivel(pref = lerPreferencia(), gpu = detectarGpu()) {
  if (pref !== "auto") return { nivel: pref, auto: false, gpu };
  return { nivel: nivelAutomatico(gpu), auto: true, gpu };
}

// Níveis que usam modelos e vegetação leves (decidido ao montar a cena).
export const ehLeve = (nivel) => nivel === "low" || nivel === "minimal";

// Nome do GLB na versão leve (public/quem-somos/<nome>-leve.glb: menos
// triângulos e texturas de 512 px), usada nos níveis leves.
export const arquivoLeve = (nome, leve) => (leve ? nome.replace(/\.glb$/, "-leve.glb") : nome);
