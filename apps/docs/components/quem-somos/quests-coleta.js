// Quests dos personagens 3D que passeiam pela Vila (scene/walkers.js); quem
// cumpre ganha uma Stack especial. Salvas só neste navegador (localStorage),
// como a quest da ocarina (quest.js).
//
//   "paginas"   Zé Carlos (coleta): o vento espalhou 4 páginas do Livro Sábio.
//               Cada página traz uma pergunta sobre o Design System; a página
//               só volta para o livro com a resposta certa.
//   "campanha"  Emily (mini game, campanha/): montar 3 campanhas de
//               comunicação da SEMEC; com estrelas suficientes o microfone
//               cria coragem e faz o show (cenas.js, cenaColeta).
//
// Etapas: "nova" → "coletando" (procurando os itens / jogando) → "pronta"
// (tem todos os itens / venceu) → "concluida".

import { useCallback, useState } from "react";

export const ETAPAS_COLETA = ["nova", "coletando", "pronta", "concluida"];

export const QUESTS_COLETA = {
  paginas: {
    id: "paginas",
    npc: "ze-carlos",
    nomeNpc: "Zé Carlos",
    titulo: "As páginas perdidas",
    item: { nome: "página", plural: "páginas" },
    recompensa: { id: "sabedoria", nome: "Stack da Sabedoria", sigla: "¶", cor: "yellow-800" },
    // Tiles andáveis longe das rotas dos passeios (ver o mapa em vila-engine.js).
    itens: [
      {
        id: "p1",
        x: 2,
        y: 5,
        pergunta: "Qual é o contraste mínimo entre texto normal e fundo para cumprir o WCAG 2.1 AA?",
        opcoes: ["3:1", "4,5:1", "10:1"],
        certa: 1,
        explicacao: "Isso! 4,5:1 para texto normal; texto grande e ícones pedem pelo menos 3:1.",
      },
      {
        id: "p2",
        x: 23,
        y: 7,
        pergunta: "No SEMEC Design System, as cores vêm de tokens com qual prefixo?",
        opcoes: ["--cor-*", "--hex-*", "--pv-*"],
        certa: 2,
        explicacao: "Exato! Nada de hex solto: as cores vêm dos tokens --pv-*.",
      },
      {
        id: "p3",
        x: 11,
        y: 19,
        pergunta: "Um botão que só tem ícone precisa de quê para funcionar com leitor de tela?",
        opcoes: ["Um nome acessível, como aria-label", "Uma cor mais forte", "Uma dica que só aparece no hover"],
        certa: 0,
        explicacao: "Isso mesmo! Sem nome acessível o leitor de tela anuncia só \"botão\".",
      },
      {
        id: "p4",
        x: 27,
        y: 13,
        pergunta: "Quem navega pelo teclado precisa enxergar o quê?",
        opcoes: ["Só o cursor do mouse", "Onde está o foco", "Nada, o teclado é só um atalho"],
        certa: 1,
        explicacao: "Perfeito! O foco precisa estar sempre visível: é como o cursor de quem usa teclado.",
      },
    ],
    objetivo: {
      nova: "Fale com o Zé Carlos, no gramado ao sul da SEMFAZ.",
      coletando: (n, total) =>
        `Ache as páginas do Livro Sábio espalhadas pela Vila e responda às perguntas (${n}/${total}).`,
      pronta: "Todas as páginas certas! Leve o livro de volta para o Zé Carlos.",
      concluida: "Quest concluída! Você ganhou a Stack da Sabedoria.",
    },
  },
  campanha: {
    id: "campanha",
    npc: "emily",
    nomeNpc: "Emily",
    titulo: "Campanha da SEMEC",
    // Mini game (campanha/Campanha.jsx): sem itens no mapa.
    minigame: true,
    recompensa: { id: "comunicacao", nome: "Stack da Comunicação", sigla: "★", cor: "red-400" },
    itens: [],
    objetivo: {
      nova: "Fale com a Emily, na praça do Front-End.",
      coletando: "Monte as 3 campanhas da Emily e consiga pelo menos 6 estrelas. Fale com ela para jogar.",
      pronta: "Campanha no ar! Fale com a Emily para comemorar.",
      concluida: "Quest concluída! Você ganhou a Stack da Comunicação.",
    },
  },
};

export const IDS_COLETA = Object.keys(QUESTS_COLETA);

// Quest dada por um personagem 3D (id da ficha/walker), ou null.
export const questDoNpc = (npcId) => IDS_COLETA.find((id) => QUESTS_COLETA[id].npc === npcId) ?? null;

export const objetivoColeta = (quest, estado) => {
  const o = quest.objetivo[estado.etapa];
  return typeof o === "function" ? o(estado.itens.length, quest.itens.length) : o;
};

const chave = (id) => `vila-semec-quest-${id}-v1`;
const VAZIO = { etapa: "nova", itens: [] };

function ler(id) {
  try {
    const v = JSON.parse(localStorage.getItem(chave(id)) || "null");
    if (!v || !ETAPAS_COLETA.includes(v.etapa)) return VAZIO;
    const validos = new Set(QUESTS_COLETA[id].itens.map((i) => i.id));
    return { etapa: v.etapa, itens: Array.isArray(v.itens) ? v.itens.filter((i) => validos.has(i)) : [] };
  } catch {
    return VAZIO;
  }
}

function gravar(id, estado) {
  try {
    if (estado.etapa === "nova") localStorage.removeItem(chave(id));
    else localStorage.setItem(chave(id), JSON.stringify(estado));
  } catch {
    // Sem armazenamento (aba anônima, bloqueio): vale só nesta visita.
  }
}

const lerTodas = () => Object.fromEntries(IDS_COLETA.map((id) => [id, ler(id)]));

// Transições válidas; qualquer outra pedida é ignorada.
export function transicao(quest, atual, acao) {
  if (acao.tipo === "reiniciar") return VAZIO;
  if (acao.tipo === "aceitar" && atual.etapa === "nova") return { etapa: "coletando", itens: [] };
  if (acao.tipo === "coletar" && atual.etapa === "coletando" && !atual.itens.includes(acao.item)) {
    if (!quest.itens.some((i) => i.id === acao.item)) return atual;
    const itens = [...atual.itens, acao.item];
    return { etapa: itens.length === quest.itens.length ? "pronta" : "coletando", itens };
  }
  // Mini game vencido.
  if (acao.tipo === "vencer" && quest.minigame && atual.etapa === "coletando") return { ...atual, etapa: "pronta" };
  if (acao.tipo === "concluir" && atual.etapa === "pronta") return { ...atual, etapa: "concluida" };
  return atual;
}

export function useQuestsColeta() {
  // Lê o localStorage uma vez (lazy), só no cliente, como useQuest.
  const [estados, setEstados] = useState(() =>
    typeof window === "undefined" ? Object.fromEntries(IDS_COLETA.map((id) => [id, VAZIO])) : lerTodas()
  );

  const aplicar = useCallback((id, acao) => {
    setEstados((todos) => {
      const atual = todos[id];
      const novo = transicao(QUESTS_COLETA[id], atual, acao);
      if (novo === atual) return todos;
      gravar(id, novo);
      return { ...todos, [id]: novo };
    });
  }, []);

  const reiniciarTodas = useCallback(() => {
    for (const id of IDS_COLETA) gravar(id, VAZIO);
    setEstados(Object.fromEntries(IDS_COLETA.map((id) => [id, VAZIO])));
  }, []);

  return { estados, aplicar, reiniciarTodas };
}
