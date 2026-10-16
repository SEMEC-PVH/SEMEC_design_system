// Efeitos sonoros da Vila SEMEC, sintetizados (som.js tem o mixer). A receita
// do "satisfatório": ataque curtíssimo (sem clique), queda rápida, um pouco
// de variação de altura a cada repetição (passos e blips nunca soam iguais),
// harmônicos de sino nos acertos e eco curto só onde brilha.
//
//   tocar("nome", { ... })   — nomes em SONS, abaixo.
//
// Tudo é silencioso enquanto não há gesto (desbloquear em som.js) ou com o
// som desligado.
import { contexto, desbloquear, hz, pulso, ruido, saidas } from "./som";

const r = (a, b) => a + Math.random() * (b - a);
const semitom = (f, n) => f * 2 ** (n / 12);

// Envelope de volume: sobe em `ataque`, cai exponencial até `dur`.
function envelope(g, t, pico, ataque, dur) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(pico, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}

// Um tom: forma ("sine" | "triangle" | "square" | "sawtooth" | número = pulso
// com essa largura), frequência (com deslize opcional `ate`), volume, filtro.
function tom(c, saida, t, { f, ate, dur = 0.12, vol = 0.3, forma = "sine", ataque = 0.004, filtro, q = 0.7, eco = 0 }) {
  const o = c.createOscillator();
  if (typeof forma === "number") o.setPeriodicWave(pulso(forma));
  else o.type = forma;
  o.frequency.setValueAtTime(f, t);
  if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur * 0.9);
  const g = c.createGain();
  envelope(g, t, vol, ataque, dur);
  let ult = o;
  if (filtro) {
    const fl = c.createBiquadFilter();
    fl.type = "lowpass";
    fl.frequency.value = filtro;
    fl.Q.value = q;
    o.connect(fl);
    ult = fl;
  }
  ult.connect(g);
  g.connect(saida);
  if (eco) {
    const ge = c.createGain();
    ge.gain.value = eco;
    g.connect(ge);
    ge.connect(saidas().eco);
  }
  o.start(t);
  o.stop(t + dur + 0.05);
}

// Ruído filtrado (passos, catraca, chiado, sopro).
function sopro(c, saida, t, { dur = 0.06, vol = 0.25, tipo = "bandpass", f = 1800, ate, q = 1, ataque = 0.002 }) {
  const s = c.createBufferSource();
  s.buffer = ruido();
  // O buffer tem 1 s e começa num ponto sorteado: em laço, sopros longos
  // (torcida, whoosh) não acabam no meio.
  s.loop = true;
  s.playbackRate.value = r(0.9, 1.1);
  const fl = c.createBiquadFilter();
  fl.type = tipo;
  fl.frequency.setValueAtTime(f, t);
  if (ate) fl.frequency.exponentialRampToValueAtTime(ate, t + dur);
  fl.Q.value = q;
  const g = c.createGain();
  envelope(g, t, vol, ataque, dur);
  s.connect(fl).connect(g).connect(saida);
  s.start(t, r(0, 0.8));
  s.stop(t + dur + 0.05);
}

// Sino: fundamental + parciais inarmônicas (o "plin" de acerto).
function sino(c, saida, t, f, { dur = 0.9, vol = 0.18, eco = 0.5 } = {}) {
  const parciais = [
    [1, 1],
    [2.01, 0.42],
    [3.0, 0.22],
    [4.2, 0.12],
  ];
  for (const [m, v] of parciais) tom(c, saida, t, { f: f * m, dur: dur / Math.sqrt(m), vol: vol * v, ataque: 0.002, eco });
}

// Arpejo (lista de notas, intervalo entre elas).
function arpejo(c, saida, t, notas, passo, opts) {
  notas.forEach((n, i) => tom(c, saida, t + i * passo, { f: hz(n), ...opts }));
}

// Vozes da fala: altura-base por personagem (blip do diálogo).
const VOZ = {
  rafa: 330,
  gava: 262,
  pedro: 247,
  leo: 294,
  mariana: 440,
  tiago: 277,
  "ze-carlos": 220,
  emily: 494,
  placa: 392,
};

const SONS = {
  // ---- Interface ------------------------------------------------------------
  "ui-mover": (c, s, t) => tom(c, s, t, { f: r(1180, 1260), dur: 0.035, vol: 0.12, forma: "triangle" }),
  "ui-ok": (c, s, t) => {
    tom(c, s, t, { f: hz("E6"), dur: 0.08, vol: 0.16, forma: 0.25, filtro: 5200 });
    tom(c, s, t + 0.06, { f: hz("B6"), dur: 0.16, vol: 0.14, forma: 0.25, filtro: 5200, eco: 0.25 });
  },
  "ui-voltar": (c, s, t) => {
    tom(c, s, t, { f: hz("B5"), dur: 0.07, vol: 0.13, forma: "triangle" });
    tom(c, s, t + 0.06, { f: hz("E5"), dur: 0.12, vol: 0.12, forma: "triangle" });
  },
  "ui-erro": (c, s, t) => {
    tom(c, s, t, { f: 260, ate: 170, dur: 0.16, vol: 0.22, forma: "triangle" });
    sopro(c, s, t, { dur: 0.05, vol: 0.06, f: 600, q: 2 });
  },
  // Pulinho da tela de escolha: "boing" (sobe com vibrato) + brilho.
  escolhido: (c, s, t) => {
    tom(c, s, t, { f: 220, ate: 660, dur: 0.28, vol: 0.2, forma: "sine" });
    arpejo(c, s, t + 0.22, ["C6", "E6", "G6"], 0.05, { dur: 0.25, vol: 0.09, forma: "triangle", eco: 0.4 });
  },
  carregou: (c, s, t) => arpejo(c, s, t, ["G5", "C6", "E6", "G6"], 0.07, { dur: 0.5, vol: 0.09, forma: "sine", eco: 0.5 }),

  // ---- Fala (um blip por letra; o VilaSemec limita a frequência) -------------
  fala: (c, s, t, { quem } = {}) => {
    const base = VOZ[quem] ?? 300;
    const f = semitom(base, [0, 2, 4, 7, 9][Math.floor(Math.random() * 5)] + r(-0.3, 0.3));
    tom(c, s, t, { f, dur: 0.045, vol: 0.07, forma: 0.25, filtro: 2600, ataque: 0.003 });
  },

  // ---- Passos (por chão; a altura varia a cada passo) ------------------------
  "passo-grama": (c, s, t) => sopro(c, s, t, { dur: 0.07, vol: 0.12, tipo: "lowpass", f: r(700, 1000), q: 0.6 }),
  "passo-pedra": (c, s, t) => {
    sopro(c, s, t, { dur: 0.035, vol: 0.13, f: r(2600, 3200), q: 3 });
    tom(c, s, t, { f: r(150, 175), dur: 0.05, vol: 0.06, forma: "sine" });
  },
  "passo-madeira": (c, s, t) => {
    tom(c, s, t, { f: r(180, 210), ate: 120, dur: 0.07, vol: 0.14, forma: "triangle" });
    sopro(c, s, t, { dur: 0.03, vol: 0.06, f: 1400, q: 2 });
  },
  "passo-piso": (c, s, t) => {
    sopro(c, s, t, { dur: 0.03, vol: 0.1, f: r(3600, 4200), q: 4 });
    tom(c, s, t, { f: r(240, 270), dur: 0.035, vol: 0.05, forma: "sine" });
  },
  "passo-carpete": (c, s, t) => sopro(c, s, t, { dur: 0.06, vol: 0.07, tipo: "lowpass", f: r(450, 600), q: 0.5 }),
  // Pneu rolando sobre o chão (pedalando): bem baixo.
  "pneu": (c, s, t) => sopro(c, s, t, { dur: 0.09, vol: 0.05, tipo: "lowpass", f: r(500, 700), q: 0.5 }),

  // ---- Bicicleta --------------------------------------------------------------
  // Campainha "trim-trim": dois toques de sino agudo.
  campainha: (c, s, t) => {
    for (const d of [0, 0.13]) {
      tom(c, s, t + d, { f: 2650, dur: 0.22, vol: 0.09, eco: 0.35 });
      tom(c, s, t + d, { f: 3960, dur: 0.16, vol: 0.05 });
    }
  },
  // Catraca da roda livre (tic seco e agudo).
  catraca: (c, s, t) => sopro(c, s, t, { dur: 0.012, vol: 0.09, tipo: "highpass", f: 5200, q: 0.8, ataque: 0.001 }),
  "bike-desce": (c, s, t) => {
    tom(c, s, t, { f: 140, ate: 90, dur: 0.1, vol: 0.16, forma: "triangle" });
    sopro(c, s, t + 0.02, { dur: 0.05, vol: 0.06, f: 1800, q: 2 });
  },

  // ---- Prédio -----------------------------------------------------------------
  porta: (c, s, t) => sopro(c, s, t, { dur: 0.45, vol: 0.12, f: 500, ate: 1600, q: 0.9, ataque: 0.12 }),
  "elevador-ding": (c, s, t) => {
    sino(c, s, t, hz("E5"), { dur: 1.2, vol: 0.16 });
    sino(c, s, t + 0.32, hz("C5"), { dur: 1.4, vol: 0.15 });
  },
  "elevador-porta": (c, s, t) => sopro(c, s, t, { dur: 0.7, vol: 0.06, tipo: "lowpass", f: 380, q: 0.6, ataque: 0.2 }),

  // ---- Quests e recompensas ---------------------------------------------------
  // Coletou (página, nota, ocarina): "plim" + arpejo cintilante.
  coleta: (c, s, t) => {
    tom(c, s, t, { f: 520, ate: 1400, dur: 0.09, vol: 0.12, forma: "sine" });
    arpejo(c, s, t + 0.05, ["C6", "E6", "G6", "C7", "E7"], 0.045, { dur: 0.32, vol: 0.08, forma: "triangle", eco: 0.55 });
  },
  // Bug corrigido: zumbido de glitch que "desliga" e um acorde que resolve.
  "bug-corrigido": (c, s, t) => {
    tom(c, s, t, { f: 900, ate: 120, dur: 0.18, vol: 0.09, forma: 0.125, filtro: 3000 });
    sopro(c, s, t, { dur: 0.12, vol: 0.06, f: 3000, ate: 400, q: 3 });
    for (const n of ["C5", "E5", "G5", "C6"]) tom(c, s, t + 0.2, { f: hz(n), dur: 0.7, vol: 0.06, forma: "triangle", eco: 0.45 });
    sino(c, s, t + 0.24, hz("G6"), { dur: 0.8, vol: 0.08 });
  },
  acerto: (c, s, t) => {
    tom(c, s, t, { f: hz("G5"), dur: 0.1, vol: 0.12, forma: 0.25, filtro: 4800 });
    tom(c, s, t + 0.08, { f: hz("D6"), dur: 0.24, vol: 0.12, forma: 0.25, filtro: 4800, eco: 0.35 });
  },
  "quest-aceita": (c, s, t) =>
    arpejo(c, s, t, ["C5", "G5", "C6"], 0.09, { dur: 0.28, vol: 0.11, forma: 0.25, filtro: 4200, eco: 0.35 }),
  // Stack conquistada: fanfarrinha + sino.
  stack: (c, s, t) => {
    arpejo(c, s, t, ["C5", "E5", "G5"], 0.1, { dur: 0.2, vol: 0.11, forma: 0.25, filtro: 4500 });
    for (const n of ["C5", "E5", "G5", "C6"]) tom(c, s, t + 0.32, { f: hz(n), dur: 1.0, vol: 0.07, forma: 0.25, filtro: 3800, eco: 0.4 });
    sino(c, s, t + 0.34, hz("C7"), { dur: 1.3, vol: 0.09 });
  },
  // Oficina da bicicleta: bomba de ar "psss" e aperto de chave.
  bomba: (c, s, t) => sopro(c, s, t, { dur: 0.32, vol: 0.12, tipo: "highpass", f: 2200, ate: 4800, q: 0.7, ataque: 0.03 }),

  // ---- Corrida da Pista -----------------------------------------------------------
  // Contagem 3-2-1: bipe médio de semáforo de largada (sempre a mesma altura,
  // como no kart: quem sobe é o "JÁ!").
  contagem: (c, s, t) => {
    tom(c, s, t, { f: hz("A4"), dur: 0.2, vol: 0.16, forma: 0.25, filtro: 3200, ataque: 0.003 });
    tom(c, s, t, { f: hz("A5"), dur: 0.12, vol: 0.04, forma: "sine" });
  },
  // Largada: bipe agudo longo (uma oitava acima) + whoosh de arrancada.
  largada: (c, s, t) => {
    tom(c, s, t, { f: hz("A5"), dur: 0.6, vol: 0.16, forma: 0.25, filtro: 4200, ataque: 0.003, eco: 0.2 });
    tom(c, s, t, { f: hz("A6"), dur: 0.35, vol: 0.04, forma: "sine" });
    sopro(c, s, t + 0.05, { dur: 0.55, vol: 0.14, f: 450, ate: 3200, q: 0.9, ataque: 0.18 });
  },
  // Checkpoint: "plim" que sobe e brilha; cada checkpoint um degrau acima na
  // escala maior (opts.i = índice, 0 o primeiro).
  checkpoint: (c, s, t, { i = 0 } = {}) => {
    const ESCALA = [0, 2, 4, 7, 9, 12, 14, 16];
    const base = semitom(hz("C6"), ESCALA[Math.max(0, i) % ESCALA.length] + 12 * Math.floor(Math.max(0, i) / ESCALA.length));
    tom(c, s, t, { f: base / 2, ate: base, dur: 0.08, vol: 0.1, forma: "triangle" });
    tom(c, s, t + 0.05, { f: base, dur: 0.22, vol: 0.12, forma: 0.25, filtro: 6000, eco: 0.3 });
    sino(c, s, t + 0.06, base * 2, { dur: 0.5, vol: 0.05, eco: 0.45 });
  },
  // Volta completa: mini fanfarra (tercinas e acorde curto).
  volta: (c, s, t) => {
    arpejo(c, s, t, ["G5", "G5", "G5"], 0.075, { dur: 0.07, vol: 0.11, forma: 0.25, filtro: 4500 });
    for (const n of ["C5", "E5", "G5", "C6"]) tom(c, s, t + 0.24, { f: hz(n), dur: 0.5, vol: 0.06, forma: 0.25, filtro: 4000, eco: 0.3 });
    tom(c, s, t + 0.24, { f: hz("C3"), dur: 0.3, vol: 0.12, forma: "triangle" });
  },
  // Chegada: fanfarra de pódio + sino de bandeirada.
  chegada: (c, s, t) => {
    arpejo(c, s, t, ["G4", "C5", "E5", "G5"], 0.09, { dur: 0.14, vol: 0.11, forma: 0.25, filtro: 4500 });
    tom(c, s, t + 0.38, { f: hz("E5"), dur: 0.14, vol: 0.11, forma: 0.25, filtro: 4500 });
    tom(c, s, t + 0.5, { f: hz("G5"), dur: 0.14, vol: 0.11, forma: 0.25, filtro: 4500 });
    for (const n of ["C5", "E5", "G5", "C6", "E6"]) tom(c, s, t + 0.64, { f: hz(n), dur: 1.3, vol: 0.055, forma: 0.25, filtro: 3800, eco: 0.4 });
    tom(c, s, t + 0.64, { f: hz("C3"), dur: 0.9, vol: 0.14, forma: "triangle" });
    sino(c, s, t + 0.66, hz("C7"), { dur: 1.6, vol: 0.1 });
    sino(c, s, t + 0.9, hz("G6"), { dur: 1.3, vol: 0.06 });
  },
  // Novo recorde: arpejo festivo de duas oitavas, com eco e faísca no topo.
  recorde: (c, s, t) => {
    arpejo(c, s, t, ["C5", "E5", "G5", "C6", "E6", "G6", "C7"], 0.06, { dur: 0.3, vol: 0.08, forma: "triangle", eco: 0.5 });
    arpejo(c, s, t + 0.03, ["G4", "C5", "E5", "G5", "C6", "E6", "G6"], 0.06, { dur: 0.2, vol: 0.04, forma: 0.25, filtro: 5000 });
    sino(c, s, t + 0.44, hz("E7"), { dur: 1.1, vol: 0.07 });
    for (let k = 0; k < 5; k++) tom(c, s, t + 0.5 + k * r(0.05, 0.09), { f: r(3200, 5200), dur: 0.06, vol: 0.03, forma: "sine", eco: 0.4 });
  },
  // Torcida: chiado de público que cresce e cai (~1,5 s) com palmas soltas
  // por cima, mais densas no meio.
  torcida: (c, s, t) => {
    sopro(c, s, t, { dur: 1.5, vol: 0.09, f: 1100, q: 0.5, ataque: 0.55 });
    sopro(c, s, t + 0.1, { dur: 1.35, vol: 0.05, tipo: "lowpass", f: 600, q: 0.4, ataque: 0.5 });
    for (let k = 0; k < 46; k++) {
      // Distribuição em sino: mais palmas perto de 0,6 s.
      const d = ((Math.random() + Math.random() + Math.random()) / 3) * 1.4;
      const forca = 1 - Math.abs(d - 0.6) / 0.9;
      sopro(c, s, t + d, { dur: r(0.015, 0.035), vol: 0.05 * Math.max(0.25, forca), f: r(1400, 2800), q: r(1.2, 2.5), ataque: 0.001 });
    }
  },

  // ---- Batalha ------------------------------------------------------------------
  golpe: (c, s, t) => {
    tom(c, s, t, { f: 160, ate: 55, dur: 0.16, vol: 0.32, forma: "sine" });
    sopro(c, s, t, { dur: 0.09, vol: 0.18, f: 1200, ate: 300, q: 0.8 });
  },
  "golpe-forte": (c, s, t) => {
    tom(c, s, t, { f: 190, ate: 45, dur: 0.22, vol: 0.38, forma: "sine" });
    sopro(c, s, t, { dur: 0.16, vol: 0.22, f: 2400, ate: 250, q: 0.7 });
    tom(c, s, t + 0.02, { f: 70, dur: 0.18, vol: 0.12, forma: 0.5, filtro: 400 });
  },
  "golpe-fraco": (c, s, t) => sopro(c, s, t, { dur: 0.08, vol: 0.12, tipo: "lowpass", f: 700, q: 0.7 }),
  derrota: (c, s, t) => arpejo(c, s, t, ["G4", "E4", "C4"], 0.12, { dur: 0.3, vol: 0.12, forma: "triangle" }),
  vitoria: (c, s, t) => {
    arpejo(c, s, t, ["C5", "C5", "C5", "G5"], 0.11, { dur: 0.12, vol: 0.12, forma: 0.25, filtro: 4500 });
    tom(c, s, t + 0.5, { f: hz("E5"), dur: 0.2, vol: 0.12, forma: 0.25, filtro: 4500 });
    for (const n of ["C5", "E5", "G5", "C6"]) tom(c, s, t + 0.72, { f: hz(n), dur: 1.0, vol: 0.06, forma: 0.25, filtro: 3800, eco: 0.4 });
  },
};

// Pequeno respiro entre repetições do mesmo som (evita metralhadora de blips).
const ultimo = new Map();
const MIN_INTERVALO = { fala: 0.045, "ui-mover": 0.03, catraca: 0.03 };

export function tocar(nome, opts) {
  // Chamado dentro de um clique/tecla antes do destravar global: destrava aqui.
  if (!contexto()) desbloquear();
  const c = contexto();
  const receita = SONS[nome];
  if (!c || !receita) return;
  const t = c.currentTime + 0.005;
  const min = MIN_INTERVALO[nome];
  if (min) {
    if (t - (ultimo.get(nome) ?? -1) < min) return;
    ultimo.set(nome, t);
  }
  receita(c, saidas().efeitos, t, opts);
}

export const NOMES_SONS = Object.keys(SONS);
