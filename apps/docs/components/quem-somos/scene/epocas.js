// Épocas da Vila SEMEC, mostradas na cena da ocarina do Pedro (cenas.js,
// cenaOcarina). Cada época é um módulo em scene/epocas/ com o mesmo contrato
// (ver o cabeçalho de qualquer um deles):
//
//   "festa"   futuro: estátua do Design System e fogos (epocas/festa.js)
//   "futuro"  futuro: Vila 2030 — neon, drones, carros voadores (epocas/futuro.js)
//   "passado" antes da tecnologia: os prédios de tecnologia se desmontam e
//             viram obras (epocas/passado.js); o tom sépia é CSS
//   null      a Vila de hoje.
//
// A troca não é instantânea: set(nome, { dur }) leva o progresso da época de
// 0 a 1 em `dur` segundos (as coisas vão sendo construídas, ou desmontadas no
// passado) e set(null, { dur }) roda de volta de 1 a 0.
//
// createEpocas(ctx) -> { set(nome, { dur }), update(t, dt), preview(nome, k) }

import { createFesta } from "./epocas/festa";
import { createFuturo } from "./epocas/futuro";
import { createPassado } from "./epocas/passado";

export function createEpocas(ctx) {
  const mods = { festa: createFesta(ctx), futuro: createFuturo(ctx), passado: createPassado(ctx) };
  let atual = null;
  let k = 0;
  let anim = null; // { from, to, t, dur }

  function aplicar() {
    for (const [nome, m] of Object.entries(mods)) m.setProgress(nome === atual ? k : 0);
  }

  function set(nome, { dur = 0 } = {}) {
    const rapido = dur <= 0 || ctx.reducedMotion;
    if (nome) {
      if (atual && atual !== nome) {
        k = 0;
        aplicar();
      }
      atual = nome;
      if (rapido) {
        anim = null;
        k = 1;
      } else anim = { from: k, to: 1, t: 0, dur };
    } else if (atual) {
      if (rapido) {
        anim = null;
        k = 0;
      } else anim = { from: k, to: 0, t: 0, dur };
    }
    aplicar();
    if (!nome && rapido) atual = null;
  }

  function update(t, dt) {
    if (anim) {
      anim.t += dt;
      const u = Math.min(anim.t / anim.dur, 1);
      k = anim.from + (anim.to - anim.from) * u;
      aplicar();
      if (u >= 1) {
        anim = null;
        if (k === 0) atual = null;
      }
    }
    if (atual && k > 0) mods[atual].update(t, dt, k);
  }

  // Depuração (prints): mostra uma época num progresso fixo.
  function preview(nome, valor) {
    anim = null;
    atual = nome;
    k = valor;
    aplicar();
  }

  return { set, update, preview };
}
