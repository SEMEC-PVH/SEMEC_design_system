// Pista de bicicleta da Vila SEMEC: o chão do traçado (dono: tracado).
//
// Uma malha só, com cor por VÉRTICE (o asfalto ganha variação suave e a
// borracha da trajetória nas curvas sem textura nenhuma):
//   - gramado em xadrez de corte (faixas de 4 tiles nos dois sentidos, quatro
//     tons de verde) e o verde mais escuro de fora do mapa;
//   - fita do asfalto seguindo a Catmull-Rom, subdividida na largura (ruído
//     de valor suave + a trajetória escurecida onde a curva aperta),
//     remendos de asfalto novo aqui e ali e riscos de frenagem na entrada
//     das curvas fortes;
//   - linhas de borda brancas, zebras com relevo (rampa e degrau externo, a
//     cada ~0,8 tile vermelha e branca) e a beira de grama aparada;
//   - faixa quadriculada da chegada, faixas tracejadas azul e branco dos
//     outros checkpoints, colchetes do grid de largada;
//   - piso do box em placas de concreto, faixa amarela do pit, hachurado da
//     entrada, e a estradinha de terra do portão com sulcos.
// Sem objetos em pé (esses vão em tracado.js / tracado-box.js).

import * as THREE from "three";
import { ABERTURA, BOX, LARGADA, LARGURA_ZEBRA, MH, MURO_Y, MW, RAIO_ASFALTO } from "./circuito";
import { GX0, GX1, MARGEM, lado, semente, wx, wz } from "./comum";

// Ruído de valor 2D suave (grade de 1,6 tile), determinístico.
function criarRuido(seed) {
  const hash = (i, j) => {
    let h = (i * 374761393 + j * 668265263 + seed * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const suave = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const u = suave(x - i);
    const v = suave(y - j);
    const a = hash(i, j);
    const b = hash(i + 1, j);
    const c = hash(i, j + 1);
    const d = hash(i + 1, j + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

// Acumulador de triângulos com cor por vértice (coordenadas de tile + altura).
function criarMalha() {
  const pos = [];
  const cor = [];
  const ponto = ([x, y], h, c) => {
    pos.push(wx(x), h, wz(y));
    cor.push(c.r, c.g, c.b);
  };
  // Triângulo virado para cima (troca a ordem se precisar).
  const triCima = (a, b, c2, ha, hb, hc, ca, cb, cc) => {
    const ny = (b[1] - a[1]) * (c2[0] - a[0]) - (b[0] - a[0]) * (c2[1] - a[1]);
    if (ny >= 0) {
      ponto(a, ha, ca);
      ponto(b, hb, cb);
      ponto(c2, hc, cc);
    } else {
      ponto(a, ha, ca);
      ponto(c2, hc, cc);
      ponto(b, hb, cb);
    }
  };
  return {
    // Quadrilátero no chão: pts [[x, y] × 4] em volta; h e c podem ser um
    // valor só ou um por canto.
    quad(pts, h, c) {
      const hs = Array.isArray(h) ? h : [h, h, h, h];
      const cs = Array.isArray(c) ? c : [c, c, c, c];
      triCima(pts[0], pts[1], pts[2], hs[0], hs[1], hs[2], cs[0], cs[1], cs[2]);
      triCima(pts[0], pts[2], pts[3], hs[0], hs[2], hs[3], cs[0], cs[2], cs[3]);
    },
    // Parede vertical entre dois pontos do chão (h0 → h1), uma cor.
    parede(a, b, h0, h1, c) {
      ponto(a, h0, c);
      ponto(b, h0, c);
      ponto(b, h1, c);
      ponto(a, h0, c);
      ponto(b, h1, c);
      ponto(a, h1, c);
    },
    geometria() {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("color", new THREE.Float32BufferAttribute(cor, 3));
      g.computeVertexNormals();
      return g;
    },
  };
}

// Monta a geometria do chão. Devolve { geo, curvas } (curvas: amostras com
// curvatura forte, para as setas e marcas de frenagem do tracado.js).
export function montarChao(ctx) {
  const { pv, mix, white, cor, lite, pts, checkpoints, N } = ctx;
  const m = criarMalha();
  const ruido = criarRuido(7);
  const rand = semente(20261021);
  const gx0 = GX0;
  const gx1 = GX1;

  // ---- Gramado: xadrez de corte -------------------------------------------------------
  m.quad([[-MARGEM, -MARGEM], [MW + MARGEM, -MARGEM], [MW + MARGEM, MH + MARGEM], [-MARGEM, MH + MARGEM]].map(([x, y]) => [x - 0.5, y - 0.5]), -0.02, cor.gramaFora);
  const tons = [
    [mix(cor.gramaA, white, 0.04), mix(cor.gramaA, cor.gramaB, 0.3)],
    [mix(cor.gramaB, cor.gramaA, 0.25), cor.gramaB],
  ];
  for (let x = 0; x < MW; x += 4) {
    for (let y = 0; y < MH; y += 4) {
      const x1 = Math.min(MW, x + 4);
      const y1 = Math.min(MH, y + 4);
      const c = tons[(x / 4) % 2][(y / 4) % 2];
      m.quad([[x - 0.5, y - 0.5], [x1 - 0.5, y - 0.5], [x1 - 0.5, y1 - 0.5], [x - 0.5, y1 - 0.5]], 0, c);
    }
  }

  // ---- Fita do asfalto ---------------------------------------------------------------
  const M = pts.length;
  const PASSO = 2; // amostras de 0,2 → fatias de 0,4 tile
  const FATIAS = lite ? 4 : 8; // subdivisões na largura
  const curv = (k) => {
    const a = pts[(k - 10 + M) % M];
    const b = pts[(k + 10) % M];
    return a.tx * b.ty - a.ty * b.tx; // > 0: vira para a direita na tela
  };
  // Curvatura suavizada (média de ±12 amostras) para a trajetória.
  const kv = pts.map((_, k) => {
    let s = 0;
    for (let d = -12; d <= 12; d += 3) s += curv((k + d + M) % M);
    return s / 9;
  });
  const asfEsc = mix(cor.asfalto, pv("gray-950"), 0.38);
  const asfClaro = mix(cor.asfalto, pv("gray-400"), 0.35);
  // Cor do asfalto no ponto (x, y) a d da linha central na amostra k.
  const corAsfalto = (x, y, d, k) => {
    const n = ruido(x / 1.6, y / 1.6) - 0.5;
    const n2 = ruido(x / 0.55 + 31, y / 0.55 + 17) - 0.5;
    let c = n > 0 ? mix(cor.asfalto, asfClaro, n * 0.55) : mix(cor.asfalto, asfEsc, -n * 0.45);
    c = n2 > 0 ? mix(c, asfClaro, n2 * 0.18) : mix(c, asfEsc, -n2 * 0.18);
    // Trajetória: do lado de dentro onde a curva aperta, borracha escura.
    const q = kv[k];
    const forca = Math.min(1, Math.abs(q) * 2.4);
    const off = Math.sign(q) * forca * 0.85;
    const borr = Math.exp(-(((d - off) / 0.42) ** 2)) * (0.1 + forca * 0.42);
    // Faixa "polida" no meio da reta (onde todo mundo passa): leve.
    return mix(c, asfEsc, Math.min(0.75, borr));
  };
  // Lado de "dentro" da curva → d positivo (ver lado()).
  const cortes = [];
  for (let j = 0; j <= FATIAS; j++) cortes.push(-RAIO_ASFALTO + (2 * RAIO_ASFALTO * j) / FATIAS);
  let acumZebra = 0;
  const vermelho = cor.zebraV;
  const vermelhoSombra = mix(vermelho, pv("gray-950"), 0.3);
  const brancoZ = cor.zebraB;
  const brancoSombra = mix(brancoZ, pv("gray-400"), 0.35);
  const beiraGrama = mix(cor.gramaB, cor.folhaB, 0.55);
  const naAbertura = (x, y) => x > ABERTURA[0] - 0.9 && x < ABERTURA[1] + 0.9 && y > MURO_Y - 1.2;
  for (let k = 0; k < M; k += PASSO) {
    // A última fatia fecha exatamente em pts[0] (com M ímpar, (k + PASSO) % M
    // passava de 0 e a fatia se sobrepunha à primeira: zebra "mordida").
    const k2 = Math.min(k + PASSO, M) % M;
    const a = pts[k];
    const b = pts[k2];
    // Asfalto em fatias (cor por canto).
    for (let j = 0; j < FATIAS; j++) {
      const d0 = cortes[j];
      const d1 = cortes[j + 1];
      const qa0 = lado(a, d0);
      const qb0 = lado(b, d0);
      const qb1 = lado(b, d1);
      const qa1 = lado(a, d1);
      m.quad([qa0, qb0, qb1, qa1], 0.02, [corAsfalto(...qa0, d0, k), corAsfalto(...qb0, d0, k2), corAsfalto(...qb1, d1, k2), corAsfalto(...qa1, d1, k)]);
    }
    // Linhas de borda brancas.
    for (const s of [-1, 1]) {
      const d0 = s * (RAIO_ASFALTO - 0.17);
      const d1 = s * (RAIO_ASFALTO - 0.08);
      m.quad([lado(a, d0), lado(b, d0), lado(b, d1), lado(a, d1)], 0.026, cor.linha);
    }
    // Zebras com relevo: rampa (borda de dentro rente ao asfalto, de fora
    // mais alta) e o degrau externo. Na entrada do box, sem zebra (faixa
    // zebrada de atenção no lugar, pintada por tracado.js).
    acumZebra += 0.4;
    const vez = Math.floor(acumZebra / 0.8) % 2;
    for (const s of [-1, 1]) {
      const d0 = s * RAIO_ASFALTO;
      const d1 = s * (RAIO_ASFALTO + LARGURA_ZEBRA);
      const qa0 = lado(a, d0);
      const qb0 = lado(b, d0);
      const qb1 = lado(b, d1);
      const qa1 = lado(a, d1);
      if (naAbertura(...qa1)) {
        m.quad([qa0, qb0, qb1, qa1], 0.024, cor.asfaltoBox);
        continue;
      }
      const c = vez ? vermelho : brancoZ;
      const cs = vez ? vermelhoSombra : brancoSombra;
      m.quad([qa0, qb0, qb1, qa1], [0.03, 0.03, 0.075, 0.075], [c, c, c, c]);
      m.parede(qa1, qb1, 0, 0.075, cs);
      // Beira de grama aparada logo depois da zebra.
      const d2 = s * (RAIO_ASFALTO + LARGURA_ZEBRA + 0.22);
      m.quad([qa1, qb1, lado(b, d2), lado(a, d2)], 0.008, beiraGrama);
    }
  }
  // Remendos de asfalto novo (retângulos girados, um tico mais escuros).
  const remendos = lite ? 6 : 14;
  for (let i = 0; i < remendos; i++) {
    const k = Math.floor(rand() * M);
    const p = pts[k];
    const d = (rand() - 0.5) * 1.6;
    const l = 0.25 + rand() * 0.35;
    const w = 0.18 + rand() * 0.2;
    const cc = lado(p, d);
    const ex = [p.tx * l, p.ty * l];
    const ey = [-p.ty * w, p.tx * w];
    const q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [cc[0] + ex[0] * u + ey[0] * v, cc[1] + ex[1] * u + ey[1] * v]);
    m.quad(q, 0.023, mix(asfEsc, cor.asfalto, 0.72));
  }
  // Marcas de frenagem: riscos de borracha na entrada das curvas fortes, de
  // fora para dentro, sumindo nas pontas (cor por vértice, sem textura).
  const borracha = mix(cor.asfalto, pv("gray-950"), 0.62);
  let ultimaMarca = -99;
  for (let k = 0; k < M; k++) {
    if (Math.abs(kv[k]) < 0.3 || pts[k].s - ultimaMarca < 9) continue;
    ultimaMarca = pts[k].s;
    const fora = -Math.sign(kv[k]);
    const riscos = lite ? 1 : 2;
    for (let r = 0; r < riscos; r++) {
      const ini = k - 28 - r * 5;
      const fim = k + 2 - r * 4;
      const off = (u) => fora * (0.95 - u * 1.45 - r * 0.28);
      const tom = (u) => mix(cor.asfalto, borracha, Math.sin(Math.PI * u) * (0.85 - r * 0.2));
      for (let j = ini; j < fim; j += 2) {
        const a = pts[(j + M) % M];
        const b = pts[(j + 2 + M) % M];
        const ua = (j - ini) / (fim - ini);
        const ub = Math.min(1, (j + 2 - ini) / (fim - ini));
        const w = 0.045;
        m.quad([lado(a, off(ua) - w), lado(b, off(ub) - w), lado(b, off(ub) + w), lado(a, off(ua) + w)], 0.0235, [tom(ua), tom(ub), tom(ub), tom(ua)]);
      }
    }
  }

  // ---- Chegada e checkpoints ---------------------------------------------------------
  checkpoints.forEach((cp, i) => {
    const f = cp.faixa;
    const col = cp.eixo === "col";
    const em = (u, v) => (col ? [f.x + u, f.y + v] : [f.x + v, f.y + u]);
    const mm = f.meia - 0.04;
    if (i === N - 1) {
      // Quadriculado 3 × 10 com filetes brancos dos dois lados.
      const n = 10;
      for (let j = 0; j < n; j++) {
        for (let r = 0; r < 3; r++) {
          const v0 = -mm + (j * 2 * mm) / n;
          const v1 = v0 + (2 * mm) / n;
          const u0 = -0.45 + r * 0.3;
          m.quad([em(u0, v0), em(u0 + 0.3, v0), em(u0 + 0.3, v1), em(u0, v1)], 0.034, (j + r) % 2 ? pv("gray-950") : white);
        }
      }
      for (const u of [-0.58, 0.48]) m.quad([em(u, -mm), em(u + 0.1, -mm), em(u + 0.1, mm), em(u, mm)], 0.034, cor.linha);
    } else {
      // Tracejado azul e branco (SEMEC) na linha do corte.
      const n = 8;
      for (let j = 0; j < n; j++) {
        const v0 = -mm + (j * 2 * mm) / n;
        const v1 = v0 + (2 * mm) / n;
        m.quad([em(-0.14, v0), em(0.14, v0), em(0.14, v1), em(-0.14, v1)], 0.034, j % 2 ? cor.azul : cor.linha);
      }
    }
  });
  // Grid de largada: colchetes brancos (pole na largada e dois atrás, em
  // ziguezague). Os números são pintura do atlas (tracado.js).
  const GRID = [
    [LARGADA.x, LARGADA.y],
    [LARGADA.x - 1.05, LARGADA.y - 0.95],
    [LARGADA.x - 1.05, LARGADA.y + 0.95],
  ];
  for (const [x, y] of GRID) {
    const lw = 0.08;
    m.quad([[x - 0.42, y - 0.4], [x - 0.42 + lw, y - 0.4], [x - 0.42 + lw, y + 0.4], [x - 0.42, y + 0.4]], 0.034, cor.linha);
    m.quad([[x - 0.42, y - 0.4], [x + 0.32, y - 0.4], [x + 0.32, y - 0.4 + lw], [x - 0.42, y - 0.4 + lw]], 0.034, cor.linha);
    m.quad([[x - 0.42, y + 0.4 - lw], [x + 0.32, y + 0.4 - lw], [x + 0.32, y + 0.4], [x - 0.42, y + 0.4]], 0.034, cor.linha);
  }

  // ---- Box: piso em placas, pit e estradinha ------------------------------------------
  const BX0 = BOX.x0 - 3.5; // o box visual vai até o muro oeste novo (x 24)
  const BX1 = BOX.x1 + 1.5;
  const concA = cor.asfaltoBox;
  const concB = mix(cor.asfaltoBox, pv("gray-400"), 0.12);
  for (let x = BX0; x < BX1; x += 2) {
    for (let y = MURO_Y + 0.2; y < BOX.y1 + 1.4; y += 2) {
      const x1 = Math.min(BX1, x + 2);
      const y1 = Math.min(BOX.y1 + 1.4, y + 2);
      const c = (Math.round(x / 2) + Math.round(y / 2)) % 2 ? concA : concB;
      m.quad([[x, y], [x1, y], [x1, y1], [x, y1]], 0.02, c);
      // Junta entre placas.
      m.quad([[x, y], [x1, y], [x1, y + 0.04], [x, y + 0.04]], 0.021, mix(concB, pv("gray-400"), 0.3));
    }
  }
  // Abertura no muro (piso do box até a pista).
  m.quad([[ABERTURA[0] - 0.5, MURO_Y - 0.4], [ABERTURA[1] + 0.5, MURO_Y - 0.4], [ABERTURA[1] + 0.5, MURO_Y + 0.25], [ABERTURA[0] - 0.5, MURO_Y + 0.25]], 0.022, concA);
  // Faixa amarela do pit (linha contínua) e vagas brancas do box.
  m.quad([[BOX.x0 - 0.3, BOX.y0 + 1.42], [BOX.x1 - 5.2, BOX.y0 + 1.42], [BOX.x1 - 5.2, BOX.y0 + 1.56], [BOX.x0 - 0.3, BOX.y0 + 1.56]], 0.03, cor.amarelo);
  for (let x = BOX.x0 + 4; x <= BOX.x1 - 5; x += 3) {
    if (x > ABERTURA[0] - 2 && x < ABERTURA[1] + 2) continue;
    m.quad([[x - 0.04, BOX.y1 - 1.0], [x + 0.04, BOX.y1 - 1.0], [x + 0.04, BOX.y1 + 0.45], [x - 0.04, BOX.y1 + 0.45]], 0.03, cor.linha);
  }
  // Caminho do portão: faixas brancas de pedestre até o portão.
  for (let i = 0; i < 4; i++) {
    const y = BOX.y1 - 0.2 + i * 0.32;
    m.quad([[gx0 + 0.15, y], [gx1 - 0.15, y], [gx1 - 0.15, y + 0.16], [gx0 + 0.15, y + 0.16]], 0.03, cor.linha);
  }
  // Estradinha de terra do portão até a borda, com sulcos de pneu.
  const terraEsc = mix(cor.terra, pv("yellow-800"), 0.35);
  m.quad([[gx0, BOX.y1 + 1.5], [gx1, BOX.y1 + 1.5], [gx1 + 0.4, MH + MARGEM], [gx0 - 0.4, MH + MARGEM]], 0.01, cor.terra);
  for (const u of [0.32, 0.68]) {
    const xa = gx0 + (gx1 - gx0) * u;
    m.quad([[xa - 0.06, BOX.y1 + 1.5], [xa + 0.06, BOX.y1 + 1.5], [xa + 0.06 + (u - 0.5) * 0.8, MH + 6], [xa - 0.06 + (u - 0.5) * 0.8, MH + 6]], 0.014, terraEsc);
  }

  // Amostras de curva forte (para setas e marcas de frenagem).
  const curvas = [];
  let ultimo = -99;
  for (let k = 0; k < M; k++) {
    if (Math.abs(kv[k]) > 0.3 && pts[k].s - ultimo > 9) {
      curvas.push({ k, kv: kv[k] });
      ultimo = pts[k].s;
    }
  }
  return { geo: m.geometria(), curvas, kv, GRID };
}
