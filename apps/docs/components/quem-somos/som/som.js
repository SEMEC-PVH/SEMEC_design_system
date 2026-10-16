// Som da Vila SEMEC: tudo sintetizado na hora com a Web Audio API (nenhum
// arquivo de áudio, nenhum direito autoral). Este módulo é o "mixer":
//   - um AudioContext só, criado no 1º gesto (os navegadores bloqueiam som
//     antes de um clique/tecla) — desbloquear();
//   - barramentos: efeitos e música → compressor → saída, mais um envio de
//     eco/ambiência (atraso com realimentação filtrada) que dá o brilho
//     "de jogo" sem embolar;
//   - preferência "tudo" | "efeitos" | "desligado", lembrada no navegador
//     (useSyncExternalStore: assinarSom/lerSom);
//   - aba escondida: suspende o contexto (sem som de fundo nem CPU).
// Os efeitos (sfx.js) e a música (musica.js) só pedem os nós daqui.

const CHAVE = "vila-semec-som";
export const OPCOES_SOM = ["tudo", "efeitos", "desligado"];
export const ROTULO_SOM = { tudo: "Tudo", efeitos: "Só efeitos", desligado: "Desligado" };

const VOL = { mestre: 0.7, efeitos: 0.9, musica: 0.32, eco: 0.22 };

let preferencia = null;
const ouvintes = new Set();
function lerArmazenado() {
  try {
    const v = localStorage.getItem(CHAVE);
    return OPCOES_SOM.includes(v) ? v : "tudo";
  } catch {
    return "tudo";
  }
}
export function lerSom() {
  if (preferencia === null) preferencia = typeof window === "undefined" ? "tudo" : lerArmazenado();
  return preferencia;
}
export function assinarSom(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}
export function salvarSom(v) {
  preferencia = OPCOES_SOM.includes(v) ? v : "tudo";
  try {
    localStorage.setItem(CHAVE, preferencia);
  } catch {
    // Sem armazenamento: vale só nesta visita.
  }
  aplicarVolumes();
  for (const fn of ouvintes) fn();
}
export const proximaOpcaoSom = (v) => OPCOES_SOM[(OPCOES_SOM.indexOf(v) + 1) % OPCOES_SOM.length];

// ---- Contexto e barramentos --------------------------------------------------
let ctx = null;
let nos = null; // { mestre, efeitos, musica, eco }

export function desbloquear() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    const mestre = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 12;
    comp.ratio.value = 3.5;
    comp.attack.value = 0.004;
    comp.release.value = 0.18;
    mestre.connect(comp).connect(ctx.destination);
    const efeitos = ctx.createGain();
    const musica = ctx.createGain();
    efeitos.connect(mestre);
    musica.connect(mestre);
    // Eco curto e escuro (ambiência): atraso 0,19 s, realimentação 0,32,
    // passa-baixa 2,4 kHz — dá "ar" aos sinos e arpejos.
    const eco = ctx.createGain();
    const atraso = ctx.createDelay(1);
    atraso.delayTime.value = 0.19;
    const realim = ctx.createGain();
    realim.gain.value = 0.32;
    const escuro = ctx.createBiquadFilter();
    escuro.type = "lowpass";
    escuro.frequency.value = 2400;
    eco.connect(atraso);
    atraso.connect(escuro);
    escuro.connect(realim);
    realim.connect(atraso);
    escuro.connect(mestre);
    nos = { mestre, efeitos, musica, eco };
    aplicarVolumes();
    document.addEventListener("visibilitychange", () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
      else if (lerSom() !== "desligado") ctx.resume();
    });
  }
  if (ctx.state === "suspended" && !document.hidden && lerSom() !== "desligado") ctx.resume();
  return ctx;
}

function aplicarVolumes() {
  if (!ctx || !nos) return;
  const p = lerSom();
  const t = ctx.currentTime;
  const alvo = (no, v) => no.gain.setTargetAtTime(v, t, 0.08);
  alvo(nos.mestre, p === "desligado" ? 0 : VOL.mestre);
  alvo(nos.efeitos, VOL.efeitos);
  alvo(nos.musica, p === "tudo" ? VOL.musica : 0);
  alvo(nos.eco, VOL.eco);
  if (p === "desligado") ctx.suspend();
  else if (!document.hidden) ctx.resume();
}

// Para sfx.js e musica.js: contexto pronto (ou null, se ainda sem gesto ou
// com o som desligado) e os nós de saída.
export function contexto() {
  if (!ctx || ctx.state === "closed" || lerSom() === "desligado") return null;
  return ctx;
}
export const saidas = () => nos;
export const musicaLigada = () => lerSom() === "tudo";

// Ruído branco reaproveitado (1 s), para passos, catraca, chiados.
let ruidoBuf = null;
export function ruido() {
  if (!ctx) return null;
  if (!ruidoBuf) {
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ruidoBuf;
}

// Onda quadrada de pulso estreito (timbre "8-bit" mais suave que a quadrada
// cheia), por PeriodicWave; cache por largura.
const pulsos = new Map();
export function pulso(largura = 0.25) {
  if (!ctx) return null;
  if (pulsos.has(largura)) return pulsos.get(largura);
  const n = 32;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * largura);
  const onda = ctx.createPeriodicWave(re, im);
  pulsos.set(largura, onda);
  return onda;
}

// Nota (nome tipo "C5", "F#4") → Hz.
const SEMI = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };
export function hz(nota) {
  if (typeof nota === "number") return nota;
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(nota);
  if (!m) return 440;
  const semi = SEMI[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * 2 ** (semi / 12);
}
