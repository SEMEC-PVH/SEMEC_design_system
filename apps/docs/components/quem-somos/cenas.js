// Roteiros das cenas da Vila SEMEC (o motor que as executa fica em
// scene/cutscene.js). Cada função devolve a lista de passos de uma cena.

import { CHEFES } from "./batalha/dados";

// Cor da insígnia de cada Stack (token pv-*).
const COR_STACK = { front: "blue-500", back: "green-500", dados: "yellow-500", full: "red-500" };

// Cena depois da PRIMEIRA vitória num ginásio: o líder comemora, entrega a
// Stack e a câmera mostra quem é o próximo desafio.
//
// lider / proximo = { index, name } (proximo pode faltar).
export function cenaVitoria({ chefeId, lider, proximo, vencidos }) {
  const chefe = CHEFES.find((c) => c.id === chefeId);
  if (!chefe || !lider) return null;
  const seguinte = CHEFES.find((c) => c.requer === chefeId);
  const faltam = CHEFES.filter((c) => c.id !== "diretoria" && !vencidos.includes(c.id)).length;
  const restante =
    faltam <= 0
      ? "Agora você tem as três Stacks. Só falta a Diretoria para virar Full Stack!"
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
    { emblem: "player", color: COR_STACK[chefe.stack.id] },
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
            ? `A Diretoria quer te conhecer. Vou avisar ${proximo.name}, lá na sede da SEMEC!`
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
            ? "Então é você que juntou as três Stacks? Venha até a sede. Estou esperando!"
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
    obra: { cam: [14, 9], zoom: 1.75, dur: 1.6 },
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
    obra: { cam: [19, 9], zoom: 1.55, dur: 1.6 },
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
