// Época "futuro": Vila SEMEC 2030 em clima cyberpunk — noite roxa, neon ciano e
// magenta em tudo, hologramas, drones e carros voadores. Cada elemento da
// cidade é um módulo em futuro/ com o mesmo contrato:
//
//   createX(ctx) -> { setProgress(k), update(t, dt, k) }
//   ctx = { scene, pal, track, tileToWorld, buildings, makeLabel, reducedMotion,
//           dayNight, cores, kit }   (cores: futuro/cores.js; kit: ../comum.js)
//   setProgress(k): k=0 = Vila de hoje EXATAMENTE como era; 1 = época pronta.
//     Determinístico (a volta ao presente roda k de 1 para 0).
//   update(t, dt, k): só movimento contínuo; roda a cada quadro com k > 0,
//     DEPOIS do dayNight.update e ANTES de a luz ser aplicada (lighting.update),
//     por isso a atmosfera pode reescrever dayNight.state aqui.
//
// A construção dura ~5,5 s (cenas.js, CONSTRUCAO). Janelas de k por módulo:
//   atmosfera   0,00–0,40  a noite cyberpunk cai; luzes acompanham o neon
//   megatorre   0,00–0,65  torre nova erguida pelo guindaste
//   rua         0,08–0,55  chão molhado, faixas neon, postes, vapor
//   predios     0,30–0,80  os prédios atuais ganham neon, telões e antenas
//   hologramas  0,55–0,92  letreiros e hologramas ligam
//   trafego     0,72–1,00  drones e carros voadores entram
//
// Depuração: window.__futuroSolo = "rua" mostra só esse módulo na prévia.
import { createKit } from "../comum";
import { createCores } from "./cores";
import { createAtmosfera } from "./atmosfera";
import { createPredios } from "./predios";
import { createMegatorre } from "./megatorre";
import { createHologramas } from "./hologramas";
import { createTrafego } from "./trafego";
import { createRua } from "./rua";

const MODULOS = {
  atmosfera: createAtmosfera,
  megatorre: createMegatorre,
  rua: createRua,
  predios: createPredios,
  hologramas: createHologramas,
  trafego: createTrafego,
};

export function createFuturo(ctx) {
  const base = { ...ctx, cores: createCores(ctx.pal), kit: createKit(ctx) };
  const mods = [];
  for (const [nome, criar] of Object.entries(MODULOS)) {
    // Um módulo com erro não derruba a cena: fica de fora e avisa no console.
    try {
      mods.push({ nome, m: criar(base) });
    } catch (e) {
      console.error(`[futuro] módulo ${nome} falhou ao criar`, e);
    }
  }
  const solo = () => (typeof window !== "undefined" ? window.__futuroSolo : null) || null;
  const kDe = (nome, k) => (solo() && solo() !== nome && nome !== "atmosfera" ? 0 : k);

  function setProgress(k) {
    for (const { nome, m } of mods) m.setProgress(kDe(nome, k));
  }
  function update(t, dt, k) {
    for (const { nome, m } of mods) {
      const kk = kDe(nome, k);
      if (kk > 0) m.update(t, dt, kk);
    }
  }
  return { setProgress, update };
}
