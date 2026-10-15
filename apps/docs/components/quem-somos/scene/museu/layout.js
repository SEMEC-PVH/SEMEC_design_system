// Galeria da Equipe (museu dentro da sede da SEMEC): planta em grade.
//
// Contrato compartilhado por sala.js (arquitetura e luzes), quadros.js
// (molduras com os retratos) e personagens.js (o time em 3D). O motor
// (vila-engine.js) usa a mesma grade para o jogador andar aqui dentro.
//
// Mesma escala da Vila: 1 tile = 1 unidade, personagens com ~1 de altura.
// A sala fica centrada na origem da cena própria do museu. A câmera vem do
// sul, alta (como na Vila): a parede sul é baixa (corte de maquete) para
// deixar ver o salão.
//
//   x → 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
// y 0   # # # Q # # Q # # Q #  #  Q  #  #  #     Q = quadro na parede norte
//   1   # . . v P . v P . v P  .  v  P  .  #     v = onde o jogador olha o quadro
//   2   # . . . . . . . . . .  .  .  .  .  #     P = personagem dono do quadro
//   3   # . . . . . . . . . .  .  .  .  .  #
//   4   Q v . . . . . E E . .  .  .  .  v  Q     E = pedestal central (estátua)
//   5   # P . . . . . E E . .  .  .  .  P  #
//   6   # . . . . . . . . . .  .  .  .  .  #
//   7   Q v . . B B . . . . B  B  .  .  v  Q     B = banco
//   8   # P . . . . . . . . .  .  .  .  P  #
//   9   # . . . . . . . X . .  .  .  .  .  #     X = chegada (porta logo abaixo)
//  10   # # # # # # # # D # #  #  #  #  #  #     D = porta (pisar = sair)

import * as THREE from "three";

export const MW = 16;
export const MH = 11;

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

// Lugares dos quadros, na ordem em que as pessoas entram (quadros[i] vai no
// slot i). `parede`: tile da parede; `ver`: tile do jogador, olhando `dir`;
// `normal`: para onde o quadro olha (para dentro da sala); `pessoa`: tile
// do personagem dono do quadro (fica ao lado, virado para o sul).
export const SLOTS = [
  { parede: [3, 0], ver: [3, 1], dir: "up", normal: [0, 1], pessoa: [4, 1] },
  { parede: [6, 0], ver: [6, 1], dir: "up", normal: [0, 1], pessoa: [7, 1] },
  { parede: [9, 0], ver: [9, 1], dir: "up", normal: [0, 1], pessoa: [10, 1] },
  { parede: [12, 0], ver: [12, 1], dir: "up", normal: [0, 1], pessoa: [13, 1] },
  { parede: [0, 4], ver: [1, 4], dir: "left", normal: [1, 0], pessoa: [1, 5] },
  { parede: [0, 7], ver: [1, 7], dir: "left", normal: [1, 0], pessoa: [1, 8] },
  { parede: [15, 4], ver: [14, 4], dir: "right", normal: [-1, 0], pessoa: [14, 5] },
  { parede: [15, 7], ver: [14, 7], dir: "right", normal: [-1, 0], pessoa: [14, 8] },
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

export const PEDESTAL = { tiles: [[7, 4], [8, 4], [7, 5], [8, 5]] };
export const BANCOS = [
  { tiles: [[4, 7], [5, 7]] },
  { tiles: [[10, 7], [11, 7]] },
];
export const PORTA = { tile: [8, 10] };
export const CHEGADA = { x: 8, y: 9, dir: "up" };

// Tiles andáveis: o miolo da sala menos pedestal, bancos e personagens.
// (A porta não é andável: o motor trata o passo para ela como "sair".)
export function andavelBase(x, y) {
  if (x < 1 || x > MW - 2 || y < 1 || y > MH - 2) return false;
  const bloqueia = (lista) => lista.some(([tx, ty]) => tx === x && ty === y);
  if (bloqueia(PEDESTAL.tiles)) return false;
  if (BANCOS.some((b) => bloqueia(b.tiles))) return false;
  if (SLOTS.some((s) => s.pessoa[0] === x && s.pessoa[1] === y)) return false;
  return true;
}
