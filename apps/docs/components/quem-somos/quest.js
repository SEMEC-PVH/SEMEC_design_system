// Quest "A ocarina perdida": o Pedro, na frente da SEMEC, perdeu a ocarina
// no mato alto. Separada das batalhas (não precisa de linguagem) e salva só
// neste navegador (localStorage), como o progresso da jornada.
//
// Etapas: "nova" (ainda não aceitou) → "procurando" → "achou" (está com a
// ocarina, falta devolver) → "concluida" (ganhou a Stack da Ocarina).

import { useCallback, useState } from "react";

export const CHAVE_QUEST = "vila-semec-quest-ocarina-v1";
export const ETAPAS = ["nova", "procurando", "achou", "concluida"];

export const QUEST = {
  id: "ocarina",
  titulo: "A ocarina perdida",
  recompensa: { id: "ocarina", nome: "Stack da Ocarina", sigla: "♪" },
  // Objetivo mostrado no painel do canto da tela, por etapa.
  objetivo: {
    nova: "Fale com o Pedro, na frente da SEMEC.",
    procurando: "Procure a ocarina do Pedro no mato alto. Dica: ele passou pelo parque perto do Back-End.",
    achou: "Você achou a ocarina! Devolva para o Pedro, na frente da SEMEC.",
    concluida: "Quest concluída! Você ganhou a Stack da Ocarina.",
  },
};

export const etapaValida = (e) => (ETAPAS.includes(e) ? e : "nova");

function lerEtapa() {
  try {
    return etapaValida(localStorage.getItem(CHAVE_QUEST));
  } catch {
    return "nova";
  }
}

function salvarEtapa(etapa) {
  try {
    if (etapa === "nova") localStorage.removeItem(CHAVE_QUEST);
    else localStorage.setItem(CHAVE_QUEST, etapa);
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): a quest vale só nesta visita.
  }
}

// A etapa só avança na ordem; "nova" (recomeçar) sempre vale.
export function proximaEtapa(atual, pedida) {
  if (pedida === "nova") return "nova";
  return ETAPAS.indexOf(pedida) === ETAPAS.indexOf(atual) + 1 ? pedida : atual;
}

export function useQuest() {
  // Lê o localStorage uma vez (lazy), só no cliente, como useProgresso.
  const [etapa, setEtapa] = useState(() => (typeof window === "undefined" ? "nova" : lerEtapa()));

  const avancar = useCallback((pedida) => {
    setEtapa((atual) => {
      const nova = proximaEtapa(atual, pedida);
      if (nova !== atual) salvarEtapa(nova);
      return nova;
    });
  }, []);

  return { etapa, avancar };
}
