// Pista de bicicleta da Vila SEMEC: arquibancadas e torcida (dono: zona
// "arquibancadas", retângulos A e a de zonas.js).
//
// A (ao norte da reta de largada, x 14..46, y 37..43): a arquibancada
// principal — cinco degraus (ARQUIBANCADA de circuito.js) com cadeirinhas
// coloridas por setor, três escadas com corrimão, parapeito azul na frente
// com faixas (TORCIDA SEMEC, VAI CICLISTA!, DESIGN SYSTEM), paredes laterais
// em degrau, muro do fundo com placas SEMEC e VILA SEMEC, cobertura em balanço
// com estrutura metálica (pilares atrás do muro, vigas, mãos-francesas, telhas
// listradas azul/branco, testeira amarela e um varal de bandeirinhas), as
// bandeiras no alto dos pilares e o telão, acima do camarote. No meio, à
// direita do pórtico, o CAMAROTE SEMEC: piso azul, laterais de vidro, balões
// e o TIME DA SEMEC em 3D torcendo, com os mascotes na frente
// (arquibancadas-time.js).
//
// a (ao sul da reta, a leste do box, x 47..70, y 51..54): só coisa baixa
// (alturaMax): grade amarela e azul, varal de bandeirinhas, torcida em pé
// virada para a pista, guarda-sóis, coolers, cadeiras de praia, toalha de
// piquenique e o carrinho de pipoca. Desvia das placas da beira (56; 51,2)
// e (66; 50,4).
//
// A torcida genérica (arquibancadas-torcida.js) é uma InstancedMesh com
// animação no shader: ola, grito da largada, festa; cartazes na mão; e as
// faixas e o telão vão nela também (uma draw call para tudo que tem texto).
// Estruturas fixas vão no lote compartilhado (cor por vértice, uma draw call
// para o mapa todo). Altura: tudo passa por `teto` (zonas.alturaMax).
//
// Contrato em comum.js. Eventos: update, festa, largada, passou, dispose.

import * as THREE from "three";
import { ARQUIBANCADA } from "./circuito";
import { caixa, wx, wz } from "./comum";
import { criarTexturaTorcida, criarTorcida } from "./arquibancadas-torcida";
import { TIME, montarTime } from "./arquibancadas-time";

// Escadas (x do eixo) e o camarote (x, nas duas fileiras da frente).
const ESCADAS = [20, 30, 40];
const CAMAROTE = { x0: 30.45, x1: 39.55 };
// Cobertura: pilares atrás do muro, telhado do fundo (y0) à frente (y1).
const TELHADO = { y0: 37.65, y1: 40.55, h0: 3.62, h1: 3.36 };
const PILARES = [15, 20, 25, 30, 35, 40, 45];
// Telão (acima do camarote, atrás do muro).
const TELAO = { x: 34.75, y: 37.37, w: 3.0, alt: 0.94, h: 4.3 };
// Zona a: os itens.
const SOMBRINHAS = [
  [49.4, 53.9],
  [58.9, 53.8],
  [63.6, 54.0],
  [68.4, 53.7],
];
const PIPOCA = [52.6, 53.8];
const TOALHA = { x0: 60.4, x1: 62.2, y0: 52.4, y1: 53.4 };

export function montarArquibancadas(ctx) {
  const { pal, pv, mix, white, cor, lite, reducedMotion, root, track, lote, add, placa, zonas } = ctx;
  const rand = ctx.semente(20261017);
  const A = ARQUIBANCADA;
  const DEG = A.y1 - A.y0 + 1; // 5 degraus
  const alturaDeg = (i) => 0.3 + i * 0.32; // i = 0 na frente (sul)
  const yDeg = (i) => A.y1 - i;

  // Cores extras (tokens).
  const C = {
    azul: cor.azul,
    azulEsc: cor.azulEsc,
    azulMed: pv("blue-500"),
    azulVidro: mix(pv("blue-200"), white, 0.35),
    amarelo: cor.amarelo,
    vermelho: cor.vermelho,
    verde: pv("green-600"),
    branco: white,
    concreto: cor.concreto,
    concretoClaro: cor.concretoClaro,
    metal: cor.metal,
    escuro: cor.escuro,
    madeira: cor.madeira,
    sombra: mix(cor.gramaA, pv("black"), 0.45),
    sombraCam: mix(cor.azulEsc, pv("black"), 0.45),
  };

  // Maior altura no tile (x, y) sem tapar a pista para a câmera do sul.
  const teto = (x, y) => zonas.alturaMax(x, y) - 0.05;
  const nosso = (x, y) => zonas.naZona("arquibancadas", x, y);

  ctx.reservar(14, 46, 37, 43);
  ctx.reservar(47, 70, 51, 54);
  ctx.reservar(67, 70, 50, 50);

  // ---- Ajudantes de geometria (tudo no lote compartilhado) ------------------------
  const V = (x, h, y) => new THREE.Vector3(wx(x), h, wz(y));
  // Barra (caixa w × t × comprimento) entre dois pontos [x, h, y] (tile).
  const barra = (a, b, w, t, cr) => {
    const p0 = V(...a);
    const p1 = V(...b);
    const len = p0.distanceTo(p1);
    if (len < 1e-4) return;
    const z = p1.clone().sub(p0).normalize();
    const ref = Math.abs(z.x) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
    const x = ref.addScaledVector(z, -ref.dot(z)).normalize();
    const y = new THREE.Vector3().crossVectors(z, x);
    const m = new THREE.Matrix4().makeBasis(x, y, z).setPosition(p0.add(p1).multiplyScalar(0.5));
    lote.add(new THREE.BoxGeometry(w, t, len), cr, m);
  };
  // Triângulo com a frente para `para` (vetor do mundo), pontos [x, h, y].
  const tri = (a, b, c, cr, para) => {
    const pa = V(...a);
    const pb = V(...b);
    const pc = V(...c);
    const n = new THREE.Vector3().crossVectors(pb.clone().sub(pa), pc.clone().sub(pa));
    const pts = n.dot(para) >= 0 ? [pa, pb, pc] : [pa, pc, pb];
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    lote.add(g, cr);
  };
  const SUL = new THREE.Vector3(0, 0.6, 1);
  const CIMA = new THREE.Vector3(0, 1, 0);
  // Varal de bandeirinhas (barriga no meio) de a até b, altura h.
  const CORES_BAND = [C.vermelho, C.amarelo, C.azul, C.branco, C.verde];
  const varal = (x0, x1, y, h, barriga = 0.1, passo = 0.3) => {
    const n = Math.max(2, Math.round((x1 - x0) / passo));
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const u = i / n;
      const hh = h - barriga * 4 * u * (1 - u);
      if (prev) barra(prev, [x, hh, y], 0.015, 0.015, C.escuro);
      prev = [x, hh, y];
      if (i < n) {
        const w = ((x1 - x0) / n) * 0.8;
        tri([x + 0.02, hh, y + 0.01], [x + w, hh - 0.005, y + 0.01], [x + w / 2 + 0.01, hh - 0.2, y + 0.01], CORES_BAND[i % CORES_BAND.length], SUL);
      }
    }
  };
  // Bolha de sombra (disco escuro no chão / no piso).
  const bolha = (x, y, h, r, cr = C.sombra) => {
    const g = new THREE.CircleGeometry(r, 12).rotateX(-Math.PI / 2);
    g.translate(wx(x), h + 0.006, wz(y));
    add(g, cr);
  };

  // ---- A: degraus, cadeirinhas e escadas -------------------------------------------
  // Trechos de degrau entre as escadas.
  const trechos = [];
  {
    let x = A.x0 - 0.3;
    for (const sx of ESCADAS) {
      trechos.push([x, sx - 0.45]);
      x = sx + 0.45;
    }
    trechos.push([x, A.x1 + 0.3]);
  }
  const noCamarote = (x, i) => i <= 1 && x > CAMAROTE.x0 && x < CAMAROTE.x1;
  const SETORES = [C.amarelo, C.azul, C.branco, C.azulMed];
  // Parapeito da frente: o degrau de baixo termina nele (y em tile).
  const Y_PAR = A.y1 + 0.26;
  for (let i = 0; i < DEG; i++) {
    const y = yDeg(i);
    const h = alturaDeg(i);
    trechos.forEach(([x0, x1], s) => {
      add(caixa(x0, x1, 0, h, y - 0.5, i === 0 ? Y_PAR : y + 0.5), i % 2 ? C.concreto : C.concretoClaro);
      // Quina do degrau (faixa azul na frente; o de baixo tem o parapeito).
      if (i > 0) add(caixa(x0, x1, h - 0.05, h + 0.012, y + 0.44, y + 0.5), C.azul);
      // Cadeirinhas (assento e encosto) no fundo do degrau; o camarote não tem.
      const corSetor = SETORES[(s + i) % SETORES.length];
      for (let x = x0 + 0.27; x < x1 - 0.2; x += 0.5) {
        if (noCamarote(x, i)) continue;
        add(caixa(x - 0.18, x + 0.18, h + 0.1, h + 0.17, y - 0.42, y - 0.12), corSetor);
        add(caixa(x - 0.18, x + 0.18, h + 0.17, h + 0.42, y - 0.47, y - 0.41), corSetor);
        add(caixa(x - 0.04, x + 0.04, h, h + 0.1, y - 0.32, y - 0.22), C.metal);
      }
    });
    // Escadas: dois meio-degraus por fileira, quina amarela.
    for (const sx of ESCADAS) {
      const meio = h - 0.16;
      add(caixa(sx - 0.45, sx + 0.45, 0, meio, y, y + 0.5), C.concretoClaro);
      add(caixa(sx - 0.45, sx + 0.45, 0, h, y - 0.5, y), C.concretoClaro);
      add(caixa(sx - 0.45, sx + 0.45, meio - 0.02, meio + 0.01, y + 0.45, y + 0.5), C.amarelo);
      add(caixa(sx - 0.45, sx + 0.45, h - 0.02, h + 0.01, y - 0.05, y), C.amarelo);
    }
  }
  // Corrimão no eixo de cada escada (postes e barra inclinada).
  for (const sx of ESCADAS) {
    for (let i = 0; i < DEG; i += 2) add(caixa(sx - 0.025, sx + 0.025, alturaDeg(i) - 0.16, alturaDeg(i) + 0.55, yDeg(i) + 0.2, yDeg(i) + 0.25), C.metal);
    barra([sx, 0.14 + 0.55, A.y1 + 0.25], [sx, alturaDeg(DEG - 1) + 0.55, A.y0 - 0.2], 0.05, 0.05, C.amarelo);
  }

  // Parapeito da frente (azul, tampa amarela), com vão nas escadas (um
  // portãozinho amarelo baixo). No camarote: mureta branca baixa e um
  // guarda-corpo vazado (postes e corrimão), para os mascotes aparecerem.
  const parapeito = (x0, x1) => {
    if (x1 <= x0) return;
    add(caixa(x0, x1, 0, 0.55, Y_PAR, Y_PAR + 0.14), C.azul);
    add(caixa(x0, x1, 0.55, 0.6, Y_PAR - 0.02, Y_PAR + 0.16), C.amarelo);
  };
  {
    let x = A.x0 - 0.48;
    for (const sx of [...ESCADAS.filter((e) => e < CAMAROTE.x0), CAMAROTE.x0, ...ESCADAS.filter((e) => e > CAMAROTE.x1)]) {
      if (sx === CAMAROTE.x0) {
        parapeito(x, CAMAROTE.x0);
        x = CAMAROTE.x1;
        continue;
      }
      parapeito(x, sx - 0.45);
      add(caixa(sx - 0.45, sx + 0.45, 0.22, 0.28, Y_PAR + 0.05, Y_PAR + 0.09), C.amarelo);
      x = sx + 0.45;
    }
    parapeito(x, A.x1 + 0.48);
  }
  add(caixa(CAMAROTE.x0, CAMAROTE.x1, 0, 0.42, Y_PAR, Y_PAR + 0.14), C.branco);
  add(caixa(CAMAROTE.x0, CAMAROTE.x1, 0.62, 0.67, Y_PAR + 0.03, Y_PAR + 0.11), C.amarelo);
  for (let x = CAMAROTE.x0 + 0.05; x <= CAMAROTE.x1; x += (CAMAROTE.x1 - CAMAROTE.x0 - 0.1) / 9) add(caixa(x - 0.03, x + 0.03, 0.42, 0.62, Y_PAR + 0.04, Y_PAR + 0.1), C.metal);

  // Paredes laterais em degrau.
  for (const [x0, x1] of [
    [A.x0 - 0.48, A.x0 - 0.3],
    [A.x1 + 0.3, A.x1 + 0.48],
  ]) {
    for (let i = 0; i < DEG; i++) {
      const y = yDeg(i);
      const h = alturaDeg(i) + 0.5;
      add(caixa(x0, x1, 0, h, y - 0.5, i === 0 ? Y_PAR + 0.14 : y + 0.5), C.azul);
      add(caixa(x0 - 0.02, x1 + 0.02, h, h + 0.05, y - 0.5, i === 0 ? Y_PAR + 0.16 : y + 0.5), C.amarelo);
    }
  }

  // Muro do fundo (azul-escuro) com placas.
  const Y_MURO = A.y0 - 0.52;
  const H_MURO = Math.min(2.95, teto(30, Y_MURO));
  add(caixa(A.x0 - 0.48, A.x1 + 0.48, 0, H_MURO, Y_MURO - 0.2, Y_MURO), C.azulEsc);
  add(caixa(A.x0 - 0.48, A.x1 + 0.48, H_MURO, H_MURO + 0.07, Y_MURO - 0.22, Y_MURO + 0.02), C.amarelo);
  for (const x of [18, 28.5, 39.5]) placa("semec", x, Y_MURO + 0.01, H_MURO - 0.42, 2.2, 0.55);

  // ---- Cobertura em balanço -----------------------------------------------------------
  // Altura conferida em toda a projeção do telhado (o leste é mais baixo:
  // o "U" da pista passa a ~4 tiles ao norte).
  let hTelhado = TELHADO.h0;
  for (let x = A.x0 - 1; x <= A.x1 + 1; x++) for (let y = Math.round(TELHADO.y0); y <= Math.round(TELHADO.y1); y++) hTelhado = Math.min(hTelhado, teto(x, y) - 0.1);
  const T0 = hTelhado;
  const T1 = hTelhado - (TELHADO.h0 - TELHADO.h1);
  const Y_PIL = Y_MURO - 0.38;
  for (const x of PILARES) {
    add(caixa(x - 0.1, x + 0.1, 0, T0, Y_PIL - 0.1, Y_PIL + 0.1), C.metal);
    // Viga em balanço e mão-francesa.
    barra([x, T0 - 0.05, TELHADO.y0], [x, T1 - 0.05, TELHADO.y1], 0.12, 0.16, C.metal);
    barra([x, T0 - 1.0, Y_PIL + 0.1], [x, T0 - 0.15, TELHADO.y0 + 1.5], 0.08, 0.08, C.metal);
    // Bandeira no alto do pilar (se couber).
    const topo = T0 + 0.95;
    if (topo < teto(x, Y_PIL) && topo < teto(x, Y_PIL + 1)) {
      add(caixa(x - 0.025, x + 0.025, T0, topo, Y_PIL - 0.025, Y_PIL + 0.025), C.escuro);
      const corB = PILARES.indexOf(x) % 2 ? C.amarelo : C.azul;
      const corF = PILARES.indexOf(x) % 2 ? C.azul : C.amarelo;
      add(caixa(x + 0.03, x + 0.55, topo - 0.34, topo - 0.02, Y_PIL - 0.01, Y_PIL + 0.01), corB);
      add(caixa(x + 0.03, x + 0.55, topo - 0.21, topo - 0.15, Y_PIL - 0.015, Y_PIL + 0.015), corF);
    }
  }
  // Telhas listradas (azul/branco), uma por tile.
  for (let x = A.x0 - 0.5, k = 0; x < A.x1 + 0.5; x += 1, k++) {
    barra([x + 0.5, T0 + 0.06, TELHADO.y0], [x + 0.5, T1 + 0.06, TELHADO.y1], 1.0, 0.06, k % 2 ? C.branco : C.azul);
  }
  // Testeira amarela e o varal de bandeirinhas logo abaixo.
  barra([A.x0 - 0.6, T1 - 0.1, TELHADO.y1 + 0.02], [A.x1 + 0.6, T1 - 0.1, TELHADO.y1 + 0.02], 0.08, 0.3, C.amarelo);
  varal(A.x0 - 0.4, A.x1 + 0.4, TELHADO.y1 + 0.08, T1 - 0.26, 0.0, 0.32);

  // Telão: moldura escura em dois postes, atrás do muro (a tela é da torcida).
  const telaoTopo = Math.min(TELAO.h + TELAO.alt / 2 + 0.12, teto(TELAO.x - 1, TELAO.y), teto(TELAO.x + 1, TELAO.y));
  const telaoH = telaoTopo - 0.12 - TELAO.alt / 2;
  for (const dx of [-1.15, 1.15]) add(caixa(TELAO.x + dx - 0.07, TELAO.x + dx + 0.07, 0, telaoH, TELAO.y - 0.3, TELAO.y - 0.16), C.escuro);
  add(caixa(TELAO.x - TELAO.w / 2 - 0.1, TELAO.x + TELAO.w / 2 + 0.1, telaoH - TELAO.alt / 2 - 0.1, telaoH + TELAO.alt / 2 + 0.1, TELAO.y - 0.16, TELAO.y - 0.02), C.escuro);
  add(caixa(TELAO.x - TELAO.w / 2 - 0.1, TELAO.x + TELAO.w / 2 + 0.1, telaoH + TELAO.alt / 2 + 0.1, telaoH + TELAO.alt / 2 + 0.14, TELAO.y - 0.16, TELAO.y), C.amarelo);

  // ---- Camarote SEMEC ----------------------------------------------------------------
  const H_CAM = alturaDeg(1); // piso de trás (o time)
  const H_FRENTE = alturaDeg(0); // piso da frente (os mascotes)
  add(caixa(CAMAROTE.x0, CAMAROTE.x1, H_CAM, H_CAM + 0.02, yDeg(1) - 0.5, yDeg(1) + 0.5), C.azulEsc);
  add(caixa(CAMAROTE.x0, CAMAROTE.x1, H_FRENTE, H_FRENTE + 0.02, yDeg(0) - 0.5, Y_PAR), C.azulEsc);
  // Laterais de vidro (com perfil amarelo).
  for (const x of [CAMAROTE.x0, CAMAROTE.x1]) {
    add(caixa(x - 0.04, x + 0.04, H_FRENTE, H_CAM + 0.75, yDeg(1) - 0.5, Y_PAR), C.azulVidro);
    add(caixa(x - 0.05, x + 0.05, H_CAM + 0.75, H_CAM + 0.8, yDeg(1) - 0.5, Y_PAR), C.amarelo);
  }
  // Balões nos cantos da frente (cachos de três, com barbante).
  const geoBalao = () => new THREE.IcosahedronGeometry(0.13, 1);
  const CORES_BALAO = [C.azul, C.amarelo, C.vermelho, C.branco, C.azulMed];
  for (const [bx, k] of [
    [CAMAROTE.x0 + 0.15, 0],
    [CAMAROTE.x1 - 0.15, 1],
  ]) {
    const by = Y_PAR + 0.05;
    [
      [-0.14, 1.45, 0.0],
      [0.13, 1.52, -0.05],
      [0.0, 1.7, 0.03],
    ].forEach(([dx, h, dy], j) => {
      const g = geoBalao().scale(1, 1.15, 1);
      g.translate(wx(bx + dx), h, wz(by + dy));
      add(g, CORES_BALAO[(k * 2 + j) % CORES_BALAO.length]);
      barra([bx, 0.6, by], [bx + dx, h - 0.15, by + dy], 0.012, 0.012, C.branco);
    });
  }

  // ---- Torcida da arquibancada (lista de instâncias) ---------------------------------
  const CABELOS = [pv("gray-900"), mix(pv("gray-900"), pv("yellow-800"), 0.45), pv("yellow-800"), mix(pv("yellow-400"), pv("yellow-800"), 0.4), pv("gray-400"), pv("red-600")];
  const CALCAS = [pv("gray-700"), pv("blue-900"), pv("gray-800"), mix(pv("blue-700"), pv("gray-700"), 0.5), mix(pv("yellow-800"), white, 0.3)];
  const CAMISAS = [...cor.camisas, pv("blue-700"), pv("yellow-500"), pv("blue-700")];
  const CARTAZES = ["vai", "semec", "ds", "coracao", "bora", "nota10", "estrela", "a11y"];
  const sorteia = (l) => l[Math.floor(rand() * l.length)];
  const pessoa = (x, y, h, giro, { cartaz = 0.14 } = {}) => {
    const crianca = rand() < 0.12;
    const temCartaz = rand() < cartaz;
    return {
      x: wx(x),
      z: wz(y),
      h,
      giro,
      s: crianca ? 0.78 : 0.92 + rand() * 0.16,
      camisa: sorteia(CAMISAS),
      pele: sorteia(cor.pele),
      cabelo: rand() < 0.08 ? pv("red-600") : sorteia(CABELOS.slice(0, 5)),
      calca: sorteia(CALCAS),
      fase: rand() * Math.PI * 2,
      energia: 0.7 + rand() * 0.5,
      // Pose parada: braços abertos ou, com reducedMotion, alguns para cima.
      braco: reducedMotion && rand() < 0.18 ? 2.4 : rand() * 0.35,
      modo: temCartaz ? 1 : 0,
      placa: sorteia(CARTAZES),
    };
  };
  const lista = [];
  const densidade = lite ? 0.4 : 0.8;
  for (let i = 0; i < DEG; i++) {
    const y = yDeg(i);
    for (let x = A.x0 - 0.25; x <= A.x1 + 0.25; x += 0.5) {
      const xx = x + (rand() - 0.5) * 0.1;
      if (ESCADAS.some((sx) => Math.abs(xx - sx) < 0.6)) continue;
      if (noCamarote(xx, i) || (i <= 1 && Math.abs(xx - CAMAROTE.x0) < 0.3) || (i <= 1 && Math.abs(xx - CAMAROTE.x1) < 0.3)) continue;
      if (rand() > densidade) continue;
      lista.push(pessoa(xx, y + 0.1, alturaDeg(i), (rand() - 0.5) * 0.4));
    }
  }

  // ---- a: a torcida do outro lado da reta (tudo baixo) ---------------------------------
  const perto = (x, y, pts, r) => pts.some(([px, py]) => Math.abs(px - x) < r[0] && Math.abs(py - y) < r[1]);
  const livreA = (x, y, r = 0.3) => nosso(x, y) && !perto(x, y, [PIPOCA], [0.75, 0.55]) && !perto(x, y, SOMBRINHAS, [r, r]);
  {
    const Y_GRADE = 51.55;
    // Grade baixa: postes azuis, duas réguas (a de cima amarela).
    const trechosG = [[47.2, 70.3]];
    for (const [x0, x1] of trechosG) {
      const n = Math.round((x1 - x0) / 1.1);
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        add(caixa(x - 0.04, x + 0.04, 0, Math.min(0.55, teto(x, Y_GRADE)), Y_GRADE - 0.04, Y_GRADE + 0.04), C.azul);
      }
      add(caixa(x0, x1, 0.22, 0.26, Y_GRADE - 0.025, Y_GRADE + 0.025), C.branco);
      add(caixa(x0, x1, 0.5, 0.56, Y_GRADE - 0.035, Y_GRADE + 0.035), C.amarelo);
      // Varal de bandeirinhas em mastrinhos (a cada ~3,5 tiles).
      const m = Math.max(1, Math.round((x1 - x0) / 3.5));
      for (let i = 0; i <= m; i++) {
        const x = x0 + ((x1 - x0) * i) / m;
        add(caixa(x - 0.03, x + 0.03, 0, Math.min(1.12, teto(x, Y_GRADE)), Y_GRADE + 0.06, Y_GRADE + 0.12), C.branco);
        if (i < m) varal(x, x0 + ((x1 - x0) * (i + 1)) / m, Y_GRADE + 0.09, Math.min(1.1, teto(x, Y_GRADE)), 0.16, 0.28);
      }
    }
    // Guarda-sóis baixos: mastro e copa em gomos coloridos.
    SOMBRINHAS.forEach(([sx, sy], k) => {
      const hTopo = Math.min(1.42, teto(sx, sy));
      const r = 0.68;
      const N = 8;
      const par = [
        [C.vermelho, C.branco],
        [C.azul, C.amarelo],
        [C.amarelo, C.branco],
        [C.verde, C.branco],
      ][k % 4];
      add(caixa(sx - 0.025, sx + 0.025, 0, hTopo, sy - 0.025, sy + 0.025), C.branco);
      for (let i = 0; i < N; i++) {
        const a0 = (i / N) * Math.PI * 2;
        const a1 = ((i + 1) / N) * Math.PI * 2;
        tri([sx, hTopo + 0.02, sy], [sx + Math.cos(a0) * r, hTopo - 0.24, sy + Math.sin(a0) * r], [sx + Math.cos(a1) * r, hTopo - 0.24, sy + Math.sin(a1) * r], par[i % 2], CIMA);
      }
      bolha(sx + 0.1, sy + 0.1, 0, 0.62);
      // Cooler (azul ou vermelho, tampa branca) e uma cadeira de praia.
      const cx = sx + (k % 2 ? -0.75 : 0.75);
      const cy = sy - 0.15;
      add(caixa(cx - 0.17, cx + 0.17, 0, 0.22, cy - 0.12, cy + 0.12), k % 2 ? C.vermelho : C.azul);
      add(caixa(cx - 0.18, cx + 0.18, 0.22, 0.27, cy - 0.13, cy + 0.13), C.branco);
      const dx = k % 2 ? 0.45 : -0.45;
      const ax = sx + dx;
      const ay = sy + 0.25;
      add(caixa(ax - 0.2, ax + 0.2, 0.16, 0.2, ay - 0.18, ay + 0.12), par[0]);
      barra([ax - 0.2, 0.18, ay - 0.18], [ax - 0.2, 0.48, ay - 0.32], 0.4, 0.04, par[1]);
      for (const ex of [-0.18, 0.18]) add(caixa(ax + ex - 0.015, ax + ex + 0.015, 0, 0.18, ay - 0.1, ay - 0.07), C.metal);
    });
    // Toalha de piquenique (xadrez vermelho e branco) com uma cesta.
    {
      const n = 4;
      const m = 3;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
          const x0 = TOALHA.x0 + ((TOALHA.x1 - TOALHA.x0) * i) / n;
          const y0 = TOALHA.y0 + ((TOALHA.y1 - TOALHA.y0) * j) / m;
          add(caixa(x0, x0 + (TOALHA.x1 - TOALHA.x0) / n, 0.01, 0.025, y0, y0 + (TOALHA.y1 - TOALHA.y0) / m), (i + j) % 2 ? C.branco : C.vermelho);
        }
      }
      const kx = TOALHA.x1 - 0.35;
      const ky = TOALHA.y0 + 0.3;
      add(caixa(kx - 0.16, kx + 0.16, 0.02, 0.22, ky - 0.11, ky + 0.11), C.madeira);
      barra([kx - 0.14, 0.22, ky], [kx, 0.34, ky], 0.03, 0.03, C.madeira);
      barra([kx, 0.34, ky], [kx + 0.14, 0.22, ky], 0.03, 0.03, C.madeira);
    }
    // Carrinho de pipoca (vermelho e branco, vitrine amarela, toldo listrado).
    {
      const [px, py] = PIPOCA;
      const hMax = Math.min(1.35, teto(px, py));
      add(caixa(px - 0.42, px + 0.42, 0.14, 0.62, py - 0.26, py + 0.26), C.vermelho);
      add(caixa(px - 0.43, px + 0.43, 0.36, 0.44, py - 0.27, py + 0.27), C.branco);
      add(caixa(px - 0.3, px + 0.3, 0.62, 0.95, py - 0.2, py + 0.2), mix(pv("yellow-400"), white, 0.4));
      for (const ex of [-0.42, 0.42]) add(caixa(px + ex - 0.03, px + ex + 0.03, 0.62, hMax - 0.08, py - 0.03, py + 0.03), C.branco);
      for (let i = 0; i < 6; i++) {
        const x0 = px - 0.5 + (i * 1.0) / 6;
        add(caixa(x0, x0 + 1.0 / 6, hMax - 0.08, hMax, py - 0.34, py + 0.34), i % 2 ? C.branco : C.vermelho);
      }
      for (const ex of [-0.3, 0.3]) {
        const g = new THREE.CylinderGeometry(0.14, 0.14, 0.05, 10).rotateX(Math.PI / 2);
        g.translate(wx(px + ex), 0.14, wz(py + 0.28));
        add(g, C.escuro);
      }
      bolha(px, py + 0.05, 0, 0.55);
    }
    // Mastros com bandeira lá atrás (y 54,5: aqui a câmera já não tapa nada).
    for (const [fx2, k] of [
      [47.6, 0],
      [55.7, 1],
      [61.2, 2],
      [69.8, 3],
    ]) {
      const fy = 54.45;
      if (!nosso(fx2, fy)) continue;
      const topo = Math.min(2.3, teto(fx2, fy));
      add(caixa(fx2 - 0.03, fx2 + 0.03, 0, topo, fy - 0.03, fy + 0.03), C.branco);
      const [c1, c2] = k % 2 ? [C.amarelo, C.azul] : [C.azul, C.amarelo];
      add(caixa(fx2 + 0.03, fx2 + 0.68, topo - 0.42, topo - 0.02, fy - 0.01, fy + 0.01), c1);
      add(caixa(fx2 + 0.03, fx2 + 0.68, topo - 0.26, topo - 0.18, fy - 0.015, fy + 0.015), c2);
    }
    // Torcida em pé atrás da grade, virada para a pista (para o norte),
    // um pouco de lado para quem vem do oeste.
    const densA = lite ? 0.3 : 0.6;
    for (const y of [52.05, 52.65, 53.3]) {
      for (let x = 47.4; x <= 70.2; x += 0.55) {
        const xx = x + (rand() - 0.5) * 0.2;
        const yy = y + (rand() - 0.5) * 0.15;
        if (rand() > densA || !livreA(xx, yy) || (xx > TOALHA.x0 - 0.2 && xx < TOALHA.x1 + 0.2 && yy > TOALHA.y0 - 0.2 && yy < TOALHA.y1 + 0.2)) continue;
        lista.push(pessoa(xx, yy, 0, Math.PI + (rand() < 0.5 ? -1 : 1) * (0.45 + rand() * 0.5), { cartaz: 0.2 }));
      }
    }
  }

  // ---- Faixas e telão (instâncias "só cartaz" da torcida) ----------------------------
  const faixa = (nome, x, y, h, w, alt, inclina = 0) => {
    lista.push({ x: wx(x), z: wz(y), h, w, alt, inclina, modo: 2, placa: nome });
    return lista.length - 1;
  };
  faixa("fTorcida", 17.6, Y_PAR + 0.15, 0.3, 3.9, 0.42);
  faixa("fVai", 24.1, Y_PAR + 0.15, 0.3, 3.9, 0.42);
  faixa("fCamarote", (CAMAROTE.x0 + CAMAROTE.x1) / 2, Y_PAR + 0.15, 0.22, 4.6, 0.32);
  faixa("fDs", 42.6, Y_PAR + 0.15, 0.3, 3.9, 0.42);
  faixa("fVila", 23.3, Y_MURO + 0.01, H_MURO - 0.42, 3.3, 0.36);
  faixa("fVila", 34.2, Y_MURO + 0.01, H_MURO - 0.42, 3.3, 0.36);
  faixa("fTorcida", 44.1, Y_MURO + 0.01, H_MURO - 0.42, 2.6, 0.3);
  const iTelao = faixa("telao", TELAO.x, TELAO.y, telaoH, TELAO.w, TELAO.alt);

  const { tex, reg } = criarTexturaTorcida(pal, lite);
  track(tex);
  const torcida = criarTorcida({ tex, reg, lista, lite, reducedMotion, pal, track });
  torcida.mesh.name = "pista-torcida";
  root.add(torcida.mesh);

  // ---- O time da SEMEC no camarote ----------------------------------------------------
  // Donos na fileira de trás do camarote, os mascotes na da frente (um tico
  // à direita de cada dono); todos de frente para a pista, levemente
  // virados para o pórtico (oeste).
  const lugares = TIME.map((d, i) => {
    const x = CAMAROTE.x0 + 0.62 + i * 1.12;
    bolha(x, yDeg(1) + 0.05, H_CAM + 0.02, 0.27, C.sombraCam);
    const pet = d.pet ? { x: wx(x + 0.5), z: wz(yDeg(0) + 0.1), h: H_FRENTE + 0.16, yaw: -0.15 } : null;
    if (pet && !lite) {
      // Pedestal redondo (azul e amarelo) para o mascote aparecer por cima da mureta.
      const g = new THREE.CylinderGeometry(0.2, 0.22, 0.14, 12);
      g.translate(wx(x + 0.5), H_FRENTE + 0.09, wz(yDeg(0) + 0.1));
      add(g, i % 2 ? C.amarelo : C.azul);
      bolha(x + 0.5, yDeg(0) + 0.1, H_FRENTE + 0.16, 0.15, C.sombraCam);
    }
    return { x: wx(x), z: wz(yDeg(1) + 0.05), h: H_CAM + 0.02, yaw: -0.2, pet };
  });
  let time = null;
  if (ctx.loader) {
    const grupo = new THREE.Group();
    grupo.name = "pista-time-semec";
    root.add(grupo);
    time = montarTime({
      grupo,
      lugares,
      loader: ctx.loader,
      baseUrl: ctx.baseUrl,
      carregar: ctx.carregar,
      lite,
      reducedMotion,
      pal,
      semente: ctx.semente(20261020),
      jogador: ctx.jogador,
      centro: V((CAMAROTE.x0 + CAMAROTE.x1) / 2, 0, yDeg(1)),
    });
  }

  // ---- Eventos ----------------------------------------------------------------------------
  const U = torcida.U;
  let festaT = -1;
  let gritoT = -1;
  let gritoForca = 1;
  const gritar = (forca) => {
    gritoT = 0;
    gritoForca = forca;
    if (time) comTime(() => time.grito());
  };
  const comTime = (fn) => {
    try {
      fn();
    } catch (e) {
      // O time é enfeite: um erro nele não para a torcida.
      console.error("[pista] arquibancadas: o time falhou", e);
      time = null;
    }
  };

  return {
    update(t, dt) {
      if (!reducedMotion) {
        U.uT.value = t;
        if (festaT >= 0) {
          festaT += dt;
          U.uFesta.value = festaT < 9 ? Math.min(1, festaT * 3) : 0.3;
        }
        if (gritoT >= 0) {
          gritoT += dt;
          const k = gritoT / 1.8;
          U.uGrito.value = k < 1 ? gritoForca * Math.min(1, gritoT * 6) * (1 - k * k) : 0;
          if (k >= 1) gritoT = -1;
        }
      }
      if (time) comTime(() => time.update(t, dt));
    },
    festa() {
      festaT = 0;
      torcida.trocarPlaca(iTelao, "telaoFesta");
      if (time) comTime(() => time.festa());
    },
    largada(fase) {
      if (fase === "verde" && !reducedMotion) gritar(1);
    },
    passou(i) {
      // Passou na chegada (o último checkpoint): grito curto.
      if (i === ctx.N - 1 && !reducedMotion) gritar(0.7);
    },
    dispose() {
      time?.dispose();
      time = null;
    },
  };
}
