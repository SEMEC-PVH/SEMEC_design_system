// Galeria da Equipe: arquitetura, mobília e luzes do salão do museu dentro da
// sede da SEMEC. Planta e medidas em ./layout.js (contrato com quadros.js e
// personagens.js; os quadros e o time NÃO são desenhados aqui).
//
// Corte de maquete: paredes norte, oeste e leste altas (galeria clara com
// lambri baixo azul-acinzentado, rodapé marinho e sanca branca iluminada),
// parede sul como mureta baixa contínua. No meio da parede norte fica o
// elevador (o mesmo dos escritórios, predio/mobilia.js), com o letreiro em
// cima, vasos altos dos dois lados e um totem de boas-vindas ao lado da
// chegada. Piso de parquet em chevron com faixa de mármore nas bordas e duas
// faixas ladeando o eixo; passadeira azul do elevador ao pedestal central e
// dele até a exposição (exposicao.js). No pedestal, a escultura do Design
// System: camadas empilhadas (tokens, componentes, padrões) com um card, um
// botão e um toggle em cima, cercada por pedestais dourados com corda de
// veludo. Cordões baixos na frente dos quadros da parede norte, dois bancos
// de museu capitonê, plantas altas nos cantos do norte e baixas nos do sul
// (tiles bloqueados em layout.js, DECOR) e trilhos de luz no alto das
// paredes com spots mirando os quadros.
//
// Uso (motor do museu / prévia):
//   const sala = buildSala({ scene, pal, track, lite, reducedMotion });
//   sala.update(t, dt);      // escultura e elevador (parados com reducedMotion)
//   sala.elevador;           // criarElevador: abrir(k), sinal(), viagem(), dentro
//   sala.dispose();          // tira tudo da cena (geometrias vão pelo track)
//
// Desempenho: peças repetidas são mescladas por material (lotes) e os spots
// são instanciados; fica em poucas dezenas de draw calls. No `lite` não há
// SpotLight nem sombra: a luz dos quadros vem de halos aditivos na parede
// (e a da sanca, de um plano aditivo em degradê, nos dois modos).

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { std } from "../../buildings/shared";
import { andarPorId } from "../../predio/andares";
import { criarElevador } from "../../predio/mobilia";
import {
  FACE,
  PAREDE_ALTURA,
  PAREDE_SUL_ALTURA,
  PAREDE_ESPESSURA,
  QUADRO,
  SLOTS,
  PEDESTAL,
  BANCOS,
  EXPOSICAO,
  DECOR,
  tileToWorld,
  centroQuadro,
} from "./layout";

// Gerador pseudoaleatório determinístico (mesmo piso a cada carga).
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function canvasTexture(canvas, repeat) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  return tex;
}

// Caixa pelos limites (x0..x1, y0..y1, z0..z1), já transladada.
function caixa(x0, x1, y0, y1, z0, z1) {
  return new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}

// Lotes: junta as geometrias estáticas por material e cria um mesh por
// material no fim (um draw call por cor, em vez de um por peça).
function criarLotes() {
  const porMat = new Map();
  const add = (mat, geo, { cast = true, receive = true } = {}) => {
    let lote = porMat.get(mat);
    if (!lote) {
      lote = { mat, geos: [], cast, receive };
      porMat.set(mat, lote);
    }
    lote.geos.push(geo);
    return geo;
  };
  const fechar = (parent, track) => {
    for (const { mat, geos, cast, receive } of porMat.values()) {
      const lista = geos.some((g) => !g.index) ? geos.map((g) => (g.index ? g.toNonIndexed() : g)) : geos;
      const merged = track(mergeGeometries(lista, false));
      for (const g of new Set([...geos, ...lista])) g.dispose();
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      parent.add(mesh);
    }
    porMat.clear();
  };
  return { add, fechar };
}

// ---- Texturas de canvas -----------------------------------------------------

// Piso: parquet em chevron (ponto húngaro, da família da espinha de peixe).
// Colunas de 0,5 u (128 px) com tacos a 45°, que trocam de sentido a cada
// coluna; cada taco tem um tom próprio, veios finos e junta escura. Cada
// repetição cobre 2×2 unidades e emenda sem costura nas duas direções.
function makePisoTexture(pal) {
  const S = 512;
  const canvas = makeCanvas(S, S);
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const base = mix(pal.woodLight, pv("white"), 0.22);
  const escuro = mix(base, pv("yellow-800"), 0.6);
  const COL = 128; // largura da coluna
  const PASSO = 32; // passo vertical entre tacos (largura do taco × √2)
  const N = S / PASSO;
  // Tons fixos por (coluna, taco) para a textura repetir sem costura.
  const rand = seeded(20261015);
  const tons = [];
  for (let c = 0; c < S / COL; c++) {
    tons.push([]);
    for (let k = 0; k < N; k++) {
      const r = rand();
      tons[c].push(r < 0.5 ? mix(base, pv("yellow-800"), r * 0.32) : mix(base, pv("white"), (r - 0.5) * 0.22));
    }
  }
  g.fillStyle = escuro.getStyle();
  g.fillRect(0, 0, S, S);
  for (let c = 0; c < S / COL; c++) {
    const x0 = c * COL;
    const s = c % 2 ? -1 : 1; // sentido do taco nesta coluna
    g.save();
    g.beginPath();
    g.rect(x0, 0, COL, S);
    g.clip();
    for (let k = -6; k < N + 6; k++) {
      const y = k * PASSO;
      const tom = tons[c][((k % N) + N) % N];
      // Paralelogramo do taco (junta de 1,5 px aparecendo por baixo).
      g.fillStyle = tom.getStyle();
      g.beginPath();
      g.moveTo(x0 + 0.8, y + 0.8);
      g.lineTo(x0 + COL - 0.8, y - s * COL + 0.8);
      g.lineTo(x0 + COL - 0.8, y - s * COL + PASSO - 0.8);
      g.lineTo(x0 + 0.8, y + PASSO - 0.8);
      g.closePath();
      g.fill();
      // Veios: dois riscos claros/escuros no sentido do taco.
      const r2 = seeded(c * 97 + (((k % N) + N) % N) * 13 + 5);
      for (let v = 0; v < 2; v++) {
        const off = 7 + r2() * (PASSO - 14);
        g.strokeStyle = (v ? escuro : mix(tom, pv("white"), 0.25)).getStyle();
        g.globalAlpha = 0.16;
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(x0 + 10, y + off - s * 10);
        g.lineTo(x0 + COL - 10, y + off - s * (COL - 10));
        g.stroke();
      }
      g.globalAlpha = 1;
    }
    g.restore();
  }
  return canvasTexture(canvas, true);
}

// Mármore claro da faixa das bordas: fundo levemente manchado e veios cinza
// finos e sinuosos. Repetição de 2×2 unidades.
function makeMarmoreTexture(pal) {
  const S = 512;
  const canvas = makeCanvas(S, S);
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const base = mix(pv("gray-100"), pv("gray-50"), 0.5);
  g.fillStyle = base.getStyle();
  g.fillRect(0, 0, S, S);
  const rand = seeded(5150);
  // Manchas suaves.
  for (let i = 0; i < 18; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const r = 40 + rand() * 90;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const cor = mix(base, pv("gray-200"), 0.5);
    grad.addColorStop(0, cor.getStyle());
    grad.addColorStop(1, base.getStyle());
    g.globalAlpha = 0.35;
    g.fillStyle = grad;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      g.save();
      g.translate(ox, oy);
      g.fillRect(x - r, y - r, r * 2, r * 2);
      g.restore();
    }
  }
  g.globalAlpha = 1;
  // Veios: curvas que atravessam a textura (copiadas nas 9 posições).
  for (let i = 0; i < 7; i++) {
    const pts = [];
    let x = rand() * S;
    let y = rand() * S;
    const ang = rand() * Math.PI;
    for (let k = 0; k < 6; k++) {
      pts.push([x, y]);
      x += Math.cos(ang) * 90 + (rand() - 0.5) * 70;
      y += Math.sin(ang) * 90 + (rand() - 0.5) * 70;
    }
    g.strokeStyle = mix(pv("gray-400"), base, i % 2 ? 0.55 : 0.25).getStyle();
    g.lineWidth = i % 2 ? 1 : 1.8;
    g.globalAlpha = 0.5;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      g.beginPath();
      g.moveTo(pts[0][0] + ox, pts[0][1] + oy);
      for (let k = 1; k < pts.length - 1; k++) {
        const mx = (pts[k][0] + pts[k + 1][0]) / 2;
        const my = (pts[k][1] + pts[k + 1][1]) / 2;
        g.quadraticCurveTo(pts[k][0] + ox, pts[k][1] + oy, mx + ox, my + oy);
      }
      g.stroke();
    }
  }
  g.globalAlpha = 1;
  return canvasTexture(canvas, true);
}

// Luz da sanca na parede: forte junto da sanca, some para baixo.
function makeSancaTexture(pal) {
  const canvas = makeCanvas(4, 128);
  const g = canvas.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, pal.lamp.getStyle());
  grad.addColorStop(0.35, pal.mix(pal.lamp, pal.pv("black"), 0.7).getStyle());
  grad.addColorStop(1, pal.pv("black").getStyle());
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 128);
  return canvasTexture(canvas, false);
}

// Totem de boas-vindas (tampo inclinado): marinho com filete dourado, título,
// subtítulo e um convite curto.
function makeTotemTexture(pal, aspect) {
  const W = 640;
  const H = Math.round(W / aspect);
  const canvas = makeCanvas(W, H);
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  g.fillStyle = pv("blue-900").getStyle();
  g.fillRect(0, 0, W, H);
  g.strokeStyle = pv("yellow-500").getStyle();
  g.lineWidth = 6;
  g.strokeRect(14, 14, W - 28, H - 28);
  g.textAlign = "center";
  g.textBaseline = "middle";
  const caber = (texto, peso, max) => {
    let size = max;
    g.font = `${peso} ${size}px ${pal.font}`;
    while (g.measureText(texto).width > W - 90 && size > 14) {
      size -= 2;
      g.font = `${peso} ${size}px ${pal.font}`;
    }
  };
  g.fillStyle = pv("yellow-400").getStyle();
  caber("BEM-VINDO(A) À", 600, 30);
  g.fillText("BEM-VINDO(A) À", W / 2, H * 0.2);
  g.fillStyle = pv("white").getStyle();
  caber("Galeria da Equipe", 700, 78);
  g.fillText("Galeria da Equipe", W / 2, H * 0.43);
  g.fillStyle = pv("yellow-500").getStyle();
  g.fillRect(W / 2 - 70, H * 0.585, 140, 4);
  g.fillStyle = mix(pv("white"), pv("blue-200"), 0.35).getStyle();
  caber("quem fez o SEMEC Design System", 500, 38);
  g.fillText("quem fez o SEMEC Design System", W / 2, H * 0.73);
  return canvasTexture(canvas, false);
}

// Plano horizontal (piso) pelos limites, com UV em coordenadas do mundo
// (1 repetição a cada `escala` unidades): faixas separadas continuam a mesma
// textura sem emenda.
function planoXZ(x0, x1, z0, z1, y, escala) {
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / escala, -pos.getZ(i) / escala);
  return geo;
}

// Tapete/passadeira: campo marinho, faixa dourada e filete branco por dentro.
// `w`, `h` em unidades (a textura acompanha a proporção, borda sem esticar).
function makeTapeteTexture(pal, w, h) {
  const PX = 128;
  const canvas = makeCanvas(Math.round(w * PX), Math.round(h * PX));
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const W = canvas.width;
  const H = canvas.height;
  g.fillStyle = pv("blue-800").getStyle();
  g.fillRect(0, 0, W, H);
  g.fillStyle = pv("blue-900").getStyle();
  g.fillRect(6, 6, W - 12, H - 12);
  g.strokeStyle = pv("yellow-500").getStyle();
  g.lineWidth = 9;
  g.strokeRect(14, 14, W - 28, H - 28);
  g.strokeStyle = mix(pv("white"), pv("blue-200"), 0.3).getStyle();
  g.lineWidth = 2.5;
  g.strokeRect(27, 27, W - 54, H - 54);
  // Miolo com losangos discretos (trama do tapete).
  g.fillStyle = pv("blue-800").getStyle();
  const passo = 48;
  for (let y = 48; y < H - 40; y += passo) {
    for (let x = 48; x < W - 40; x += passo) {
      g.beginPath();
      g.moveTo(x, y - 9);
      g.lineTo(x + 9, y);
      g.lineTo(x, y + 9);
      g.lineTo(x - 9, y);
      g.closePath();
      g.fill();
    }
  }
  return canvasTexture(canvas, false);
}

// Letreiro da parede norte: placa marinha, borda dourada, texto branco.
function makeLetreiroTexture(pal, aspect) {
  const H = 96;
  const W = Math.round(H * aspect);
  const canvas = makeCanvas(W, H);
  const g = canvas.getContext("2d");
  const { pv } = pal;
  g.fillStyle = pv("blue-900").getStyle();
  g.fillRect(0, 0, W, H);
  g.strokeStyle = pv("yellow-500").getStyle();
  g.lineWidth = 4;
  g.strokeRect(8, 8, W - 16, H - 16);
  const texto = "GALERIA DA EQUIPE";
  let size = 58;
  g.font = `700 ${size}px ${pal.font}`;
  while (g.measureText(texto).width > W - 200 && size > 24) {
    size -= 2;
    g.font = `700 ${size}px ${pal.font}`;
  }
  g.fillStyle = pv("white").getStyle();
  g.textAlign = "center";
  g.textBaseline = "middle";
  // Espaçamento entre letras manual (letterSpacing não existe em todo canvas).
  const letras = [...texto];
  const esp = size * 0.12;
  const larg = letras.reduce((s, c) => s + g.measureText(c).width + esp, -esp);
  let x = W / 2 - larg / 2;
  g.textAlign = "left";
  for (const c of letras) {
    g.fillText(c, x, H / 2 + 3);
    x += g.measureText(c).width + esp;
  }
  // Estrelinhas douradas nas pontas.
  const estrela = (cx, cy, r) => {
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
  };
  g.fillStyle = pv("yellow-500").getStyle();
  estrela(W / 2 - larg / 2 - 50, H / 2, 16);
  estrela(W / 2 + larg / 2 + 50, H / 2, 16);
  return canvasTexture(canvas, false);
}

// Plaquinha de latão do pedestal.
function makePlacaTexture(pal) {
  const W = 512;
  const H = 128;
  const canvas = makeCanvas(W, H);
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, mix(pv("yellow-400"), pv("white"), 0.25).getStyle());
  grad.addColorStop(1, pv("yellow-600").getStyle());
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = pv("yellow-800").getStyle();
  g.lineWidth = 5;
  g.strokeRect(8, 8, W - 16, H - 16);
  g.fillStyle = pv("blue-900").getStyle();
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `700 50px ${pal.font}`;
  g.fillText("DESIGN SYSTEM", W / 2, 54);
  g.font = `600 26px ${pal.font}`;
  g.fillText("SEMEC · tokens pv-*", W / 2, 96);
  return canvasTexture(canvas, false);
}

// Face do card da escultura: cabeçalho azul, avatar, linhas de texto, chip e
// botão primário (uma tela de componente em miniatura).
function makeCardTexture(pal) {
  const W = 256;
  const H = 300;
  const canvas = makeCanvas(W, H);
  const g = canvas.getContext("2d");
  const { pv } = pal;
  g.fillStyle = pv("white").getStyle();
  g.fillRect(0, 0, W, H);
  g.fillStyle = pv("blue-600").getStyle();
  g.fillRect(0, 0, W, 64);
  g.fillStyle = pv("white").getStyle();
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.arc(26 + i * 22, 32, 7, 0, Math.PI * 2);
    g.fill();
  }
  // Avatar.
  g.fillStyle = pv("yellow-500").getStyle();
  g.beginPath();
  g.arc(52, 112, 28, 0, Math.PI * 2);
  g.fill();
  // Linhas de texto.
  g.fillStyle = pv("gray-700").getStyle();
  g.fillRect(96, 94, 128, 14);
  g.fillStyle = pv("gray-300").getStyle();
  g.fillRect(96, 118, 96, 10);
  g.fillRect(24, 162, 208, 10);
  g.fillRect(24, 182, 176, 10);
  // Chip verde.
  g.fillStyle = pv("green-600").getStyle();
  g.beginPath();
  g.roundRect(24, 206, 70, 22, 11);
  g.fill();
  // Botão primário.
  g.fillStyle = pv("blue-700").getStyle();
  g.beginPath();
  g.roundRect(24, 242, 208, 40, 20);
  g.fill();
  g.fillStyle = pv("white").getStyle();
  g.font = `700 22px ${pal.font}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("Entrar", W / 2, 263);
  return canvasTexture(canvas, false);
}

// Halo de luz na parede (piscina do spot): mais forte no alto, some embaixo.
function makeHaloTexture(pal) {
  const S = 128;
  const canvas = makeCanvas(S, S);
  const g = canvas.getContext("2d");
  g.fillStyle = pal.pv("black").getStyle();
  g.fillRect(0, 0, S, S);
  g.save();
  g.translate(S / 2, S * 0.36);
  g.scale(1, 1.35);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, S * 0.46);
  grad.addColorStop(0, pal.lamp.getStyle());
  grad.addColorStop(0.55, pal.mix(pal.lamp, pal.pv("black"), 0.6).getStyle());
  grad.addColorStop(1, pal.pv("black").getStyle());
  g.fillStyle = grad;
  g.beginPath();
  g.arc(0, 0, S * 0.46, 0, Math.PI * 2);
  g.fill();
  g.restore();
  return canvasTexture(canvas, false);
}

// ---- Construtor ---------------------------------------------------------------

export function buildSala({ scene, pal, track, lite = false, reducedMotion = false }) {
  const { pv, mix } = pal;
  const white = pv("white");
  const root = new THREE.Group();
  root.name = "museu-sala";
  scene.add(root);
  const lotes = criarLotes();
  const seg = lite ? 1 : 2; // segmentos dos cantos arredondados
  const rad = lite ? 6 : 12; // segmentos radiais de cilindros

  // ---- Materiais (todas as cores dos tokens) --------------------------------
  const M = {
    parede: track(std(mix(pal.wall, pv("yellow-400"), 0.1), { roughness: 0.95 })),
    lambri: track(std(mix(pv("blue-200"), pv("gray-100"), 0.3), { roughness: 0.9 })),
    friso: track(std(white, { roughness: 0.7 })),
    rodape: track(std(pv("blue-900"), { roughness: 0.7 })),
    corte: track(std(mix(pv("gray-400"), pv("gray-300"), 0.5), { roughness: 1 })),
    base: track(std(mix(pv("gray-200"), pv("gray-300"), 0.4), { roughness: 1 })),
    marmore: track(std(mix(pv("gray-50"), pv("gray-100"), 0.5), { roughness: 0.45 })),
    pedestal: track(std(white, { roughness: 0.6 })),
    marinho: track(std(pv("blue-900"), { roughness: 0.55 })),
    azul: track(std(pv("blue-600"), { roughness: 0.5 })),
    amarelo: track(std(pv("yellow-500"), { roughness: 0.55 })),
    ouro: track(std(pv("yellow-600"), { roughness: 0.35, metalness: 0.35 })),
    veludo: track(std(pv("red-700"), { roughness: 0.9 })),
    madeira: track(std(mix(pal.woodLight, pv("yellow-800"), 0.35), { roughness: 0.7 })),
    metal: track(std(pv("gray-800"), { roughness: 0.45, metalness: 0.3 })),
    estofado: track(std(pv("blue-800"), { roughness: 0.75 })),
    vaso: track(std(mix(pv("gray-50"), pv("gray-100"), 0.6), { roughness: 0.5 })),
    terra: track(std(mix(pv("yellow-800"), pv("gray-900"), 0.55), { roughness: 1 })),
    folha: track(std(pv("green-700"), { roughness: 0.75 })),
    folhaClara: track(std(mix(pv("green-600"), pv("yellow-400"), 0.25), { roughness: 0.75 })),
    trilho: track(std(pv("gray-900"), { roughness: 0.5, metalness: 0.3 })),
    led: track(new THREE.MeshBasicMaterial({ color: pal.lamp })),
  };

  // ---- Medidas ----------------------------------------------------------------
  const H = PAREDE_ALTURA;
  const HS = PAREDE_SUL_ALTURA;
  const T = PAREDE_ESPESSURA;
  const { norte: ZN, sul: ZS, oeste: XO, leste: XL } = FACE;
  // Vão do elevador na parede norte (centrado em x = 0; a cabine fica atrás
  // da face) e altura do revestimento de granito dele (mobilia.js).
  const VAO = { x: 0.56, h: 1.76 };
  const ELEV_ALTO = 2.3;
  const ELEV_MEIA = 1.01; // meia-largura do revestimento, com folga

  // ---- Base da maquete e piso -----------------------------------------------
  // Placa sob o salão (uma borda fina em volta das paredes).
  lotes.add(M.base, caixa(XO - T - 0.25, XL + T + 0.25, -0.3, -0.002, ZN - T - 0.25, ZS + T + 0.25), { cast: false });

  // Piso: parquet em chevron no miolo, faixa de mármore junto das paredes
  // (como nas galerias clássicas) e um filete marinho separando os dois.
  const BORDA = 0.42;
  const FILETE = 0.05;
  const pisoTex = track(makePisoTexture(pal));
  const pisoMat = track(std(white, { map: pisoTex, roughness: 0.5 }));
  const piso = new THREE.Mesh(track(planoXZ(XO + BORDA, XL - BORDA, ZN + BORDA, ZS - BORDA, 0, 2)), pisoMat);
  piso.receiveShadow = true;
  root.add(piso);
  const marmoreTex = track(makeMarmoreTexture(pal));
  const marmorePiso = track(std(white, { map: marmoreTex, roughness: 0.3 }));
  for (const [x0, x1, z0, z1] of [
    [XO, XL, ZN, ZN + BORDA],
    [XO, XL, ZS - BORDA, ZS],
    [XO, XO + BORDA, ZN + BORDA, ZS - BORDA],
    [XL - BORDA, XL, ZN + BORDA, ZS - BORDA],
  ]) lotes.add(marmorePiso, planoXZ(x0, x1, z0, z1, 0, 2), { cast: false });
  {
    // Filete marinho (por dentro da faixa de mármore, um tico acima do piso).
    const b = BORDA;
    const f = FILETE;
    const y = 0.003;
    for (const [x0, x1, z0, z1] of [
      [XO + b - f, XL - b + f, ZN + b - f, ZN + b],
      [XO + b - f, XL - b + f, ZS - b, ZS - b + f],
      [XO + b - f, XO + b, ZN + b, ZS - b],
      [XL - b, XL - b + f, ZN + b, ZS - b],
    ]) lotes.add(M.marinho, planoXZ(x0, x1, z0, z1, y, 1), { cast: false });
    // Duas faixas de mármore (com filetes) ladeando o eixo do salão, do
    // norte ao sul: dividem o parquet em três campos, como nas galerias.
    const FX = 2.65;
    const FL = 0.09;
    for (const sx of [-1, 1]) {
      const xc = sx * FX;
      lotes.add(marmorePiso, planoXZ(xc - FL, xc + FL, ZN + b, ZS - b, y, 2), { cast: false });
      lotes.add(M.marinho, planoXZ(xc - FL - f * 0.6, xc - FL, ZN + b, ZS - b, y, 1), { cast: false });
      lotes.add(M.marinho, planoXZ(xc + FL, xc + FL + f * 0.6, ZN + b, ZS - b, y, 1), { cast: false });
    }
  }

  // Pedestal: centro e meia-largura a partir dos tiles do contrato.
  const pedTiles = PEDESTAL.tiles.map(([x, y]) => tileToWorld(x, y));
  const pedC = pedTiles.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / pedTiles.length);
  const pedHalf = Math.max(...pedTiles.map((p) => Math.abs(p.x - pedC.x))) + 0.5; // 1 para 2×2

  // Tapete sob o pedestal e passadeira do elevador até ele.
  const addTapete = (w, d, cx, cz, y) => {
    const tex = track(makeTapeteTexture(pal, w, d));
    const mat = track(std(white, { map: tex, roughness: 0.95 }));
    const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, 0.02, d)), mat);
    m.position.set(cx, y, cz);
    m.receiveShadow = true;
    root.add(m);
  };
  const tapeteLado = pedHalf * 2 + 0.9;
  addTapete(tapeteLado, tapeteLado, pedC.x, pedC.z, 0.01);
  const passIni = ZN + 0.12; // depois da soleira do elevador
  const passFim = pedC.z - tapeteLado / 2 + 0.15;
  addTapete(1.1, passFim - passIni, 0, (passIni + passFim) / 2, 0.012);
  // Continua do tapete do pedestal até a exposição do Design System (o eixo
  // do salão: elevador → escultura → exposição).
  const expoZ = Math.min(...EXPOSICAO.tiles.map(([x, y]) => tileToWorld(x, y).z)) - 0.5;
  const contIni = pedC.z + tapeteLado / 2 - 0.15;
  if (expoZ - contIni > 0.3) addTapete(1.1, expoZ - contIni, 0, (contIni + expoZ) / 2, 0.012);

  // ---- Paredes --------------------------------------------------------------
  // Corpo das paredes (sem sombra própria: a direcional faz papel de
  // claraboia e paredes projetando faixas escuras deixariam a sala triste).
  const parede = { cast: false };
  lotes.add(M.parede, caixa(XO - T, -VAO.x, 0, H, ZN - T, ZN), parede);
  lotes.add(M.parede, caixa(VAO.x, XL + T, 0, H, ZN - T, ZN), parede);
  lotes.add(M.parede, caixa(-VAO.x, VAO.x, VAO.h, H, ZN - T, ZN), parede);
  lotes.add(M.parede, caixa(XO - T, XO, 0, H, ZN, ZS + T), parede);
  lotes.add(M.parede, caixa(XL, XL + T, 0, H, ZN, ZS + T), parede);
  lotes.add(M.parede, caixa(XO, XL, 0, HS, ZS, ZS + T), parede);
  // Corte da maquete: tampa cinza no topo de cada parede.
  const C = 0.012;
  lotes.add(M.corte, caixa(XO - T, XL + T, H, H + C, ZN - T, ZN), parede);
  lotes.add(M.corte, caixa(XO - T, XO, H, H + C, ZN, ZS + T), parede);
  lotes.add(M.corte, caixa(XL, XL + T, H, H + C, ZN, ZS + T), parede);
  lotes.add(M.corte, caixa(XO, XL, HS, HS + C, ZS, ZS + T), parede);

  // Acabamentos ao longo das faces internas: `faixa(mat, y0, y1, saliência)`
  // nas paredes altas (na norte, abaixo do letreiro, param no revestimento
  // do elevador); o rodapé também corre pela mureta.
  // Lambri baixo: a placa de latão sob cada quadro (de 0,375 a 0,645 de
  // altura) fica livre na parede, sem o guarda-cadeira atravessando.
  const LAMBRI = 0.3;
  const faixa = (mat, y0, y1, e, comMureta = false) => {
    if (y0 < ELEV_ALTO) {
      lotes.add(mat, caixa(XO, -ELEV_MEIA, y0, y1, ZN, ZN + e), parede);
      lotes.add(mat, caixa(ELEV_MEIA, XL, y0, y1, ZN, ZN + e), parede);
    } else lotes.add(mat, caixa(XO, XL, y0, y1, ZN, ZN + e), parede);
    lotes.add(mat, caixa(XO, XO + e, y0, y1, ZN + e, ZS), parede);
    lotes.add(mat, caixa(XL - e, XL, y0, y1, ZN + e, ZS), parede);
    if (comMureta) lotes.add(mat, caixa(XO + e, XL - e, y0, y1, ZS - e, ZS), parede);
  };
  faixa(M.lambri, 0, LAMBRI, 0.012);
  faixa(M.friso, LAMBRI - 0.02, LAMBRI + 0.04, 0.03); // guarda-cadeira
  faixa(M.rodape, 0, 0.14, 0.035, true);
  faixa(M.friso, H - 0.12, H - 0.04, 0.06); // sanca em dois degraus
  faixa(M.friso, H - 0.04, H, 0.1);
  // Sanca iluminada: fita de luz embaixo do degrau da sanca e o clarão que
  // ela joga na parede (plano aditivo em degradê; não é luz de verdade).
  const sancaY = H - 0.12;
  faixa(M.led, sancaY - 0.016, sancaY, 0.055);
  {
    const glowMat = track(new THREE.MeshBasicMaterial({
      map: track(makeSancaTexture(pal)),
      transparent: true,
      opacity: lite ? 0.42 : 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    const gh = 0.95;
    const gy = sancaY - gh / 2;
    const semNada = { cast: false, receive: false };
    lotes.add(glowMat, new THREE.PlaneGeometry(XL - XO, gh).translate((XO + XL) / 2, gy, ZN + 0.004), semNada);
    lotes.add(glowMat, new THREE.PlaneGeometry(ZS - ZN, gh).rotateY(Math.PI / 2).translate(XO + 0.004, gy, (ZN + ZS) / 2), semNada);
    lotes.add(glowMat, new THREE.PlaneGeometry(ZS - ZN, gh).rotateY(-Math.PI / 2).translate(XL - 0.004, gy, (ZN + ZS) / 2), semNada);
  }
  // Mureta sul: friso branco no alto.
  lotes.add(M.friso, caixa(XO, XL, HS - 0.04, HS, ZS - 0.03, ZS), parede);

  // ---- Elevador -------------------------------------------------------------------
  // O mesmo dos escritórios (cabine funda, portas de aço, display e lanterna),
  // na cor e com o rótulo do andar da Galeria (predio/andares.js).
  const andar = andarPorId("galeria");
  const elevador = criarElevador({ pal, track, lite, reducedMotion, rotulo: andar?.rotulo ?? "", cor: andar ? pv(andar.cor) : undefined });
  elevador.grupo.position.set(0, 0, ZN);
  root.add(elevador.grupo);

  // ---- Letreiro "GALERIA DA EQUIPE" -------------------------------------------
  const letW = 4.4;
  const letH = 0.36;
  // Entre o revestimento do elevador e a sanca (e acima das molduras).
  const letY = (Math.max(ELEV_ALTO, QUADRO.centroY + QUADRO.altura / 2) + H - 0.12) / 2;
  lotes.add(M.marinho, caixa(-letW / 2 - 0.03, letW / 2 + 0.03, letY - letH / 2 - 0.03, letY + letH / 2 + 0.03, ZN, ZN + 0.04), parede);
  // Emissivo pela própria textura: o letreiro "acende" um pouco sem lavar o fundo.
  const letTex = track(makeLetreiroTexture(pal, letW / letH));
  const letreiro = new THREE.Mesh(
    track(new THREE.PlaneGeometry(letW, letH)),
    track(new THREE.MeshStandardMaterial({ map: letTex, emissive: white, emissiveMap: letTex, emissiveIntensity: lite ? 0.35 : 0.2, roughness: 0.6 })),
  );
  letreiro.position.set(0, letY, ZN + 0.042);
  root.add(letreiro);

  // ---- Pedestal central --------------------------------------------------------
  const PB = pedHalf * 0.8; // meia-largura do degrau de mármore
  const PC = pedHalf * 0.6; // meia-largura da coluna
  const yCol = 0.74;
  const yTopo = 0.82;
  const at = (g) => g.translate(pedC.x, 0, pedC.z);
  lotes.add(M.marmore, at(new RoundedBoxGeometry(PB * 2, 0.12, PB * 2, seg, 0.02).translate(0, 0.06, 0)));
  lotes.add(M.pedestal, at(caixa(-PC, PC, 0.12, yCol, -PC, PC)));
  lotes.add(M.marinho, at(caixa(-PC - 0.012, PC + 0.012, 0.6, 0.67, -PC - 0.012, PC + 0.012)));
  lotes.add(M.marmore, at(new RoundedBoxGeometry(PC * 2 + 0.16, yTopo - yCol, PC * 2 + 0.16, seg, 0.02).translate(0, (yCol + yTopo) / 2, 0)));
  const placa = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.72, 0.18)),
    track(new THREE.MeshStandardMaterial({ map: track(makePlacaTexture(pal)), roughness: 0.4, metalness: 0.2 })),
  );
  placa.position.set(pedC.x, 0.38, pedC.z + PC + 0.004);
  root.add(placa);

  // Pedestais de latão com corda de veludo em volta.
  const PP = pedHalf - 0.08;
  const postes = [[-PP, -PP], [PP, -PP], [PP, PP], [-PP, PP]];
  for (const [x, z] of postes) {
    lotes.add(M.ouro, at(new THREE.CylinderGeometry(0.06, 0.075, 0.03, rad).translate(x, 0.015, z)));
    lotes.add(M.ouro, at(new THREE.CylinderGeometry(0.016, 0.016, 0.62, rad).translate(x, 0.33, z)));
    lotes.add(M.ouro, at(new THREE.SphereGeometry(0.035, rad, lite ? 4 : 8).translate(x, 0.66, z)));
  }
  for (let i = 0; i < 4; i++) {
    const [ax, az] = postes[i];
    const [bx, bz] = postes[(i + 1) % 4];
    const curva = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(ax, 0.58, az),
      new THREE.Vector3((ax + bx) / 2, 0.3, (az + bz) / 2),
      new THREE.Vector3(bx, 0.58, bz),
    );
    lotes.add(M.veludo, at(new THREE.TubeGeometry(curva, lite ? 8 : 14, 0.017, lite ? 4 : 6, false)));
  }

  // ---- Escultura do Design System -------------------------------------------
  // Camadas (tokens marinho, componentes azul, padrões amarelo) e, no topo,
  // um card em pé, um botão e um toggle. Grupo próprio para animar.
  const escultura = new THREE.Group();
  escultura.position.set(pedC.x, yTopo, pedC.z);
  root.add(escultura);
  const sombra = (m) => {
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  const camada = (mat, lado, alt, y, rot) => {
    const m = sombra(new THREE.Mesh(track(new RoundedBoxGeometry(lado, alt, lado, seg, 0.035)), mat));
    m.position.y = y + alt / 2;
    m.rotation.y = rot;
    escultura.add(m);
    return m;
  };
  camada(M.marinho, 1.08, 0.14, 0, 0);
  const camadaMeio = camada(M.azul, 0.94, 0.14, 0.14, 0.26);
  camada(M.amarelo, 0.8, 0.12, 0.28, 0.52);
  const yDeck = 0.4;

  const topo = new THREE.Group(); // card + botão + toggle (flutua de leve)
  topo.position.y = yDeck;
  escultura.add(topo);
  const cardW = 0.66;
  const cardH = 0.8;
  const card = sombra(new THREE.Mesh(track(new RoundedBoxGeometry(cardW, cardH, 0.08, seg, 0.03)), M.pedestal));
  card.position.set(0, cardH / 2, -0.1);
  card.rotation.x = -0.06;
  topo.add(card);
  const cardTex = track(makeCardTexture(pal));
  const cardFace = new THREE.Mesh(
    track(new THREE.PlaneGeometry(cardW - 0.06, (cardW - 0.06) * (300 / 256))),
    track(new THREE.MeshStandardMaterial({ map: cardTex, emissive: white, emissiveMap: cardTex, emissiveIntensity: 0.12, roughness: 0.5 })),
  );
  cardFace.position.z = 0.0405;
  card.add(cardFace);

  const botao = sombra(new THREE.Mesh(track(new RoundedBoxGeometry(0.3, 0.12, 0.14, seg, 0.055)), M.azul));
  botao.position.set(-0.17, 0.06, 0.2);
  topo.add(botao);
  const rotulo = new THREE.Mesh(track(caixa(-0.08, 0.08, -0.012, 0.012, 0, 0.006)), M.pedestal);
  rotulo.position.set(-0.17, 0.065, 0.27);
  topo.add(rotulo);

  const toggleCorOff = pv("gray-300");
  const toggleCorOn = pv("green-500");
  const toggleMat = track(std(toggleCorOn.clone(), { roughness: 0.45 }));
  const trilhoToggle = sombra(new THREE.Mesh(track(new THREE.CapsuleGeometry(0.065, 0.16, 4, rad)), toggleMat));
  trilhoToggle.rotation.z = Math.PI / 2;
  trilhoToggle.position.set(0.18, 0.065, 0.2);
  topo.add(trilhoToggle);
  const knob = sombra(new THREE.Mesh(track(new THREE.SphereGeometry(0.06, rad, lite ? 6 : 10)), M.pedestal));
  knob.position.set(0.18 + 0.08, 0.075, 0.215);
  topo.add(knob);

  // ---- Bancos -------------------------------------------------------------------
  // Banco de museu: assento estofado capitonê (botões marinho), cinta de
  // madeira e quatro pés torneados com ponteira de latão.
  for (const banco of BANCOS) {
    const ps = banco.tiles.map(([x, y]) => tileToWorld(x, y));
    const cx = (ps[0].x + ps[ps.length - 1].x) / 2;
    const cz = (ps[0].z + ps[ps.length - 1].z) / 2;
    const comp = Math.abs(ps[ps.length - 1].x - ps[0].x) + 0.8;
    const prof = 0.5;
    const b = (g) => g.translate(cx, 0, cz);
    lotes.add(M.estofado, b(new RoundedBoxGeometry(comp, 0.12, prof, seg, 0.05).translate(0, 0.44, 0)));
    lotes.add(M.madeira, b(new RoundedBoxGeometry(comp + 0.04, 0.07, prof + 0.04, seg, 0.015).translate(0, 0.35, 0)));
    // Botões do capitonê em duas fileiras desencontradas.
    if (!lite) {
      const nb = Math.round(comp / 0.32);
      for (let i = 0; i < nb; i++) {
        for (const [fz, off] of [[-0.11, 0], [0.11, 0.5]]) {
          const bx = -comp / 2 + ((i + 0.5 + off) * comp) / (nb + 0.5);
          lotes.add(M.marinho, b(new THREE.SphereGeometry(0.018, 6, 4).scale(1, 0.5, 1).translate(bx, 0.5, fz)), { cast: false });
        }
      }
    }
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const lx = sx * (comp / 2 - 0.1);
        const lz = sz * (prof / 2 - 0.08);
        lotes.add(M.madeira, b(new THREE.CylinderGeometry(0.035, 0.022, 0.29, rad).translate(lx, 0.17, lz)));
        lotes.add(M.ouro, b(new THREE.CylinderGeometry(0.024, 0.024, 0.03, rad).translate(lx, 0.015, lz)), { cast: false });
      }
    }
  }

  // ---- Plantas -----------------------------------------------------------------
  // Espada-de-são-jorge num vaso de cerâmica (centro em x, z): vaso estreito e
  // folhas quase retas, para não invadir o tile andável vizinho. Nos cantos
  // do norte as plantas são altas; nos do sul (perto da câmera), baixas.
  const rand = seeded(744);
  const up = new THREE.Vector3(0, 1, 0);
  const espada = (x, z, { vh, vr, folhas, n }) => {
    lotes.add(M.vaso, new THREE.CylinderGeometry(vr, vr * 0.75, vh, rad).translate(x, vh / 2, z));
    lotes.add(M.marinho, new THREE.CylinderGeometry(vr + 0.003, vr * 0.97, 0.05, rad).translate(x, vh - 0.06, z));
    // Terra 6 mm acima da boca (no mesmo y da tampa do vaso ela piscava).
    lotes.add(M.terra, new THREE.CylinderGeometry(vr * 0.88, vr * 0.88, 0.016, rad).translate(x, vh - 0.002, z), { cast: false });
    const k = lite ? Math.ceil(n * 0.65) : n;
    for (let i = 0; i < k; i++) {
      const a = (i / k) * Math.PI * 2 + rand() * 0.5;
      const r = vr * (0.2 + rand() * 0.45);
      const alt = folhas + rand() * folhas * 0.6;
      const g = new THREE.ConeGeometry(0.045 * (vr / 0.16), alt, 4).translate(0, alt / 2, 0);
      g.scale(1, 1, 0.35);
      g.rotateY(-a);
      const eixo = new THREE.Vector3(Math.sin(a), 0, -Math.cos(a)).cross(up).normalize();
      g.applyQuaternion(new THREE.Quaternion().setFromAxisAngle(eixo, -(0.08 + rand() * 0.16)));
      g.translate(x + Math.cos(a) * r, vh - 0.02, z + Math.sin(a) * r);
      lotes.add(i % 3 === 0 ? M.folhaClara : M.folha, g);
    }
  };
  for (const [tx, ty] of DECOR.plantasNorte) {
    const p = tileToWorld(tx, ty);
    espada(p.x + Math.sign(p.x) * 0.16, p.z - 0.16, { vh: 0.5, vr: 0.21, folhas: 0.8, n: 13 });
  }
  for (const [tx, ty] of DECOR.plantasSul) {
    const p = tileToWorld(tx, ty);
    espada(p.x + Math.sign(p.x) * 0.2, p.z + 0.2, { vh: 0.3, vr: 0.16, folhas: 0.42, n: 9 });
  }

  // Vasos altos ladeando o elevador (como nos escritórios): cachepô de
  // cerâmica branca com cinta marinho e uma árvore-da-felicidade em copa.
  for (const [tx, ty] of DECOR.vasosElevador) {
    const x = tileToWorld(tx, ty).x;
    const z = ZN + 0.36;
    const vh = 0.55;
    lotes.add(M.vaso, new THREE.CylinderGeometry(0.21, 0.17, vh, rad).translate(x, vh / 2, z));
    lotes.add(M.marinho, new THREE.CylinderGeometry(0.213, 0.2, 0.06, rad).translate(x, vh - 0.1, z));
    lotes.add(M.ouro, new THREE.CylinderGeometry(0.175, 0.175, 0.025, rad).translate(x, 0.0125, z), { cast: false });
    lotes.add(M.terra, new THREE.CylinderGeometry(0.19, 0.19, 0.016, rad).translate(x, vh - 0.002, z), { cast: false });
    lotes.add(M.madeira, new THREE.CylinderGeometry(0.018, 0.026, 0.7, 5).translate(x, vh + 0.35, z));
    const copa = lite ? 4 : 7;
    for (let i = 0; i < copa; i++) {
      const a = rand() * Math.PI * 2;
      const r = i === 0 ? 0 : 0.08 + rand() * 0.08;
      const y = vh + 0.55 + (i === 0 ? 0.32 : rand() * 0.5);
      const raio = i === 0 ? 0.2 : 0.13 + rand() * 0.06;
      lotes.add(i % 2 ? M.folhaClara : M.folha, new THREE.IcosahedronGeometry(raio, lite ? 0 : 1).translate(x + Math.cos(a) * r, y, z + Math.sin(a) * r * 0.6));
    }
  }

  // ---- Cordões na frente dos quadros da parede norte ---------------------------
  // Pedestais baixos de latão com corda de veludo, colados na parede (a 0,2
  // da face): o jogador olha o quadro do tile "ver" logo em frente, sem
  // pisar neles. Nas laterais não há cordão (as pessoas ficam bem ao lado).
  const CORDAO = { d: 0.2, meia: 0.72, h: 0.46 };
  SLOTS.forEach((s, i) => {
    if (!s.normal[1]) return;
    const c = centroQuadro(i);
    const z = ZN + CORDAO.d;
    const xs = [c.x - CORDAO.meia, c.x + CORDAO.meia];
    for (const x of xs) {
      lotes.add(M.ouro, new THREE.CylinderGeometry(0.05, 0.062, 0.025, rad).translate(x, 0.0125, z), { cast: false });
      lotes.add(M.ouro, new THREE.CylinderGeometry(0.013, 0.013, CORDAO.h, rad).translate(x, CORDAO.h / 2, z));
      lotes.add(M.ouro, new THREE.SphereGeometry(0.028, rad, lite ? 4 : 8).translate(x, CORDAO.h + 0.01, z), { cast: false });
    }
    const curva = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(xs[0], CORDAO.h - 0.05, z),
      new THREE.Vector3(c.x, CORDAO.h - 0.26, z),
      new THREE.Vector3(xs[1], CORDAO.h - 0.05, z),
    );
    lotes.add(M.veludo, new THREE.TubeGeometry(curva, lite ? 8 : 14, 0.014, lite ? 4 : 6, false));
  });

  // ---- Totem de boas-vindas ---------------------------------------------------------
  // Púlpito baixo ao lado da chegada, de frente para o sul (quem sai do
  // elevador e a câmera do jogo leem o tampo inclinado).
  {
    const p = tileToWorld(DECOR.totem[0], DECOR.totem[1]);
    const tw = 0.9;
    const td = 0.56;
    const incl = 0.62; // inclinação do tampo (rad)
    const yT = 0.86;
    lotes.add(M.marmore, new RoundedBoxGeometry(0.56, 0.06, 0.4, seg, 0.015).translate(p.x, 0.03, p.z));
    lotes.add(M.marinho, caixa(p.x - 0.18, p.x + 0.18, 0.06, yT - 0.14, p.z - 0.12, p.z + 0.12));
    lotes.add(M.ouro, caixa(p.x - 0.185, p.x + 0.185, yT - 0.42, yT - 0.39, p.z - 0.125, p.z + 0.125), { cast: false });
    lotes.add(M.marinho, new RoundedBoxGeometry(tw, 0.05, td, seg, 0.012).rotateX(incl).translate(p.x, yT, p.z));
    const totemTex = track(makeTotemTexture(pal, (tw - 0.08) / (td - 0.08)));
    const face = new THREE.Mesh(
      track(new THREE.PlaneGeometry(tw - 0.08, td - 0.08)),
      track(new THREE.MeshStandardMaterial({ map: totemTex, emissive: white, emissiveMap: totemTex, emissiveIntensity: 0.18, roughness: 0.55 })),
    );
    face.rotation.x = -Math.PI / 2 + incl;
    face.position.set(p.x, yT, p.z).add(new THREE.Vector3(0, 0.026, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), incl));
    root.add(face);
  }

  // ---- Trilhos de luz e spots ------------------------------------------------------
  // Trilho preto em balanço sobre cada parede alta (mãos-francesas apoiadas no
  // topo), com uma cabeça de spot por quadro mirando o centro da moldura.
  const TR = 0.42; // distância do trilho até a face da parede
  const TY = H + 0.12; // altura do trilho
  const semSombra = { cast: false }; // sombra fina e comprida no piso: feia
  const centros = SLOTS.map((_, i) => centroQuadro(i));
  // A norte tem dois grupos (um de cada lado do elevador e do letreiro).
  const porParede = { norteO: [], norteL: [], oeste: [], leste: [] };
  SLOTS.forEach((s, i) => {
    const w = s.normal[1] ? (centros[i].x < 0 ? "norteO" : "norteL") : s.normal[0] > 0 ? "oeste" : "leste";
    porParede[w].push(i);
  });
  // Trilho de uma parede: do primeiro ao último quadro (com folga).
  const trilho = (grupo, ids) => {
    if (!ids.length) return;
    const w = grupo.startsWith("norte") ? "norte" : grupo;
    const ao = (i) => (w === "norte" ? centros[i].x : centros[i].z);
    const a0 = Math.min(...ids.map(ao)) - 1.2;
    const a1 = Math.max(...ids.map(ao)) + 1.2;
    const box = (u0, u1, y0, y1, d0, d1) => {
      // (u ao longo da parede, d da face para dentro da sala)
      if (w === "norte") return caixa(u0, u1, y0, y1, ZN + d0, ZN + d1);
      if (w === "oeste") return caixa(XO + d0, XO + d1, y0, y1, u0, u1);
      return caixa(XL - d1, XL - d0, y0, y1, u0, u1);
    };
    lotes.add(M.trilho, box(a0, a1, TY - 0.03, TY + 0.03, TR - 0.03, TR + 0.03), semSombra);
    for (const u of [a0 + 0.15, (a0 + a1) / 2, a1 - 0.15]) {
      lotes.add(M.trilho, box(u - 0.02, u + 0.02, TY, TY + 0.03, -T * 0.7, TR), semSombra);
      lotes.add(M.trilho, box(u - 0.02, u + 0.02, H, TY + 0.03, -T * 0.7, -T * 0.7 + 0.04), semSombra);
    }
  };
  for (const [w, ids] of Object.entries(porParede)) trilho(w, ids);

  // Cabeças (corpo + lente), feixes e halos: instanciados, um por quadro.
  const N = SLOTS.length;
  const cabecaGeo = track(new THREE.CylinderGeometry(0.05, 0.068, 0.2, rad).translate(0, -0.1, 0));
  const lenteGeo = track(new THREE.CircleGeometry(0.05, rad).rotateX(Math.PI / 2).translate(0, -0.202, 0));
  const feixeGeo = track(new THREE.ConeGeometry(1, 1, lite ? 10 : 18, 1, true).translate(0, -0.5, 0));
  {
    // Degradê no feixe: forte na lente, some na parede.
    const pos = feixeGeo.attributes.position;
    const cores = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const k = 1 + pos.getY(i) * 0.9;
      cores.set([k, k, k], i * 3);
    }
    feixeGeo.setAttribute("color", new THREE.BufferAttribute(cores, 3));
  }
  const cabecas = track(new THREE.InstancedMesh(cabecaGeo, M.trilho, N));
  const lentes = track(new THREE.InstancedMesh(lenteGeo, track(new THREE.MeshBasicMaterial({ color: pal.lamp })), N));
  const feixes = track(new THREE.InstancedMesh(feixeGeo, track(new THREE.MeshBasicMaterial({
    color: pal.lamp,
    vertexColors: true,
    transparent: true,
    opacity: lite ? 0.035 : 0.025,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })), N));
  const haloGeo = track(new THREE.PlaneGeometry(2.0, 2.3));
  const halos = track(new THREE.InstancedMesh(haloGeo, track(new THREE.MeshBasicMaterial({
    map: track(makeHaloTexture(pal)),
    transparent: true,
    opacity: lite ? 0.16 : 0.1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })), N));
  feixes.renderOrder = 2;
  halos.renderOrder = 1;
  const DOWN = new THREE.Vector3(0, -1, 0);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  SLOTS.forEach((s, i) => {
    const c = centros[i];
    const n = new THREE.Vector3(s.normal[0], 0, s.normal[1]);
    const cab = c.clone().addScaledVector(n, TR);
    cab.y = TY - 0.03;
    const alvo = c.clone().add(new THREE.Vector3(0, 0.15, 0));
    const dir = alvo.clone().sub(cab).normalize();
    q.setFromUnitVectors(DOWN, dir);
    m4.compose(cab, q, one);
    cabecas.setMatrixAt(i, m4);
    lentes.setMatrixAt(i, m4);
    // Feixe: começa na lente e abre até cobrir a moldura.
    const ini = cab.clone().addScaledVector(dir, 0.2);
    const len = ini.distanceTo(alvo) + 0.15;
    m4.compose(ini, q, new THREE.Vector3(QUADRO.largura * 0.55, len, QUADRO.largura * 0.55));
    feixes.setMatrixAt(i, m4);
    // Halo colado na parede, atrás da moldura.
    const h = c.clone().addScaledVector(n, 0.004);
    h.y = c.y + 0.18;
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    m4.compose(h, q, one);
    halos.setMatrixAt(i, m4);
  });
  cabecas.castShadow = false;
  root.add(cabecas, lentes, halos, feixes);

  // ---- Luzes ----------------------------------------------------------------------
  // Salão um pouco mais suave (a sanca e os spots dão o clima); no lite,
  // sem spots, a ambiente compensa.
  const luzQuente = mix(white, pv("yellow-400"), 0.16);
  const hemi = new THREE.HemisphereLight(
    mix(white, pv("yellow-400"), 0.1),
    mix(pal.woodLight, white, 0.35),
    lite ? 2.0 : 1.3,
  );
  root.add(hemi);

  // Claraboia: direcional suave, alta e vinda do sul (ilumina a parede norte
  // e não joga as paredes laterais na sombra).
  const sol = new THREE.DirectionalLight(luzQuente, lite ? 1.25 : 1.05);
  sol.position.set(-1.5, 12, 7);
  sol.target.position.set(0, 0, -0.5);
  if (!lite) {
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    const sc = sol.shadow.camera;
    sc.left = -11;
    sc.right = 11;
    sc.top = 8.5;
    sc.bottom = -8.5;
    sc.near = 1;
    sc.far = 30;
    sol.shadow.bias = -0.0004;
    sol.shadow.normalBias = 0.03;
    sol.shadow.radius = 3;
  }
  root.add(sol, sol.target);

  // Destaque dos quadros: até 4 spots quentes, cada um cobre um par de
  // molduras. Ficam marcados (userData.slots/base) para quadros.js reforçar
  // o do quadro em destaque, sem criar outra luz.
  const spots = [];
  const corSpot = mix(pal.lamp, pv("yellow-400"), 0.22);
  if (!lite) {
    const pares = [];
    for (const ids of Object.values(porParede)) {
      for (let i = 0; i < ids.length; i += 2) pares.push(ids.slice(i, i + 2));
    }
    for (const par of pares.slice(0, 4)) {
      const mid = par.reduce((s, i) => s.add(centros[i]), new THREE.Vector3()).multiplyScalar(1 / par.length);
      const s = SLOTS[par[0]];
      const n = new THREE.Vector3(s.normal[0], 0, s.normal[1]);
      const meia = par.length > 1 ? centros[par[0]].distanceTo(centros[par[1]]) / 2 + QUADRO.largura / 2 + 0.3 : 1;
      const spot = new THREE.SpotLight(corSpot, 11, 0, 0.72, 0.8, 2);
      spot.userData.slots = par;
      spot.userData.base = spot.intensity;
      spot.position.copy(mid).addScaledVector(n, 2.1);
      spot.position.y = H + 0.5;
      spot.target.position.copy(mid);
      spot.target.position.y = QUADRO.centroY - 0.1;
      spot.angle = Math.min(1.0, Math.atan2(meia, spot.position.distanceTo(spot.target.position)) + 0.05);
      root.add(spot, spot.target);
      spots.push(spot);
    }
  }

  // Fundo: sala de exposição "no escuro" em volta da maquete.
  const fundoAntes = scene.background;
  scene.background = mix(pv("blue-950"), pv("gray-900"), 0.55);

  lotes.fechar(root, track);

  // ---- Animação -------------------------------------------------------------------
  // Toggle liga/desliga a cada ~3 s, camada do meio balança, topo flutua.
  const setToggle = (k) => {
    knob.position.x = 0.18 - 0.08 + 0.16 * k;
    toggleMat.color.lerpColors(toggleCorOff, toggleCorOn, k);
  };
  setToggle(1);

  function update(t, dt) {
    elevador.update(t, dt);
    if (reducedMotion) return;
    const onda = Math.sin((t * Math.PI * 2) / 3.2);
    setToggle(THREE.MathUtils.smoothstep(onda, -0.35, 0.35));
    camadaMeio.rotation.y = 0.26 + Math.sin(t * 0.6) * 0.12;
    topo.position.y = yDeck + 0.015 + Math.sin(t * 1.4) * 0.015;
  }

  function dispose() {
    root.removeFromParent();
    if (scene.background && scene.background.isColor) scene.background = fundoAntes;
  }

  return { update, dispose, elevador, raiz: root };
}
