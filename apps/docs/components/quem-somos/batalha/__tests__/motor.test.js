// Testes do motor de batalhas da Vila SEMEC (runner nativo: node:test).
// Rodar: npm run test:batalha (em apps/docs).

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CHEFES,
  GOLPES,
  INICIAIS,
  ITENS,
  ITENS_POR_BATALHA,
  LINGUAGENS,
  MULT_DESVANTAGEM,
  MULT_VANTAGEM,
  TIPOS,
  VANTAGEM,
  multiplicadorTipo,
} from "../dados.js";
import {
  calcularDano,
  criarLutador,
  ganharXp,
  iniciarBatalha,
  jogarTurno,
  mulberry32,
  oponenteAtual,
  xpParaProximo,
} from "../motor.js";

// rng que devolve sempre o mesmo valor.
const fixo = (v) => () => v;
// rng que devolve a sequência dada (e repete o último valor).
const sequencia = (...valores) => {
  let i = 0;
  return () => valores[Math.min(i++, valores.length - 1)];
};

const NIVEL_INICIAL = 5;

// ---- 1. multiplicadorTipo ----------------------------------------------------------
describe("multiplicadorTipo", () => {
  it("o ciclo Front > Back > Dados > Front vale MULT_VANTAGEM", () => {
    assert.equal(multiplicadorTipo("front", "back"), MULT_VANTAGEM);
    assert.equal(multiplicadorTipo("back", "dados"), MULT_VANTAGEM);
    assert.equal(multiplicadorTipo("dados", "front"), MULT_VANTAGEM);
  });

  it("o inverso do ciclo vale MULT_DESVANTAGEM", () => {
    assert.equal(multiplicadorTipo("back", "front"), MULT_DESVANTAGEM);
    assert.equal(multiplicadorTipo("dados", "back"), MULT_DESVANTAGEM);
    assert.equal(multiplicadorTipo("front", "dados"), MULT_DESVANTAGEM);
  });

  it("basico vale sempre 1 (atacando ou defendendo)", () => {
    for (const t of Object.keys(TIPOS)) {
      assert.equal(multiplicadorTipo("basico", t), 1);
      assert.equal(multiplicadorTipo(t, "basico"), 1);
    }
  });

  it("mesmo tipo vale 1", () => {
    for (const t of Object.keys(TIPOS)) assert.equal(multiplicadorTipo(t, t), 1);
  });

  it("VANTAGEM é um ciclo fechado entre front, back e dados", () => {
    assert.deepEqual(new Set(Object.keys(VANTAGEM)), new Set(Object.values(VANTAGEM)));
    assert.equal(VANTAGEM[VANTAGEM[VANTAGEM.front]], "front");
  });
});

// ---- 2. Integridade dos dados ------------------------------------------------------
describe("integridade dos dados", () => {
  it("todo golpe usado nas linguagens existe em GOLPES", () => {
    for (const [id, l] of Object.entries(LINGUAGENS)) {
      for (const [golpeId, nivel] of l.golpes) {
        assert.ok(GOLPES[golpeId], `${id} usa golpe inexistente: ${golpeId}`);
        assert.ok(Number.isInteger(nivel) && nivel >= 1, `${id}/${golpeId}: nível inválido`);
      }
    }
  });

  it("todo golpe tem tipo válido, poder ≥ 0 e precisão entre 1 e 100", () => {
    for (const [id, g] of Object.entries(GOLPES)) {
      assert.ok(TIPOS[g.tipo], `${id}: tipo inválido ${g.tipo}`);
      assert.ok(g.poder >= 0, `${id}: poder negativo`);
      assert.ok(g.precisao > 0 && g.precisao <= 100, `${id}: precisão inválida`);
    }
  });

  it("golpes de poder 0 têm efeito válido", () => {
    for (const [id, g] of Object.entries(GOLPES)) {
      if (g.poder !== 0) continue;
      assert.ok(g.efeito, `${id}: golpe de efeito sem efeito`);
      assert.ok(["eu", "oponente"].includes(g.efeito.alvo), `${id}: alvo inválido`);
      assert.ok(["atk", "def"].includes(g.efeito.stat), `${id}: stat inválido`);
      assert.ok(Number.isInteger(g.efeito.estagios) && g.efeito.estagios !== 0, `${id}: estágios inválidos`);
    }
  });

  it("toda linguagem tem tipo válido e toda evolução aponta para linguagem existente", () => {
    for (const [id, l] of Object.entries(LINGUAGENS)) {
      assert.ok(TIPOS[l.tipo], `${id}: tipo inválido`);
      if (l.evolui) {
        assert.ok(LINGUAGENS[l.evolui.para], `${id} evolui para inexistente: ${l.evolui.para}`);
        assert.ok(l.evolui.nivel > NIVEL_INICIAL, `${id}: evolui antes do nível inicial`);
      }
    }
  });

  it("INICIAIS existem", () => {
    assert.ok(INICIAIS.length > 0);
    for (const id of INICIAIS) assert.ok(LINGUAGENS[id], `inicial inexistente: ${id}`);
  });

  it("todo chefe tem time com linguagens existentes", () => {
    for (const c of CHEFES) {
      assert.ok(c.time.length > 0, `${c.id}: time vazio`);
      for (const [id, nivel] of c.time) {
        assert.ok(LINGUAGENS[id], `${c.id} usa linguagem inexistente: ${id}`);
        assert.ok(nivel >= 1);
      }
    }
  });

  it("os requisitos formam a cadeia frontend → backend → database → diretoria", () => {
    assert.deepEqual(
      CHEFES.map((c) => c.id),
      ["frontend", "backend", "database", "diretoria"]
    );
    assert.equal(CHEFES[0].requer, undefined);
    for (let i = 1; i < CHEFES.length; i++) assert.equal(CHEFES[i].requer, CHEFES[i - 1].id);
  });

  it("toda linguagem tem no máximo 4 golpes disponíveis no nível em que aparece", () => {
    const niveis = {};
    for (const id of INICIAIS) (niveis[id] ??= []).push(NIVEL_INICIAL);
    for (const l of Object.values(LINGUAGENS)) {
      if (l.evolui) (niveis[l.evolui.para] ??= []).push(l.evolui.nivel);
    }
    for (const c of CHEFES) for (const [id, nivel] of c.time) (niveis[id] ??= []).push(nivel);

    for (const [id, l] of Object.entries(LINGUAGENS)) {
      for (const nivel of niveis[id] ?? [100]) {
        const disponiveis = l.golpes.filter(([, n]) => n <= nivel);
        assert.ok(disponiveis.length >= 1, `${id} sem golpes no nível ${nivel}`);
        assert.ok(disponiveis.length <= 4, `${id} tem ${disponiveis.length} golpes no nível ${nivel}`);
      }
    }
  });

  it("itens da batalha existem e curam algo", () => {
    for (const [id, qtd] of Object.entries(ITENS_POR_BATALHA)) {
      assert.ok(ITENS[id], `item inexistente: ${id}`);
      assert.ok(ITENS[id].cura > 0);
      assert.ok(qtd > 0);
    }
  });
});

// ---- 3. criarLutador ---------------------------------------------------------------
describe("criarLutador", () => {
  it("nasce com vida cheia, XP informado e estágios zerados", () => {
    const l = criarLutador("python", NIVEL_INICIAL, 7);
    assert.equal(l.hp, l.maxHp);
    assert.equal(l.xp, 7);
    assert.equal(l.nivel, NIVEL_INICIAL);
    assert.deepEqual(l.estagios, { atk: 0, def: 0 });
    assert.equal(l.nome, "Python");
    assert.equal(l.tipo, "dados");
  });

  it("stats crescem (ou se mantêm) com o nível", () => {
    for (const id of Object.keys(LINGUAGENS)) {
      const baixo = criarLutador(id, 5);
      const alto = criarLutador(id, 20);
      for (const s of ["maxHp", "atk", "def", "spd"]) {
        assert.ok(alto[s] > baixo[s], `${id}.${s}: ${baixo[s]} → ${alto[s]}`);
      }
    }
  });

  it("nunca tem mais de 4 golpes", () => {
    for (const id of Object.keys(LINGUAGENS)) {
      for (const nivel of [1, 5, 10, 50, 100]) {
        const l = criarLutador(id, nivel);
        assert.ok(l.golpes.length <= 4 && l.golpes.length >= 1);
      }
    }
  });
});

// ---- 4. calcularDano ---------------------------------------------------------------
describe("calcularDano", () => {
  const semCritico = () => sequencia(0.5, 0.5); // crítico não; variação fixa.

  it("dano é no mínimo 1, mesmo no pior cenário", () => {
    const fraco = criarLutador("css", 1);
    const forte = criarLutador("cobol", 100);
    forte.estagios.def = 4;
    const golpe = { tipo: "dados", poder: 1, precisao: 100 }; // dados × back = desvantagem
    const { dano, mult } = calcularDano(fraco, forte, golpe, fixo(0.99));
    assert.equal(mult, MULT_DESVANTAGEM);
    assert.ok(dano >= 1);
  });

  it("STAB: golpe do mesmo tipo do atacante causa mais que golpe básico de mesmo poder", () => {
    const js = criarLutador("javascript", 10);
    const alvo = { ...criarLutador("react", 10) }; // front × front = neutro
    const comStab = calcularDano(js, alvo, { tipo: "front", poder: 60, precisao: 100 }, semCritico());
    const semStab = calcularDano(js, alvo, { tipo: "basico", poder: 60, precisao: 100 }, semCritico());
    assert.equal(comStab.mult, 1);
    assert.ok(comStab.dano > semStab.dano, `${comStab.dano} > ${semStab.dano}`);
  });

  it("vantagem de tipo aumenta o dano; desvantagem diminui", () => {
    const java = criarLutador("java", 10);
    const alvo = criarLutador("sql", 10);
    const golpe = { tipo: "front", poder: 75, precisao: 100 };
    const contra = (tipo) => calcularDano(java, { ...alvo, tipo }, golpe, semCritico());
    const vant = contra("back");
    const neutro = contra("front");
    const desv = contra("dados");
    assert.equal(vant.mult, MULT_VANTAGEM);
    assert.equal(desv.mult, MULT_DESVANTAGEM);
    assert.ok(vant.dano > neutro.dano);
    assert.ok(desv.dano < neutro.dano);
  });

  it("crítico com rng forçado (< 1/16) aumenta o dano", () => {
    const a = criarLutador("kotlin", 12);
    const d = criarLutador("php", 12);
    const golpe = GOLPES.coroutines;
    const normal = calcularDano(a, d, golpe, sequencia(0.5, 0.5));
    const crit = calcularDano(a, d, golpe, sequencia(0, 0.5));
    assert.equal(normal.critico, false);
    assert.equal(crit.critico, true);
    assert.ok(crit.dano > normal.dano);
  });

  it("estágios de ataque e defesa alteram o dano", () => {
    const a = criarLutador("anaconda", 12);
    const d = criarLutador("mongodb", 12);
    const golpe = GOLPES.machineLearning;
    const base = calcularDano(a, d, golpe, semCritico()).dano;
    const atkUp = calcularDano({ ...a, estagios: { atk: 2, def: 0 } }, d, golpe, semCritico()).dano;
    const defUp = calcularDano(a, { ...d, estagios: { atk: 0, def: 2 } }, golpe, semCritico()).dano;
    assert.ok(atkUp > base);
    assert.ok(defUp < base);
  });
});

// ---- 5. jogarTurno -----------------------------------------------------------------
describe("jogarTurno", () => {
  const novaBatalha = (especie = "javascript", nivel = NIVEL_INICIAL, chefe = "frontend") =>
    iniciarBatalha(criarLutador(especie, nivel), chefe);

  it("iniciarBatalha monta o time do chefe, itens e não compartilha o jogador", () => {
    const jogador = criarLutador("java", NIVEL_INICIAL);
    const estado = iniciarBatalha(jogador, "backend");
    assert.deepEqual(estado.time.map((l) => [l.especieId, l.nivel]), [["php", 5], ["node", 6]]);
    assert.deepEqual(estado.itens, ITENS_POR_BATALHA);
    assert.notEqual(estado.itens, ITENS_POR_BATALHA);
    assert.notEqual(estado.jogador, jogador);
    assert.equal(estado.atual, 0);
    assert.equal(estado.resultado, null);
    assert.equal(oponenteAtual(estado).especieId, "php");
  });

  it("golpe que erra (rng alto) gera o evento 'errou'", () => {
    const estado = novaBatalha("javascript");
    const { eventos } = jogarTurno(estado, { tipo: "golpe", id: "promise" }, fixo(0.99));
    const erro = eventos.find((e) => e.tipo === "errou");
    assert.ok(erro, "esperava evento errou");
    assert.equal(erro.lado, "jogador");
    // O golpe que errou não causa dano no oponente.
    assert.ok(!eventos.some((e) => e.tipo === "dano" && e.lado === "oponente"));
  });

  it("golpe de efeito sobe o estágio", () => {
    const estado = novaBatalha("typescript", 10);
    const { estado: novo, eventos } = jogarTurno(estado, { tipo: "golpe", id: "tipagem" }, fixo(0.5));
    assert.equal(novo.jogador.estagios.def, 1);
    assert.ok(eventos.some((e) => e.tipo === "estagio" && e.lado === "jogador" && e.stat === "def"));
  });

  it("golpe de efeito respeita o limite +4 ('Não teve efeito')", () => {
    const estado = novaBatalha("typescript", 10);
    estado.jogador.estagios.def = 4;
    const { estado: novo, eventos } = jogarTurno(estado, { tipo: "golpe", id: "tipagem" }, fixo(0.5));
    assert.equal(novo.jogador.estagios.def, 4);
    assert.ok(eventos.some((e) => e.tipo === "texto" && e.texto.startsWith("Não teve efeito")));
  });

  it("golpe de efeito no oponente respeita o limite −4", () => {
    // Figma (Diretoria) usa "Reunião de Alinhamento" (atk −1 no alvo).
    const estado = novaBatalha("kotlin", 30, "diretoria");
    estado.jogador.estagios.atk = -4;
    // rng: 0 → a IA sorteia (0 < 0.25); o 2º valor escolhe o índice de "reuniao".
    const figma = oponenteAtual(estado);
    const idx = figma.golpes.indexOf("reuniao");
    assert.ok(idx >= 0);
    const rng = sequencia(0, (idx + 0.5) / figma.golpes.length, 0.5);
    const { estado: novo, eventos } = jogarTurno(estado, { tipo: "golpe", id: "tryCatch" }, rng);
    assert.ok(eventos.some((e) => e.tipo === "golpe" && e.lado === "oponente" && e.golpeId === "reuniao"));
    assert.equal(novo.jogador.estagios.atk, -4);
    assert.ok(eventos.some((e) => e.tipo === "texto" && e.texto.startsWith("Não teve efeito")));
  });

  it("café cura até no máximo maxHp e decrementa o estoque", () => {
    const estado = novaBatalha("java", 20);
    estado.jogador.hp = estado.jogador.maxHp - 10; // café cura 25: deve parar no máximo
    const { estado: novo, eventos } = jogarTurno(estado, { tipo: "item", id: "cafe" }, fixo(0.99));
    const cura = eventos.find((e) => e.tipo === "cura");
    assert.ok(cura);
    assert.equal(cura.valor, 10);
    assert.equal(cura.hp, estado.jogador.maxHp);
    assert.equal(novo.itens.cafe, ITENS_POR_BATALHA.cafe - 1);
    // Depois de usar o item, o oponente ainda ataca.
    assert.ok(eventos.some((e) => e.tipo === "golpe" && e.lado === "oponente"));
  });

  it("café cura exatamente 25 quando há espaço", () => {
    const estado = novaBatalha("java", 20);
    estado.jogador.hp = 5;
    const { eventos } = jogarTurno(estado, { tipo: "item", id: "cafe" }, fixo(0.99));
    assert.equal(eventos.find((e) => e.tipo === "cura").valor, ITENS.cafe.cura);
  });

  it("item sem estoque (ou inexistente) não faz nada", () => {
    const estado = novaBatalha("java");
    estado.jogador.hp = 5;
    estado.itens.cafe = 0;
    const r1 = jogarTurno(estado, { tipo: "item", id: "cafe" }, fixo(0.5));
    assert.deepEqual(r1.eventos, []);
    assert.deepEqual(r1.estado, estado);
    const r2 = jogarTurno(estado, { tipo: "item", id: "naoExiste" }, fixo(0.5));
    assert.deepEqual(r2.eventos, []);
    assert.deepEqual(r2.estado, estado);
  });

  it("item com a vida cheia é recusado: não gasta o item nem passa a vez", () => {
    const estado = novaBatalha("java");
    const { estado: novo, eventos } = jogarTurno(estado, { tipo: "item", id: "cafe" }, fixo(0.5));
    assert.equal(novo.itens.cafe, ITENS_POR_BATALHA.cafe);
    assert.equal(novo.jogador.hp, estado.jogador.hp);
    assert.ok(!eventos.some((e) => e.tipo === "golpe" && e.lado === "oponente"));
    assert.ok(eventos.some((e) => e.tipo === "texto" && e.texto.includes("já está cheia")));
  });

  it("'desistir' encerra com resultado 'desistiu'", () => {
    const estado = novaBatalha();
    const { estado: novo, eventos } = jogarTurno(estado, { tipo: "desistir" }, fixo(0.5));
    assert.equal(novo.resultado, "desistiu");
    assert.deepEqual(eventos.at(-1), { tipo: "fim", resultado: "desistiu" });
  });

  it("batalha encerrada não processa mais turnos", () => {
    const estado = novaBatalha();
    estado.resultado = "vitoria";
    const { estado: novo, eventos } = jogarTurno(estado, { tipo: "golpe", id: "dom" }, fixo(0.5));
    assert.deepEqual(eventos, []);
    assert.deepEqual(novo, estado);
  });

  it("prioridade: Arrow Function age antes de um oponente mais rápido", () => {
    const estado = novaBatalha("typescript", 8);
    estado.jogador.spd = 1;
    estado.time[0].spd = 999;
    const comPrio = jogarTurno(estado, { tipo: "golpe", id: "arrowFunction" }, fixo(0.5)).eventos;
    assert.equal(comPrio.find((e) => e.tipo === "golpe").lado, "jogador");
    // Controle: sem prioridade, o mais rápido age primeiro.
    const semPrio = jogarTurno(estado, { tipo: "golpe", id: "generics" }, fixo(0.5)).eventos;
    assert.equal(semPrio.find((e) => e.tipo === "golpe").lado, "oponente");
  });

  it("oponente que desmaia gera 'desmaio' + 'xp' e o próximo entra (sem atacar no mesmo turno)", () => {
    const estado = novaBatalha("javascript", 10);
    estado.jogador.spd = 999;
    estado.time[0].hp = 1;
    const { estado: novo, eventos } = jogarTurno(estado, { tipo: "golpe", id: "dom" }, fixo(0.5));
    const tipos = eventos.map((e) => e.tipo);
    const iDesmaio = tipos.indexOf("desmaio");
    assert.ok(iDesmaio >= 0);
    assert.equal(eventos[iDesmaio].lado, "oponente");
    assert.ok(tipos.indexOf("xp") > iDesmaio);
    assert.ok(tipos.indexOf("entra") > tipos.indexOf("xp"));
    assert.equal(novo.atual, 1);
    assert.equal(novo.resultado, null);
    assert.ok(!eventos.some((e) => e.tipo === "golpe" && e.lado === "oponente"));
    assert.ok(novo.jogador.xp > 0 || novo.jogador.nivel > 10);
  });

  it("derrotar o último oponente gera 'fim' com 'vitoria'", () => {
    const estado = novaBatalha("javascript", 10);
    estado.jogador.spd = 999;
    estado.atual = estado.time.length - 1;
    estado.time[estado.atual].hp = 1;
    const { estado: novo, eventos } = jogarTurno(estado, { tipo: "golpe", id: "dom" }, fixo(0.5));
    assert.equal(novo.resultado, "vitoria");
    assert.deepEqual(eventos.at(-1), { tipo: "fim", resultado: "vitoria" });
    assert.ok(!eventos.some((e) => e.tipo === "entra"));
  });

  it("derrota do jogador gera resultado 'derrota'", () => {
    const estado = novaBatalha("javascript");
    estado.jogador.hp = 1;
    estado.jogador.spd = 1;
    estado.time[0].spd = 999;
    const { estado: novo, eventos } = jogarTurno(estado, { tipo: "golpe", id: "dom" }, fixo(0.5));
    assert.equal(novo.resultado, "derrota");
    assert.equal(novo.jogador.hp, 0);
    assert.ok(eventos.some((e) => e.tipo === "desmaio" && e.lado === "jogador"));
    assert.deepEqual(eventos.at(-1), { tipo: "fim", resultado: "derrota" });
    // Quem desmaiou não ataca.
    assert.ok(!eventos.some((e) => e.tipo === "golpe" && e.lado === "jogador"));
  });

  it("é puro: não muta o estado de entrada", () => {
    const acoes = [
      { tipo: "golpe", id: "dom" },
      { tipo: "golpe", id: "promise" },
      { tipo: "item", id: "cafe" },
      { tipo: "item", id: "stackOverflow" },
      { tipo: "desistir" },
    ];
    for (const acao of acoes) {
      const estado = novaBatalha("javascript", 7);
      estado.jogador.hp = 3;
      estado.time[0].hp = 1; // força desmaio, XP e subida de nível
      const copia = structuredClone(estado);
      jogarTurno(estado, acao, mulberry32(42));
      assert.deepEqual(estado, copia, `estado mutado por ${JSON.stringify(acao)}`);
    }
  });

  it("é determinístico com a mesma semente", () => {
    const estado = novaBatalha("python");
    const a = jogarTurno(estado, { tipo: "golpe", id: "dataFrame" }, mulberry32(7));
    const b = jogarTurno(estado, { tipo: "golpe", id: "dataFrame" }, mulberry32(7));
    assert.deepEqual(a, b);
  });
});

// ---- 6. ganharXp -------------------------------------------------------------------
describe("ganharXp", () => {
  it("xpParaProximo cresce com o nível", () => {
    assert.equal(xpParaProximo(5), 125);
    assert.ok(xpParaProximo(6) > xpParaProximo(5));
  });

  it("XP abaixo do necessário não sobe de nível", () => {
    const l = criarLutador("python", 5);
    const eventos = [];
    ganharXp(l, 10, eventos);
    assert.equal(l.nivel, 5);
    assert.equal(l.xp, 10);
    assert.deepEqual(eventos.map((e) => e.tipo), ["xp"]);
  });

  it("sobe de nível guardando a sobra de XP e recalcula stats", () => {
    const l = criarLutador("python", 5);
    const eventos = [];
    ganharXp(l, xpParaProximo(5) + 7, eventos);
    assert.equal(l.nivel, 6);
    assert.equal(l.xp, 7);
    const ref = criarLutador("python", 6);
    for (const s of ["maxHp", "atk", "def", "spd"]) assert.equal(l[s], ref[s]);
    assert.ok(eventos.some((e) => e.tipo === "nivel" && e.nivel === 6));
  });

  it("sobe vários níveis de uma vez", () => {
    const l = criarLutador("java", 5);
    const eventos = [];
    ganharXp(l, xpParaProximo(5) + xpParaProximo(6) + 3, eventos);
    assert.equal(l.nivel, 7);
    assert.equal(l.xp, 3);
    assert.equal(eventos.filter((e) => e.tipo === "nivel").length, 2);
  });

  it("evolui no nível de evolui.nivel (JavaScript → TypeScript) mantendo a proporção de vida", () => {
    const especie = LINGUAGENS.javascript;
    const nivelAntes = especie.evolui.nivel - 1;
    const l = criarLutador("javascript", nivelAntes);
    l.hp = Math.round(l.maxHp / 2);
    const proporcao = l.hp / l.maxHp;
    const eventos = [];
    ganharXp(l, xpParaProximo(nivelAntes), eventos);

    const ts = criarLutador("typescript", especie.evolui.nivel);
    assert.equal(l.nivel, especie.evolui.nivel);
    assert.equal(l.especieId, "typescript");
    assert.equal(l.nome, "TypeScript");
    assert.equal(l.sigla, "TS");
    assert.equal(l.tipo, "front");
    assert.deepEqual(l.golpes, ts.golpes);
    for (const s of ["maxHp", "atk", "def", "spd"]) assert.equal(l[s], ts[s]);
    assert.equal(l.hp, Math.round(l.maxHp * proporcao));
    const evo = eventos.find((e) => e.tipo === "evolucao");
    assert.deepEqual([evo.de, evo.para], ["JavaScript", "TypeScript"]);
  });

  it("todos os iniciais evoluem no nível certo", () => {
    for (const id of INICIAIS) {
      const { evolui } = LINGUAGENS[id];
      const l = criarLutador(id, evolui.nivel - 1);
      ganharXp(l, xpParaProximo(evolui.nivel - 1), []);
      assert.equal(l.especieId, evolui.para);
      // Vida cheia continua cheia depois de evoluir.
      assert.equal(l.hp, l.maxHp);
    }
  });

  it("vida nunca cai para 0 ao subir de nível", () => {
    const l = criarLutador("python", 5);
    l.hp = 1;
    ganharXp(l, xpParaProximo(5), []);
    assert.ok(l.hp >= 1);
  });
});

// ---- mulberry32 --------------------------------------------------------------------
describe("mulberry32", () => {
  it("é reprodutível e devolve valores em [0, 1)", () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    for (let i = 0; i < 1000; i++) {
      const v = a();
      assert.equal(v, b());
      assert.ok(v >= 0 && v < 1);
    }
  });
});
