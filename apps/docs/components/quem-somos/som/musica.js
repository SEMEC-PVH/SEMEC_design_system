// Trilha da Vila SEMEC: chiptune composto aqui mesmo e tocado por um
// sequenciador Web Audio (som.js tem o mixer). Quatro vozes por faixa:
//   melodia  pulso 25% (o "8-bit" clássico), com leve vibrato;
//   baixo    triângulo, tônica e oitava em colcheias;
//   arpejo   pulso 12,5% bem baixinho, acorde em semicolcheias;
//   bateria  bumbo (seno que despenca), caixa (ruído) e chimbal (tic agudo).
// Faixas: "titulo", "vila", "predio" e "batalha"; trocar faz crossfade de
// ~1,2 s e a nova entra no começo de um compasso.
//
// Notação de cada compasso: `acorde` (notas do acorde, a 1ª é a tônica do
// baixo) e `mel` com 8 colcheias: nota ("E5"), "." (segura a anterior) ou
// "-" (pausa). O agendador olha 0,12 s à frente (setInterval de 25 ms), o
// padrão de jogos na Web Audio: o tempo vem do relógio do áudio, não do JS.
import { contexto, hz, musicaLigada, pulso, ruido, saidas } from "./som";

const C = (acorde, mel) => ({ acorde, mel: mel.split(" ") });

const FAIXAS = {
  // Vila: Dó maior, alegre, 112 bpm, A + B (16 compassos).
  vila: {
    bpm: 112,
    bateria: "leve",
    compassos: [
      C(["C3", "E4", "G4", "C5"], "E5 . G5 . A5 G5 E5 ."),
      C(["A2", "C4", "E4", "A4"], "C5 . E5 . G5 . A5 ."),
      C(["F2", "A3", "C4", "F4"], "A5 . C6 . A5 G5 F5 ."),
      C(["G2", "B3", "D4", "G4"], "G5 . . . D5 E5 F5 G5"),
      C(["C3", "E4", "G4", "C5"], "E5 . G5 . C6 . B5 A5"),
      C(["A2", "C4", "E4", "A4"], "G5 . E5 . C5 . E5 ."),
      C(["F2", "A3", "C4", "F4"], "F5 . A5 . G5 . B5 D6"),
      C(["C3", "E4", "G4", "C5"], "C6 . . . - - G5 ."),
      C(["F2", "A3", "C4", "F4"], "A5 . A5 C6 . A5 G5 ."),
      C(["C3", "E4", "G4", "C5"], "G5 . E5 . C5 . E5 G5"),
      C(["F2", "A3", "C4", "F4"], "A5 . C6 . D6 . C6 A5"),
      C(["G2", "B3", "D4", "G4"], "G5 . . . B5 . D6 ."),
      C(["E2", "G3", "B3", "E4"], "B5 . G5 . E5 . G5 ."),
      C(["A2", "C4", "E4", "A4"], "C6 . A5 . E5 . A5 ."),
      C(["D3", "F3", "A3", "D4"], "F5 . A5 . G5 . B5 ."),
      C(["C3", "E4", "G4", "C5"], "C6 . G5 . E5 . C5 ."),
    ],
  },
  // Tela de título: a melodia da Vila mais calma, sem bateria.
  titulo: { bpm: 96, bateria: null, de: "vila" },
  // Dentro dos prédios: lo-fi tranquilo, Lá menor com sétimas, 84 bpm.
  predio: {
    bpm: 84,
    bateria: "lofi",
    suave: true,
    compassos: [
      C(["A2", "C4", "E4", "G4"], "E5 . . . G5 . E5 ."),
      C(["D2", "F3", "A3", "C4"], "F5 . . . A5 . . ."),
      C(["G2", "B3", "D4", "F4"], "D5 . . . F5 . D5 B4"),
      C(["C3", "E4", "G4", "B4"], "C5 . . . - - - -"),
      C(["A2", "C4", "E4", "G4"], "A5 . G5 . E5 . . ."),
      C(["D2", "F3", "A3", "C4"], "F5 . E5 . D5 . . ."),
      C(["G2", "B3", "D4", "F4"], "B4 . D5 . F5 . G5 ."),
      C(["C3", "E4", "G4", "B4"], "E5 . . . - - - -"),
    ],
  },
  // Batalha: Lá menor, 148 bpm, bateria cheia.
  batalha: {
    bpm: 148,
    bateria: "cheia",
    compassos: [
      C(["A2", "C4", "E4", "A4"], "A5 . C6 . E6 . C6 ."),
      C(["F2", "A3", "C4", "F4"], "F5 . A5 . C6 . A5 ."),
      C(["G2", "B3", "D4", "G4"], "G5 . B5 . D6 . B5 ."),
      C(["E2", "G#3", "B3", "E4"], "E5 . G#5 . B5 . . ."),
      C(["A2", "C4", "E4", "A4"], "E6 . D6 C6 B5 . A5 ."),
      C(["F2", "A3", "C4", "F4"], "C6 . B5 A5 G5 . F5 ."),
      C(["G2", "B3", "D4", "G4"], "D6 . C6 B5 A5 . G5 ."),
      C(["E2", "G#3", "B3", "E4"], "B5 . . . E6 . . ."),
    ],
  },
};

// ---- Instrumentos ------------------------------------------------------------
function nota(c, saida, t, f, dur, { forma, vol, ataque = 0.006, liberacao = 0.08, filtro, vibrato = 0 }) {
  const o = c.createOscillator();
  if (typeof forma === "number") o.setPeriodicWave(pulso(forma));
  else o.type = forma;
  o.frequency.setValueAtTime(f, t);
  if (vibrato) {
    // Vibrato que entra devagar nas notas longas (o "canto" do chip).
    const lfo = c.createOscillator();
    lfo.frequency.value = 5.5;
    const prof = c.createGain();
    prof.gain.setValueAtTime(0, t);
    prof.gain.linearRampToValueAtTime(f * vibrato, t + Math.min(dur, 0.6));
    lfo.connect(prof).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + dur + liberacao + 0.05);
  }
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + ataque);
  g.gain.setTargetAtTime(vol * 0.7, t + ataque, dur * 0.4);
  g.gain.setTargetAtTime(0.0001, t + dur, liberacao / 3);
  let ult = o;
  if (filtro) {
    const fl = c.createBiquadFilter();
    fl.type = "lowpass";
    fl.frequency.value = filtro;
    o.connect(fl);
    ult = fl;
  }
  ult.connect(g).connect(saida);
  o.start(t);
  o.stop(t + dur + liberacao + 0.1);
}

function bumbo(c, saida, t, vol) {
  const o = c.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(saida);
  o.start(t);
  o.stop(t + 0.2);
}
function chiado(c, saida, t, { dur, vol, tipo, f }) {
  const s = c.createBufferSource();
  s.buffer = ruido();
  const fl = c.createBiquadFilter();
  fl.type = tipo;
  fl.frequency.value = f;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl).connect(g).connect(saida);
  s.start(t, Math.random() * 0.8);
  s.stop(t + dur + 0.02);
}

// ---- Sequenciador ---------------------------------------------------------------
let atual = null; // { nome, faixa, saida, passo, proximo, compasso }
let pedida = null;
let relogio = 0;

const faixaDe = (nome) => {
  const f = FAIXAS[nome];
  if (!f) return null;
  return f.de ? { ...FAIXAS[f.de], ...f, compassos: FAIXAS[f.de].compassos } : f;
};

// Agenda um compasso inteiro (8 colcheias) a partir de `t`.
function agendarCompasso(c, a, t) {
  const f = a.faixa;
  const colcheia = 60 / f.bpm / 2;
  const comp = f.compassos[a.compasso % f.compassos.length];
  const s = a.saida;
  const suave = f.suave;
  // Melodia (com "." segurando a nota).
  comp.mel.forEach((n, i) => {
    if (n === "." || n === "-") return;
    let dur = 1;
    while (comp.mel[i + dur] === ".") dur++;
    nota(c, s, t + i * colcheia, hz(n), dur * colcheia * 0.92, {
      forma: suave ? "triangle" : 0.25,
      vol: suave ? 0.16 : 0.1,
      filtro: suave ? 2200 : 3600,
      vibrato: dur >= 3 ? 0.006 : 0,
    });
  });
  // Baixo: tônica e oitava em colcheias (no lo-fi, semínimas).
  const raiz = hz(comp.acorde[0]);
  for (let i = 0; i < 8; i += suave ? 2 : 1) {
    const f0 = i % 4 === 2 && !suave ? raiz * 2 : raiz;
    nota(c, s, t + i * colcheia, f0, colcheia * (suave ? 1.8 : 0.8), { forma: "triangle", vol: suave ? 0.2 : 0.17, liberacao: 0.04 });
  }
  // Arpejo do acorde em semicolcheias (no lo-fi, acorde parado e macio).
  if (suave) {
    for (const n of comp.acorde.slice(1)) nota(c, s, t, hz(n), colcheia * 7.5, { forma: "sine", vol: 0.045, ataque: 0.25, liberacao: 0.6 });
  } else {
    const tons = comp.acorde.slice(1);
    for (let i = 0; i < 16; i++) {
      nota(c, s, t + (i * colcheia) / 2, hz(tons[i % tons.length]) * 2, colcheia * 0.35, { forma: 0.125, vol: 0.028, liberacao: 0.03, filtro: 5000 });
    }
  }
  // Bateria.
  const b = f.bateria;
  if (b) {
    for (let i = 0; i < 8; i++) {
      const ti = t + i * colcheia;
      if (b === "cheia" ? i % 2 === 0 : i % 4 === 0) bumbo(c, s, ti, b === "lofi" ? 0.22 : 0.3);
      if (i % 4 === 2) chiado(c, s, ti, { dur: b === "lofi" ? 0.12 : 0.1, vol: b === "lofi" ? 0.05 : 0.08, tipo: "bandpass", f: 1800 });
      chiado(c, s, ti, { dur: 0.03, vol: b === "cheia" ? 0.035 : 0.022, tipo: "highpass", f: 7000 });
      if (b === "cheia") chiado(c, s, ti + colcheia / 2, { dur: 0.025, vol: 0.022, tipo: "highpass", f: 8000 });
    }
  }
  return t + 8 * colcheia;
}

function agendar() {
  const c = contexto();
  if (!c || !musicaLigada()) return;
  // Troca pedida: a nova entra no próximo compasso, a velha esmaece.
  if (pedida !== (atual?.nome ?? null)) {
    const t0 = atual ? atual.proximo : c.currentTime + 0.08;
    if (atual) {
      atual.saida.gain.setTargetAtTime(0.0001, t0 - 0.2, 0.35);
      const velha = atual.saida;
      setTimeout(() => velha.disconnect(), 3000);
    }
    atual = null;
    const faixa = pedida && faixaDe(pedida);
    if (faixa) {
      const saida = c.createGain();
      saida.gain.setValueAtTime(0.0001, t0);
      saida.gain.linearRampToValueAtTime(1, t0 + 1.2);
      saida.connect(saidas().musica);
      atual = { nome: pedida, faixa, saida, compasso: 0, proximo: Math.max(t0, c.currentTime + 0.05) };
    }
  }
  if (!atual) return;
  // Voltou de uma pausa (aba escondida, música desligada): retoma de agora,
  // sem tentar "recuperar" os compassos perdidos de uma vez.
  if (atual.proximo < c.currentTime) atual.proximo = c.currentTime + 0.05;
  while (atual.proximo < c.currentTime + 0.12 + 60 / atual.faixa.bpm * 4) {
    // Agenda um compasso de cada vez (~2 s à frente no máximo).
    atual.proximo = agendarCompasso(c, atual, atual.proximo);
    atual.compasso++;
  }
}

// Pede a faixa (ou null para silêncio). Pode ser chamada à vontade: só troca
// quando muda.
export function tocarMusica(nome) {
  pedida = nome && FAIXAS[nome] ? nome : null;
  if (!relogio && typeof window !== "undefined") relogio = setInterval(agendar, 25);
  agendar();
}

// Desligou a música (ou o som): para o que estava agendado.
export function pararMusica() {
  if (atual) {
    try {
      atual.saida.disconnect();
    } catch {
      // já desconectada
    }
  }
  atual = null;
}

export const FAIXAS_MUSICA = Object.keys(FAIXAS);
