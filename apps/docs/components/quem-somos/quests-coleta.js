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
//   "bugs"      Rafa, na Galeria da Equipe (6º andar): caça aos bugs de
//               acessibilidade espalhados pela Vila e pelos andares. Cada bug
//               abre a correção (CorrigirBug.jsx): o "antes" com o problema e,
//               acertando, o "depois" com o componente/token do kit.
//
// Itens com `local` ("vila" ou id do andar, predio/andares.js): onde o item
// fica; sem `local`, é na Vila. Quest com `local` (a do Rafa) só é dada pela
// pessoa naquele lugar (o Rafa da Vila continua sendo o líder do ginásio).
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
  bugs: {
    id: "bugs",
    npc: "rafa",
    nomeNpc: "Rafa",
    // Dada pelo Rafa da Galeria (não pelo líder do ginásio Front-End, na Vila).
    local: "galeria",
    titulo: "Caça aos bugs de acessibilidade",
    item: { nome: "bug", plural: "bugs" },
    tipoItem: "bug",
    recompensa: { id: "acessibilidade", nome: "Stack da Acessibilidade", sigla: "A11y", cor: "blue-700" },
    // `bug`: qual "antes/depois" o CorrigirBug.jsx mostra; `wcag`: critério.
    itens: [
      {
        id: "b1",
        local: "vila",
        x: 20,
        y: 7,
        bug: "contraste",
        onde: "Placa do Rio Madeira",
        problema: "O texto da placa é cinza-claro sobre fundo branco: quase ninguém consegue ler.",
        pergunta: "Como corrigir a placa?",
        opcoes: [
          "Aumentar o tamanho da letra e manter o cinza-claro",
          "Usar o token de texto --pv-gray-950 sobre o fundo claro",
          "Colocar o texto em itálico para chamar atenção",
        ],
        certa: 1,
        wcag: "1.4.3 Contraste (mínimo)",
        explicacao: "Isso! Com --pv-gray-950 sobre branco o contraste passa de 4,5:1, o mínimo do WCAG para texto normal.",
      },
      {
        id: "b2",
        local: "vila",
        x: 19,
        y: 15,
        bug: "foco",
        onde: "Quiosque da praça do Front-End",
        problema: "O botão do quiosque some quando recebe o foco do teclado: alguém removeu o contorno (outline: none).",
        pergunta: "Qual é a correção?",
        opcoes: [
          "Usar o Button do kit, que já vem com o anel de foco visível",
          "Deixar sem contorno, porque com o mouse ninguém repara",
          "Mostrar o foco só quando o mouse passar por cima",
        ],
        certa: 0,
        wcag: "2.4.7 Foco visível",
        explicacao: "Exato! O Button do @semec/ds mostra o anel de foco (token --color-ring) para quem navega pelo teclado.",
      },
      {
        id: "b3",
        local: "vila",
        x: 17,
        y: 21,
        bug: "alt",
        onde: "Cartaz de boas-vindas",
        problema: "A foto do cartaz não tem texto alternativo: o leitor de tela só diz \"imagem\".",
        pergunta: "O que colocar no alt da foto?",
        opcoes: [
          "alt=\"imagem\"",
          "Nada: deixar o alt vazio sempre",
          "alt=\"Equipe da SEMEC reunida na frente da sede\"",
        ],
        certa: 2,
        wcag: "1.1.1 Conteúdo não textual",
        explicacao: "Isso! O alt descreve o que a imagem comunica. Alt vazio só vale para imagem puramente decorativa.",
      },
      {
        id: "b4",
        local: "vila",
        x: 25,
        y: 15,
        bug: "link",
        onde: "Placa do Back-End",
        problema: "A placa tem um link \"clique aqui\": fora da frase, ninguém sabe para onde ele leva.",
        pergunta: "Como reescrever o link?",
        opcoes: [
          "\"Clique aqui\" em negrito",
          "\"Ver a documentação da API do Back-End\"",
          "\"Saiba mais\" com uma setinha",
        ],
        certa: 1,
        wcag: "2.4.4 Finalidade do link",
        explicacao: "Exato! O texto do link diz o destino, então ele faz sentido até numa lista de links do leitor de tela.",
      },
      {
        id: "b5",
        local: "terreo",
        x: 13,
        y: 10,
        bug: "cor",
        onde: "Aviso da recepção da SEMEC",
        problema: "O aviso de erro do balcão é só uma borda vermelha, sem texto: quem não distingue cores não percebe.",
        pergunta: "Como deixar o aviso acessível?",
        opcoes: [
          "Trocar o vermelho por um vermelho mais forte",
          "Piscar a borda para chamar atenção",
          "Usar o Alert do kit, com ícone e mensagem escrita",
        ],
        certa: 2,
        wcag: "1.4.1 Uso de cor",
        explicacao: "Isso! O Alert do @semec/ds avisa com ícone e texto, não só com cor.",
      },
      {
        id: "b6",
        local: "tecnologia",
        x: 18,
        y: 8,
        bug: "label",
        onde: "Formulário do Departamento de Tecnologia",
        problema: "O campo de e-mail só tem placeholder: quando a pessoa começa a digitar, o nome do campo some.",
        pergunta: "Qual é a correção?",
        opcoes: [
          "Usar Label do kit ligado ao Input (htmlFor/id)",
          "Escrever o placeholder em letra maior",
          "Colocar o nome do campo só num tooltip",
        ],
        certa: 0,
        wcag: "3.3.2 Rótulos ou instruções",
        explicacao: "Exato! O rótulo fica sempre visível e o leitor de tela anuncia o nome do campo.",
      },
    ],
    objetivo: {
      nova: "Fale com o Rafa, na Galeria da Equipe (6º andar).",
      coletando: (n, total) => `Corrija os bugs de acessibilidade: ${n} de ${total}.`,
      pronta: "Todos os bugs corrigidos! Volte ao Rafa, na Galeria.",
      concluida: "Stack da Acessibilidade conquistada!",
    },
  },
};

export const IDS_COLETA = Object.keys(QUESTS_COLETA);

// Quest dada por um personagem 3D (id da ficha/walker), ou null. `local`:
// onde a pessoa está ("galeria" para quem está na Galeria; sem local, a Vila);
// quest com `local` só é dada naquele lugar.
export const questDoNpc = (npcId, local = null) =>
  IDS_COLETA.find((id) => QUESTS_COLETA[id].npc === npcId && (QUESTS_COLETA[id].local ?? null) === local) ?? null;

// Onde fica cada item: "vila" ou o id do andar.
export const localDoItem = (item) => item.local ?? "vila";

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
