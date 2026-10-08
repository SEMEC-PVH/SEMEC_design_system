// Teste de regressão do balanceamento da Vila SEMEC.
//
// Simula 300 campanhas por linguagem inicial com uma estratégia simples (mas
// sensata) e garante faixas mínimas de taxa de vitória por chefe. Se mexer nos
// dados (stats, golpes, times), rode e confira a tabela impressa.

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { CHEFES, GOLPES, INICIAIS, multiplicadorTipo } from "../dados.js";
import { criarLutador, iniciarBatalha, jogarTurno, mulberry32, oponenteAtual } from "../motor.js";

const CAMPANHAS = 300;
const TENTATIVAS_POR_CHEFE = 5;
const TETO_TURNOS = 200;
const NIVEL_INICIAL = 5;

// Faixas mínimas (taxa de vitória por tentativa).
const MIN_PRIMEIRO_GINASIO = 0.75;
const MIN_POR_CHEFE = 0.35;
const MIN_CAMPANHA_COMPLETA = 0.85;

function valorGolpe(jogador, alvo, id) {
  const g = GOLPES[id];
  if (g.poder === 0) {
    const quem = g.efeito.alvo === "eu" ? jogador : alvo;
    const estagio = quem.estagios[g.efeito.stat];
    return estagio < 1 && jogador.hp > 0.7 * jogador.maxHp ? 70 : 0;
  }
  const stab = g.tipo === jogador.tipo ? 1.5 : 1;
  return g.poder * stab * multiplicadorTipo(g.tipo, alvo.tipo) * (g.precisao / 100);
}

function escolherAcao(estado) {
  const j = estado.jogador;
  const fracao = j.hp / j.maxHp;
  if (fracao < 0.2 && estado.itens.stackOverflow > 0) return { tipo: "item", id: "stackOverflow" };
  if (fracao < 0.4 && estado.itens.cafe > 0) return { tipo: "item", id: "cafe" };
  const alvo = oponenteAtual(estado);
  let melhor = j.golpes[0];
  let valorMelhor = -Infinity;
  for (const id of j.golpes) {
    const v = valorGolpe(j, alvo, id);
    if (v > valorMelhor) {
      valorMelhor = v;
      melhor = id;
    }
  }
  return { tipo: "golpe", id: melhor };
}

function simular(inicial) {
  const porChefe = Object.fromEntries(CHEFES.map((c) => [c.id, { vitorias: 0, tentativas: 0 }]));
  let completas = 0;

  for (let r = 0; r < CAMPANHAS; r++) {
    const rng = mulberry32(1000 + r);
    let jogador = criarLutador(inicial, NIVEL_INICIAL);
    let zerou = true;

    for (const chefe of CHEFES) {
      let venceu = false;
      for (let t = 0; t < TENTATIVAS_POR_CHEFE && !venceu; t++) {
        porChefe[chefe.id].tentativas += 1;
        jogador = { ...jogador, hp: jogador.maxHp, estagios: { atk: 0, def: 0 } };
        let estado = iniciarBatalha(jogador, chefe.id);
        for (let turno = 0; turno < TETO_TURNOS && !estado.resultado; turno++) {
          estado = jogarTurno(estado, escolherAcao(estado), rng).estado;
        }
        // O XP ganho (mesmo numa derrota) fica com o jogador, como na Vila.
        jogador = estado.jogador;
        if (estado.resultado === "vitoria") {
          porChefe[chefe.id].vitorias += 1;
          venceu = true;
        }
      }
      if (!venceu) {
        zerou = false;
        break;
      }
    }
    if (zerou) completas += 1;
  }

  const taxas = Object.fromEntries(
    Object.entries(porChefe).map(([id, { vitorias, tentativas }]) => [id, tentativas ? vitorias / tentativas : null])
  );
  return { taxas, porChefe, completas: completas / CAMPANHAS };
}

const pct = (v) => (v === null ? "  –" : `${Math.round(v * 100)}%`.padStart(4));

describe(`balanceamento (${CAMPANHAS} campanhas por inicial)`, () => {
  const resultados = Object.fromEntries(INICIAIS.map((id) => [id, simular(id)]));

  // Tabela para documentação.
  const cab = ["inicial".padEnd(11), ...CHEFES.map((c) => c.id.padStart(9)), "zerou".padStart(7)].join(" ");
  const linhas = INICIAIS.map((id) => {
    const { taxas, completas } = resultados[id];
    return [id.padEnd(11), ...CHEFES.map((c) => pct(taxas[c.id]).padStart(9)), pct(completas).padStart(7)].join(" ");
  });
  console.log(`\nTaxa de vitória por tentativa (até ${TENTATIVAS_POR_CHEFE} tentativas por chefe):\n${cab}\n${linhas.join("\n")}\n`);

  for (const id of INICIAIS) {
    describe(id, () => {
      const { taxas, completas } = resultados[id];

      it(`vence o 1º ginásio (frontend) em ≥ ${MIN_PRIMEIRO_GINASIO * 100}% das tentativas`, () => {
        assert.ok(taxas.frontend >= MIN_PRIMEIRO_GINASIO, `frontend: ${pct(taxas.frontend)}`);
      });

      it(`vence cada chefe em ≥ ${MIN_POR_CHEFE * 100}% das tentativas`, () => {
        for (const c of CHEFES) {
          assert.notEqual(taxas[c.id], null, `${c.id}: nenhuma tentativa`);
          assert.ok(taxas[c.id] >= MIN_POR_CHEFE, `${c.id}: ${pct(taxas[c.id])}`);
        }
      });

      it(`chega ao fim (vence a Diretoria) em ≥ ${MIN_CAMPANHA_COMPLETA * 100}% das campanhas`, () => {
        assert.ok(completas >= MIN_CAMPANHA_COMPLETA, `zerou: ${pct(completas)}`);
      });
    });
  }
});
