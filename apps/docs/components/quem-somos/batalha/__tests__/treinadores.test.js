// Aprendizes do Laboratório de ML (dados.js, TREINADORES): batalhas de
// aquecimento. Simula a 1ª tentativa com a mesma estratégia do teste de
// balanceamento (melhor golpe esperado + café/Stack Overflow).
// Rodar: npm run test:batalha (em apps/docs).

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { GOLPES, INICIAIS, LINGUAGENS, TREINADORES, multiplicadorTipo, oponentePorId } from "../dados.js";
import { criarLutador, iniciarBatalha, jogarTurno, mulberry32, oponenteAtual } from "../motor.js";

const BATALHAS = 300;
const TETO_TURNOS = 200;

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


function taxa(especieId, nivel, treinadorId, seed) {
  const rng = mulberry32(seed);
  let vitorias = 0;
  for (let i = 0; i < BATALHAS; i++) {
    let estado = iniciarBatalha(criarLutador(especieId, nivel), treinadorId);
    for (let t = 0; t < TETO_TURNOS && !estado.resultado; t++) estado = jogarTurno(estado, escolherAcao(estado), rng).estado;
    if (estado.resultado === "vitoria") vitorias += 1;
  }
  return vitorias / BATALHAS;
}

describe("aprendizes do Laboratório de ML", () => {
  it("dados válidos: time com criaturas existentes, sem Stack, cenário do laboratório", () => {
    for (const t of TREINADORES) {
      assert.equal(oponentePorId(t.id), t);
      assert.ok(t.treinador && !t.stack);
      assert.equal(t.cenario, "ml");
      for (const [id] of t.time) assert.ok(LINGUAGENS[id], id);
      for (const id of ["numpy", "matplotlib", "seaborn"]) {
        for (const [g] of LINGUAGENS[id].golpes) assert.ok(GOLPES[g], `${id}/${g}`);
      }
    }
  });

  for (const ini of INICIAIS) {
    it(`${ini}: dá para vencer no nível 8 (aquecimento antes da Mariana)`, () => {
      for (const [i, t] of TREINADORES.entries()) {
        const v = taxa(ini, 8, t.id, 1000 + i);
        assert.ok(v >= 0.5, `${t.id} vence só ${Math.round(v * 100)}%`);
      }
    });
  }
});
