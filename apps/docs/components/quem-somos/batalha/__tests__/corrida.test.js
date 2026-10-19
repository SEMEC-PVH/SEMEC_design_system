// Testes da corrida da Pista (funções puras e recorde de corrida.js).
// Rodar: npm run test:batalha (em apps/docs).

import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CHAVE_CORRIDA,
  METAS,
  assinarCorrida,
  formatarTempo,
  formatarTempoFalado,
  lerCorrida,
  lerRecorde,
  medalhaDe,
  normalizarCorrida,
  reiniciarCorrida,
  salvarResultado,
} from "../../corrida.js";

// ---- medalhaDe ---------------------------------------------------------------------
describe("medalhaDe", () => {
  it("metas em ordem: ouro < prata < bronze", () => {
    assert.ok(METAS.ouro < METAS.prata && METAS.prata < METAS.bronze);
  });

  it("limites inclusivos de cada medalha", () => {
    assert.equal(medalhaDe(METAS.ouro), "ouro");
    assert.equal(medalhaDe(METAS.ouro + 1), "prata");
    assert.equal(medalhaDe(METAS.prata), "prata");
    assert.equal(medalhaDe(METAS.prata + 1), "bronze");
    assert.equal(medalhaDe(METAS.bronze), "bronze");
    assert.equal(medalhaDe(METAS.bronze + 1), null);
    assert.equal(medalhaDe(1000), "ouro");
  });

  it("tempo inválido não ganha medalha", () => {
    for (const lixo of [0, -5, Number.NaN, Infinity, "40000", null, undefined]) {
      assert.equal(medalhaDe(lixo), null, `aceitou ${String(lixo)}`);
    }
  });

  it("aceita metas próprias", () => {
    assert.equal(medalhaDe(30000, { ouro: 20000, prata: 30000, bronze: 40000 }), "prata");
  });
});

// ---- formatarTempo / formatarTempoFalado ---------------------------------------------
describe("formatarTempo", () => {
  it("minutos, segundos com 2 dígitos e centésimos truncados", () => {
    assert.equal(formatarTempo(47329), "0:47.32");
    assert.equal(formatarTempo(65030), "1:05.03");
    assert.equal(formatarTempo(600000), "10:00.00");
    assert.equal(formatarTempo(9), "0:00.00");
    assert.equal(formatarTempo(59999), "0:59.99");
  });

  it("inválido vira zero", () => {
    for (const lixo of [-1, Number.NaN, undefined, null, "x"]) assert.equal(formatarTempo(lixo), "0:00.00");
  });
});

describe("formatarTempoFalado", () => {
  it("fala segundos e centésimos", () => {
    assert.equal(formatarTempoFalado(47320), "47 segundos e 32 centésimos");
  });
  it("singular e partes zeradas omitidas", () => {
    assert.equal(formatarTempoFalado(61000), "1 minuto e 1 segundo");
    assert.equal(formatarTempoFalado(60010), "1 minuto e 1 centésimo");
    assert.equal(formatarTempoFalado(125450), "2 minutos, 5 segundos e 45 centésimos");
    assert.equal(formatarTempoFalado(30000), "30 segundos");
    assert.equal(formatarTempoFalado(120000), "2 minutos");
    assert.equal(formatarTempoFalado(0), "0 segundos");
  });
});

// ---- normalizarCorrida ---------------------------------------------------------------
describe("normalizarCorrida", () => {
  it("lixo vira a corrida zerada", () => {
    for (const lixo of [undefined, null, 0, "texto", [], {}]) {
      assert.deepEqual(normalizarCorrida(lixo), { recorde: null, medalhas: { ouro: 0, prata: 0, bronze: 0 }, vezes: 0 });
    }
  });
  it("descarta campos adulterados", () => {
    const n = normalizarCorrida({ recorde: -3, medalhas: { ouro: 2.5, prata: "1", bronze: 4, lata: 9 }, vezes: -1 });
    assert.deepEqual(n, { recorde: null, medalhas: { ouro: 0, prata: 0, bronze: 4 }, vezes: 0 });
  });
});

// ---- Recorde no localStorage -----------------------------------------------------------
describe("recorde (localStorage simulado)", () => {
  let original;
  let dados;
  const instalar = (valor) =>
    Object.defineProperty(globalThis, "localStorage", { value: valor, configurable: true, writable: true });

  beforeEach(() => {
    original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    dados = new Map();
    instalar({
      getItem: (k) => (dados.has(k) ? dados.get(k) : null),
      setItem: (k, v) => dados.set(k, String(v)),
      removeItem: (k) => dados.delete(k),
    });
    reiniciarCorrida();
  });
  afterEach(() => {
    reiniciarCorrida();
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  });

  it("primeira corrida é recorde; medalha e contagem gravadas", () => {
    assert.equal(lerRecorde(), null);
    // Tempos relativos às metas (calibradas em corrida.js).
    const t = METAS.prata + 1000; // bronze
    const r = salvarResultado(t);
    assert.equal(r.novoRecorde, true);
    assert.equal(r.medalha, "bronze");
    assert.equal(r.ganhouStack, false);
    assert.equal(r.recordeAnterior, null);
    assert.equal(lerRecorde(), t);
    assert.deepEqual(JSON.parse(dados.get(CHAVE_CORRIDA)), {
      recorde: t,
      medalhas: { ouro: 0, prata: 0, bronze: 1 },
      vezes: 1,
    });
  });

  it("tempo pior não bate o recorde, mas conta a corrida", () => {
    const melhor = METAS.ouro + 2000; // prata
    salvarResultado(melhor);
    const r = salvarResultado(melhor + 2000); // prata, mais lento
    assert.equal(r.novoRecorde, false);
    assert.equal(r.recorde, melhor);
    assert.equal(lerCorrida().vezes, 2);
    assert.equal(lerCorrida().medalhas.prata, 2);
  });

  it("Stack do Pedal só no primeiro ouro", () => {
    assert.equal(salvarResultado(METAS.ouro).ganhouStack, true);
    const r2 = salvarResultado(METAS.ouro - 2000);
    assert.equal(r2.ganhouStack, false);
    assert.equal(r2.novoRecorde, true);
    assert.equal(lerCorrida().medalhas.ouro, 2);
  });

  it("tempo inválido não grava", () => {
    const r = salvarResultado(Number.NaN);
    assert.equal(r.novoRecorde, false);
    assert.equal(r.medalha, null);
    assert.equal(dados.has(CHAVE_CORRIDA), false);
  });

  it("lê o que já estava salvo (e ignora JSON quebrado)", () => {
    dados.set(CHAVE_CORRIDA, JSON.stringify({ recorde: 50123, medalhas: { prata: 1 }, vezes: 3 }));
    reiniciarCorridaSemApagar();
    assert.equal(lerRecorde(), 50123);
    assert.equal(lerCorrida().vezes, 3);
    dados.set(CHAVE_CORRIDA, "{quebrado");
    reiniciarCorridaSemApagar();
    assert.equal(lerRecorde(), null);
  });

  it("foto estável entre leituras e avisa quem assina", () => {
    let avisos = 0;
    const sair = assinarCorrida(() => avisos++);
    const a = lerCorrida();
    assert.equal(lerCorrida(), a);
    salvarResultado(70000);
    assert.notEqual(lerCorrida(), a);
    reiniciarCorrida();
    assert.equal(avisos, 2);
    sair();
    salvarResultado(70000);
    assert.equal(avisos, 2);
  });

  it("reiniciarCorrida apaga recorde e medalhas (Stack do Pedal volta a valer)", () => {
    salvarResultado(40000);
    reiniciarCorrida();
    assert.equal(dados.has(CHAVE_CORRIDA), false);
    assert.equal(lerRecorde(), null);
    assert.equal(salvarResultado(40000).ganhouStack, true);
  });

  it("sem armazenamento (aba privada), vale só nesta visita", () => {
    instalar({
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
      removeItem: () => {
        throw new Error("bloqueado");
      },
    });
    const r = salvarResultado(50000);
    assert.equal(r.novoRecorde, true);
    assert.equal(lerRecorde(), 50000);
    assert.equal(salvarResultado(52000).novoRecorde, false);
  });

  // Simula uma nova visita: zera a foto em memória (reiniciarCorrida) e
  // devolve ao armazenamento o que estava gravado.
  function reiniciarCorridaSemApagar() {
    const copia = new Map(dados);
    reiniciarCorrida();
    for (const [k, v] of copia) dados.set(k, v);
  }
});
