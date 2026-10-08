// Progresso da jornada das batalhas (linguagem escolhida, lutador e chefes
// vencidos), salvo só neste navegador (localStorage).
//
// As funções puras (normalizarProgresso, progressoInicial, chefeLiberado,
// aplicarResultado) não dependem de React nem do DOM e são testadas com o
// node:test. O hook useProgresso() junta tudo para a
// Vila 3D; os componentes que o usam são client-only.

import { useCallback, useEffect, useRef, useState } from "react";
import { CHEFES, INICIAIS, LINGUAGENS } from "./dados.js";
import { criarLutador, xpParaProximo } from "./motor.js";

export const CHAVE = "vila-semec-jornada-v1";
export const NIVEL_INICIAL = 5;

// Chefe cuja vitória encerra a jornada ("Você é FULL STACK!").
const CHEFE_FINAL = "diretoria";

// Progresso salvo só neste navegador (conveniência; pode vir vazio, de uma
// versão antiga ou editado à mão). O lutador é recriado a partir de espécie,
// nível e XP, para nunca entrar na batalha com campos faltando.
export function normalizarProgresso(p) {
  const j = p?.jogador;
  if (!j || typeof j !== "object" || !Object.hasOwn(LINGUAGENS, j.especieId)) return null;
  const nivel = Number.isInteger(j.nivel) && j.nivel >= 1 && j.nivel <= 100 ? j.nivel : NIVEL_INICIAL;
  const xp = Number.isFinite(j.xp) && j.xp >= 0 && j.xp < xpParaProximo(nivel) ? j.xp : 0;
  const ids = CHEFES.map((c) => c.id);
  const vencidos = Array.isArray(p.vencidos) ? ids.filter((id) => p.vencidos.includes(id)) : [];
  const inicial = INICIAIS.includes(p.inicial) ? p.inicial : null;
  return { inicial, jogador: criarLutador(j.especieId, nivel, xp), vencidos };
}

export function lerProgresso() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto ? normalizarProgresso(JSON.parse(bruto)) : null;
  } catch {
    return null;
  }
}

export function salvarProgresso(p) {
  try {
    if (p) localStorage.setItem(CHAVE, JSON.stringify(p));
    else localStorage.removeItem(CHAVE);
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): o jogo segue sem salvar.
  }
}

// Lutador pronto para a próxima batalha: vida cheia e sem estágios.
export const curado = (lutador) => ({ ...lutador, hp: lutador.maxHp, estagios: { atk: 0, def: 0 } });

// ---- Regras puras do progresso ------------------------------------------------------

// Progresso novo a partir da linguagem inicial (null se não for uma inicial).
export function progressoInicial(especieId) {
  if (!INICIAIS.includes(especieId)) return null;
  return { inicial: especieId, jogador: criarLutador(especieId, NIVEL_INICIAL), vencidos: [] };
}

// O chefe pode ser desafiado se não exige ninguém ou se o exigido já foi vencido.
export function chefeLiberado(vencidos, chefeId) {
  const chefe = CHEFES.find((c) => c.id === chefeId);
  if (!chefe) return false;
  return !chefe.requer || (Array.isArray(vencidos) && vencidos.includes(chefe.requer));
}

// Aplica o fim de uma batalha. O jogador volta curado e mantém a XP mesmo em
// derrota ou desistência; a vitória entra em "vencidos" sem duplicar.
// Devolve { progresso, venceu, zerou }.
export function aplicarResultado(progresso, chefeId, resultado, jogadorFinal) {
  const venceu = resultado === "vitoria";
  const antes = Array.isArray(progresso?.vencidos) ? progresso.vencidos : [];
  const vencidos = venceu && !antes.includes(chefeId) ? [...antes, chefeId] : antes;
  const jogadorBase = jogadorFinal ?? progresso?.jogador;
  const novo = {
    inicial: progresso?.inicial ?? null,
    ...progresso,
    jogador: jogadorBase ? curado(jogadorBase) : null,
    vencidos,
  };
  return { progresso: novo, venceu, zerou: venceu && chefeId === CHEFE_FINAL };
}

// ---- Hook -----------------------------------------------------------------------------

// Instâncias montadas do hook na mesma página: quando uma salva, as outras
// (por exemplo a Vila e um modal de batalha) passam a ver o mesmo progresso.
const inscritos = new Set();

export function useProgresso() {
  // Lê o localStorage uma vez (lazy), só no cliente.
  const [progresso, setProgresso] = useState(lerProgresso);
  // Cópia síncrona: registrarResultado precisa do valor atual para devolver
  // { venceu, zerou } na hora, sem esperar a próxima renderização.
  const atualRef = useRef(progresso);

  useEffect(() => {
    const ouvir = (novo) => {
      atualRef.current = novo;
      setProgresso(novo);
    };
    inscritos.add(ouvir);
    return () => {
      inscritos.delete(ouvir);
    };
  }, []);

  const atualizar = useCallback((novo) => {
    salvarProgresso(novo);
    atualRef.current = novo;
    setProgresso(novo);
    for (const ouvir of inscritos) ouvir(novo);
  }, []);

  const vencidos = progresso?.vencidos ?? [];

  const liberado = useCallback((chefeId) => chefeLiberado(progresso?.vencidos ?? [], chefeId), [progresso]);

  const escolherInicial = useCallback(
    (especieId) => {
      const novo = progressoInicial(especieId);
      if (novo) atualizar(novo);
    },
    [atualizar]
  );

  const registrarResultado = useCallback(
    (chefeId, resultado, jogadorFinal) => {
      const { progresso: novo, venceu, zerou } = aplicarResultado(atualRef.current, chefeId, resultado, jogadorFinal);
      atualizar(novo);
      return { venceu, zerou };
    },
    [atualizar]
  );

  const recomecar = useCallback(() => atualizar(null), [atualizar]);

  return {
    progresso,
    temInicial: Boolean(progresso?.jogador),
    vencidos,
    liberado,
    escolherInicial,
    registrarResultado,
    recomecar,
  };
}
