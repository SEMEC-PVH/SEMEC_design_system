// Roteiros das cenas da Vila SEMEC (o motor que as executa fica em
// scene/cutscene.js). Cada função devolve a lista de passos de uma cena.

import { CHEFES } from "./batalha/dados";

// Cor da insígnia de cada Stack (token pv-*).
const COR_STACK = { front: "blue-500", back: "green-500", dados: "yellow-500", ia: "blue-800", full: "red-500" };

// Cena depois da PRIMEIRA vitória num ginásio: o líder comemora, entrega a
// Stack e a câmera mostra quem é o próximo desafio.
//
// lider / proximo = { index, name } (proximo pode faltar).
export function cenaVitoria({ chefeId, lider, proximo, vencidos }) {
  const chefe = CHEFES.find((c) => c.id === chefeId);
  if (!chefe || !lider) return null;
  const seguinte = CHEFES.find((c) => c.requer === chefeId && !c.bonus);
  const faltam = CHEFES.filter((c) => c.id !== "diretoria" && !c.bonus && !vencidos.includes(c.id)).length;
  const restante =
    faltam <= 0
      ? "Agora você tem as quatro Stacks. Só falta a Diretoria para virar Full Stack!"
      : `${faltam === 1 ? "Falta 1 Stack" : `Faltam ${faltam} Stacks`} para você enfrentar a Diretoria.`;

  const L = lider.index;
  const passos = [
    { cam: L, zoom: 0.7, dur: 1 },
    { face: L, dir: "player" },
    { face: "player", dir: L },
    { hop: L, times: 2 },
    {
      say: {
        title: lider.name,
        falante: L,
        text: `Que batalha! Você venceu o ${chefe.ginasio}. Aqui está: a ${chefe.stack.nome} é sua.`,
      },
    },
    { cam: "player", zoom: 0.7, dur: 0.8 },
    { emblem: "player", color: COR_STACK[chefe.stack.id], insignia: chefe.stack.id },
    { hop: "player", times: 1 },
    { say: { title: "Stack conquistada!", text: `Você recebeu a ${chefe.stack.nome}. ${restante}` } },
  ];

  if (seguinte && proximo) {
    const ehDiretoria = seguinte.id === "diretoria";
    passos.push(
      {
        say: {
          title: lider.name,
          falante: L,
          text: ehDiretoria
            ? `A Diretoria quer te conhecer. Vou avisar ${proximo.name}, lá na sede da SEMFAZ!`
            : `O ${seguinte.ginasio} acabou de abrir. Vou avisar ${proximo.name}!`,
        },
      },
      { cam: proximo.index, zoom: 0.85, dur: 1.8 },
      { face: proximo.index, dir: "down" },
      { hop: proximo.index, times: 2 },
      {
        say: {
          title: proximo.name,
          falante: proximo.index,
          text: ehDiretoria
            ? "Então é você que juntou as quatro Stacks? Venha até a sede. Estou esperando!"
            : `Ouvi dizer que tem gente nova com a ${chefe.stack.nome}... Venha me desafiar no ${seguinte.ginasio}!`,
        },
      }
    );
  }

  passos.push({ cam: "player", dur: 1.2 }, { cam: "follow" });
  return passos;
}

// Cena da ocarina do Pedro (quest.js): a canção leva a Vila para outra época
// e depois volta. epoca = "festa" | "futuro" (dois futuros possíveis, para
// comparar) | "passado". O que muda no mapa fica em scene/epocas.js; o passo
// { mundo } é executado pelo motor (vila-engine.js, mundo()).
//
// pedro = { index, name }.
// Quanto dura a construção (e a volta) da época, junto com o relógio (s).
const CONSTRUCAO = 5.5;
// obra: para onde a câmera olha enquanto a época é construída.
const VIAGEM = {
  festa: {
    cancao: "Esta é a Canção do Amanhã. Segura firme, que o tempo vai correr!",
    ate: 20.5,
    obra: { cam: [7, 9], zoom: 1.1, dur: 1.4 },
    foco: [{ cam: [7, 10], zoom: 1.2, dur: 1.2 }],
    chegada:
      "Anos depois... a Vila SEMEC virou referência! O time inteiro veio comemorar: o Design System ganhou até estátua na praça.",
  },
  futuro: {
    cancao: "Esta é a Canção do Amanhã. Segura firme, que o tempo vai correr!",
    ate: 20.5,
    obra: { cam: [22, 5], zoom: 1.75, dur: 1.6 },
    foco: [
      { cam: [10, 9], zoom: 1.55, dur: 1.8 },
      { wait: 1.5 },
      { cam: [20, 11], zoom: 1.3, dur: 2 },
    ],
    chegada:
      "Vila SEMEC, 2030! Drones levam material para as escolas, ônibus voam sobre a rua e os prédios brilham em neon. E os componentes? Acessíveis como sempre.",
  },
  passado: {
    cancao: "Esta é a Canção do Ontem. Vamos ver como a Vila começou?",
    ate: 9,
    obra: { cam: [19, 10], zoom: 1.55, dur: 1.6 },
    foco: [{ cam: [19, 10], zoom: 1.35, dur: 1.4 }],
    chegada:
      "Muito tempo atrás, só existia a sede da SEMEC. Front-End, Back-End e Banco de Dados ainda eram obra... e o Design System era só uma ideia.",
  },
};

export function cenaOcarina({ epoca, pedro }) {
  const v = VIAGEM[epoca];
  if (!v || !pedro) return null;
  const P = pedro.index;
  const nome = pedro.name.split(" ")[0];
  const sentido = epoca === "passado" ? -1 : 1;
  const fala = (text) => ({ say: { title: nome, falante: P, text } });

  return [
    { cam: P, zoom: 0.7, dur: 1 },
    { face: "player", dir: P },
    { mundo: { tocar: true } },
    { wait: 1.3 },
    fala(v.cancao),
    // Câmera vai até onde a Vila vai mudar; o relógio dispara e, junto com
    // ele, a época vai sendo construída (ou desmontada, no passado).
    v.obra,
    ...(epoca === "passado" ? [{ mundo: { efeito: "sepia", on: true } }] : []),
    { mundo: { efeito: "relogio", on: true, sentido } },
    { mundo: { epoca, dur: CONSTRUCAO } },
    { mundo: { tempo: sentido, dias: 2, ate: v.ate, dur: CONSTRUCAO } },
    { mundo: { efeito: "relogio", on: false } },
    ...(epoca === "festa" ? [{ mundo: { reunir: true } }] : []),
    { wait: 0.6 },
    ...v.foco,
    { wait: 1.5 },
    fala(v.chegada),
    // Volta ao presente: o relógio desfaz a viagem e a obra roda ao contrário.
    { cam: P, zoom: 1.2, dur: 1.4 },
    fala("Bom, chega de viagem. Hora de voltar!"),
    ...(epoca === "festa" ? [{ mundo: { reunir: false } }] : []),
    v.obra,
    { mundo: { efeito: "relogio", on: true, sentido: -sentido } },
    { mundo: { epoca: null, dur: CONSTRUCAO } },
    { mundo: { tempo: "voltar", dur: CONSTRUCAO } },
    { mundo: { efeito: "sepia", on: false } },
    { mundo: { efeito: "relogio", on: false } },
    { mundo: { tocar: false } },
    { cam: P, zoom: 0.7, dur: 1.2 },
    fala("De volta ao presente! Quando quiser viajar de novo, é só falar comigo."),
    { cam: "player", dur: 1 },
    { cam: "follow" },
  ];
}

// Entrega de uma quest de coleta (quests-coleta.js): quem deu a quest
// comemora e a Stack especial sobe sobre o jogador. Na da campanha, antes, o
// microfone da Emily faz o show na praça (passo { mundo: { show } }).
export function cenaColeta({ quest }) {
  const N = quest.npc; // id do walker: ator de câmera em vila-engine.js
  const fala = (text) => ({ say: { title: quest.nomeNpc, falante: { name: quest.nomeNpc, retrato: N }, text } });
  const show =
    quest.id === "campanha"
      ? [
          { cam: N, zoom: 0.65, dur: 1.2 },
          fala("As três campanhas no ar e a cidade inteira comentando... olha, ele criou coragem! Vai começar o show!"),
          { mundo: { show: N } },
          { wait: 0.4 },
          fala("Ele cantou! Na frente de todo mundo! Comunicação boa é assim: clara, para todos e com o coração."),
        ]
      : [
          { cam: N, zoom: 0.65, dur: 1.2 },
          fala("Página por página, o Livro Sábio está inteiro de novo. E você respondeu tudo certinho!"),
        ];
  const depois =
    quest.id === "paginas"
      ? [fala("Ah, e quando quiser, venha falar comigo: este livro guarda uma história que eu adoro contar.")]
      : [];
  return [
    ...show,
    { cam: "player", zoom: 0.7, dur: 0.8 },
    { emblem: "player", color: quest.recompensa.cor, insignia: quest.recompensa.id },
    { hop: "player", times: 1 },
    { say: { title: "Stack conquistada!", text: `Você recebeu a ${quest.recompensa.nome}.` } },
    ...depois,
    { cam: "player", dur: 0.8 },
    { cam: "follow" },
  ];
}

// Roda de história do Zé Carlos (depois da quest das páginas): o relógio
// corre até a noite, o time senta em volta da fogueira e o Livro Sábio solta
// uma página ilustrada por trecho (public/quem-somos/historia/N.webp).
export const HISTORIA_DS = [
  "Há um tempo, cada sistema da prefeitura tinha um jeito: botão de toda cor, formulário de todo tamanho. Quem usava vivia se perdendo.",
  "Aí o Pedro juntou a turma e perguntou: \"E se tudo falasse a mesma língua?\" Foi como acender uma lâmpada.",
  "Primeiro vieram os tokens: as cores, os espaços e a fonte, cada um com o seu nome. Como uma caixa de lápis bem organizada.",
  "Depois, os componentes: botão, campo, cartão, tabela... peça por peça, como blocos de montar que sempre se encaixam.",
  "E ninguém podia ficar de fora: contraste para quem enxerga pouco, teclado para quem não usa mouse, leitor de tela para quem não enxerga.",
  "Assim nasceu o Design System da SEMEC: um kit que qualquer escola pode usar. E essa história continua... com você!",
];

export function cenaHistoria() {
  const Z = "ze-carlos";
  const fala = (text) => ({ say: { title: "Zé Carlos", falante: { name: "Zé Carlos", retrato: Z }, text } });
  return [
    { cam: Z, zoom: 0.7, dur: 1.2 },
    fala("Querem saber como tudo isso aqui começou? Então chega mais, que essa história é das boas!"),
    { mundo: { efeito: "relogio", on: true, sentido: 1 } },
    { mundo: { tempo: 1, dias: 0, ate: 19.5, dur: 3 } },
    { mundo: { efeito: "relogio", on: false } },
    { mundo: { roda: true } },
    { cam: [6, 11], zoom: 0.8, dur: 1.4 },
    { wait: 0.8 },
    fala("Senta aí, pessoal. Esta é a história de como nasceu o Design System da SEMEC."),
    { mundo: { apresenta: Z, show: "sabio" } },
    ...HISTORIA_DS.flatMap((texto, i) => [{ mundo: { pagina: i } }, fala(texto)]),
    // Fecha o livro (a animação de fechar roda antes da próxima fala).
    { mundo: { pagina: null } },
    { wait: 0.6 },
    { hop: "player", times: 2 },
    fala("Gostaram? Toda vez que alguém usa o kit, a história ganha uma página nova."),
    { mundo: { roda: false } },
    { mundo: { efeito: "relogio", on: true, sentido: -1 } },
    { mundo: { tempo: "voltar", dur: 2 } },
    { mundo: { efeito: "relogio", on: false } },
    { cam: "player", dur: 1 },
    { cam: "follow" },
  ];
}
