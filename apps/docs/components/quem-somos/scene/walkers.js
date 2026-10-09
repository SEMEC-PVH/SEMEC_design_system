// Duplas dono + mascote que passeiam pela Vila (scene/companion.js).
//
// Cada uma anda num gramado baixo (capim alto esconderia os dois) e tem um
// mascote com jeito próprio (scene/pets.js). Os GLBs ficam em
// public/quem-somos/ ao lado do gava.glb. `id` e `petId` são as fichas que o
// clique abre (onInspect do motor).
//
// Quem é chefe de ginásio não passeia: `anchors` (Map id → boneco do líder no
// motor) põe o dono parado na porta do ginásio, no lugar do boneco, com o
// mascote ao lado. A rota só vale para quem não é chefe.

import { createCompanion } from "./companion";
import { bunnyPet, samuraiPet, wafflePet } from "./pets";

const WALKERS = [
  {
    // Leo + bolinho de arroz samurai, no gramado a oeste da rua central, ao
    // sul da SEMEC (x 7–10, y 10–13). Não passa por (6,12): ponto genérico.
    id: "leo",
    petId: "samurai",
    owner: "leo.glb",
    petFile: "leo-samurai.glb",
    route: [
      [7, 10], [8, 10], [9, 10], [10, 10], [10, 11], [10, 12],
      [10, 13], [9, 13], [8, 13], [7, 13], [7, 12], [7, 11],
    ],
    restAt: new Map([[2, "taichi"], [8, "ataque"]]),
    restSeconds: 5.6, // cobre o tai chi de ~4,2 s
    talkShow: "ataque",
    ownerWalkScale: 1.2,
    pet: ({ slashColor }) => samuraiPet({ slashColor }),
  },
  {
    // Tiago + coelhinho de pelúcia, dentro do jardim cercado a sudoeste
    // (x 5–8, y 16–19; portão em (10,16)).
    id: "tiago",
    petId: "coelho",
    owner: "tiago.glb",
    petFile: "tiago-coelho.glb",
    route: [
      [5, 16], [6, 16], [7, 16], [8, 16], [8, 17], [8, 18],
      [8, 19], [7, 19], [6, 19], [5, 19], [5, 18], [5, 17],
    ],
    restAt: new Map([[2, "pulinhos"], [8, "mortal"]]),
    restSeconds: 3.2,
    talkShow: "mortal",
    ownerWalkScale: 1.25,
    pet: () => bunnyPet({}),
    quote: "É esse que é o negócio",
  },
  {
    // Rafa + waffle, na praça do Front-End (x 17–20, y 17–20), gramada para
    // eles; as flores do miolo ficam fora do circuito.
    id: "rafa",
    petId: "waffle",
    owner: "rafa.glb",
    petFile: "rafa-waffle.glb",
    route: [
      [17, 17], [18, 17], [19, 17], [20, 17], [20, 18], [20, 19],
      [20, 20], [19, 20], [18, 20], [17, 20], [17, 19], [17, 18],
    ],
    restAt: new Map([[2, "danca"], [8, "giro"]]),
    restSeconds: 3.6, // cobre a dança de 3,2 s
    talkShow: "danca",
    ownerWalkScale: 1.2,
    pet: () => wafflePet({}),
  },
];

// Ids com boneco 3D (o motor usa para saber quais líderes trocar).
export const WALKER_IDS = new Set(WALKERS.map((w) => w.id));

export function createWalkers({ baseUrl, slashColor, bubble, anchors = new Map(), ...ctx }) {
  return WALKERS.map((w) =>
    createCompanion({
      ...ctx,
      id: w.id,
      petId: w.petId,
      route: w.route,
      restAt: w.restAt,
      restSeconds: w.restSeconds,
      talkShow: w.talkShow,
      ownerUrl: baseUrl + w.owner,
      ownerWalkScale: w.ownerWalkScale,
      petUrl: baseUrl + w.petFile,
      pet: w.pet({ slashColor }),
      quote: w.quote && bubble ? { text: w.quote, ...bubble } : null,
      anchor: anchors.get(w.id) ?? null,
    })
  );
}
