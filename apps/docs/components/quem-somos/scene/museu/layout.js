// Galeria da Equipe (museu no 6º andar da SEMFAZ): planta em grade.
//
// Contrato compartilhado por sala.js (arquitetura, elevador e luzes),
// quadros.js (molduras com os retratos), personagens.js (o time em 3D) e
// exposicao.js (a exposição do Design System). O motor (vila-engine.js) usa
// a mesma grade para o jogador andar aqui dentro.
//
// Mesma escala da Vila: 1 tile = 1 unidade, personagens com ~1 de altura.
// A sala fica centrada na origem da cena própria do museu. A câmera vem do
// sul, alta (como na Vila): a parede sul é uma mureta contínua (corte de
// maquete) para deixar ver o salão. Como nos escritórios, chega-se pelo
// elevador no meio da parede norte.
//
//   x → 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19
// y 0   # # # Q # # Q # # L L  #  #  Q  #  #  Q  #  #  #    Q = quadro na parede
//   1   # p . v P . v P V X .  V  P  v  .  P  v  .  p  #    L = elevador (letreiro em cima)
//   2   # . . . . . . . . . .  T  .  .  .  .  .  .  .  #    v = onde o jogador olha o quadro
//   3   # . . . . . . . . . .  .  .  .  .  .  .  .  .  #    P = personagem dono do quadro
//   4   Q v . . . . . . . E E  .  .  .  .  .  .  .  v  Q    X = chegada (saindo do elevador)
//   5   # P . . . . . . . E E  .  .  .  .  .  .  .  P  #    E = pedestal central (escultura)
//   6   # . . . . . . . . . .  .  .  .  .  .  .  .  .  #    B = banco
//   7   Q v . . B B . . . . .  .  .  .  B  B  .  .  v  Q    D = exposição do Design System
//   8   # P . . . . . . D D D  D  .  .  .  .  .  .  P  #        (EXPOSICAO, fase 2)
//   9   # . . . . . . . D D D  D  .  .  .  .  .  .  .  #
//  10   # p . . . . . . . . .  .  .  .  .  .  .  .  p  #    V = vaso alto, p = planta, T = totem
//  11   # # # # # # # # # # #  #  #  #  #  #  #  #  #  #    mureta sul (sem porta)

import * as THREE from "three";

export const MW = 20;
export const MH = 12;

export const PAREDE_ALTURA = 3; // paredes norte, oeste e leste
export const PAREDE_SUL_ALTURA = 0.45; // mureta: a câmera vê por cima
export const PAREDE_ESPESSURA = 0.3; // a face interna fica na borda do tile

export const tileToWorld = (x, y) => new THREE.Vector3(x - MW / 2 + 0.5, 0, y - MH / 2 + 0.5);

// Faces internas das paredes (coordenadas do mundo do museu).
export const FACE = {
  norte: -MH / 2 + 1, // z
  sul: MH / 2 - 1, // z
  oeste: -MW / 2 + 1, // x
  leste: MW / 2 - 1, // x
};

// Moldura: tamanho externo e altura do centro.
export const QUADRO = { largura: 1.3, altura: 1.6, centroY: 1.55 };

// Eixo central: passa entre os tiles CX e CX + 1 (x = 0 no mundo).
const CX = MW / 2 - 1;

// Elevador (predio/mobilia.js, criarElevador) nos 2 tiles do meio da parede
// norte, como nos escritórios: pisar neles = chamar o elevador. A chegada é
// o tile logo à frente, olhando para o sul.
export const ELEVADOR = { tiles: [[CX, 0], [CX + 1, 0]] };
export const CHEGADA = { x: CX, y: 1, dir: "down" };

// Lugares dos quadros, na ordem em que as pessoas entram (quadros[i] vai no
// slot i). `parede`: tile da parede; `ver`: tile do jogador, olhando `dir`;
// `normal`: para onde o quadro olha (para dentro da sala); `pessoa`: tile
// do personagem dono do quadro (ao lado; na norte, do lado do elevador no
// par oeste e espelhado no par leste).
export const SLOTS = [
  { parede: [3, 0], ver: [3, 1], dir: "up", normal: [0, 1], pessoa: [4, 1] },
  { parede: [6, 0], ver: [6, 1], dir: "up", normal: [0, 1], pessoa: [7, 1] },
  { parede: [13, 0], ver: [13, 1], dir: "up", normal: [0, 1], pessoa: [12, 1] },
  { parede: [16, 0], ver: [16, 1], dir: "up", normal: [0, 1], pessoa: [15, 1] },
  { parede: [0, 4], ver: [1, 4], dir: "left", normal: [1, 0], pessoa: [1, 5] },
  { parede: [0, 7], ver: [1, 7], dir: "left", normal: [1, 0], pessoa: [1, 8] },
  { parede: [MW - 1, 4], ver: [MW - 2, 4], dir: "right", normal: [-1, 0], pessoa: [MW - 2, 5] },
  { parede: [MW - 1, 7], ver: [MW - 2, 7], dir: "right", normal: [-1, 0], pessoa: [MW - 2, 8] },
];

// Centro do quadro i no mundo (no plano da face da parede, um tico à frente).
export function centroQuadro(i) {
  const s = SLOTS[i];
  const [nx, nz] = s.normal;
  const p = tileToWorld(s.parede[0], s.parede[1]);
  if (nz) p.z = FACE.norte;
  else p.x = nx > 0 ? FACE.oeste : FACE.leste;
  p.y = QUADRO.centroY;
  return p;
}

export const PEDESTAL = { tiles: [[CX, 4], [CX + 1, 4], [CX, 5], [CX + 1, 5]] };
export const BANCOS = [
  { tiles: [[4, 7], [5, 7]] },
  { tiles: [[MW - 6, 7], [MW - 5, 7]] },
];

// Área reservada para a exposição do Design System (exposicao.js): bloco
// 4×2 no eixo do salão, ao sul do pedestal. Fica fora dos caminhos (do
// elevador a todos os quadros e pessoas) e não é andável; as peças lá
// devem ser baixas (até ~1,3) por estar perto da câmera, que vem do sul.
export const EXPOSICAO = {
  tiles: [
    [CX - 1, 8], [CX, 8], [CX + 1, 8], [CX + 2, 8],
    [CX - 1, 9], [CX, 9], [CX + 1, 9], [CX + 2, 9],
  ],
};

// Decoração do salão (sala.js) que ocupa tile: vasos altos ladeando o
// elevador, plantas altas nos cantos do norte, plantas baixas nos cantos do
// sul e o totem de boas-vindas ao lado da chegada (baixo, de frente para o
// sul). Os cordões dos quadros da parede norte ficam colados na parede, fora
// do miolo dos tiles: não bloqueiam nada.
export const DECOR = {
  vasosElevador: [[CX - 1, 1], [CX + 2, 1]],
  plantasNorte: [[1, 1], [MW - 2, 1]],
  plantasSul: [[1, MH - 2], [MW - 2, MH - 2]],
  totem: [CX + 2, 2],
};
const DECOR_TILES = [...DECOR.vasosElevador, ...DECOR.plantasNorte, ...DECOR.plantasSul, DECOR.totem];

const tem = (lista, x, y) => lista.some(([tx, ty]) => tx === x && ty === y);

// Tiles andáveis: o miolo da sala menos pedestal, bancos, exposição,
// decoração e personagens. (O elevador não é andável: o motor trata o passo para ele
// como "chamar o elevador".)
export function andavelBase(x, y) {
  if (x < 1 || x > MW - 2 || y < 1 || y > MH - 2) return false;
  if (tem(PEDESTAL.tiles, x, y)) return false;
  if (BANCOS.some((b) => tem(b.tiles, x, y))) return false;
  if (tem(EXPOSICAO.tiles, x, y)) return false;
  if (tem(DECOR_TILES, x, y)) return false;
  if (SLOTS.some((s) => s.pessoa[0] === x && s.pessoa[1] === y)) return false;
  return true;
}
