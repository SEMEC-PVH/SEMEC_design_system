// Testes do progresso da jornada (funções puras de progresso.js).
// Rodar: npm run test:batalha (em apps/docs).

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import { CHEFES, INICIAIS } from "../dados.js";
import { criarLutador, xpParaProximo } from "../motor.js";
import {
  CHAVE,
  NIVEL_INICIAL,
  aplicarResultado,
  chefeLiberado,
  curado,
  lerProgresso,
  normalizarProgresso,
  progressoInicial,
  salvarProgresso,
} from "../progresso.js";

const salvo = (extra = {}) => ({
  inicial: "python",
  jogador: { especieId: "python", nivel: 7, xp: 10 },
  vencidos: ["frontend"],
  ...extra,
});

// ---- normalizarProgresso -------------------------------------------------------------
describe("normalizarProgresso", () => {
  it("recusa lixo (null, número, string, array, objeto sem jogador)", () => {
    for (const lixo of [undefined, null, 0, 42, "texto", [], {}, { jogador: null }, { jogador: "python" }]) {
      assert.equal(normalizarProgresso(lixo), null, `aceitou ${JSON.stringify(lixo)}`);
    }
  });

  it("recusa espécie desconhecida ou herdada do protótipo", () => {
    for (const especieId of ["inexistente", "", undefined, "toString", "__proto__", "constructor"]) {
      assert.equal(normalizarProgresso(salvo({ jogador: { especieId, nivel: 5, xp: 0 } })), null);
    }
  });

  it("recria o lutador completo a partir de espécie, nível e XP", () => {
    const p = normalizarProgresso(salvo());
    assert.deepEqual(p.jogador, criarLutador("python", 7, 10));
    assert.equal(p.inicial, "python");
    assert.deepEqual(p.vencidos, ["frontend"]);
  });

  it("ignora campos extras e hp/golpes adulterados do jogador salvo", () => {
    const p = normalizarProgresso(salvo({ jogador: { especieId: "python", nivel: 7, xp: 10, hp: 9999, golpes: ["x"] } }));
    assert.deepEqual(p.jogador, criarLutador("python", 7, 10));
  });

  it("nível inválido volta ao NIVEL_INICIAL", () => {
    for (const nivel of [0, -3, 101, 5.5, "7", null, Number.NaN, Infinity]) {
      const p = normalizarProgresso(salvo({ jogador: { especieId: "java", nivel, xp: 0 } }));
      assert.equal(p.jogador.nivel, NIVEL_INICIAL, `nível ${nivel}`);
    }
  });

  it("XP inválida (negativa, não numérica ou acima do próximo nível) vira 0", () => {
    for (const xp of [-1, "10", null, Number.NaN, Infinity, xpParaProximo(7)]) {
      const p = normalizarProgresso(salvo({ jogador: { especieId: "python", nivel: 7, xp } }));
      assert.equal(p.jogador.xp, 0, `xp ${xp}`);
    }
  });

  it("vencidos: só ids de chefes reais, sem duplicar, na ordem dos ginásios", () => {
    const p = normalizarProgresso(salvo({ vencidos: ["backend", "frontend", "frontend", "hacker", 3, null] }));
    assert.deepEqual(p.vencidos, ["frontend", "backend"]);
  });

  it("vencidos que não são array viram []", () => {
    for (const vencidos of [undefined, null, "frontend", { 0: "frontend" }, 1]) {
      assert.deepEqual(normalizarProgresso(salvo({ vencidos })).vencidos, []);
    }
  });

  it("inicial fora das iniciais vira null, sem descartar o progresso", () => {
    const p = normalizarProgresso(salvo({ inicial: "cobol" })); // COBOL existe, mas não é inicial
    assert.equal(p.inicial, null);
    assert.equal(p.jogador.especieId, "python");
  });
});

// ---- lerProgresso / salvarProgresso --------------------------------------------------
describe("lerProgresso e salvarProgresso", () => {
  let original;
  let dados;
  const instalar = (valor) => {
    Object.defineProperty(globalThis, "localStorage", { value: valor, configurable: true, writable: true });
  };

  beforeEach(() => {
    original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    dados = new Map();
    instalar({
      getItem: (k) => (dados.has(k) ? dados.get(k) : null),
      setItem: (k, v) => dados.set(k, String(v)),
      removeItem: (k) => dados.delete(k),
    });
  });
  afterEach(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  });

  it("ida e volta: o que salva é o que lê (normalizado)", () => {
    const p = progressoInicial("javascript");
    salvarProgresso(p);
    assert.ok(dados.has(CHAVE));
    assert.deepEqual(lerProgresso(), p);
  });

  it("salvar null apaga a chave", () => {
    salvarProgresso(progressoInicial("java"));
    salvarProgresso(null);
    assert.equal(dados.has(CHAVE), false);
    assert.equal(lerProgresso(), null);
  });

  it("JSON quebrado ou lixo salvo devolve null", () => {
    dados.set(CHAVE, "{quebrado");
    assert.equal(lerProgresso(), null);
    dados.set(CHAVE, "42");
    assert.equal(lerProgresso(), null);
  });

  it("sem armazenamento (lança erro) não quebra", () => {
    const erro = () => {
      throw new Error("bloqueado");
    };
    instalar({ getItem: erro, setItem: erro, removeItem: erro });
    assert.equal(lerProgresso(), null);
    assert.doesNotThrow(() => salvarProgresso(progressoInicial("python")));
    assert.doesNotThrow(() => salvarProgresso(null));
  });
});

// ---- curado ------------------------------------------------------------------------
describe("curado", () => {
  it("enche a vida e zera os estágios sem mexer no original", () => {
    const l = { ...criarLutador("python", 8, 3), hp: 1, estagios: { atk: 2, def: -1 } };
    const c = curado(l);
    assert.equal(c.hp, c.maxHp);
    assert.deepEqual(c.estagios, { atk: 0, def: 0 });
    assert.equal(c.xp, 3);
    assert.equal(l.hp, 1);
    assert.deepEqual(l.estagios, { atk: 2, def: -1 });
  });
});

// ---- escolherInicial (progressoInicial) ----------------------------------------------------
describe("progressoInicial", () => {
  it("cria o lutador no NIVEL_INICIAL, com vencidos vazio", () => {
    for (const id of INICIAIS) {
      const p = progressoInicial(id);
      assert.equal(p.inicial, id);
      assert.deepEqual(p.jogador, criarLutador(id, NIVEL_INICIAL));
      assert.deepEqual(p.vencidos, []);
    }
  });

  it("recusa o que não é linguagem inicial", () => {
    for (const id of ["cobol", "inexistente", undefined, null, "toString"]) {
      assert.equal(progressoInicial(id), null);
    }
  });
});

// ---- liberado (chefeLiberado) -------------------------------------------------------
describe("chefeLiberado", () => {
  it("o primeiro ginásio (sem requer) está sempre liberado", () => {
    const primeiro = CHEFES.find((c) => !c.requer);
    assert.equal(chefeLiberado([], primeiro.id), true);
    assert.equal(chefeLiberado(undefined, primeiro.id), true);
  });

  it("cada chefe com requer só abre depois do anterior vencido", () => {
    for (const c of CHEFES.filter((x) => x.requer)) {
      assert.equal(chefeLiberado([], c.id), false, c.id);
      assert.equal(chefeLiberado([c.requer], c.id), true, c.id);
    }
  });

  it("chefe desconhecido nunca está liberado", () => {
    assert.equal(chefeLiberado(CHEFES.map((c) => c.id), "hacker"), false);
  });

  it("a diretoria exige o ginásio de dados", () => {
    assert.equal(chefeLiberado(["frontend", "backend"], "diretoria"), false);
    assert.equal(chefeLiberado(["frontend", "backend", "database"], "diretoria"), true);
  });
});

// ---- registrarResultado (aplicarResultado) -------------------------------------------------
describe("aplicarResultado", () => {
  const base = () => progressoInicial("python");
  const jogadorFerido = () => ({ ...criarLutador("python", 6, 12), hp: 3, estagios: { atk: 1, def: 0 } });

  it("vitória: adiciona o chefe aos vencidos e guarda o jogador curado", () => {
    const { progresso, venceu, zerou } = aplicarResultado(base(), "frontend", "vitoria", jogadorFerido());
    assert.equal(venceu, true);
    assert.equal(zerou, false);
    assert.deepEqual(progresso.vencidos, ["frontend"]);
    assert.equal(progresso.jogador.nivel, 6);
    assert.equal(progresso.jogador.xp, 12);
    assert.equal(progresso.jogador.hp, progresso.jogador.maxHp);
    assert.deepEqual(progresso.jogador.estagios, { atk: 0, def: 0 });
    assert.equal(progresso.inicial, "python");
  });

  it("revanche vencida não duplica o chefe", () => {
    const p = { ...base(), vencidos: ["frontend"] };
    const { progresso } = aplicarResultado(p, "frontend", "vitoria", jogadorFerido());
    assert.deepEqual(progresso.vencidos, ["frontend"]);
  });

  it("derrota e desistência mantêm a XP, sem adicionar vencidos", () => {
    for (const res of ["derrota", "desistiu"]) {
      const { progresso, venceu, zerou } = aplicarResultado(base(), "frontend", res, jogadorFerido());
      assert.equal(venceu, false, res);
      assert.equal(zerou, false, res);
      assert.deepEqual(progresso.vencidos, [], res);
      assert.equal(progresso.jogador.xp, 12, res);
      assert.equal(progresso.jogador.nivel, 6, res);
      assert.equal(progresso.jogador.hp, progresso.jogador.maxHp, res);
    }
  });

  it("vencer a diretoria zera o jogo; perder para ela não", () => {
    const p = { ...base(), vencidos: ["frontend", "backend", "database"] };
    const vitoria = aplicarResultado(p, "diretoria", "vitoria", jogadorFerido());
    assert.equal(vitoria.zerou, true);
    assert.deepEqual(vitoria.progresso.vencidos, ["frontend", "backend", "database", "diretoria"]);
    assert.equal(aplicarResultado(p, "diretoria", "derrota", jogadorFerido()).zerou, false);
  });

  it("não altera o progresso recebido", () => {
    const p = base();
    const copia = structuredClone(p);
    aplicarResultado(p, "frontend", "vitoria", jogadorFerido());
    assert.deepEqual(p, copia);
  });

  it("o resultado sobrevive a salvar e normalizar", () => {
    const { progresso } = aplicarResultado(base(), "frontend", "vitoria", jogadorFerido());
    assert.deepEqual(normalizarProgresso(JSON.parse(JSON.stringify(progresso))), progresso);
  });
});
