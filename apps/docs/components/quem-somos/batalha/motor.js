// Motor das batalhas: lógica pura, sem React nem DOM.
//
// O estado é um objeto simples; jogarTurno() devolve o novo estado e a lista
// de EVENTOS do turno (textos, dano, desmaio, nível, evolução…), que a UI
// apresenta um a um. O sorteio vem de fora (rng), para testes reprodutíveis.

import { CHEFES, GOLPES, ITENS, ITENS_POR_BATALHA, LINGUAGENS, TIPOS, multiplicadorTipo } from "./dados.js";

const ESTAGIO_MAX = 4;
const CHANCE_CRITICO = 1 / 16;
// Ganho de experiência por adversário vencido = nível dele × XP_POR_NIVEL.
const XP_POR_NIVEL = 35;

export const xpParaProximo = (nivel) => nivel * 25;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Lutadores ------------------------------------------------------------------
function calcularStats(especie, nivel) {
  const b = especie.base;
  const s = (v) => Math.floor((v * 2 * nivel) / 50) + 5;
  return {
    maxHp: Math.floor((b.hp * 2 * nivel) / 50) + nivel + 10,
    atk: s(b.atk),
    def: s(b.def),
    spd: s(b.spd),
  };
}

function golpesPara(especie, nivel) {
  return especie.golpes
    .filter(([, n]) => n <= nivel)
    .map(([id]) => id)
    .slice(-4);
}

export function criarLutador(especieId, nivel, xp = 0) {
  const especie = LINGUAGENS[especieId];
  const stats = calcularStats(especie, nivel);
  return {
    especieId,
    nome: especie.nome,
    sigla: especie.sigla,
    tipo: especie.tipo,
    nivel,
    xp,
    ...stats,
    hp: stats.maxHp,
    golpes: golpesPara(especie, nivel),
    estagios: { atk: 0, def: 0 },
  };
}

const fatorEstagio = (s) => (s >= 0 ? (2 + s) / 2 : 2 / (2 - s));

// ---- Dano -----------------------------------------------------------------------
export function calcularDano(atacante, defensor, golpe, rng) {
  const atk = atacante.atk * fatorEstagio(atacante.estagios.atk);
  const def = defensor.def * fatorEstagio(defensor.estagios.def);
  const base = Math.floor(Math.floor(((2 * atacante.nivel) / 5 + 2) * golpe.poder * (atk / def)) / 50) + 2;
  const stab = golpe.tipo === atacante.tipo ? 1.5 : 1;
  const mult = multiplicadorTipo(golpe.tipo, defensor.tipo);
  const critico = rng() < CHANCE_CRITICO;
  const variacao = 0.85 + rng() * 0.15;
  const dano = Math.max(1, Math.floor(base * stab * mult * (critico ? 1.5 : 1) * variacao));
  return { dano, mult, critico };
}

// ---- Batalha --------------------------------------------------------------------
export function iniciarBatalha(jogador, chefeId) {
  const chefe = CHEFES.find((c) => c.id === chefeId);
  return {
    chefeId,
    jogador: structuredClone(jogador),
    time: chefe.time.map(([id, nivel]) => criarLutador(id, nivel)),
    atual: 0,
    itens: { ...ITENS_POR_BATALHA },
    resultado: null, // "vitoria" | "derrota" | "desistiu"
  };
}

export const oponenteAtual = (estado) => estado.time[estado.atual];

// Escolha do adversário: o golpe de maior dano esperado, com 25% de acaso.
export function escolherGolpeIA(eu, alvo, rng) {
  if (rng() < 0.25) return eu.golpes[Math.floor(rng() * eu.golpes.length)];
  let melhor = eu.golpes[0];
  let valorMelhor = -1;
  for (const id of eu.golpes) {
    const g = GOLPES[id];
    let valor;
    if (g.poder > 0) {
      const stab = g.tipo === eu.tipo ? 1.5 : 1;
      valor = g.poder * stab * multiplicadorTipo(g.tipo, alvo.tipo) * (g.precisao / 100);
    } else {
      const quem = g.efeito.alvo === "eu" ? eu : alvo;
      const estagio = quem.estagios[g.efeito.stat];
      const util = g.efeito.estagios > 0 ? estagio < 2 : estagio > -2;
      valor = util ? 45 : 0;
    }
    if (valor > valorMelhor) {
      valorMelhor = valor;
      melhor = id;
    }
  }
  return melhor;
}

function textoEfetividade(mult) {
  if (mult > 1) return "Foi super efetivo!";
  if (mult < 1) return "Não foi muito efetivo…";
  return null;
}

// Executa um golpe e devolve os eventos. lado: "jogador" | "oponente" (quem ataca).
function executarGolpe(estado, lado, golpeId, rng, eventos) {
  const atacante = lado === "jogador" ? estado.jogador : oponenteAtual(estado);
  const defensor = lado === "jogador" ? oponenteAtual(estado) : estado.jogador;
  const alvoLado = lado === "jogador" ? "oponente" : "jogador";
  const golpe = GOLPES[golpeId];
  eventos.push({ tipo: "golpe", lado, golpeId, texto: `${atacante.nome} usou ${golpe.nome}!` });

  if (rng() * 100 >= golpe.precisao) {
    eventos.push({ tipo: "errou", lado, texto: `Mas errou! (${golpe.nome} não é 100% garantido.)` });
    return;
  }

  if (golpe.poder === 0) {
    const quem = golpe.efeito.alvo === "eu" ? atacante : defensor;
    const quemLado = golpe.efeito.alvo === "eu" ? lado : alvoLado;
    const antes = quem.estagios[golpe.efeito.stat];
    const depois = Math.max(-ESTAGIO_MAX, Math.min(ESTAGIO_MAX, antes + golpe.efeito.estagios));
    const stat = golpe.efeito.stat === "atk" ? "ataque" : "defesa";
    if (depois === antes) {
      eventos.push({ tipo: "texto", texto: `Não teve efeito: a ${stat} de ${quem.nome} já está no limite.` });
      return;
    }
    quem.estagios[golpe.efeito.stat] = depois;
    const verbo = depois > antes ? "aumentou" : "diminuiu";
    eventos.push({ tipo: "estagio", lado: quemLado, stat: golpe.efeito.stat, texto: `A ${stat} de ${quem.nome} ${verbo}!` });
    return;
  }

  const { dano, mult, critico } = calcularDano(atacante, defensor, golpe, rng);
  defensor.hp = Math.max(0, defensor.hp - dano);
  eventos.push({ tipo: "dano", lado: alvoLado, valor: dano, hp: defensor.hp, maxHp: defensor.maxHp, mult, critico });
  if (critico) eventos.push({ tipo: "texto", texto: "Acerto crítico!" });
  const efet = textoEfetividade(mult);
  if (efet) eventos.push({ tipo: "texto", texto: efet });
}

// XP, subida de nível e evolução do jogador.
export function ganharXp(lutador, quantidade, eventos) {
  lutador.xp += quantidade;
  eventos.push({ tipo: "xp", valor: quantidade, texto: `${lutador.nome} ganhou ${quantidade} de experiência.` });
  while (lutador.xp >= xpParaProximo(lutador.nivel)) {
    lutador.xp -= xpParaProximo(lutador.nivel);
    lutador.nivel += 1;
    const proporcao = lutador.hp / lutador.maxHp;
    const especie = LINGUAGENS[lutador.especieId];
    Object.assign(lutador, calcularStats(especie, lutador.nivel));
    lutador.hp = Math.max(1, Math.round(lutador.maxHp * proporcao));
    eventos.push({ tipo: "nivel", nivel: lutador.nivel, texto: `${lutador.nome} subiu para o nível ${lutador.nivel}!` });

    if (especie.evolui && lutador.nivel >= especie.evolui.nivel) {
      const de = lutador.nome;
      const nova = LINGUAGENS[especie.evolui.para];
      lutador.especieId = especie.evolui.para;
      lutador.nome = nova.nome;
      lutador.sigla = nova.sigla;
      lutador.tipo = nova.tipo;
      Object.assign(lutador, calcularStats(nova, lutador.nivel));
      lutador.hp = Math.max(1, Math.round(lutador.maxHp * proporcao));
      lutador.golpes = golpesPara(nova, lutador.nivel);
      eventos.push({ tipo: "evolucao", de, para: nova.nome, texto: `O quê?! ${de} evoluiu para ${nova.nome}!` });
    }
  }
}

function checarDesmaios(estado, eventos) {
  const op = oponenteAtual(estado);
  if (op.hp <= 0) {
    eventos.push({ tipo: "desmaio", lado: "oponente", texto: `${op.nome} foi derrotado!` });
    ganharXp(estado.jogador, op.nivel * XP_POR_NIVEL, eventos);
    if (estado.atual < estado.time.length - 1) {
      estado.atual += 1;
      const prox = oponenteAtual(estado);
      eventos.push({ tipo: "entra", texto: `O adversário chamou ${prox.nome} (nível ${prox.nivel})!` });
    } else {
      estado.resultado = "vitoria";
      eventos.push({ tipo: "fim", resultado: "vitoria" });
    }
    return true;
  }
  if (estado.jogador.hp <= 0) {
    eventos.push({ tipo: "desmaio", lado: "jogador", texto: `${estado.jogador.nome} ficou sem energia…` });
    estado.resultado = "derrota";
    eventos.push({ tipo: "fim", resultado: "derrota" });
    return true;
  }
  return false;
}

const prioridade = (golpeId) => GOLPES[golpeId].prioridade ?? 0;

// acao: { tipo: "golpe", id } | { tipo: "item", id } | { tipo: "desistir" }
export function jogarTurno(estadoAnterior, acao, rng = Math.random) {
  const estado = structuredClone(estadoAnterior);
  const eventos = [];
  if (estado.resultado) return { estado, eventos };

  if (acao.tipo === "desistir") {
    estado.resultado = "desistiu";
    eventos.push({ tipo: "texto", texto: "Você saiu da batalha. Dá para tentar de novo quando quiser!" });
    eventos.push({ tipo: "fim", resultado: "desistiu" });
    return { estado, eventos };
  }

  const golpeOponente = escolherGolpeIA(oponenteAtual(estado), estado.jogador, rng);

  if (acao.tipo === "item") {
    const item = ITENS[acao.id];
    if (!item || !estado.itens[acao.id]) return { estado, eventos };
    // Vida cheia: recusa sem gastar o item nem passar a vez.
    if (estado.jogador.hp >= estado.jogador.maxHp) {
      eventos.push({ tipo: "texto", texto: `A vida de ${estado.jogador.nome} já está cheia.` });
      return { estado, eventos };
    }
    estado.itens[acao.id] -= 1;
    const antes = estado.jogador.hp;
    estado.jogador.hp = Math.min(estado.jogador.maxHp, antes + item.cura);
    eventos.push({ tipo: "cura", lado: "jogador", valor: estado.jogador.hp - antes, hp: estado.jogador.hp, maxHp: estado.jogador.maxHp, texto: `Você usou ${item.nome}! ${estado.jogador.nome} recuperou ${estado.jogador.hp - antes} de vida.` });
    executarGolpe(estado, "oponente", golpeOponente, rng, eventos);
    checarDesmaios(estado, eventos);
    return { estado, eventos };
  }

  // Ordem do turno: prioridade do golpe, depois velocidade, depois sorte.
  const pj = prioridade(acao.id);
  const po = prioridade(golpeOponente);
  const spdJ = estado.jogador.spd;
  const spdO = oponenteAtual(estado).spd;
  const jogadorPrimeiro = pj !== po ? pj > po : spdJ !== spdO ? spdJ > spdO : rng() < 0.5;
  const ordem = jogadorPrimeiro
    ? [["jogador", acao.id], ["oponente", golpeOponente]]
    : [["oponente", golpeOponente], ["jogador", acao.id]];

  const oponenteDoTurno = estado.atual;
  for (const [lado, golpeId] of ordem) {
    // Se o oponente do turno caiu, o próximo só entra no turno seguinte.
    if (lado === "oponente" && estado.atual !== oponenteDoTurno) break;
    executarGolpe(estado, lado, golpeId, rng, eventos);
    if (checarDesmaios(estado, eventos)) break;
  }
  return { estado, eventos };
}

// Texto curto do tipo, para a UI.
export const nomeTipo = (tipo) => TIPOS[tipo]?.nome ?? tipo;
