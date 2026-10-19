// Pista de bicicleta da Vila SEMEC: o box (dono: tracado, retângulo "box"
// de zonas.js, x 24..46 × y 49..54).
//
// O box andável da corrida (circuito.js: BOX x 27..45 × y 50..53, menos a
// garagem, a bancada e o quadro de regras) fica igual; o que muda é o que
// está em volta e nos tiles bloqueados:
//   - muro dos boxes com tampo vermelho e branco e plaquinhas SEMEC na face
//     de dentro; os muros laterais e o do fundo agora fecham o retângulo
//     inteiro (x 24..46), e as faixas de fora do andável (x 24..26 a oeste,
//     x 46 a leste) viram cantinhos decorados: pódio com troféu e painel
//     SEMEC, pilhas de pneus, bebedouro e bomba de ar, estante de pneus e o
//     pit board;
//   - garagem (GARAGEM, tiles bloqueados): telhado azul em água única
//     (baixo no norte, alto no sul: não tapa a reta), uma baia aberta com
//     duas bicicletas, rodas penduradas e armário, outra com a porta de
//     enrolar SEMEC, toldo listrado e "GARAGEM SEMEC" pintado no telhado;
//   - bancada (BANCADA): tampo de madeira, gaveteiro vermelho, morsa, painel
//     de ferramentas e uma bicicleta de ponta-cabeça em conserto;
//   - quadro de REGRAS no mesmo tile (PLACA_REGRAS, infoEm), com chapéu;
//   - jardineiras e o portão (desliza para o leste: abrirPorta) com a placa
//     "VOLTAR À VILA" baixinha (não tapa quem chega no tile CHEGADA);
//   - dois postes de holofote nos cantos do fundo.
//
// Altura: a câmera vem do sul; o muro (0,68 de altura na linha y 48,8) já
// esconde o asfalto até y ≈ 48,25. Atrás dele, um objeto cuja borda norte
// está em y pode subir até (y − 48,25) × 1,15 sem esconder NADA a mais da
// pista (alturaAtras): é o teto usado aqui, por objeto.

import * as THREE from "three";
import { ABERTURA, BANCADA, BOX, GARAGEM, MURO_Y, PLACA_REGRAS } from "./circuito";
import { GX0, GX1, caixa, wx, wz } from "./comum";

// Altura máxima atrás do muro dos boxes (ver cabeçalho).
export const alturaAtras = (y) => Math.max(0, (y - 48.25) * 1.15);

const EIXO_Y = new THREE.Vector3(0, 1, 0);

// Barra (cilindro baixo) entre dois pontos locais/mundo (Vector3).
export function barraV(a, b, r, seg = 5) {
  const d = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r, r, d.length(), seg, 1, true);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(EIXO_Y, d.normalize()));
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

// Bicicleta low-poly em coordenadas locais (ao longo de +x, rodas no chão):
// lista de [geo, cor].
export function partesBike(corQuadro, cor, white) {
  const R = 0.2;
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const tras = V(-0.33, R);
  const frente = V(0.33, R);
  const selim = V(-0.1, 0.52);
  const movimento = V(0.01, 0.24);
  const cabeca = V(0.22, 0.5);
  const partes = [];
  for (const p of [tras, frente]) {
    partes.push([new THREE.TorusGeometry(R, 0.03, 4, 12).translate(p.x, p.y, 0), cor.pneu]);
    partes.push([new THREE.CylinderGeometry(0.035, 0.035, 0.06, 6).rotateX(Math.PI / 2).translate(p.x, p.y, 0), cor.metal]);
  }
  for (const [a, b] of [[tras, selim], [selim, movimento], [movimento, tras], [movimento, cabeca], [selim, cabeca], [cabeca, frente]]) {
    partes.push([barraV(a, b, 0.024, 4), corQuadro]);
  }
  partes.push([new THREE.BoxGeometry(0.16, 0.04, 0.07).translate(selim.x - 0.02, selim.y + 0.05, 0), cor.escuro]);
  partes.push([barraV(cabeca, V(0.2, 0.62), 0.02, 4), cor.metal]);
  partes.push([new THREE.BoxGeometry(0.04, 0.03, 0.34).translate(0.2, 0.63, 0), cor.escuro]);
  partes.push([new THREE.BoxGeometry(0.1, 0.02, 0.05).translate(0.01, 0.2, 0.05), white]);
  return partes;
}

export function montarBox(ctx, h) {
  const { pv, mix, white, cor, lite, lote, add, placa, matInst, vertexColored, root, track } = ctx;
  const { pinta, placaArte, bulbo } = h;
  const gx0 = GX0;
  const gx1 = GX1;
  const X0 = BOX.x0 - 3.3; // muro oeste novo (x ≈ 23,7)
  const X1 = BOX.x1 + 1.3; // muro leste novo (x ≈ 46,3)
  const YS = BOX.y1 + 1.3; // muro do fundo (y ≈ 54,3)
  const bx = (x0, x1, h0, h1, y0, y1, c) => add(caixa(x0, x1, h0, h1, y0, y1), c);
  const comMatriz = (geo, c, x, y, alt, giro = 0, extra = null) => {
    const mt = new THREE.Matrix4().makeTranslation(wx(x), alt, wz(y)).multiply(new THREE.Matrix4().makeRotationY(giro));
    if (extra) mt.multiply(extra);
    lote.add(geo, c, mt);
  };
  const cil = (x, y, r, h0, h1, c, seg = 10) => comMatriz(new THREE.CylinderGeometry(r, r, h1 - h0, seg), c, x, y, (h0 + h1) / 2);
  const bike = (x, y, giro, corQuadro, alt = 0, deCabecaPraBaixo = false) => {
    const extra = deCabecaPraBaixo ? new THREE.Matrix4().makeRotationX(Math.PI) : null;
    for (const [g, c] of partesBike(corQuadro, cor, white)) comMatriz(g, c, x, y, alt, giro, extra);
  };
  const pilhaPneus = (x, y, n) => {
    for (let i = 0; i < n; i++) {
      cil(x, y, 0.24, i * 0.17, i * 0.17 + 0.15, cor.pneu, 10);
      cil(x, y, 0.245, i * 0.17 + 0.06, i * 0.17 + 0.09, i % 2 ? cor.amarelo : white, 10);
    }
  };

  // ---- Muros --------------------------------------------------------------------------
  // Muro dos boxes (norte): concreto, tampo vermelho e branco alternado.
  const muroNorte = (x0, x1) => {
    bx(x0, x1, 0, 0.6, MURO_Y - 0.2, MURO_Y + 0.2, cor.concretoClaro);
    for (let x = x0; x < x1 - 0.01; x += 1) {
      const xe = Math.min(x1, x + 1);
      bx(x, xe, 0.6, 0.68, MURO_Y - 0.22, MURO_Y + 0.22, Math.round(x - x0) % 2 ? white : cor.vermelho);
    }
  };
  muroNorte(X0, ABERTURA[0] - 0.5);
  muroNorte(ABERTURA[1] + 0.5, X1 + 0.2);
  // Plaquinhas SEMEC na face de dentro (sul) do muro, viradas para a câmera.
  for (let x = X0 + 1.4; x < X1 - 1; x += 3.2) {
    if (x > ABERTURA[0] - 1.6 && x < ABERTURA[1] + 1.6) continue;
    if (x > GARAGEM.x0 - 1.2) continue;
    placa("semec", x, MURO_Y + 0.215, 0.32, 0.96, 0.24);
  }
  // Laterais e fundo (mais baixos), com tampo azul.
  const muro = (x0, x1, y0, y1, hh = 0.5) => {
    bx(x0, x1, 0, hh, y0, y1, cor.concretoClaro);
    bx(x0 - 0.02, x1 + 0.02, hh, hh + 0.07, y0 - 0.02, y1 + 0.02, cor.azul);
  };
  muro(X0 - 0.2, X0, MURO_Y - 0.2, YS + 0.2);
  muro(X1, X1 + 0.2, MURO_Y - 0.2, YS + 0.2);
  muro(X0 - 0.2, gx0, YS, YS + 0.2);
  muro(gx1, X1 + 0.2, YS, YS + 0.2);
  // Limite do andável nas faixas decoradas: filete amarelo no chão.
  pinta("listra", BOX.x0 - 0.56, (BOX.y0 + BOX.y1) / 2, BOX.y1 - BOX.y0 + 1, 0.1, Math.PI / 2, 0.03);
  pinta("listra", BOX.x1 + 0.56, (BOX.y0 + BOX.y1 + 1.2) / 2, BOX.y1 - BOX.y0 - 0.2, 0.1, Math.PI / 2, 0.03);

  // Entrada do box: "BOX" pintado e faixa zebrada de atenção no lugar da zebra.
  pinta("boxChao", (ABERTURA[0] + ABERTURA[1]) / 2, MURO_Y + 0.75, 1.6, 0.53);
  pinta("listra", (ABERTURA[0] + ABERTURA[1]) / 2, MURO_Y + 0.02, ABERTURA[1] - ABERTURA[0] + 1.4, 0.34);
  // Selo SEMEC no meio do piso.
  pinta("selo", 32.6, 52.3, 1.7, 1.7);

  // ---- Garagem ------------------------------------------------------------------------
  const G = GARAGEM;
  const gx = [G.x0 - 0.5, G.x1 + 0.5];
  const yN = G.y0 - 0.55; // fundo (norte), colado no muro
  const yS = G.y1 + 0.55; // fachada (sul)
  const hN = Math.min(1.25, alturaAtras(yN - 0.05));
  const hS = 2.25;
  const altEm = (y) => hN + ((y - yN) / (yS - yN)) * (hS - hN);
  // Paredes: fundo, laterais em degraus (o telhado inclinado cobre) e a
  // fachada com duas baias.
  bx(gx[0], gx[1], 0, hN, yN, yN + 0.12, cor.concretoClaro);
  for (const [x0, x1] of [[gx[0], gx[0] + 0.18], [gx[1] - 0.18, gx[1]]]) {
    const passos = 4;
    for (let i = 0; i < passos; i++) {
      const y0 = yN + ((yS - yN) * i) / passos;
      const y1 = yN + ((yS - yN) * (i + 1)) / passos;
      bx(x0, x1, 0, altEm(y0 + (y1 - y0) * 0.5), y0, y1, cor.concretoClaro);
    }
    bx(x0 - 0.01, x1 + 0.01, 0, 0.18, yN, yS, cor.concreto);
  }
  const baiaA = [gx[0] + 0.18, gx[0] + 2.45];
  const baiaB = [gx[0] + 2.65, gx[1] - 0.18];
  const hBaia = 1.55;
  bx(baiaA[1], baiaB[0], 0, hS, yS - 0.18, yS, cor.concretoClaro);
  bx(gx[0], gx[1], hBaia, hS - 0.02, yS - 0.18, yS, cor.azulEsc);
  bx(gx[0], gx[1], hBaia - 0.06, hBaia, yS - 0.2, yS + 0.02, cor.amarelo);
  // Letreiro BOX SEMEC na fachada (atlas compartilhado).
  placa("box", (gx[0] + gx[1]) / 2, yS + 0.01, (hBaia + hS) / 2, 2.4, 0.6);
  // Telhado inclinado (azul, beiral amarelo) com o letreiro pintado em cima.
  {
    const len = Math.hypot(yS - yN + 0.3, hS - hN);
    const ang = Math.atan2(hS - hN, yS - yN);
    const rot = new THREE.Matrix4().makeRotationX(-ang);
    const yc = (yN + yS) / 2;
    const hc = (hN + hS) / 2 + 0.06;
    comMatriz(new THREE.BoxGeometry(gx[1] - gx[0] + 0.3, 0.1, len), cor.azul, (gx[0] + gx[1]) / 2, yc, hc, 0, rot);
    comMatriz(new THREE.BoxGeometry(gx[1] - gx[0] + 0.34, 0.06, 0.12), cor.amarelo, (gx[0] + gx[1]) / 2, yS + 0.12, hS + 0.1, 0);
    const mt = new THREE.Matrix4()
      .makeTranslation(wx((gx[0] + gx[1]) / 2), hc + 0.056, wz(yc))
      .multiply(rot)
      .multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    h.decal.add(new THREE.PlaneGeometry(4.4, 1.1), h.regioes.garagem, mt);
  }
  // Baia A (aberta): piso escuro, fundo cinza, duas bicicletas, rodas
  // penduradas, armário e lâmpada.
  bx(baiaA[0], baiaA[1], 0.005, 0.03, yN + 0.12, yS - 0.18, mix(cor.concreto, cor.metal, 0.35));
  bx(baiaA[0], baiaA[1], 0.03, hN - 0.02, yN + 0.12, yN + 0.16, mix(cor.concretoClaro, cor.concreto, 0.6));
  bike((baiaA[0] + baiaA[1]) / 2 + 0.25, yN + 0.6, 0, cor.azul);
  bike((baiaA[0] + baiaA[1]) / 2 - 0.2, yN + 1.25, 0, cor.amarelo);
  for (const [x, hh] of [[baiaA[0] + 0.35, 0.9], [baiaA[0] + 0.85, 0.95]]) {
    comMatriz(new THREE.TorusGeometry(0.19, 0.03, 4, 12), cor.pneu, x, yN + 0.2, hh);
  }
  bx(baiaA[1] - 0.55, baiaA[1] - 0.05, 0, 0.95, yN + 0.16, yN + 0.5, cor.vermelho);
  for (let i = 1; i < 4; i++) bx(baiaA[1] - 0.52, baiaA[1] - 0.08, i * 0.23, i * 0.23 + 0.03, yN + 0.5, yN + 0.52, cor.metal);
  bulbo((baiaA[0] + baiaA[1]) / 2, yS - 0.4, hBaia - 0.12, "quente");
  // Baia B: porta de enrolar fechada (arte própria).
  placaArte("porta", (baiaB[0] + baiaB[1]) / 2, yS + 0.012, hBaia / 2, baiaB[1] - baiaB[0], hBaia);
  // Toldo listrado sobre a baia A (amarelo e branco), com sanefa.
  {
    const n = 6;
    const w = (baiaA[1] - baiaA[0] + 0.3) / n;
    const ang = Math.atan2(0.22, 0.55);
    for (let i = 0; i < n; i++) {
      const x = baiaA[0] - 0.15 + w * (i + 0.5);
      const c = i % 2 ? white : cor.amarelo;
      comMatriz(new THREE.BoxGeometry(w, 0.04, 0.6), c, x, yS + 0.28, hBaia + 0.05, 0, new THREE.Matrix4().makeRotationX(ang));
      bx(x - w / 2, x + w / 2, hBaia - 0.22, hBaia - 0.06, yS + 0.55, yS + 0.58, c);
    }
  }

  // ---- Bancada ------------------------------------------------------------------------
  const B = BANCADA;
  const bxa = B.x0 - 0.42;
  const bxb = B.x1 + 0.42;
  bx(bxa, bxb, 0.74, 0.82, B.y0 - 0.38, B.y0 + 0.3, cor.madeira);
  for (const x of [bxa + 0.06, bxb - 0.06]) for (const y of [B.y0 - 0.32, B.y0 + 0.24]) bx(x - 0.04, x + 0.04, 0, 0.74, y - 0.04, y + 0.04, cor.metal);
  bx(bxa + 0.04, bxb - 0.04, 0.2, 0.24, B.y0 - 0.34, B.y0 + 0.26, mix(cor.madeira, cor.escuro, 0.3));
  // Gaveteiro vermelho embaixo (gavetas com puxador amarelo).
  bx(bxa + 0.1, bxa + 0.62, 0.02, 0.7, B.y0 - 0.3, B.y0 + 0.2, cor.vermelho);
  for (let i = 0; i < 3; i++) bx(bxa + 0.26, bxa + 0.46, 0.18 + i * 0.2, 0.22 + i * 0.2, B.y0 + 0.2, B.y0 + 0.23, cor.amarelo);
  // Morsa e caixa de ferramentas em cima.
  bx(bxb - 0.38, bxb - 0.16, 0.82, 0.94, B.y0 - 0.2, B.y0 + 0.02, cor.metal);
  bx(bxb - 0.42, bxb - 0.12, 0.94, 0.99, B.y0 - 0.16, B.y0 - 0.04, cor.metal);
  bx(bxa + 0.12, bxa + 0.5, 0.82, 0.98, B.y0 - 0.06, B.y0 + 0.2, cor.azul);
  bx(bxa + 0.24, bxa + 0.38, 0.98, 1.02, B.y0 + 0.02, B.y0 + 0.12, cor.escuro);
  // Bicicleta de ponta-cabeça em conserto no meio da bancada.
  bike((bxa + bxb) / 2 + 0.05, B.y0 - 0.16, 0, cor.vermelho, 0.82 + 0.66, true);
  // Painel de ferramentas no muro, atrás da bancada.
  {
    const y = MURO_Y + 0.26;
    const topo = Math.min(1.25, alturaAtras(y));
    for (const x of [bxa + 0.12, bxb - 0.12]) bx(x - 0.03, x + 0.03, 0.6, topo, y - 0.03, y + 0.03, cor.metal);
    placaArte("ferramentas", (bxa + bxb) / 2, y + 0.04, (0.86 + topo) / 2, bxb - bxa - 0.2, Math.max(0.3, topo - 0.86));
  }

  // ---- Quadro de regras (mesmo tile: infoEm) ------------------------------------------
  {
    const R = PLACA_REGRAS;
    for (const dx of [-0.38, 0.38]) bx(R.x + dx - 0.04, R.x + dx + 0.04, 0, 1.05, R.y - 0.04, R.y + 0.04, cor.metal);
    bx(R.x - 0.48, R.x + 0.48, 0.53, 1.52, R.y - 0.07, R.y, cor.azulEsc);
    bx(R.x - 0.52, R.x + 0.52, 1.52, 1.6, R.y - 0.14, R.y + 0.06, cor.amarelo);
    bx(R.x - 0.56, R.x + 0.56, 1.6, 1.66, R.y - 0.16, R.y + 0.1, cor.azul);
    placa("regras", R.x, R.y + 0.01, 1.03, 0.86, 0.86);
  }

  // ---- Cantinho oeste (x 24..26, fora do andável) -------------------------------------
  {
    // Pódio 2-1-3 com números e troféu; painel SEMEC atrás.
    const cx = 25.25;
    const y0 = 52.05;
    const y1 = 53.25;
    const degraus = [
      [cx - 1.05, cx - 0.35, 0.3, 2],
      [cx - 0.35, cx + 0.35, 0.46, 1],
      [cx + 0.35, cx + 1.05, 0.2, 3],
    ];
    for (const [a, b, hh, n] of degraus) {
      bx(a, b, 0, hh, y0, y1, cor.azul);
      bx(a, b, hh, hh + 0.04, y0, y1, white);
      placaArte(`p${n}`, (a + b) / 2, y1 + 0.005, hh * 0.55, Math.min(0.42, hh * 0.9), Math.min(0.42, hh * 0.9));
    }
    // Troféu dourado no degrau do campeão.
    cil(cx, (y0 + y1) / 2, 0.1, 0.5, 0.56, cor.madeira, 8);
    cil(cx, (y0 + y1) / 2, 0.035, 0.56, 0.68, cor.amarelo, 6);
    comMatriz(new THREE.CylinderGeometry(0.13, 0.06, 0.18, 8), cor.amarelo, cx, (y0 + y1) / 2, 0.77);
    comMatriz(new THREE.TorusGeometry(0.06, 0.015, 4, 8), cor.amarelo, cx + 0.14, (y0 + y1) / 2, 0.78);
    comMatriz(new THREE.TorusGeometry(0.06, 0.015, 4, 8), cor.amarelo, cx - 0.14, (y0 + y1) / 2, 0.78);
    const yp = 51.7;
    for (const x of [cx - 1.0, cx + 1.0]) bx(x - 0.04, x + 0.04, 0, 1.45, yp - 0.04, yp + 0.04, cor.metal);
    bx(cx - 1.04, cx + 1.04, 0.88, 1.46, yp - 0.05, yp, cor.azulEsc);
    placa("semec", cx, yp + 0.01, 1.17, 2.0, 0.5);
    // Pilhas de pneus coladas no muro.
    pilhaPneus(24.35, 49.85, lite ? 3 : 4);
    pilhaPneus(24.95, 49.8, 3);
    if (!lite) pilhaPneus(24.6, 50.45, 2);
    // Bebedouro (garrafão azul) e bomba de ar.
    bx(25.85, 26.3, 0, 0.62, 50.65, 51.05, cor.concretoClaro);
    cil(26.07, 50.85, 0.15, 0.62, 0.95, mix(pv("blue-300"), white, 0.3), 8);
    bx(26.0, 26.14, 0.4, 0.48, 51.05, 51.08, cor.azul);
    if (!lite) {
      cil(25.55, 51.15, 0.05, 0, 0.55, cor.vermelho, 6);
      bx(25.4, 25.7, 0, 0.04, 51.1, 51.2, cor.escuro);
      bx(25.45, 25.65, 0.55, 0.58, 51.13, 51.17, cor.escuro);
    }
  }

  // ---- Cantinho leste (x 46, fora do andável) -----------------------------------------
  {
    // Estante de pneus (rodas em pé) e o pit board no cavalete.
    const x = 45.95;
    for (const y of [51.85, 53.15]) bx(x - 0.3, x + 0.3, 0, 0.9, y - 0.03, y + 0.03, cor.metal);
    bx(x - 0.3, x + 0.3, 0.42, 0.45, 51.85, 53.15, cor.metal);
    for (let i = 0; i < 4; i++) {
      const y = 52.05 + i * 0.3;
      comMatriz(new THREE.TorusGeometry(0.19, 0.045, 4, 12), cor.pneu, x, y, 0.65, Math.PI / 2);
      comMatriz(new THREE.TorusGeometry(0.19, 0.045, 4, 12), cor.pneu, x, y, 0.21, Math.PI / 2);
    }
    // Pit board no fundo, virado para a câmera.
    bx(45.92, 45.98, 0, 0.75, 53.75, 53.81, cor.metal);
    placaArte("pitboard", 45.95, 53.84, 0.9, 0.42, 0.56, { deFrente: true });
  }

  // ---- Jardineiras e portão -----------------------------------------------------------
  for (const [a, b] of [[X0, gx0 - 0.1], [gx1 + 0.1, X1]]) {
    if (b - a < 0.3) continue;
    bx(a, b, 0, 0.3, BOX.y1 + 0.62, YS, cor.concreto);
    bx(a + 0.05, b - 0.05, 0.3, 0.42, BOX.y1 + 0.67, YS - 0.05, cor.folhaA);
    // Florzinhas (amarelas e vermelhas) na jardineira.
    if (!lite) {
      for (let x = a + 0.3; x < b - 0.2; x += 0.55) {
        bx(x - 0.06, x + 0.06, 0.42, 0.52, BOX.y1 + 0.9, BOX.y1 + 1.02, Math.round(x * 3) % 2 ? cor.amarelo : pv("red-400"));
      }
    }
  }
  // Postes do portão (com bola amarela) e a placa "VOLTAR À VILA" baixa,
  // presa entre eles (topo a 1,5: quem está no tile CHEGADA aparece inteiro).
  for (const x of [gx0, gx1]) {
    bx(x - 0.1, x + 0.1, 0, 1.52, YS - 0.02, YS + 0.2, cor.azulEsc);
    comMatriz(new THREE.IcosahedronGeometry(0.11, 0), cor.amarelo, x, YS + 0.09, 1.6);
  }
  bx(gx0, gx1, 1.18, 1.5, YS + 0.12, YS + 0.18, cor.azulEsc);
  placaArte("voltar", (gx0 + gx1) / 2, YS + 0.19, 1.34, gx1 - gx0 - 0.25, 0.3);

  // Portão (desliza para o leste): grade azul, trilhos amarelos.
  const geoPortao = vertexColored([
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => [new THREE.BoxGeometry(0.05, 0.96, 0.05).translate(-0.9 + i * 0.225, 0.6, 0), cor.azul]),
    [new THREE.BoxGeometry(1.95, 0.08, 0.07).translate(0, 1.1, 0), cor.amarelo],
    [new THREE.BoxGeometry(1.95, 0.08, 0.07).translate(0, 0.14, 0), cor.amarelo],
    [new THREE.BoxGeometry(0.6, 0.3, 0.075).translate(0, 0.62, 0), white],
    [new THREE.BoxGeometry(0.5, 0.06, 0.08).translate(0, 0.62, 0), cor.azul],
  ]);
  track(geoPortao);
  const portao = new THREE.Mesh(geoPortao, matInst);
  const portaoBase = new THREE.Vector3(wx((gx0 + gx1) / 2), 0, wz(BOX.y1 + 1.4));
  portao.position.copy(portaoBase);
  portao.castShadow = !lite;
  root.add(portao);

  // ---- Holofotes nos cantos do fundo ---------------------------------------------------
  for (const x of [X0 + 0.2, X1 - 0.1]) {
    const y = YS - 0.15;
    cil(x, y, 0.05, 0, 3.0, cor.metal, 6);
    bx(x - 0.32, x + 0.32, 2.95, 3.25, y - 0.12, y + 0.04, cor.escuro);
    for (const dx of [-0.16, 0.16]) bulbo(x + dx, y + 0.06, 3.1, "quente");
  }

  return {
    abrirPorta(k) {
      const kk = THREE.MathUtils.clamp(k, 0, 1);
      portao.position.x = portaoBase.x + kk * (gx1 - gx0 - 0.15);
    },
  };
}
