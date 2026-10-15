// Insígnias das Stacks (public/quem-somos/insignias/<id>.webp, 160 px com
// fundo transparente): HUD (VilaSemec.jsx), a coleção em tela cheia
// (StackDex.jsx) e a insígnia que sobe girando sobre o jogador quando ele
// ganha uma Stack (scene/cutscene.js, passo emblem).
//
// ids: Stacks dos ginásios (batalha/dados.js, CHEFES[].stack.id) e as
// especiais das quests (quest.js e quests-coleta.js, recompensa.id).

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// ?v=: troca quando as imagens mudam (o navegador guardava a versão antiga).
const VERSAO = 2;

export const INSIGNIAS = ["front", "back", "dados", "ia", "full", "ocarina", "sabedoria", "comunicacao"];

export const urlInsignia = (id) =>
  INSIGNIAS.includes(id) ? `${basePath}/quem-somos/insignias/${id}.webp?v=${VERSAO}` : null;

// Ficha de cada insígnia na coleção (StackDex). `cor`: token pv do brilho.
// `grupo`: "ginasio" (trilha do Full Stack) ou "especial" (quests).
export const FICHAS_INSIGNIAS = {
  front: {
    numero: 1,
    nome: "Front-End Stack",
    grupo: "ginasio",
    cor: "blue-500",
    forma: "Escudo azul com janela e pincel",
    comoGanhar: "Vença o Rafa no Ginásio Front-End, o prédio de vidro azul ao sul da praça.",
    oQueE: "Tudo o que a população vê e toca na tela: botões, formulários, cores e o caminho do clique. Bem feito, ninguém precisa de manual.",
  },
  back: {
    numero: 2,
    nome: "Back-End Stack",
    grupo: "ginasio",
    cor: "green-500",
    forma: "Engrenagem verde com servidor",
    comoGanhar: "Vença o Leo no Ginásio Back-End, o prédio escuro de servidores, ao lado do Front-End.",
    oQueE: "O trabalho que ninguém vê: servidores e APIs que recebem o clique, conferem as regras e respondem rápido — mesmo com a cidade inteira acessando.",
  },
  dados: {
    numero: 3,
    nome: "Data Stack",
    grupo: "ginasio",
    cor: "yellow-500",
    forma: "Hexágono amarelo com banco de dados",
    comoGanhar: "Vença o Tiago no Ginásio de Dados, a torre do Banco de Dados, ao norte.",
    oQueE: "Os dados da rede municipal guardados com segurança, organizados e protegidos pela LGPD. Sem eles, a tela mais bonita fica vazia.",
  },
  ia: {
    numero: 4,
    nome: "IA Stack",
    grupo: "ginasio",
    cor: "blue-800",
    forma: "Círculo azul-marinho com cérebro de circuitos",
    comoGanhar: "Vença a Mariana no Laboratório de Machine Learning, na beira do lago (depois da Data Stack).",
    oQueE: "Modelos que aprendem com os dados para prever e ajudar a decidir — sempre limpando os dados antes e testando para não decorar as respostas.",
  },
  full: {
    numero: 5,
    nome: "Full Stack",
    grupo: "ginasio",
    cor: "red-500",
    forma: "Estrela vermelha com camadas empilhadas",
    comoGanhar: "Com as quatro Stacks, vença a Diretoria na sede da SEMFAZ.",
    oQueE: "Quem entende o caminho inteiro: da tela ao servidor, do servidor aos dados, dos dados à inteligência. É assim que o time da SEMEC trabalha.",
  },
  ocarina: {
    numero: 6,
    nome: "Stack da Ocarina",
    grupo: "especial",
    cor: "blue-400",
    forma: "Gota azul com ocarina e nota musical",
    comoGanhar: "Ajude o Pedro, na frente da SEMFAZ, a achar a ocarina perdida no mato alto.",
    oQueE: "Recompensa de quem ajuda um colega sem pedir nada em troca — e ainda ganha uma viagem no tempo pela Vila.",
  },
  sabedoria: {
    numero: 7,
    nome: "Stack da Sabedoria",
    grupo: "especial",
    cor: "yellow-800",
    forma: "Brasão marrom com livro aberto",
    comoGanhar: "Ache as 4 páginas do Livro Sábio do Zé Carlos e responda certo às perguntas sobre o Design System.",
    oQueE: "Para quem conhece as regras que deixam tudo acessível: contraste, foco visível, nome nos botões e tokens no lugar de cor solta.",
  },
  comunicacao: {
    numero: 8,
    nome: "Stack da Comunicação",
    grupo: "especial",
    cor: "red-400",
    forma: "Losango roxo com microfone",
    comoGanhar: "Monte as 3 campanhas da Emily na praça do Front-End com pelo menos 6 estrelas.",
    oQueE: "Falar simples, para quem importa, no canal certo e de um jeito que todo mundo consiga ler — inclusive quem usa leitor de tela.",
  },
};
