// Testes das quests de coleta do Zé Carlos e da Emily (funções puras de
// quests-coleta.js). Rodar: npm run test:batalha (em apps/docs).

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { IDS_COLETA, QUESTS_COLETA, objetivoColeta, questDoNpc, transicao } from "../../quests-coleta.js";

const NOVA = { etapa: "nova", itens: [] };

describe("transicao", () => {
  const q = QUESTS_COLETA.paginas;

  it("aceitar só vale na etapa nova", () => {
    assert.deepEqual(transicao(q, NOVA, { tipo: "aceitar" }), { etapa: "coletando", itens: [] });
    const pronta = { etapa: "pronta", itens: ["p1", "p2", "p3", "p4"] };
    assert.equal(transicao(q, pronta, { tipo: "aceitar" }), pronta);
  });

  it("coleta cada item uma vez e fica pronta no último", () => {
    let e = transicao(q, NOVA, { tipo: "aceitar" });
    e = transicao(q, e, { tipo: "coletar", item: "p1" });
    assert.equal(transicao(q, e, { tipo: "coletar", item: "p1" }), e);
    for (const item of ["p2", "p3"]) e = transicao(q, e, { tipo: "coletar", item });
    assert.equal(e.etapa, "coletando");
    e = transicao(q, e, { tipo: "coletar", item: "p4" });
    assert.deepEqual(e, { etapa: "pronta", itens: ["p1", "p2", "p3", "p4"] });
  });

  it("ignora item desconhecido e coleta fora da etapa", () => {
    const coletando = { etapa: "coletando", itens: [] };
    assert.equal(transicao(q, coletando, { tipo: "coletar", item: "p9" }), coletando);
    assert.equal(transicao(q, NOVA, { tipo: "coletar", item: "p1" }), NOVA);
  });

  it("concluir só depois de pronta; reiniciar sempre volta ao início", () => {
    const coletando = { etapa: "coletando", itens: ["p1"] };
    assert.equal(transicao(q, coletando, { tipo: "concluir" }), coletando);
    const pronta = { etapa: "pronta", itens: ["p1", "p2", "p3", "p4"] };
    assert.equal(transicao(q, pronta, { tipo: "concluir" }).etapa, "concluida");
    assert.deepEqual(transicao(q, pronta, { tipo: "reiniciar" }), NOVA);
  });

  it("mini game da Emily: vencer só jogando, e só no mini game", () => {
    const c = QUESTS_COLETA.campanha;
    let e = transicao(c, NOVA, { tipo: "aceitar" });
    assert.equal(transicao(c, NOVA, { tipo: "vencer" }), NOVA);
    e = transicao(c, e, { tipo: "vencer" });
    assert.equal(e.etapa, "pronta");
    assert.equal(transicao(c, e, { tipo: "concluir" }).etapa, "concluida");
    const jogando = { etapa: "coletando", itens: [] };
    assert.equal(transicao(q, jogando, { tipo: "vencer" }), jogando);
  });
});

describe("dados das quests", () => {
  it("cada quest pertence a um personagem diferente", () => {
    assert.equal(questDoNpc("ze-carlos"), "paginas");
    assert.equal(questDoNpc("emily"), "campanha");
    assert.equal(questDoNpc("pedro"), null);
  });

  it("itens em tiles diferentes e ids únicos", () => {
    const tiles = new Set();
    for (const id of IDS_COLETA) {
      const ids = QUESTS_COLETA[id].itens.map((i) => i.id);
      assert.equal(new Set(ids).size, ids.length);
      for (const i of QUESTS_COLETA[id].itens) {
        const k = `${i.x},${i.y}`;
        assert.ok(!tiles.has(k), `tile repetido ${k}`);
        tiles.add(k);
      }
    }
  });

  it("toda pergunta do Zé tem resposta certa válida e explicação", () => {
    for (const p of QUESTS_COLETA.paginas.itens) {
      assert.ok(p.opcoes.length >= 2);
      assert.ok(p.certa >= 0 && p.certa < p.opcoes.length);
      assert.ok(p.explicacao.length > 0);
    }
  });

  it("objetivo mostra a contagem durante a coleta", () => {
    const q = QUESTS_COLETA.paginas;
    assert.match(objetivoColeta(q, { etapa: "coletando", itens: ["p1"] }), /\(1\/4\)/);
    assert.equal(objetivoColeta(q, NOVA), q.objetivo.nova);
  });
});

describe("mini game Campanha da SEMEC (campanha/dados.js)", async () => {
  const { ESTRELAS_PARA_VENCER, MAX_PONTOS, PASSOS, RODADAS, engajamento, estrelas } = await import("../../campanha/dados.js");

  it("cada passo tem uma única opção ótima e a soma ótima é o máximo", () => {
    for (const r of RODADAS) {
      assert.deepEqual(
        r.passos.map((p) => p.id),
        PASSOS
      );
      let melhor = 0;
      for (const p of r.passos) {
        assert.equal(p.opcoes.filter((o) => o.pontos === 2).length, 1, `${r.id}/${p.id}`);
        assert.ok(p.opcoes.every((o) => o.porque.length > 0));
        melhor += Math.max(...p.opcoes.map((o) => o.pontos));
      }
      assert.equal(melhor, MAX_PONTOS);
    }
  });

  it("estrelas e vitória coerentes", () => {
    assert.equal(estrelas(MAX_PONTOS), 3);
    assert.equal(estrelas(0), 1);
    assert.ok(ESTRELAS_PARA_VENCER <= RODADAS.length * 3);
    const r = RODADAS[0];
    assert.ok(engajamento(r, MAX_PONTOS).curtidas > engajamento(r, 3).curtidas);
  });
});
