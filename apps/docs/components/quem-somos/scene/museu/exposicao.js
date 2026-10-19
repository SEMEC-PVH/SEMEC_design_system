// Galeria da Equipe: exposição do Design System.
//
// Ocupa os tiles de EXPOSICAO (layout.js): um bloco 4×2 no eixo do salão,
// ao sul do pedestal. Esses tiles já saem do `passable` do museu (o jogador
// não pisa neles); as peças são baixas (até ~1,25), porque a câmera vem do
// sul, alta.
//
// Num estrado de mármore com cordão de veludo (lados e fundo):
//   - fundo, à esquerda: totem de tokens, chips em 3D com as cores pv-* reais
//     e rótulos (--pv-blue-700…) e a tipografia (Aa, Poppins 400/600/700);
//   - fundo, à direita: painel de acessibilidade (contraste 7,1:1 × 1,5:1,
//     foco visível, leitor de tela) com as teclas Tab e Enter na prateleira;
//   - meio: 4 vitrines com componentes do kit em "maquete de UI" (Button,
//     Switch e Checkbox, Card com Badge e Tabs, Input e Alert), bandeja
//     inclinada para a câmera, tampa de vidro e plaquinha de latão;
//   - frente: mesa expositora com a linha do tempo do projeto (datas do git).
//
// Uso (index.js):
//   const expo = buildExposicao({ scene, pal, track, lite, reducedMotion, layout });
//   expo.update(t, dt);  // o interruptor liga/desliga, o botão "pressiona" e
//                        // a luz das vitrines respira (parado com reducedMotion)
//   expo.dispose();      // tira tudo da cena (geometrias vão pelo track)
//   expo.infos           // objetos que ensinam: [{ id, titulo, texto, tiles: [[x, y], ...] }]
//                        // (Espaço de frente para um tile abre o texto; infoEm em index.js)
//
// Desempenho: tudo o que é estático vai em poucos lotes mesclados — um com
// cores por vértice (todas as peças coloridas), um de latão e um com os
// textos num atlas de canvas — mais vidro, brilho e as 4 peças animadas:
// 9 draw calls (7 no `lite`, sem vidro e com atlas menor).

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const M4 = () => new THREE.Matrix4();
const T = (x, y, z) => M4().makeTranslation(x, y, z);
const RX = (a) => M4().makeRotationX(a);
const RY = (a) => M4().makeRotationY(a);
// Composição de matrizes da esquerda para a direita (pai → filho).
const comp = (...ms) => ms.reduce((acc, m) => acc.multiply(m), M4());

// Inclinação dos painéis do fundo (topo para o norte) e das bandejas das
// vitrines e da mesa (frente para a câmera).
const INCL_PAINEL = -0.16;
const INCL_BANDEJA = 0.26;

// ---- Canvas -----------------------------------------------------------------

function makeCanvas(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

// Texto numa linha, encolhendo até caber em `max` px.
function texto(g, pal, str, x, y, { peso = 600, tam = 24, cor, alinh = "left", max = Infinity, base = "middle" } = {}) {
  let size = tam;
  g.font = `${peso} ${size}px ${pal.font}`;
  while (g.measureText(str).width > max && size > 8) {
    size -= 1;
    g.font = `${peso} ${size}px ${pal.font}`;
  }
  g.fillStyle = cor.getStyle();
  g.textAlign = alinh;
  g.textBaseline = base;
  g.fillText(str, x, y);
}

function retRedondo(g, x, y, w, h, r, cor) {
  g.fillStyle = cor.getStyle();
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

// Atlas: um canvas grande com todos os textos e faces desenhadas (um só
// material). `reservar(w, h, desenhar)` aloca uma região (em px da escala
// cheia; no `lite` o canvas tem metade), desenha nela e devolve o retângulo
// de UV. Empacotamento em prateleiras, na ordem das chamadas.
function criarAtlas(lite) {
  const S = 2048;
  const k = lite ? 0.5 : 1;
  const canvas = makeCanvas(S * k, S * k);
  const g = canvas.getContext("2d");
  const PAD = 6;
  let cx = 0;
  let cy = 0;
  let alturaLinha = 0;
  function reservar(w, h, desenhar) {
    if (cx + w > S) {
      cx = 0;
      cy += alturaLinha + PAD;
      alturaLinha = 0;
    }
    const x = cx;
    const y = cy;
    cx += w + PAD;
    alturaLinha = Math.max(alturaLinha, h);
    g.save();
    g.setTransform(k, 0, 0, k, x * k, y * k);
    g.beginPath();
    g.rect(0, 0, w, h);
    g.clip();
    desenhar(g, w, h);
    g.restore();
    // Meio texel para dentro (sem sangrar a região vizinha no filtro).
    const m = 0.5 / k;
    return { u0: (x + m) / S, u1: (x + w - m) / S, v0: 1 - (y + h - m) / S, v1: 1 - (y + m) / S };
  }
  const textura = () => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  };
  return { reservar, textura };
}

// Luz de vitrine: mancha radial clara sobre preto (vai em mistura aditiva).
function makeBrilhoTexture(pal) {
  const S = 128;
  const canvas = makeCanvas(S, S);
  const g = canvas.getContext("2d");
  g.fillStyle = pal.pv("black").getStyle();
  g.fillRect(0, 0, S, S);
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, pal.lamp.getStyle());
  grad.addColorStop(0.5, pal.mix(pal.lamp, pal.pv("black"), 0.65).getStyle());
  grad.addColorStop(1, pal.pv("black").getStyle());
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---- Geometria ----------------------------------------------------------------

// Caixa centrada (arredondada se r > 0; o raio é limitado pela menor medida).
function bloco(w, h, d, r, seg) {
  if (!r) return new THREE.BoxGeometry(w, h, d);
  return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, Math.min(w, h, d) / 2 - 1e-4));
}

// Pílula (estádio) deitada: w × d no plano xz, altura h a partir de y = 0.
function pilula(w, d, h, curva) {
  const r = d / 2;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -r);
  s.lineTo(w / 2 - r, -r);
  s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-w / 2 + r, r);
  s.absarc(-w / 2 + r, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
  const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: curva });
  return geo.rotateX(-Math.PI / 2);
}

// Plano com UV numa região do atlas. `deitado`: virado para cima, com o
// topo do desenho para o norte (como a câmera, que vem do sul, lê).
function placaAtlas(reg, w, h, deitado = false) {
  const geo = new THREE.PlaneGeometry(w, h);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, reg.u0 + uv.getX(i) * (reg.u1 - reg.u0), reg.v0 + uv.getY(i) * (reg.v1 - reg.v0));
  }
  if (deitado) geo.rotateX(-Math.PI / 2);
  return geo;
}

const naoIndexada = (geo) => {
  if (!geo.index) return geo;
  const g = geo.toNonIndexed();
  geo.dispose();
  return g;
};

// Cor por vértice (o lote colorido usa um só material com vertexColors).
function pintar(geo, cor) {
  const g = naoIndexada(geo);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = cor.r;
    arr[i * 3 + 1] = cor.g;
    arr[i * 3 + 2] = cor.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}

export function buildExposicao({ scene, pal, track, lite, reducedMotion, layout }) {
  const root = new THREE.Group();
  root.name = "museu-exposicao";
  scene.add(root);
  // Centro do bloco reservado: as peças são montadas em volta dele
  // (x de -2 a 2, z de -1 a 1; z negativo = norte, para o pedestal).
  const ps = layout.EXPOSICAO.tiles.map(([x, y]) => layout.tileToWorld(x, y));
  root.position.copy(ps.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / ps.length));

  const { pv, mix } = pal;
  const white = pv("white");
  const seg = lite ? 1 : 3;
  const curva = lite ? 6 : 12;
  const rad = lite ? 8 : 14;

  // Cores (todas de tokens pv-*).
  const C = {
    marmore: mix(white, pv("gray-200"), 0.35),
    marmoreVeio: mix(white, pv("gray-300"), 0.6),
    marinho: pv("blue-900"),
    corpo: mix(white, pv("gray-100"), 0.6),
    feltro: pv("gray-800"),
    madeira: pal.woodLight,
    veludo: pv("red-800"),
    primaria: pv("blue-600"),
    secundaria: pv("gray-100"),
    borda: pv("gray-400"),
    foco: pv("blue-hero"),
    texto: pv("gray-900"),
  };

  // ---- Lotes -------------------------------------------------------------------
  const lote = { cor: [], ouro: [], atlas: [], brilho: [] };
  const corDe = (cor, geo, m) => lote.cor.push(pintar(m ? geo.applyMatrix4(m) : geo, cor));
  const ouroDe = (geo, m) => lote.ouro.push(naoIndexada(m ? geo.applyMatrix4(m) : geo));
  const atlasDe = (geo, m) => lote.atlas.push(naoIndexada(m ? geo.applyMatrix4(m) : geo));
  const brilhoDe = (geo, m) => lote.brilho.push(naoIndexada(m ? geo.applyMatrix4(m) : geo));
  // Caixa pelos limites (coordenadas da raiz da exposição).
  const caixa = (x0, x1, y0, y1, z0, z1, r = 0) =>
    bloco(x1 - x0, y1 - y0, z1 - z0, r, seg).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

  const atlas = criarAtlas(lite);
  const A = desenharAtlas(atlas, pal);

  // ---- Estrado ---------------------------------------------------------------------
  const Y0 = 0.095; // topo do estrado
  corDe(C.marinho, caixa(-1.98, 1.98, 0, 0.05, -0.98, 0.98, 0.015));
  corDe(C.marmore, caixa(-1.94, 1.94, 0.04, Y0, -0.94, 0.94, 0.015));
  // Filete dourado na borda do mármore.
  ouroDe(caixa(-1.95, 1.95, 0.044, 0.056, 0.935, 0.95));

  // Pedestais de latão e cordão de veludo nos lados e no fundo (a frente
  // é a própria mesa da linha do tempo).
  const PX = 1.88;
  const PZ = 0.88;
  const postes = [[-PX, PZ], [-PX, -PZ], [-0.62, -PZ], [0.62, -PZ], [PX, -PZ], [PX, PZ]];
  for (const [x, z] of postes) {
    ouroDe(new THREE.CylinderGeometry(0.05, 0.062, 0.025, rad).translate(x, Y0 + 0.0125, z));
    ouroDe(new THREE.CylinderGeometry(0.013, 0.013, 0.5, rad).translate(x, Y0 + 0.27, z));
    ouroDe(new THREE.SphereGeometry(0.03, rad, lite ? 4 : 8).translate(x, Y0 + 0.53, z));
  }
  for (let i = 0; i < postes.length - 1; i++) {
    const [ax, az] = postes[i];
    const [bx, bz] = postes[i + 1];
    const curvaCorda = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(ax, Y0 + 0.47, az),
      new THREE.Vector3((ax + bx) / 2, Y0 + 0.27, (az + bz) / 2),
      new THREE.Vector3(bx, Y0 + 0.47, bz),
    );
    corDe(C.veludo, new THREE.TubeGeometry(curvaCorda, lite ? 8 : 16, 0.015, lite ? 4 : 6, false));
  }

  // ---- Painéis do fundo -------------------------------------------------------------
  // Quadro do painel: origem no pé, x ao longo, y subindo pelo painel, z
  // saindo da face (para o sul), inclinado com o topo para o norte.
  const PAINEL_BASE = 0.16;
  const painel = (cx, w, h) => {
    const F = comp(T(cx, Y0 + PAINEL_BASE, -0.6), RX(INCL_PAINEL));
    // Base sob o painel (alta o bastante para a face passar por cima das vitrines).
    corDe(C.marinho, caixa(cx - w / 2 + 0.04, cx + w / 2 - 0.04, Y0, Y0 + PAINEL_BASE + 0.01, -0.72, -0.5, 0.01));
    corDe(C.marinho, bloco(w, h, 0.07, 0.012, seg).translate(0, h / 2, -0.035), F);
    ouroDe(bloco(w + 0.03, 0.024, 0.09, 0, seg).translate(0, h + 0.012, -0.035), F);
    return F;
  };

  // Totem de tokens: face no atlas e chips em 3D por cima dos desenhados.
  const P1 = { cx: -0.76, w: 2.18, h: 0.98 };
  const F1 = painel(P1.cx, P1.w, P1.h);
  const face1 = { w: 2.1, h: 0.9 };
  const face1Y = P1.h / 2;
  atlasDe(placaAtlas(A.tokens.reg, face1.w, face1.h).translate(0, face1Y, 0.002), F1);
  for (const chip of A.tokens.chips) {
    const x = (chip.cx / A.tokens.w - 0.5) * face1.w;
    const y = face1Y + (0.5 - chip.cy / A.tokens.h) * face1.h;
    const cw = (chip.w / A.tokens.w) * face1.w;
    const ch = (chip.h / A.tokens.h) * face1.h;
    corDe(pv(chip.token), bloco(cw, ch, 0.026, 0.007, seg).translate(x, y, 0.014), F1);
  }

  // Acessibilidade: face no atlas, prateleira com as teclas Tab e Enter.
  const P2 = { cx: 1.2, w: 1.3, h: 0.86 };
  const F2 = painel(P2.cx, P2.w, P2.h);
  const face2 = { w: 1.22, h: 0.74 };
  atlasDe(placaAtlas(A.a11y, face2.w, face2.h).translate(0, 0.075 + face2.h / 2, 0.002), F2);
  corDe(C.marinho, bloco(P2.w, 0.03, 0.12, 0.008, seg).translate(0, 0.035, 0.06), F2);
  for (const [x, w, reg] of [[-0.2, 0.16, A.teclaTab], [0.2, 0.24, A.teclaEnter]]) {
    corDe(C.borda, bloco(w + 0.012, 0.03, 0.102, 0.01, seg).translate(x, 0.065, 0.065), F2);
    corDe(C.secundaria, bloco(w, 0.05, 0.09, 0.014, seg).translate(x, 0.075, 0.065), F2);
    atlasDe(placaAtlas(reg, w - 0.03, 0.065, true).translate(x, 0.1015, 0.065), F2);
  }

  // ---- Vitrines -------------------------------------------------------------------------
  const PED_TOPO = Y0 + 0.33;
  const VH = 0.28; // altura da tampa de vidro
  const VX = [-1.41, -0.47, 0.47, 1.41];
  const animadas = []; // grupos das bandejas com peças que se mexem
  const vitrine = (cx, placa) => {
    // Pedestal: rodapé, corpo claro, faixa marinha e tampo de mármore.
    corDe(C.marinho, caixa(cx - 0.39, cx + 0.39, Y0, Y0 + 0.04, -0.26, 0.26));
    corDe(C.corpo, caixa(cx - 0.37, cx + 0.37, Y0 + 0.04, PED_TOPO - 0.05, -0.24, 0.24));
    corDe(C.marinho, caixa(cx - 0.38, cx + 0.38, PED_TOPO - 0.15, PED_TOPO - 0.105, -0.25, 0.25));
    corDe(C.marmore, caixa(cx - 0.41, cx + 0.41, PED_TOPO - 0.05, PED_TOPO, -0.28, 0.28, 0.012));
    // Bandeja de feltro inclinada para a câmera, com calço atrás.
    corDe(C.feltro, caixa(cx - 0.35, cx + 0.35, PED_TOPO, PED_TOPO + 0.1, -0.21, 0));
    const F = comp(T(cx, PED_TOPO + 0.06, 0), RX(INCL_BANDEJA));
    corDe(C.feltro, bloco(0.72, 0.04, 0.44, 0.008, seg), F);
    // Plaquinha de latão na beira da frente.
    ouroDe(bloco(0.62, 0.012, 0.075, 0, seg).translate(0, 0.026, 0.168), F);
    atlasDe(placaAtlas(placa, 0.6, 0.064, true).translate(0, 0.0325, 0.168), F);
    // Luz de vitrine: mancha clara sobre o feltro e, com vidro, a régua de
    // luz no alto da tampa (UV no miolo da mancha = cor cheia).
    brilhoDe(new THREE.PlaneGeometry(0.7, 0.42).rotateX(-Math.PI / 2).translate(0, 0.0215, 0), F);
    if (!lite) {
      const regua = new THREE.PlaneGeometry(0.62, 0.025).rotateX(-Math.PI / 2);
      const uv = regua.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5, 0.5);
      brilhoDe(regua.translate(cx, PED_TOPO + VH - 0.004, -0.2));
      // Arestas de latão da tampa de vidro.
      const e = 0.012;
      const [x0, x1, z0, z1, y1] = [cx - 0.38, cx + 0.38, -0.26, 0.26, PED_TOPO + VH];
      for (const [ax, az] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
        ouroDe(caixa(ax - e / 2, ax + e / 2, PED_TOPO, y1, az - e / 2, az + e / 2));
      }
      ouroDe(caixa(x0 - e / 2, x1 + e / 2, y1 - e, y1, z0 - e / 2, z0 + e / 2));
      ouroDe(caixa(x0 - e / 2, x1 + e / 2, y1 - e, y1, z1 - e / 2, z1 + e / 2));
      ouroDe(caixa(x0 - e / 2, x0 + e / 2, y1 - e, y1, z0, z1));
      ouroDe(caixa(x1 - e / 2, x1 + e / 2, y1 - e, y1, z0, z1));
      vidros.push(caixa(x0, x1, PED_TOPO, y1, z0, z1));
    }
    return F;
  };
  const vidros = [];
  const S = 0.02; // superfície da bandeja (no quadro da bandeja)

  // Grupo real que acompanha a bandeja (para as peças animadas).
  const grupoBandeja = (F) => {
    const g = new THREE.Group();
    F.decompose(g.position, g.quaternion, g.scale);
    root.add(g);
    animadas.push(g);
    return g;
  };

  // V1 — Button: primário (anima: pressiona) e secundário.
  const FV1 = vitrine(VX[0], A.placas[0]);
  const gV1 = grupoBandeja(FV1);
  const botao = new THREE.Group();
  botao.position.set(0, S, -0.09);
  gV1.add(botao);
  corDe(C.secundaria, bloco(0.44, 0.045, 0.12, 0.022, seg).translate(0, S + 0.0225, 0.065), FV1);
  corDe(C.borda, bloco(0.452, 0.04, 0.132, 0.024, seg).translate(0, S + 0.02, 0.065), FV1);
  atlasDe(placaAtlas(A.cancelar, 0.34, 0.08, true).translate(0, S + 0.0455, 0.065), FV1);

  // V2 — Switch (anima: liga/desliga) e Checkbox marcado, vazio e indeterminado.
  const FV2 = vitrine(VX[1], A.placas[1]);
  const gV2 = grupoBandeja(FV2);
  const caixaMarcacao = (x, z, estado) => {
    if (estado === "vazio") {
      corDe(C.borda, bloco(0.12, 0.034, 0.12, 0.016, seg).translate(x, S + 0.017, z), FV2);
      corDe(white, bloco(0.1, 0.036, 0.1, 0.012, seg).translate(x, S + 0.018, z), FV2);
      return;
    }
    corDe(C.primaria, bloco(0.12, 0.036, 0.12, 0.016, seg).translate(x, S + 0.018, z), FV2);
    const traco = (x0, z0, x1, z1) => {
      const dx = x1 - x0;
      const dz = z1 - z0;
      const L = Math.hypot(dx, dz);
      const m = comp(T(x + (x0 + x1) / 2, S + 0.04, z + (z0 + z1) / 2), RY(Math.atan2(-dz, dx)));
      corDe(white, new THREE.BoxGeometry(L + 0.014, 0.01, 0.016), comp(FV2, m));
    };
    if (estado === "marcado") {
      traco(-0.03, 0.0, -0.008, 0.024);
      traco(-0.008, 0.024, 0.032, -0.026);
    } else traco(-0.03, 0, 0.03, 0);
  };
  caixaMarcacao(0.17, -0.08, "marcado");
  caixaMarcacao(-0.04, 0.06, "vazio");
  caixaMarcacao(0.17, 0.06, "indeterminado");
  const trilhoMat = track(new THREE.MeshStandardMaterial({ color: C.primaria.clone(), roughness: 0.5 }));
  const trilho = new THREE.Mesh(track(pilula(0.27, 0.12, 0.04, curva)), trilhoMat);
  trilho.position.set(-0.12, S, -0.08);
  gV2.add(trilho);
  const SW_DESL = 0.072; // meio curso do botão do interruptor

  // V3 — Card com Tabs no cabeçalho e Badge "Novo" no canto.
  const FV3 = vitrine(VX[2], A.placas[2]);
  corDe(pv("gray-200"), bloco(0.51, 0.026, 0.31, 0.012, seg).translate(0, S + 0.013, -0.04), FV3);
  corDe(white, bloco(0.5, 0.03, 0.3, 0.012, seg).translate(0, S + 0.015, -0.04), FV3);
  atlasDe(placaAtlas(A.card, 0.48, 0.28, true).translate(0, S + 0.0305, -0.04), FV3);
  corDe(pv("green-800"), pilula(0.14, 0.056, 0.026, curva).translate(0.2, S + 0.03, -0.18), FV3);
  atlasDe(placaAtlas(A.badge, 0.1, 0.04, true).translate(0.2, S + 0.0565, -0.18), FV3);

  // V4 — Input (campo com label e foco) e Alert de erro.
  const FV4 = vitrine(VX[3], A.placas[3]);
  corDe(white, bloco(0.58, 0.026, 0.16, 0.01, seg).translate(0, S + 0.013, -0.1), FV4);
  atlasDe(placaAtlas(A.input, 0.56, 0.146, true).translate(0, S + 0.0265, -0.1), FV4);
  corDe(pv("red-50"), bloco(0.58, 0.026, 0.115, 0.01, seg).translate(0, S + 0.013, 0.05), FV4);
  atlasDe(placaAtlas(A.alerta, 0.56, 0.104, true).translate(0, S + 0.0265, 0.05), FV4);

  // ---- Mesa da linha do tempo -----------------------------------------------------------
  // Perfil em cunha (alto atrás, baixo na frente) extrudado ao longo de x.
  const MESA = { x: 1.78, zA: 0.44, zF: 0.9, hA: 0.34, hF: 0.2 };
  const perfil = new THREE.Shape();
  perfil.moveTo(-MESA.zA, 0);
  perfil.lineTo(-MESA.zF, 0);
  perfil.lineTo(-MESA.zF, MESA.hF);
  perfil.lineTo(-MESA.zA, MESA.hA);
  perfil.closePath();
  const cunha = new THREE.ExtrudeGeometry(perfil, { depth: MESA.x * 2, bevelEnabled: false });
  cunha.rotateY(Math.PI / 2).translate(-MESA.x, Y0, 0);
  corDe(C.madeira, cunha);
  const decl = Math.atan2(MESA.hA - MESA.hF, MESA.zF - MESA.zA);
  const meio = { y: Y0 + (MESA.hA + MESA.hF) / 2, z: (MESA.zA + MESA.zF) / 2 };
  const FM = comp(T(0, meio.y, meio.z), RX(decl));
  const compr = Math.hypot(MESA.hA - MESA.hF, MESA.zF - MESA.zA);
  corDe(C.marinho, bloco(MESA.x * 2 + 0.02, 0.02, compr + 0.02, 0.006, seg).translate(0, 0.008, 0), FM);
  atlasDe(placaAtlas(A.linha, MESA.x * 2 - 0.08, compr - 0.05, true).translate(0, 0.0185, 0), FM);
  ouroDe(caixa(-MESA.x - 0.01, MESA.x + 0.01, Y0 + MESA.hF - 0.02, Y0 + MESA.hF + 0.004, MESA.zF - 0.004, MESA.zF + 0.012));
  // Rodapé marinho da mesa.
  corDe(C.marinho, caixa(-MESA.x - 0.01, MESA.x + 0.01, Y0, Y0 + 0.04, MESA.zA + 0.01, MESA.zF + 0.012));

  // ---- Materiais e meshes ----------------------------------------------------------------
  const atlasTex = track(atlas.textura());
  const mats = {
    cor: track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62 })),
    ouro: track(new THREE.MeshStandardMaterial({ color: mix(pv("yellow-500"), pv("yellow-600"), 0.5), metalness: 0.55, roughness: 0.35 })),
    atlas: track(new THREE.MeshStandardMaterial({ map: atlasTex, emissive: white, emissiveMap: atlasTex, emissiveIntensity: lite ? 0.3 : 0.16, roughness: 0.55 })),
    brilho: track(new THREE.MeshBasicMaterial({ map: track(makeBrilhoTexture(pal)), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })),
  };
  const fechar = (geos, mat, { cast = true, receive = true } = {}) => {
    const merged = track(mergeGeometries(geos, false));
    for (const g of geos) g.dispose();
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = cast && !lite;
    mesh.receiveShadow = receive && !lite;
    root.add(mesh);
    return mesh;
  };
  fechar(lote.cor, mats.cor);
  fechar(lote.ouro, mats.ouro);
  fechar(lote.atlas, mats.atlas, { cast: false });
  const brilho = fechar(lote.brilho, mats.brilho, { cast: false, receive: false });
  brilho.renderOrder = 2;
  brilho.userData.noShadow = true;

  // Peças animadas (fora dos lotes): botão primário com o rótulo e o
  // botão do interruptor.
  const botaoCorpo = new THREE.Mesh(track(pintar(bloco(0.44, 0.055, 0.12, 0.024, seg).translate(0, 0.0275, 0), C.primaria)), mats.cor);
  const botaoRotulo = new THREE.Mesh(track(placaAtlas(A.salvar, 0.34, 0.08, true).translate(0, 0.0555, 0)), mats.atlas);
  botao.add(botaoCorpo, botaoRotulo);
  const pino = new THREE.Mesh(track(pintar(new THREE.CylinderGeometry(0.046, 0.046, 0.03, rad).translate(0, 0.045, 0), white)), mats.cor);
  pino.position.copy(trilho.position);
  gV2.add(pino);
  for (const m of [botaoCorpo, pino, trilho]) m.castShadow = !lite;

  // Tampas de vidro (fora do lite): um mesh só, sem sombra.
  if (vidros.length) {
    const vidro = fechar(vidros, track(new THREE.MeshStandardMaterial({
      color: mix(pv("blue-50"), white, 0.4),
      transparent: true,
      opacity: 0.14,
      roughness: 0.08,
      depthWrite: false,
    })), { cast: false, receive: false });
    vidro.renderOrder = 3;
    vidro.userData.noShadow = true;
  }

  // ---- Objetos que ensinam ------------------------------------------------------------------
  // Tiles de EXPOSICAO: fileira norte (y 8), vista do corredor ao norte e
  // dos lados; fileira sul (y 9), vista do corredor da mureta.
  const [ex0, ey0] = layout.EXPOSICAO.tiles[0];
  const infos = [
    {
      id: "expo-design-system",
      titulo: "O que é um Design System?",
      texto: [
        "Um Design System é uma caixa de peças prontas para montar telas: botões, campos, cartões, abas e avisos, todos com o mesmo jeito de ser e de funcionar. Assim, cada sistema da SEMEC parece parte da mesma família.",
        "Além das peças (os componentes), ele traz as regras de uso e os tokens: as cores, espaços e letras oficiais. O kit @semec/ds tem quase 50 componentes em React, documentados neste site; quem programa só encaixa as peças.",
        "As vitrines mostram alguns: Button (botão), Switch e Checkbox (ligar e marcar), Card, Badge e Tabs (cartão, etiqueta e abas), Input e Alert (campo e aviso). Na mesa da frente, a linha do tempo de como o projeto cresceu.",
      ],
      tiles: [[ex0, ey0 + 1], [ex0 + 1, ey0 + 1], [ex0 + 2, ey0 + 1]],
    },
    {
      id: "expo-tokens",
      titulo: "Tokens de design",
      texto: [
        "Tokens são nomes dados às decisões visuais: cada cor, espaço, tamanho de letra ou canto arredondado ganha um nome. Em vez de escrever um código de cor solto, quem programa usa o nome, e todas as telas ficam iguais.",
        "No SEMEC eles começam com pv-: --pv-blue-700 é um azul, --pv-gray-900 é o cinza do texto. Se a cor oficial mudar, troca-se o token num lugar só e todas as telas acompanham.",
        "A letra também é token: a família Poppins, nos pesos 400 (normal), 600 e 700 (negrito). O totem mostra amostras reais das cores pv-* em vários tons.",
      ],
      tiles: [[ex0, ey0], [ex0 + 1, ey0]],
    },
    {
      id: "expo-acessibilidade",
      titulo: "Acessibilidade (WCAG 2.1 AA)",
      texto: [
        "Acessibilidade é fazer telas que todo mundo consegue usar, inclusive quem enxerga pouco, não usa mouse ou depende de um leitor de tela (programa que lê a página em voz alta). A WCAG é a norma internacional; o SEMEC segue o nível AA.",
        "O texto precisa de contraste mínimo de 4,5:1 com o fundo (3:1 para letras grandes e bordas de controles). Branco sobre o azul --pv-blue-700 dá 7,1:1 e passa; cinza-claro sobre branco dá 1,5:1 e não passa.",
        "Tudo tem de funcionar só pelo teclado (Tab avança, Enter ativa), com o foco sempre visível, como o contorno azul em volta do botão. E cada controle tem um nome que o leitor de tela consegue anunciar.",
      ],
      tiles: [[ex0 + 2, ey0], [ex0 + 3, ey0], [ex0 + 3, ey0 + 1]],
    },
  ];

  // ---- Animação -------------------------------------------------------------------------------
  const corLigado = C.primaria.clone();
  const corDesligado = C.borda.clone();
  const suave = (x) => x * x * (3 - 2 * x);
  function aplicarInterruptor(k) {
    pino.position.x = trilho.position.x - SW_DESL + 2 * SW_DESL * k;
    trilhoMat.color.copy(corDesligado).lerp(corLigado, k);
  }
  aplicarInterruptor(1);

  function update(t) {
    if (reducedMotion) return;
    // Interruptor: 2 s ligado, 2 s desligado, com 0,3 s de transição.
    const fase = t % 4;
    const k = fase < 2 ? Math.min(fase / 0.3, 1) : 1 - Math.min((fase - 2) / 0.3, 1);
    aplicarInterruptor(suave(k));
    // Botão: um clique a cada 3 s (afunda e volta em 0,3 s).
    const c = t % 3;
    botao.position.y = S - (c < 0.3 ? Math.sin((c / 0.3) * Math.PI) * 0.018 : 0);
    // Luz das vitrines respira de leve.
    mats.brilho.opacity = 0.45 + Math.sin(t * 1.3) * 0.12;
  }

  function dispose() {
    root.removeFromParent();
  }

  return { update, dispose, infos, raiz: root };
}

// ---- Desenhos do atlas ----------------------------------------------------------------------------

function desenharAtlas(atlas, pal) {
  const { pv, mix } = pal;
  const white = pv("white");
  const R = {};

  // Totem de tokens: 5 famílias × 3 tons, rótulos e a coluna de tipografia.
  const TW = 1024;
  const TH = Math.round(TW / (2.1 / 0.9));
  const familias = [
    ["blue", [200, 600, 800]],
    ["green", [500, 700, 800]],
    ["red", [300, 600, 800]],
    ["yellow", [400, 600, 800]],
    ["gray", [100, 400, 700]],
  ];
  const chips = [];
  const reg = atlas.reservar(TW, TH, (g, w, h) => {
    g.fillStyle = pv("gray-950").getStyle();
    g.fillRect(0, 0, w, h);
    g.fillStyle = pv("blue-900").getStyle();
    g.fillRect(0, 0, w, 64);
    g.fillStyle = pv("yellow-500").getStyle();
    g.fillRect(0, 62, w, 3);
    texto(g, pal, "TOKENS DE COR", 26, 34, { peso: 700, tam: 34, cor: pv("yellow-500") });
    texto(g, pal, "--pv-*", 712, 34, { peso: 600, tam: 24, cor: pv("blue-200"), alinh: "right" });
    texto(g, pal, "TIPOGRAFIA", 870, 34, { peso: 700, tam: 26, cor: pv("yellow-500"), alinh: "center" });
    const colW = 138;
    const linhaH = 112;
    familias.forEach(([nome, tons], i) => {
      tons.forEach((tom, j) => {
        const cx = 30 + colW * (i + 0.5);
        const topo = 82 + j * linhaH;
        const token = `${nome}-${tom}`;
        const cw = 100;
        const ch = 56;
        retRedondo(g, cx - cw / 2, topo, cw, ch, 8, pv(token));
        chips.push({ token, cx, cy: topo + ch / 2, w: cw, h: ch });
        texto(g, pal, `--pv-${token}`, cx, topo + ch + 22, { peso: 600, tam: 17, cor: white, alinh: "center", max: colW - 6 });
      });
    });
    g.fillStyle = pv("blue-800").getStyle();
    g.fillRect(730, 84, 3, h - 104);
    texto(g, pal, "Aa", 870, 170, { peso: 700, tam: 128, cor: white, alinh: "center" });
    texto(g, pal, "Poppins", 870, 266, { peso: 600, tam: 36, cor: pv("yellow-500"), alinh: "center" });
    [[400, 806], [600, 870], [700, 934]].forEach(([peso, x]) => {
      texto(g, pal, String(peso), x, 320, { peso, tam: 26, cor: white, alinh: "center" });
    });
    texto(g, pal, "--font-family-sans", 870, 372, { peso: 600, tam: 18, cor: pv("blue-200"), alinh: "center" });
  });
  R.tokens = { reg, chips, w: TW, h: TH };

  // Linha do tempo: marcos tirados do git log do repositório.
  const LW = 1792;
  const LH = Math.round(LW / ((1.78 * 2 - 0.08) / 0.43));
  const marcos = [
    ["ago 2026", "Docs em Next.js", "blue-600"],
    ["ago 2026", "Contraste WCAG AA", "green-700"],
    ["ago 2026", "Tokens pv-*", "yellow-600"],
    ["set 2026", "Kit @semec/ds", "blue-800"],
    ["out 2026", "Vila SEMEC 3D", "red-600"],
    ["out 2026", "Galeria da Equipe", "yellow-800"],
  ];
  R.linha = atlas.reservar(LW, LH, (g, w, h) => {
    g.fillStyle = mix(white, pv("yellow-400"), 0.16).getStyle();
    g.fillRect(0, 0, w, h);
    g.strokeStyle = pv("yellow-800").getStyle();
    g.lineWidth = 4;
    g.strokeRect(6, 6, w - 12, h - 12);
    texto(g, pal, "LINHA DO", 34, h / 2 - 22, { peso: 700, tam: 32, cor: pv("blue-900") });
    texto(g, pal, "TEMPO", 34, h / 2 + 20, { peso: 700, tam: 32, cor: pv("blue-900") });
    const x0 = 300;
    const x1 = w - 150;
    g.fillStyle = pv("blue-900").getStyle();
    g.fillRect(x0 - 30, h / 2 - 3, x1 - x0 + 120, 6);
    const passo = (x1 - x0 - 100) / (marcos.length - 1);
    marcos.forEach(([data, nome, cor], i) => {
      const x = x0 + 50 + i * passo;
      g.fillStyle = pv(cor).getStyle();
      g.beginPath();
      g.arc(x, h / 2, 17, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = white.getStyle();
      g.beginPath();
      g.arc(x, h / 2, 6, 0, Math.PI * 2);
      g.fill();
      texto(g, pal, data, x, h / 2 - 46, { peso: 600, tam: 24, cor: pv("gray-700"), alinh: "center" });
      texto(g, pal, nome, x, h / 2 + 50, { peso: 700, tam: 28, cor: pv("blue-900"), alinh: "center", max: passo - 16 });
    });
  });

  // Acessibilidade: contraste que passa e que não passa, foco, leitor de tela.
  const AW = 640;
  const AH = Math.round(AW / (1.22 / 0.74));
  R.a11y = atlas.reservar(AW, AH, (g, w, h) => {
    g.fillStyle = pv("gray-50").getStyle();
    g.fillRect(0, 0, w, h);
    g.fillStyle = pv("blue-hero").getStyle();
    g.fillRect(0, 0, w, 58);
    texto(g, pal, "ACESSIBILIDADE", 22, 31, { peso: 700, tam: 28, cor: white });
    texto(g, pal, "WCAG 2.1 AA", w - 22, 31, { peso: 700, tam: 24, cor: pv("yellow-400"), alinh: "right" });
    // Amostras de contraste.
    retRedondo(g, 22, 74, 280, 92, 12, pv("blue-700"));
    texto(g, pal, "Aa", 162, 122, { peso: 700, tam: 56, cor: white, alinh: "center" });
    retRedondo(g, 338, 74, 280, 92, 12, pv("gray-200"));
    retRedondo(g, 341, 77, 274, 86, 10, white);
    texto(g, pal, "Aa", 478, 122, { peso: 700, tam: 56, cor: pv("gray-300"), alinh: "center" });
    texto(g, pal, "7,1:1  ✓ passa", 162, 190, { peso: 700, tam: 22, cor: pv("green-800"), alinh: "center" });
    texto(g, pal, "1,5:1  ✗ não passa", 478, 190, { peso: 700, tam: 22, cor: pv("red-700"), alinh: "center" });
    // Foco visível: anel azul afastado do botão.
    g.strokeStyle = pv("blue-hero").getStyle();
    g.lineWidth = 4;
    g.beginPath();
    g.roundRect(52, 222, 220, 66, 33);
    g.stroke();
    retRedondo(g, 61, 231, 202, 48, 24, pv("blue-600"));
    texto(g, pal, "Enviar", 162, 256, { peso: 700, tam: 24, cor: white, alinh: "center" });
    texto(g, pal, "Foco visível", 162, 312, { peso: 600, tam: 20, cor: pv("gray-700"), alinh: "center" });
    // Leitor de tela: alto-falante com ondas.
    const ax = 452;
    const ay = 255;
    g.fillStyle = pv("blue-700").getStyle();
    g.fillRect(ax - 22, ay - 13, 16, 26);
    g.beginPath();
    g.moveTo(ax - 6, ay - 13);
    g.lineTo(ax + 14, ay - 30);
    g.lineTo(ax + 14, ay + 30);
    g.lineTo(ax - 6, ay + 13);
    g.closePath();
    g.fill();
    g.strokeStyle = pv("blue-700").getStyle();
    g.lineWidth = 5;
    g.lineCap = "round";
    for (const r of [24, 40, 56]) {
      g.beginPath();
      g.arc(ax + 14, ay, r, -0.7, 0.7);
      g.stroke();
    }
    texto(g, pal, "Leitor de tela", 478, 312, { peso: 600, tam: 20, cor: pv("gray-700"), alinh: "center" });
    g.fillStyle = pv("gray-200").getStyle();
    g.fillRect(22, 338, w - 44, 2);
    texto(g, pal, "Teclado: Tab avança, Enter ativa", w / 2, 364, { peso: 600, tam: 20, cor: pv("gray-900"), alinh: "center", max: w - 40 });
  });

  // Face do card: abas, título, linhas de texto e botão.
  R.card = atlas.reservar(512, Math.round(512 / (0.48 / 0.28)), (g, w, h) => {
    g.fillStyle = white.getStyle();
    g.fillRect(0, 0, w, h);
    texto(g, pal, "Geral", 30, 34, { peso: 700, tam: 26, cor: pv("blue-600") });
    texto(g, pal, "Detalhes", 140, 34, { peso: 600, tam: 26, cor: pv("gray-600") });
    texto(g, pal, "Notas", 286, 34, { peso: 600, tam: 26, cor: pv("gray-600") });
    g.fillStyle = pv("gray-200").getStyle();
    g.fillRect(0, 62, w, 3);
    g.fillStyle = pv("blue-600").getStyle();
    g.fillRect(22, 58, 90, 6);
    texto(g, pal, "Matrícula escolar", 30, 104, { peso: 700, tam: 32, cor: pv("gray-900"), max: 330 });
    g.fillStyle = pv("gray-300").getStyle();
    g.fillRect(30, 140, 420, 14);
    g.fillRect(30, 168, 360, 14);
    g.fillRect(30, 196, 260, 14);
    retRedondo(g, w - 190, h - 76, 160, 50, 25, pv("blue-600"));
    texto(g, pal, "Abrir", w - 110, h - 51, { peso: 700, tam: 24, cor: white, alinh: "center" });
  });

  // Etiqueta (Badge).
  R.badge = atlas.reservar(160, 64, (g, w, h) => {
    g.fillStyle = pv("green-800").getStyle();
    g.fillRect(0, 0, w, h);
    texto(g, pal, "Novo", w / 2, h / 2 + 2, { peso: 700, tam: 34, cor: white, alinh: "center" });
  });

  // Campo de formulário: label, campo com foco (anel azul) e texto.
  R.input = atlas.reservar(512, Math.round(512 / (0.56 / 0.146)), (g, w, h) => {
    g.fillStyle = white.getStyle();
    g.fillRect(0, 0, w, h);
    texto(g, pal, "Nome completo", 16, 24, { peso: 700, tam: 24, cor: pv("gray-900") });
    texto(g, pal, "*", 196, 24, { peso: 700, tam: 24, cor: pv("red-700") });
    g.strokeStyle = pv("blue-hero").getStyle();
    g.lineWidth = 4;
    g.beginPath();
    g.roundRect(10, 48, w - 20, h - 56, 12);
    g.stroke();
    g.strokeStyle = pv("gray-400").getStyle();
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(17, 55, w - 34, h - 70, 8);
    g.stroke();
    texto(g, pal, "Maria da Silva", 34, 48 + (h - 56) / 2, { peso: 400, tam: 26, cor: pv("gray-900") });
    g.fillStyle = pv("gray-900").getStyle();
    g.fillRect(212, 48 + (h - 56) / 2 - 15, 2, 30);
  });

  // Aviso (Alert) de erro.
  R.alerta = atlas.reservar(512, Math.round(512 / (0.56 / 0.104)), (g, w, h) => {
    g.fillStyle = pv("red-50").getStyle();
    g.fillRect(0, 0, w, h);
    g.fillStyle = pv("red-700").getStyle();
    g.fillRect(0, 0, 10, h);
    g.beginPath();
    g.arc(46, h / 2, 20, 0, Math.PI * 2);
    g.fill();
    texto(g, pal, "!", 46, h / 2 + 2, { peso: 700, tam: 28, cor: white, alinh: "center" });
    texto(g, pal, "Atenção", 80, h / 2 - 17, { peso: 700, tam: 24, cor: pv("red-800") });
    texto(g, pal, "Preencha o CPF para continuar.", 80, h / 2 + 18, { peso: 600, tam: 20, cor: pv("red-900"), max: w - 96 });
  });

  // Rótulos dos botões (fundo na cor do botão).
  const rotuloBotao = (str, fundo, cor) =>
    atlas.reservar(256, Math.round(256 / (0.34 / 0.08)), (g, w, h) => {
      g.fillStyle = fundo.getStyle();
      g.fillRect(0, 0, w, h);
      texto(g, pal, str, w / 2, h / 2 + 2, { peso: 700, tam: 36, cor, alinh: "center", max: w - 20 });
    });
  R.salvar = rotuloBotao("Salvar", pv("blue-600"), white);
  R.cancelar = rotuloBotao("Cancelar", pv("gray-100"), pv("blue-800"));

  // Teclas (tampa clara, letra escura).
  const tecla = (str, w) =>
    atlas.reservar(w, 64, (g, cw, ch) => {
      g.fillStyle = pv("gray-100").getStyle();
      g.fillRect(0, 0, cw, ch);
      texto(g, pal, str, cw / 2, ch / 2 + 2, { peso: 700, tam: 32, cor: pv("gray-900"), alinh: "center" });
    });
  R.teclaTab = tecla("Tab ⇥", Math.round(64 * (0.13 / 0.065)));
  R.teclaEnter = tecla("Enter ↵", Math.round(64 * (0.21 / 0.065)));

  // Plaquinhas de latão das vitrines: nome no código e nome em PT.
  const placa = (nome, pt) =>
    atlas.reservar(512, Math.round(512 / (0.6 / 0.064)), (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, mix(pv("yellow-400"), white, 0.25).getStyle());
      grad.addColorStop(1, pv("yellow-600").getStyle());
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.strokeStyle = pv("yellow-800").getStyle();
      g.lineWidth = 3;
      g.strokeRect(3, 3, w - 6, h - 6);
      texto(g, pal, nome, w / 2, 20, { peso: 700, tam: 24, cor: pv("blue-900"), alinh: "center", max: w - 24 });
      texto(g, pal, pt, w / 2, 42, { peso: 600, tam: 14, cor: pv("blue-900"), alinh: "center", max: w - 24 });
    });
  R.placas = [
    placa("Button", "Botões"),
    placa("Switch · Checkbox", "Interruptor · Caixa de marcação"),
    placa("Card · Badge · Tabs", "Cartão · Etiqueta · Abas"),
    placa("Input · Alert", "Caixa de texto · Aviso"),
  ];
  return R;
}
