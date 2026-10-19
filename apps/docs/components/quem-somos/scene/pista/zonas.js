// Pista de bicicleta da Vila SEMEC: quem decora onde (sem three.js).
//
// Puro e testável no Node, como circuito.js: recebe o circuito montado
// (montarCircuito) e diz, tile a tile, de qual módulo é aquele pedaço do
// mapa (86 × 56 tiles; coordenadas de tile contínuas, o centro do tile
// (x, y) é o ponto (x, y)). Cada construtor só põe coisa na sua zona.
//
// Donos (a ordem é a precedência: o primeiro que reclama o tile leva):
//   1. tracado      — asfalto, zebras e uma folga (RESERVA_PISTA da linha
//                     central), o box com muro e garagem (x 24..46, y 49..54),
//                     o portão e a estradinha até a borda, o pórtico e o pé
//                     dos arcos. Ninguém mais põe nada aqui.
//   2. beira        — a faixa até FAIXA_BEIRA (3,5) tiles da linha central em
//                     toda a volta, mais o retângulo C (gramado ao sul do "U",
//                     entre a reta e a subida).
//   3. arquibancadas — A (a arquibancada da reta) e a (ao sul da reta, a
//                     leste do box).
//      vila         — B (miolo do "S", oeste) e b (miolo do grampo, leste):
//                     a parte temática da Vila SEMEC.
//   4. paisagem     — D (entre o "alto" e o "U", norte) e todo o resto:
//                     margens do mapa, além da cerca e o horizonte.
//
//   x →    0    10        20        30        40        50        60        70        80
//   y  0                                     DDDDDDDDDDDDDDD
//      6               ~~~~~~~~~~~~~~        D             D          ~~~~~~~        ~ = pista + beira
//     11            ~~~  BBBBBBBBBBB  ~~~    D             D     ~~~~       ~~~~
//     16           ~~~  B           B  ~~    D             D   ~~~  bbbbbbbb  ~~~
//     26           ~~~  B           B   ~~~  DDDDDDDDDDDDDDD  ~~~  b        b   ~~
//     33          ~~~   BBBBBBBBBBBBB     ~~~~~~~~~~~~~~~~CCCCCCCCCCCCCCCCCCCCC ~~
//     37          ~~~  AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA C                   C ~~
//     44           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//     47             ~~~~~~~~~~~~ reta (largada/chegada) ~~~~~~~~~~~~~~~~~~~~~~~
//     49                       [######## box ########]  aaaaaaaaaaaaaaaaaaaaaaaa
//     55                                 portão         aaaaaaaaaaaaaaaaaaaaaaaa
//
// Os retângulos (inclusivos) estão em ZONAS; um tile do retângulo que cai
// na faixa da beira (ou no traçado) é da beira (ou do traçado), não do dono
// do retângulo — por construção nenhuma zona encosta no asfalto.
//
// Altura (alturaMax): a câmera do motor é alta e vem do SUL (CAM_OFFSET
// (0, 10.5, 9)): olha para o norte descendo ~49,4° (atan2(10.5, 9)). Um
// objeto no tile (x, y) com altura h tapa o chão até h / tan(49,4°) ≈
// h / 1,17 tiles ao norte dele. Por isso: se o primeiro tile de pista
// (asfalto + zebra, colunas x-1..x+1) ao norte está a k tiles,
//   alturaMax(x, y) = (k - 0,6) × 1,15
// (0,6 de folga para a largura do objeto e a meia-largura do tile; 1,15 um
// pouco abaixo de 1,17, conservador). Sem pista até 12 tiles ao norte:
// Infinity. No próprio asfalto: 0. Ao norte da pista (k grande ou sem
// pista) pode-se crescer à vontade — quem fica atrás da pista nunca a tapa.

import {
  BOX,
  CORREDOR_FOLGA,
  LARGURA_ZEBRA,
  MH,
  MURO_Y,
  MW,
  PORTAO,
  RAIO_ASFALTO,
} from "./circuito";

// Asfalto + zebra (distância da linha central em tiles).
export const BORDA_PISTA = RAIO_ASFALTO + LARGURA_ZEBRA;
// Até onde é do traçado: a borda da zebra mais a folga do corredor da
// bicicleta e uma sobra (nada encosta na zebra).
export const RESERVA_PISTA = BORDA_PISTA + CORREDOR_FOLGA + 0.2;
// Faixa da beira (da linha central).
export const FAIXA_BEIRA = 3.5;
// alturaMax: quantos tiles ao norte procurar pista.
const ALCANCE_NORTE = 12;

// Retângulos de cada dono (tiles, inclusivos).
export const ZONAS = {
  arquibancadas: [
    { id: "A", x0: 14, x1: 46, y0: 37, y1: 44 },
    { id: "a", x0: 47, x1: 70, y0: 50, y1: 55 },
  ],
  vila: [
    { id: "B", x0: 13, x1: 31, y0: 11, y1: 35 },
    { id: "b", x0: 57, x1: 75, y0: 16, y1: 31 },
  ],
  beira: [{ id: "C", x0: 47, x1: 75, y0: 33, y1: 44 }],
  paisagem: [{ id: "D", x0: 36, x1: 50, y0: 0, y1: 26 }],
  // O box (com muro, garagem, jardineiras e portão) é do traçado.
  tracado: [{ id: "box", x0: 24, x1: 46, y0: 49, y1: 54 }],
};
export const DONOS = ["tracado", "beira", "arquibancadas", "vila", "paisagem"];

const dentro = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

export function criarZonas(c) {
  // Pórtico da chegada (último checkpoint): pilares 0,75 além do asfalto e
  // a torre do semáforo ao norte (ver tracado.js).
  const cpF = c.checkpoints[c.checkpoints.length - 1];
  const fx = cpF.tiles[0][0];
  const fyN = cpF.tiles[0][1] - 0.5 - 0.75;
  const fyS = cpF.tiles.at(-1)[1] + 0.5 + 0.75;
  // Pés dos arcos dos outros checkpoints (0,65 além do último tile).
  const pes = [[fx, fyN], [fx, fyS]];
  for (const cp of c.checkpoints.slice(0, -1)) {
    const f = cp.tiles;
    if (cp.eixo === "col") pes.push([f[0][0], f[0][1] - 1.15], [f[0][0], f.at(-1)[1] + 1.15]);
    else pes.push([f[0][0] - 1.15, f[0][1]], [f.at(-1)[0] + 1.15, f[0][1]]);
  }
  // Portão e estradinha de terra (do box até a borda sul, e além).
  const gx0 = PORTAO[0][0] - 1;
  const gx1 = PORTAO.at(-1)[0] + 1;

  // O tile (x, y) é do traçado?
  const doTracado = (x, y) => {
    if (c.distancia(x, y) <= RESERVA_PISTA) return true;
    if (ZONAS.tracado.some((r) => dentro(r, x, y))) return true;
    if (x >= gx0 && x <= gx1 && y > BOX.y1) return true;
    if (Math.abs(x - fx) <= 1 && y >= fyN - 1.5 && y <= fyS + 0.5) return true;
    return pes.some(([px, py]) => Math.abs(px - x) <= 1 && Math.abs(py - y) <= 1);
  };

  // Dono do tile (x, y) (coordenadas contínuas: vale o tile que as contém).
  const dono = (x, y) => {
    const tx = Math.round(x);
    const ty = Math.round(y);
    if (doTracado(tx, ty)) return "tracado";
    if (c.distancia(tx, ty) <= FAIXA_BEIRA) return "beira";
    for (const d of ["beira", "arquibancadas", "vila"]) if (ZONAS[d].some((r) => dentro(r, tx, ty))) return d;
    return "paisagem";
  };

  // A zona de `donoOuId` contém o tile (x, y)? Aceita o dono ("vila") ou o
  // id de um retângulo ("B"): o tile tem de estar no retângulo E ser do dono.
  const naZona = (donoOuId, x, y) => {
    const d = dono(x, y);
    if (DONOS.includes(donoOuId)) return d === donoOuId;
    for (const k of DONOS) {
      const r = ZONAS[k].find((z) => z.id === donoOuId);
      if (r) return d === k && dentro(r, Math.round(x), Math.round(y));
    }
    return false;
  };

  // Um objeto de raio `raio` (tiles) centrado no ponto (x, y) fica fora do
  // asfalto + zebra (com a folga de RESERVA_PISTA), do box e da estradinha
  // do portão? Mede a distância contínua à linha central (c.corredor), não
  // a escadinha dos tiles. Fora do mapa vale (horizonte), salvo a estradinha.
  const livre = (x, y, raio = 0) => {
    const perto = c.corredor(x, y);
    if (perto && perto.d - raio <= RESERVA_PISTA) return false;
    if (x + raio >= BOX.x0 - 1.5 && x - raio <= BOX.x1 + 1.5 && y + raio >= MURO_Y - 0.5 && y - raio <= BOX.y1 + 1.5) return false;
    if (x + raio >= gx0 && x - raio <= gx1 && y + raio >= BOX.y1) return false;
    return true;
  };

  // Maior altura (unidades do mundo; 1 tile = 1) de um objeto no tile
  // (x, y) sem tapar o asfalto para a câmera que vem do sul (fórmula no
  // cabeçalho): (k - 0,6) × 1,15, k = tiles até a 1ª pista ao norte.
  const alturaMax = (x, y) => {
    const tx = Math.round(x);
    const ty = Math.round(y);
    if (c.distancia(tx, ty) <= BORDA_PISTA) return 0;
    for (let k = 1; k <= ALCANCE_NORTE; k++) {
      for (let dx = -1; dx <= 1; dx++) if (c.distancia(tx + dx, ty - k) <= BORDA_PISTA) return (k - 0.6) * 1.15;
    }
    return Infinity;
  };

  return { ZONAS, DONOS, MW, MH, dono, naZona, livre, alturaMax };
}
