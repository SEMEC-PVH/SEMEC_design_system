// Vila SEMEC — motor 3D da página Quem Somos.
//
// three.js puro, sem React: o componente VilaSemec importa este módulo
// sob demanda (import dinâmico), então o three não entra no bundle das
// outras páginas. As cores vêm dos tokens `--pv-*` lidos do CSS em tempo
// de execução — nenhum hex no código.
//
// Mapa em grade (estilo RPG clássico): cada tile tem 1 unidade. O jogador
// anda de tile em tile; árvores, água, casas, placas e pessoas bloqueiam.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { std } from "./buildings/shared";
import { buildBackEnd } from "./buildings/backend";
import { buildDatabase } from "./buildings/database";
import { createChibiKit } from "./scene/chibi";
import { buildSemec } from "./buildings/semec";
import { createLighting } from "./scene/lighting";
import { buildFences, buildSigns, buildStreetProps, LAMP_SOUTH_OFFSET } from "./scene/props";
import { createDayNight, formatClock } from "./scene/daynight";
import { createNightLights } from "./scene/nightlights";
import { createCutscene } from "./scene/cutscene";
import { createPedro } from "./scene/pedro";
import { createOcarinaHideout, createQuestMarker } from "./scene/quest";
import { createEpocas } from "./scene/epocas";
import { createWalkers, WALKER_IDS } from "./scene/walkers";
import { buildVegetation } from "./scene/vegetation";
import { buildGround } from "./scene/ground";
import { areaOf } from "./areas";

const W = 30;
const H = 24;

const GRASS = 0;
const PATH = 1;
const WATER = 2;
const TALL = 3;
const FLOWER = 4;
const TREE = 5;
const FENCE = 6;
const BUILDING = 7;
const SIGN = 8;
const PROP = 9; // mobiliário urbano (poste, banco, lixeira, bicicletário)

const WALKABLE = new Set([GRASS, PATH, TALL, FLOWER]);

const DIRS = {
  up: { dx: 0, dy: -1, rot: Math.PI },
  down: { dx: 0, dy: 1, rot: 0 },
  left: { dx: -1, dy: 0, rot: -Math.PI / 2 },
  right: { dx: 1, dy: 0, rot: Math.PI / 2 },
};
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };

const STEP_WALK = 0.26;
const STEP_RUN = 0.15;
// Ciclo da clip `andando` = 2 passos ≈ 0,68 m na escala do modelo.
const WALK_CYCLE_STRIDE = 0.68;
// Teto de aceleração da clip: acima disso a perna vira borrão (o pé desliza um pouco).
const WALK_MAX_TIMESCALE = 2.6;
const TURN_LOCK = 0.09;
const IDLE_BEFORE_CODING = 2.2;
// Distância da câmera no modo vitrine (tela de título).
const ATTRACT_ZOOM = 1.75;
// Zoom do jogador (roda do mouse, + e -): multiplica a distância da câmera.
const ZOOM_MIN = 0.55;
const ZOOM_MAX = 1.6;

const BUILDINGS = [
  { id: "semec", kind: "semec", x: 3, y: 3, w: 6, h: 4, label: "SEMEC" },
  // Bairro de tecnologia: Front-End e Back-End lado a lado ao sul da rua
  // principal. O Banco de Dados (torre alta) fica ao norte, encostado na
  // floresta: prédio alto com chão andável atrás esconde o jogador da câmera.
  { id: "frontend", kind: "frontend", x: 16, y: 11, w: 5, h: 4, label: "FRONT-END" },
  { id: "backend", kind: "backend", x: 22, y: 11, w: 5, h: 4, label: "BACK-END" },
  { id: "database", kind: "database", x: 11, y: 2, w: 4, h: 4, label: "BANCO DE DADOS" },
];

const SIGNS = [
  { id: "boas-vindas", x: 16, y: 20 },
  { id: "diretoria", x: 3, y: 7 },
  { id: "rio", x: 19, y: 7 },
  { id: "front-end", x: 20, y: 15 },
  { id: "back-end", x: 26, y: 15 },
  { id: "banco-de-dados", x: 15, y: 7 },
];

// Mobiliário urbano (scene/props.js): cada item ocupa um tile PROP, não
// andável. Nunca sobre caminho nem na frente de porta, placa ou NPC.
// dir = para onde o banco "olha".
const PROPS = [
  { kind: "lamp", x: 5, y: 9 },
  { kind: "lamp", x: 10, y: 9 },
  { kind: "lamp", x: 17, y: 7 },
  { kind: "lamp", x: 24, y: 7 },
  { kind: "lamp", x: 13, y: 13 },
  { kind: "lamp", x: 13, y: 17 },
  { kind: "lamp", x: 16, y: 17 },
  { kind: "lamp", x: 21, y: 17 },
  { kind: "lamp", x: 27, y: 17 },
  { kind: "planter", x: 13, y: 9 },
  { kind: "bin", x: 13, y: 10 },
  { kind: "bench", x: 13, y: 11, dir: "right" },
  { kind: "planter", x: 13, y: 15 },
  { kind: "bench", x: 16, y: 18, dir: "left" },
  { kind: "bin", x: 16, y: 19 },
  { kind: "bench", x: 25, y: 17, dir: "down" },
  { kind: "bin", x: 26, y: 17 },
  { kind: "bikes", x: 18, y: 15 },
  { kind: "bikes", x: 24, y: 15 },
];

// Diretoria na porta da SEMEC; estagiários na frente do prédio da sua área
// (pelo cargo). Quem não casar com nenhuma área usa um ponto genérico.
// O Pedro (3D, quest da ocarina) fica à esquerda da porta, em QUEST_SPOT.
const DIRECTOR_SPOTS = [
  { x: 7, y: 7, dir: "down" },
  { x: 10, y: 6, dir: "down" },
  { x: 4, y: 7, dir: "down" },
];
const QUEST_SPOT = { x: 5, y: 7, dir: "down" };
// Onde a ocarina do Pedro caiu: mato alto do parque a sudeste, longe da SEMEC.
const OCARINA_SPOT = { x: 25, y: 19 };
// Distância (em tiles) em que o painel da quest aparece ao chegar perto do Pedro.
const QUEST_NEAR = 3;
// Cena da ocarina, futuro "festa": onde o time se junta, em volta da estátua
// do Design System (scene/epocas.js, tile 7,10).
const FESTA_SPOTS = [
  [6, 9], [8, 9], [6, 11], [8, 11], [4, 10], [9, 10], [3, 9], [9, 9],
];
const AREA_SPOTS = {
  frontend: [
    { x: 16, y: 15, dir: "down" },
    { x: 19, y: 15, dir: "down" },
    { x: 21, y: 13, dir: "left" },
  ],
  backend: [
    { x: 22, y: 15, dir: "down" },
    { x: 25, y: 15, dir: "down" },
    { x: 27, y: 13, dir: "left" },
  ],
  database: [
    { x: 11, y: 6, dir: "down" },
    { x: 15, y: 5, dir: "left" },
    { x: 10, y: 4, dir: "right" },
  ],
  generic: [
    { x: 21, y: 7, dir: "up" },
    { x: 11, y: 20, dir: "right" },
    { x: 6, y: 12, dir: "down" },
    { x: 23, y: 19, dir: "up" },
  ],
};

const START = { x: 14, y: 20, dir: "up" };

function buildMap() {
  const g = Array.from({ length: H }, () => Array(W).fill(GRASS));
  const rect = (x0, y0, x1, y1, t) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = t;
  };

  // Borda de floresta.
  rect(0, 0, W - 1, 1, TREE);
  rect(0, H - 2, W - 1, H - 1, TREE);
  rect(0, 0, 1, H - 1, TREE);
  rect(W - 2, 0, W - 1, H - 1, TREE);

  // Rio Madeira (lago com cantos arredondados).
  rect(20, 2, 27, 6, WATER);
  for (const [x, y] of [[20, 2], [20, 6], [27, 6], [21, 6]]) g[y][x] = GRASS;

  // Mato alto, flores e árvores soltas.
  rect(16, 2, 17, 2, TALL);
  // Praça do Front-End (x 17–20, y 17–20): grama baixa para o Rafa e o waffle
  // passearem sem o capim esconder os dois (scene/walkers.js).
  for (const [x, y] of [[18, 18], [19, 19]]) g[y][x] = FLOWER;
  rect(2, 10, 4, 13, TALL);
  for (const [x, y] of [[16, 3], [17, 3], [16, 4], [12, 18], [13, 19], [8, 10], [9, 11], [25, 9], [26, 9], [3, 20], [4, 20]]) g[y][x] = FLOWER;
  for (const [x, y] of [[11, 10], [12, 12], [25, 8], [27, 19], [2, 18], [2, 19], [27, 10], [8, 2], [9, 2], [16, 8]]) g[y][x] = TREE;

  // Jardim cercado com flores.
  rect(4, 15, 9, 20, FLOWER);
  rect(3, 14, 10, 14, FENCE);
  rect(3, 21, 10, 21, FENCE);
  rect(3, 14, 3, 21, FENCE);
  rect(10, 14, 10, 21, FENCE);
  g[16][10] = PATH; // portão
  rect(5, 16, 8, 19, GRASS);
  for (const [x, y] of [[6, 17], [7, 18]]) g[y][x] = FLOWER;

  // Caminhos.
  rect(3, 8, 26, 8, PATH);
  rect(6, 7, 6, 7, PATH);
  rect(14, 8, 15, 21, PATH);
  rect(11, 16, 26, 16, PATH);
  rect(17, 15, 17, 15, PATH); // porta do Front-End
  rect(23, 15, 23, 15, PATH); // porta do Back-End (entrada à esquerda do centro)
  rect(12, 6, 13, 7, PATH); // portão do Banco de Dados
  // Parque no canto sudeste.
  rect(22, 18, 26, 20, TALL);
  for (const [x, y] of [[22, 17], [23, 17], [24, 17], [21, 20]]) g[y][x] = FLOWER;
  // Árvores atrás do Front-End e do Back-End: ali o jogador sumiria atrás
  // dos prédios na câmera alta.
  rect(16, 9, 27, 10, TREE);

  for (const b of BUILDINGS) rect(b.x, b.y, b.x + b.w - 1, b.y + b.h - 1, BUILDING);
  for (const s of SIGNS) g[s.y][s.x] = SIGN;
  for (const p of PROPS) g[p.y][p.x] = PROP;
  return g;
}

// PRNG determinístico: a vila é sempre igual.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const pv = (name) => {
    const v = cs.getPropertyValue(`--pv-${name}`).trim();
    return v ? new THREE.Color(v) : new THREE.Color().setHSL(0, 0, 0.5);
  };
  const mix = (a, b, t) => a.clone().lerp(b, t);
  const white = pv("white");
  const p = {
    white,
    black: pv("black"),
    leaves: pv("green-700"),
    woodLight: mix(pv("yellow-800"), pv("yellow-400"), 0.35),
    wall: pv("gray-50"),
    marker: pv("yellow-500"),
    markerLeader: pv("blue-600"),
    markerDone: pv("green-600"),
    skin: mix(mix(pv("yellow-400"), pv("red-200"), 0.55), white, 0.25),
    hair: mix(pv("gray-900"), pv("yellow-800"), 0.45),
    eye: pv("gray-950"),
    pants: pv("gray-700"),
    shirtsDirectors: [pv("blue-700"), pv("blue-900"), pv("blue-600")],
    shirtsInterns: [pv("green-600"), pv("red-600"), pv("yellow-500"), pv("blue-500"), pv("gray-600"), pv("red-400")],
    // Prédio Front-End (referência: estúdio de vidro com acento azul-marinho).
    navy: pv("blue-900"),
    slabTop: pv("gray-200"),
    interior: mix(pv("yellow-400"), white, 0.5),
    interiorFloor: mix(mix(pv("yellow-400"), pv("yellow-800"), 0.25), white, 0.45),
    glass: mix(pv("blue-200"), white, 0.2),
    lamp: mix(pv("yellow-400"), white, 0.85),
    gravel: pv("gray-300"),
    screen: pv("blue-600"),
    screenAccent: [pv("blue-300"), pv("yellow-500"), pv("green-500"), white],
    font: getComputedStyle(document.body).fontFamily || "sans-serif",
    pv,
    mix,
  };
  return p;
}

const tileToWorld = (x, y) => new THREE.Vector3(x - W / 2 + 0.5, 0, y - H / 2 + 0.5);

function makeLabelTexture(text, bg, fg, font) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg.getStyle();
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 24);
  ctx.fill();
  ctx.fillStyle = fg.getStyle();
  // Reduz a fonte até o texto caber (rótulos longos, ex.: "BANCO DE DADOS").
  let size = 64;
  do {
    ctx.font = `700 ${size}px ${font}`;
    size -= 2;
  } while (ctx.measureText(text).width > 456 && size > 24);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 68);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function shadowed(obj) {
  obj.traverse((o) => {
    if (o.isMesh && !o.userData.noShadow) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return obj;
}

// Tela de computador: barra de título + blocos de interface.
function makeScreenTexture(pal, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 80;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = pal.screen.getStyle();
  ctx.fillRect(0, 0, 128, 80);
  ctx.fillStyle = pal.white.getStyle();
  ctx.fillRect(0, 0, 128, 12);
  const blocks = [
    [8, 20, 52, 22],
    [66, 20, 54, 22],
    [8, 48, 34, 24],
    [48, 48, 34, 24],
    [88, 48, 32, 24],
  ];
  blocks.forEach(([x, y, w, h], i) => {
    ctx.fillStyle = pal.screenAccent[(i + seed) % pal.screenAccent.length].getStyle();
    ctx.fillRect(x, y, w, h);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Prédio Front-End: volume superior em balanço com vidro contornando a
// quina, lâmina azul-marinho na lateral, marquise sobre a entrada e
// interior iluminado (mesas e monitores) visível pelo vidro.
// Coordenadas locais: centro do footprint na origem, fachada em +z.
function buildFrontEnd(group, b, { pal, track, unitBox }) {
  const hw = b.w / 2 - 0.05;
  const hd = b.h / 2 - 0.05;
  const mats = {
    white: track(std(pal.wall)),
    slabTop: track(std(pal.slabTop)),
    navy: track(std(pal.navy)),
    interior: track(std(pal.interior, { emissive: pal.interior, emissiveIntensity: 0.45 })),
    floor: track(std(pal.interiorFloor, { emissive: pal.interiorFloor, emissiveIntensity: 0.35 })),
    glass: track(std(pal.glass, { roughness: 0.08, transparent: true, opacity: 0.2, depthWrite: false })),
    lampHousing: track(std(pal.slabTop, { roughness: 0.5 })),
    mullion: track(std(pal.white, { roughness: 0.4 })),
    lamp: track(new THREE.MeshBasicMaterial({ color: pal.lamp })),
    gravel: track(std(pal.gravel)),
    leaves: track(std(pal.leaves, { flatShading: true })),
    bezel: track(std(pal.eye, { roughness: 0.4 })),
    shelf: track(std(pal.woodLight)),
  };

  // Caixa a partir dos limites (x0..x1, y0..y1, z0..z1).
  const box = (mat, x0, x1, y0, y1, z0, z1, opts = {}) => {
    const m = new THREE.Mesh(unitBox, mat);
    m.scale.set(x1 - x0, y1 - y0, z1 - z0);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    if (opts.noShadow) m.userData.noShadow = true;
    group.add(m);
    return m;
  };

  // Vidro com caixilhos verticais finos (ao longo de x ou de z).
  const glazing = (axis, from, to, fixed, y0, y1, spacing) => {
    const t = 0.02;
    if (axis === "x") box(mats.glass, from, to, y0, y1, fixed - t, fixed + t, { noShadow: true });
    else box(mats.glass, fixed - t, fixed + t, y0, y1, from, to, { noShadow: true });
    const n = Math.max(1, Math.round((to - from) / spacing));
    for (let i = 0; i <= n; i++) {
      const p = from + ((to - from) * i) / n;
      if (axis === "x") box(mats.mullion, p - 0.02, p + 0.02, y0, y1, fixed - 0.03, fixed + 0.03);
      else box(mats.mullion, fixed - 0.03, fixed + 0.03, y0, y1, p - 0.02, p + 0.02);
    }
  };

  const groundTop = 1.0;
  const slabTop = 1.28;
  const roofBottom = 2.25;
  const roofTop = 2.43;
  const bladeX0 = hw - 0.5;
  // Balanço discreto: com a câmera alta, um recuo grande esconderia o térreo.
  const upperFront = hd - 0.2; // fachada de vidro do andar de cima
  const groundFront = upperFront - 0.18; // fachada do térreo, levemente recuada

  // ---- Térreo ------------------------------------------------------------------
  box(mats.white, -hw + 0.1, bladeX0, 0, groundTop, -hd + 0.1, groundFront - 1.05); // bloco dos fundos
  box(mats.floor, -hw + 0.1, bladeX0, 0, 0.04, groundFront - 1.05, groundFront); // piso
  box(mats.interior, -hw + 0.15, bladeX0, 0.04, groundTop, groundFront - 1.08, groundFront - 1.02); // parede iluminada
  box(mats.white, -hw + 0.1, -hw + 0.22, 0, groundTop, groundFront - 1.05, groundFront); // lateral esquerda
  // Balcão de recepção com monitor.
  box(mats.white, -0.55, 0.35, 0.04, 0.42, groundFront - 0.75, groundFront - 0.5);
  box(mats.bezel, -0.3, 0.02, 0.44, 0.64, groundFront - 0.66, groundFront - 0.63);
  const lobbyScreen = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.28, 0.17)),
    track(new THREE.MeshBasicMaterial({ map: track(makeScreenTexture(pal, 7)) }))
  );
  lobbyScreen.position.set(-0.14, 0.54, groundFront - 0.625);
  group.add(lobbyScreen);
  // Pilar azul-marinho e vidro da entrada.
  const pillarX0 = -hw + 0.22;
  const pillarX1 = pillarX0 + 0.6;
  box(mats.navy, pillarX0, pillarX1, 0, groundTop, groundFront - 0.35, groundFront + 0.08);
  glazing("x", pillarX1, bladeX0, groundFront, 0.04, groundTop, 0.55);
  // Marquise com luzes embutidas.
  const doorX0 = pillarX1;
  const doorX1 = pillarX1 + 1.75;
  box(mats.navy, doorX0 - 0.05, doorX1, 0.9, 0.99, groundFront, groundFront + 0.45);
  for (const lx of [doorX0 + 0.35, (doorX0 + doorX1) / 2, doorX1 - 0.35]) {
    box(mats.lamp, lx - 0.04, lx + 0.04, 0.885, 0.9, groundFront + 0.25, groundFront + 0.33, { noShadow: true });
  }
  // Hall à direita da entrada: escada subindo e luminárias pendentes.
  const stairX0 = doorX1 + 0.12;
  const stairX1 = bladeX0 - 0.08;
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const sx0 = stairX0 + ((stairX1 - stairX0) * i) / steps;
    box(mats.white, sx0, stairX1, 0.04, 0.04 + (0.9 * (i + 1)) / steps, groundFront - 0.85, groundFront - 0.45);
  }
  for (const px of [stairX0 + 0.12, (stairX0 + stairX1) / 2, stairX1 - 0.12]) {
    box(mats.lampHousing, px - 0.008, px + 0.008, 0.62, groundTop, groundFront - 0.22, groundFront - 0.2, { noShadow: true });
    box(mats.lamp, px - 0.025, px + 0.025, 0.55, 0.62, groundFront - 0.235, groundFront - 0.185, { noShadow: true });
  }

  // Degrau de entrada.
  box(mats.white, doorX0 - 0.05, doorX1, 0, 0.06, groundFront, groundFront + 0.55);

  // ---- Laje do andar de cima (faixa branca grossa) ------------------------------
  box(mats.white, -hw, bladeX0, groundTop, slabTop, -hd + 0.05, upperFront + 0.06);
  // Faixa azul-marinho sob o vidro da direita.
  // Fica 5 mm à frente da laje e 4 mm abaixo do topo dela: coplanar, as duas
  // superfícies brigavam na renderização (z-fighting) e a faixa saltava do vidro.
  box(mats.navy, bladeX0 - 1.35, bladeX0, groundTop, slabTop - 0.004, upperFront - 0.1, upperFront + 0.065);

  // ---- Andar de cima: escritório ------------------------------------------------
  box(mats.interior, -hw + 0.1, bladeX0, slabTop, roofBottom, -hd + 0.1, -hd + 0.2); // parede do fundo
  // Estante no fundo.
  box(mats.shelf, -0.4, 0.9, slabTop, slabTop + 0.55, -hd + 0.2, -hd + 0.38);
  // Duas fileiras de mesas com monitores virados para a fachada.
  box(mats.floor, -hw + 0.08, bladeX0, slabTop, slabTop + 0.01, -hd + 0.2, upperFront - 0.03, { noShadow: true });
  // Bancada colada ao vidro com os monitores virados para fora: com a
  // câmera alta, só ~0,4 m do interior aparece através do vidro.
  const deskZ = upperFront - 0.32;
  box(mats.white, -hw + 0.35, bladeX0 - 0.25, slabTop + 0.3, slabTop + 0.34, deskZ - 0.14, deskZ + 0.14);
  let screenSeed = 0;
  for (let sx = -hw + 0.75; sx < bladeX0 - 0.4; sx += 0.85) {
    box(mats.bezel, sx - 0.21, sx + 0.21, slabTop + 0.36, slabTop + 0.64, deskZ - 0.03, deskZ);
    const screen = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.38, 0.24)),
      track(new THREE.MeshBasicMaterial({ map: track(makeScreenTexture(pal, screenSeed++)) }))
    );
    screen.position.set(sx, slabTop + 0.5, deskZ + 0.005);
    group.add(screen);
    // Cadeira atrás da bancada.
    box(mats.navy, sx - 0.09, sx + 0.09, slabTop + 0.16, slabTop + 0.2, deskZ - 0.45, deskZ - 0.27);
    box(mats.navy, sx - 0.09, sx + 0.09, slabTop + 0.2, slabTop + 0.42, deskZ - 0.49, deskZ - 0.45);
  }
  // Luminárias lineares no teto, perto do vidro para aparecerem na câmera.
  for (const [lx0, lx1] of [[-hw + 0.35, -0.2], [0.25, bladeX0 - 0.35]]) {
    box(mats.lampHousing, lx0, lx1, roofBottom - 0.07, roofBottom - 0.02, upperFront - 0.24, upperFront - 0.14, { noShadow: true });
    box(mats.lamp, lx0 + 0.02, lx1 - 0.02, roofBottom - 0.075, roofBottom - 0.07, upperFront - 0.23, upperFront - 0.15, { noShadow: true });
  }
  // Vidro contornando a quina: fachada + lateral esquerda.
  glazing("x", -hw + 0.05, bladeX0, upperFront, slabTop, roofBottom, 0.6);
  glazing("z", -hd + 0.15, upperFront, -hw + 0.05, slabTop, roofBottom, 0.6);

  // ---- Cobertura com platibanda ----------------------------------------------
  box(mats.white, -hw - 0.05, bladeX0 + 0.02, roofBottom, roofTop, -hd, upperFront + 0.1);
  box(mats.slabTop, -hw + 0.12, bladeX0 - 0.12, roofTop, roofTop + 0.005, -hd + 0.15, upperFront - 0.05, { noShadow: true });
  // Borda elevada (platibanda) em volta da cobertura.
  const rimTop = roofTop + 0.08;
  box(mats.white, -hw - 0.05, bladeX0 + 0.02, roofTop, rimTop, upperFront - 0.02, upperFront + 0.1);
  box(mats.white, -hw - 0.05, bladeX0 + 0.02, roofTop, rimTop, -hd, -hd + 0.12);
  box(mats.white, -hw - 0.05, -hw + 0.07, roofTop, rimTop, -hd, upperFront + 0.1);

  // ---- Lâmina azul-marinho na lateral, passando do telhado -------------------
  box(mats.white, bladeX0, hw, 0, groundTop, -hd + 0.1, groundFront + 0.2); // base branca do térreo
  box(mats.navy, bladeX0, hw - 0.05, groundTop, roofTop + 0.35, -hd + 0.35, upperFront + 0.08);
  box(mats.white, bladeX0 - 0.03, hw, roofTop + 0.35, roofTop + 0.43, -hd + 0.3, upperFront + 0.13);
  box(mats.white, bladeX0 + 0.1, hw, 0, roofTop + 0.15, -hd + 0.05, -hd + 0.35); // volume branco dos fundos

  // ---- Jardineiras com arbustos facetados ------------------------------------
  const pointy = track(new THREE.OctahedronGeometry(0.13, 0));
  const round = track(new THREE.IcosahedronGeometry(0.1, 0));
  const shrub = (geo, x, z, sy) => {
    const m = new THREE.Mesh(geo, mats.leaves);
    m.position.set(x, 0.12 + 0.1 * sy, z);
    m.scale.set(1, sy, 1);
    group.add(m);
    return m;
  };
  const planter = (x0, x1, z0, z1) => {
    box(mats.white, x0, x1, 0, 0.12, z0, z1);
    box(mats.gravel, x0 + 0.04, x1 - 0.04, 0.12, 0.125, z0 + 0.04, z1 - 0.04, { noShadow: true });
  };
  planter(-hw, pillarX0 + 0.05, groundFront - 0.1, hd);
  shrub(pointy, -hw + 0.18, hd - 0.45, 2.6);
  shrub(pointy, -hw + 0.42, hd - 0.62, 1.8);
  shrub(round, -hw + 0.2, hd - 0.18, 1.1);
  shrub(round, -hw + 0.45, hd - 0.2, 0.9);
  planter(doorX1 + 0.1, hw, groundFront + 0.15, hd);
  shrub(pointy, hw - 0.25, groundFront + 0.38, 2.4);
  shrub(pointy, doorX1 + 0.3, groundFront + 0.4, 1.6);
  shrub(round, doorX1 + 0.45, hd - 0.2, 1.2);
  shrub(round, doorX1 + 0.75, hd - 0.18, 1);
  shrub(round, hw - 0.2, hd - 0.18, 1);
  shrub(round, hw - 0.45, hd - 0.15, 0.8);

  // Luz quente interna (sem sombra, alcance curto).
  const warm = new THREE.PointLight(pal.lamp, 2.5, 3.5, 2);
  warm.position.set(0, slabTop + 0.5, 0);
  group.add(warm);

  return { labelPos: new THREE.Vector3(-0.35, (groundTop + slabTop) / 2, upperFront + 0.07), labelBg: pal.navy };
}

export function createVila(host, options) {
  const {
    members = [],
    // Índices (em members) dos líderes de ginásio e da Diretoria: balão com
    // estrela em vez do "!" (areas.js decide quem são).
    leaders = new Set(),
    reducedMotion = false,
    modelUrl,
    onInteract = () => {},
    onFacing = () => {},
    // Ficha de um personagem 3D ou mascote ({ id }): clique nele ou conversa de
    // frente pelo teclado. id: "pedro" | "leo" | "tiago" | "rafa" (pessoas) ou
    // "samurai" | "coelho" | "waffle" (mascotes); "ocarina" fica a cargo da UI.
    onInspect = () => {},
    onReady = () => {},
    onClock = () => {},
    // Fala de uma cena ({ title, text }); a cena espera continueCutscene().
    onCutsceneSay = () => {},
    // Quest da ocarina: perto do Pedro (true/false) e ocarina encontrada.
    onQuestNear = () => {},
    onQuestFind = () => {},
    // Efeito visual de uma cena, feito na interface: { efeito: "sepia", on }
    // ou { efeito: "relogio", on, sentido }.
    onCutsceneEfeito = () => {},
  } = options;

  const map = buildMap();
  const pal = readPalette();
  const rand = mulberry32(20261008);
  const disposables = [];
  const track = (x) => {
    disposables.push(x);
    return x;
  };

  // ---- Renderer, cena, câmera ---------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // near 0,5 (câmera fica a ~14 u do chão): mais precisão de profundidade
  // para a oclusão de ambiente, sem cortar nada.
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 120);
  const CAM_OFFSET = new THREE.Vector3(0, 10.5, 9);
  const camTarget = new THREE.Vector3();

  // Tone mapping, sombras, sol, hemisfério, névoa e pós-processamento:
  // scene/lighting.js (pixel ratio também, conforme o nível de qualidade).
  // Ciclo dia/noite acelerado (parado de manhã com prefers-reduced-motion).
  const dayNight = createDayNight({ pal, reducedMotion });
  const lighting = createLighting({ renderer, scene, camera, pal, track, dayNight });

  // ---- Chão -----------------------------------------------------------------
  const unitBox = track(new THREE.BoxGeometry(1, 1, 1));
  const v = new THREE.Vector3();

  // Terreno contínuo, calçadas com meio-fio e lago (scene/ground.js).
  const groundFx = buildGround({
    scene,
    map,
    pal,
    track,
    W,
    H,
    unitBox,
    tiles: { PATH, WATER, TALL, FLOWER, TREE, BUILDING },
  });
  // Mantém a sequência do PRNG igual à do chão antigo (1 sorteio por tile
  // de terra): o resto da vila (árvores, flores, NPCs) não muda de lugar.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] !== WATER) rand();

  // ---- Árvores, mato alto e flores (scene/vegetation.js) -------------------
  // Copa redonda, coníferas na borda, açaizeiros perto do rio, ipês de
  // destaque, arbustos e pedras só em tiles de árvore e no anel externo.
  const veg = buildVegetation({
    scene,
    map,
    pal,
    track,
    tileToWorld,
    W,
    H,
    tiles: { TREE, TALL, FLOWER, WATER, FENCE, BUILDING },
    reducedMotion,
  });

  // ---- Cercas -----------------------------------------------------------------
  // Cerca branca de ripas com mureta e pilares no portão (scene/props.js).
  const fenceTiles = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] === FENCE) fenceTiles.push([x, y]);
  buildFences(scene, { pal, track, unitBox }, {
    tiles: fenceTiles,
    isFence: (x, y) => map[y]?.[x] === FENCE,
    // Portão = caminho encostado na cerca.
    isGate: (x, y) => map[y]?.[x] === PATH,
    tileToWorld,
  });

  // ---- Prédios -------------------------------------------------------------
  // Animações por quadro dos prédios (luzes, ventoinhas). Desligadas com
  // prefers-reduced-motion.
  const frameUpdaters = [];
  const buildCtx = {
    pal,
    track,
    unitBox,
    reducedMotion,
    onFrame: (fn) => {
      if (!reducedMotion) frameUpdaters.push(fn);
    },
  };
  const BUILDERS = {
    frontend: (group, b) => buildFrontEnd(group, b, buildCtx),
    backend: (group, b) => buildBackEnd(group, b, buildCtx),
    database: (group, b) => buildDatabase(group, b, buildCtx),
    semec: (group, b) => buildSemec(group, b, buildCtx),
  };

  const buildingGroups = new Map(); // id → grupo (épocas da cena da ocarina)
  for (const b of BUILDINGS) {
    const group = new THREE.Group();
    buildingGroups.set(b.id, group);
    group.position.set(b.x + b.w / 2 - W / 2, 0, b.y + b.h / 2 - H / 2);
    const { labelPos, labelBg } = BUILDERS[b.kind](group, b);
    if (b.label) {
      const tex = track(makeLabelTexture(b.label, labelBg, pal.white, pal.font));
      const plate = new THREE.Mesh(track(new THREE.PlaneGeometry(1.2, 0.3)), track(new THREE.MeshBasicMaterial({ map: tex })));
      plate.position.copy(labelPos);
      group.add(plate);
    }
    scene.add(shadowed(group));
  }

  // ---- Placas -----------------------------------------------------------------
  // Totens com moldura grafite e face na cor da área + mobiliário urbano
  // (postes, bancos, lixeiras, bicicletários), tudo instanciado.
  buildSigns(scene, buildCtx, { signs: SIGNS, tileToWorld });
  buildStreetProps(scene, buildCtx, { props: PROPS, tileToWorld });

  // ---- NPCs (o time) --------------------------------------------------------
  const occupied = new Map(); // "x,y" -> npc
  const npcs = [];
  // Bonecos chibi (scene/chibi.js): geometria compartilhada, visual por índice.
  // Também usado pelo jogador provisório enquanto o GLB carrega.
  const { makeChibi, makeMarker, setMarkerDone } = createChibiKit({ pal, track });
  // Alto o bastante para não encostar nos cachos/coque vistos da câmera.
  const MARKER_Y = 1.53;
  // Inclinação do balão para encarar a câmera (alta, ao sul).
  const MARKER_TILT = -0.55;
  let di = 0;
  let ii = 0;
  const areaUsed = {};
  const takeSpot = (area) => {
    const i = areaUsed[area] ?? 0;
    areaUsed[area] = i + 1;
    return AREA_SPOTS[area][i];
  };
  // Líderes escolhem primeiro: ficam no ponto principal da área (porta).
  const spotOf = new Map();
  const byLeaderFirst = members.map((m, i) => i).sort((a, b) => leaders.has(b) - leaders.has(a));
  for (const index of byLeaderFirst) {
    const member = members[index];
    if (member.group === "directors") continue;
    spotOf.set(index, takeSpot(areaOf(member.role)) || takeSpot("generic"));
  }
  // Líderes com boneco 3D (scene/walkers.js): o chibi vira âncora invisível
  // (tile, balão de líder, conversa e cenas) e o 3D fica no lugar dele.
  const anchors = new Map(); // id do boneco 3D → fig do líder
  // Quem dá quest (o Pedro) não vira chibi: é o NPC 3D de scene/pedro.js.
  const questIndex = members.findIndex((m) => m.quest);
  members.forEach((member, index) => {
    if (member.quest) return;
    const isDirector = member.group === "directors";
    const spot = isDirector ? DIRECTOR_SPOTS[di++] : spotOf.get(index);
    if (!spot) return;
    if (!isDirector) ii++;
    const shirts = isDirector ? pal.shirtsDirectors : pal.shirtsInterns;
    const shirt = shirts[(isDirector ? di - 1 : ii - 1) % shirts.length];
    const fig = makeChibi({ shirt, eye: pal.eye, variant: npcs.length + 1, director: isDirector });
    fig.position.copy(tileToWorld(spot.x, spot.y));
    fig.rotation.y = DIRS[spot.dir].rot;
    const leader = leaders.has(index);
    const boneco = leader && modelUrl && WALKER_IDS.has(member.retrato) ? member.retrato : null;
    if (boneco) {
      fig.traverse((o) => {
        if (o.isMesh) o.visible = false; // continua no raycast do clique
      });
      anchors.set(boneco, fig);
    }
    const marker = makeMarker({ leader });
    // O 3D é mais baixo que o chibi: balão um pouco mais perto da cabeça.
    const markerY = boneco ? MARKER_Y - 0.12 : MARKER_Y;
    marker.position.y = markerY;
    // Balão sempre de frente para a câmera, qualquer que seja a direção do NPC.
    marker.rotation.set(MARKER_TILT, -fig.rotation.y, 0);
    fig.add(marker);
    fig.traverse((o) => (o.userData.npcIndex = npcs.length));
    scene.add(fig);
    const npc = { index, member, x: spot.x, y: spot.y, dir: spot.dir, fig, marker, markerY, boneco, talked: false, leader, beaten: false, phase: rand() * 6 };
    npcs.push(npc);
    occupied.set(`${spot.x},${spot.y}`, npc);
  });

  // ---- Luzes da noite (postes, janelas, vaga-lumes) -------------------------
  // Criado depois de toda a cena: recolhe os materiais emissivos já montados.
  const lampSpots = PROPS.filter((p) => p.kind === "lamp").map((p) => {
    const w = tileToWorld(p.x, p.y);
    w.z += LAMP_SOUTH_OFFSET;
    return w;
  });
  const glowSpots = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if ((map[y][x] === TALL || map[y][x] === FLOWER) && (x + y) % 2 === 0) glowSpots.push(tileToWorld(x, y));
  const nightLights = createNightLights({ scene, pal, track, lamps: lampSpots, glowSpots, reducedMotion });
  let lastClock = "";

  // ---- Jogador ----------------------------------------------------------------
  const player = {
    x: START.x,
    y: START.y,
    dir: START.dir,
    root: new THREE.Group(),
    body: null,
    move: null,
    path: [],
    pending: null,
    turnLock: 0,
    idle: 0,
    run: false,
  };
  player.root.position.copy(tileToWorld(player.x, player.y));
  player.root.rotation.y = DIRS[player.dir].rot;
  const placeholder = makeChibi({ shirt: pal.white, pants: pal.pants, skin: pal.skin, hair: pal.hair, eye: pal.eye });
  player.root.add(placeholder);
  player.body = placeholder;
  scene.add(player.root);

  // Sombra de contato redonda sob o jogador (o rig não projeta bem nos pés).
  const blob = new THREE.Mesh(
    track(new THREE.CircleGeometry(0.3, 20)),
    track(new THREE.MeshBasicMaterial({ color: pal.black, transparent: true, opacity: 0.18, depthWrite: false }))
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.01;
  player.root.add(blob);

  // Personagem animado: anda de notebook guardado; parado, abre e programa.
  let mixer = null;
  let actions = null;
  let laptop = null;
  let laptopLid = null;
  let laptopPose = null; // pose do notebook aberto, mantida durante a `digitando`
  let coding = false;
  let walking = false;
  let walkStride = WALK_CYCLE_STRIDE;
  let walkCycle = 1;
  let disposed = false;

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  // Pedro: NPC 3D parado na frente da SEMEC com a quest da ocarina
  // (scene/pedro.js); a ocarina fica escondida no mato (scene/quest.js).
  let questEtapa = "nova";
  let questNear = false;
  const questMarker = createQuestMarker({ pal, track, reducedMotion });
  const pedro =
    modelUrl && questIndex >= 0
      ? createPedro({
          scene,
          loader,
          url: modelUrl.replace(/gava\.glb$/, "pedro.glb"),
          tileToWorld,
          spot: { ...QUEST_SPOT, rot: DIRS[QUEST_SPOT.dir].rot },
          index: questIndex,
          marker: questMarker.object,
          occupied,
          shadowColor: pal.black,
          reducedMotion,
          isPaused: () => paused || cutscene.active,
        })
      : null;
  const ocarina = pedro
    ? createOcarinaHideout({
        scene,
        loader,
        url: modelUrl.replace(/gava\.glb$/, "ocarina.glb"),
        pos: tileToWorld(OCARINA_SPOT.x, OCARINA_SPOT.y),
        pal,
        track,
        reducedMotion,
      })
    : null;
  // Duplas dono + mascote passeando (Leo + samurai, Tiago + coelho): scene/walkers.js.
  const walkers = modelUrl
    ? createWalkers({
        scene,
        loader,
        baseUrl: modelUrl.replace(/gava\.glb$/, ""),
        tileToWorld,
        isFree: (x, y) => passable(x, y) && !(player.x === x && player.y === y),
        occupied,
        shadowColor: pal.black,
        slashColor: pal.white,
        bubble: { bg: pal.white, fg: pal.eye, font: pal.font },
        anchors,
        reducedMotion,
        isPaused: () => paused || cutscene.active,
      })
    : [];
  if (modelUrl) {
    loader
      .loadAsync(modelUrl)
      .then((gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const k = 0.98 / size.y;
        walkStride = WALK_CYCLE_STRIDE * k;
        model.scale.setScalar(k);
        model.position.y = -box.min.y * k;
        const wrap = new THREE.Group();
        wrap.add(shadowed(model));
        player.root.remove(placeholder);
        player.root.add(wrap);
        player.body = wrap;
        laptop = model.getObjectByName("Laptop");
        laptopLid = model.getObjectByName("LaptopLid");
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          const clip = (n) => gltf.animations.find((a) => a.name === n);
          const entrada = clip("entrada");
          const digitando = clip("digitando");
          const andando = clip("andando");
          if (entrada && digitando) {
            actions = { entrada: mixer.clipAction(entrada), digitando: mixer.clipAction(digitando) };
            if (andando) {
              actions.andando = mixer.clipAction(andando);
              walkCycle = andando.duration;
            }
            actions.entrada.setLoop(THREE.LoopOnce, 1);
            actions.entrada.clampWhenFinished = true;
            mixer.addEventListener("finished", (e) => {
              if (e.action === actions.entrada && coding) {
                // A `digitando` não anima escala/rotação do notebook nem a
                // tampa: sem isso, ao sair da `entrada` eles voltariam ao
                // repouso (escala 0,001, tampa fechada). Guarda a pose final.
                laptopPose = [laptop, laptopLid]
                  .filter(Boolean)
                  .map((o) => ({ o, s: o.scale.clone(), q: o.quaternion.clone() }));
                actions.digitando.reset().play();
                actions.digitando.crossFadeFrom(actions.entrada, 0.15, false);
              }
            });
          }
        }
        stopCoding();
      })
      .catch(() => {
        // Sem o modelo, o bonequinho provisório continua valendo.
      });
  }

  // Caminhada: crossfade entre a pose parada (1º quadro da `entrada`) e a
  // clip `andando`, acelerada para casar com a velocidade do passo em grade.
  function walkTimeScale() {
    const dur = player.run ? STEP_RUN : STEP_WALK;
    const natural = walkStride / walkCycle; // m/s da clip em 1x
    return Math.min(1 / dur / natural, WALK_MAX_TIMESCALE);
  }

  function startWalk() {
    walking = true;
    const walk = actions?.andando;
    if (!walk) return;
    walk.timeScale = walkTimeScale();
    if (walk.isRunning() && walk.getEffectiveWeight() > 0.99) return;
    walk.enabled = true;
    walk.setEffectiveWeight(1);
    walk.play();
    walk.crossFadeFrom(actions.entrada, 0.12, false);
  }

  function stopWalk() {
    walking = false;
    const walk = actions?.andando;
    if (!walk || coding) return;
    actions.entrada.reset().play();
    actions.entrada.paused = true;
    actions.entrada.crossFadeFrom(walk, 0.15, false);
  }

  function startCoding() {
    if (!actions || coding) return;
    coding = true;
    // Vira para a câmera: o notebook fica de frente para quem joga.
    face("down");
    if (laptop) laptop.visible = true;
    actions.digitando.stop();
    actions.andando?.stop();
    actions.entrada.reset().play();
    if (reducedMotion) {
      actions.entrada.time = actions.entrada.getClip().duration;
    }
  }

  function stopCoding() {
    coding = false;
    laptopPose = null;
    if (!actions) {
      if (laptop) laptop.visible = false;
      return;
    }
    actions.digitando.stop();
    // Pose de caminhada = primeiro quadro da `entrada` (braços baixos).
    actions.entrada.reset().play();
    actions.entrada.paused = true;
    if (laptop) laptop.visible = false;
    mixer.update(0);
  }

  // ---- Destaque do tile sob o mouse -----------------------------------------
  const hover = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.9, 0.9)),
    track(new THREE.MeshBasicMaterial({ color: pal.white, transparent: true, opacity: 0.35, depthWrite: false }))
  );
  hover.rotation.x = -Math.PI / 2;
  hover.position.y = 0.012;
  hover.visible = false;
  scene.add(hover);

  // ---- Regras de movimento ----------------------------------------------------
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const passable = (x, y) => inBounds(x, y) && WALKABLE.has(map[y][x]) && !occupied.has(`${x},${y}`);

  function frontOf() {
    const d = DIRS[player.dir];
    return { x: player.x + d.dx, y: player.y + d.dy };
  }

  function targetAt(x, y) {
    const npc = occupied.get(`${x},${y}`);
    if (npc) return { type: npc.isWalker ? "pedro" : "npc", npc };
    const sign = SIGNS.find((sg) => sg.x === x && sg.y === y);
    if (sign) return { type: "sign", sign };
    return null;
  }

  let lastFacingKey = "";
  function reportFacing() {
    const f = frontOf();
    const t = targetAt(f.x, f.y);
    // Personagem 3D ou mascote (Pedro, duplas): Espaço abre a ficha dele.
    const inspectId = t?.type === "pedro" ? (t.npc.inspectId ?? t.npc.id ?? null) : null;
    let key = "";
    if (inspectId) key = `inspect:${inspectId}`;
    else if (t?.type === "npc") key = `npc:${t.npc.index}`;
    else if (t?.type === "sign") key = `sign:${t.sign.id}`;
    if (key === lastFacingKey) return;
    lastFacingKey = key;
    if (inspectId) onFacing({ type: "inspect", id: inspectId });
    else if (t?.type === "npc") onFacing({ type: "npc", index: t.npc.index });
    else if (t?.type === "sign") onFacing({ type: "sign", id: t.sign.id });
    else onFacing(null);
  }

  function face(dir) {
    player.dir = dir;
    player.root.rotation.y = DIRS[dir].rot;
    reportFacing();
  }

  function tryStep(dir) {
    const d = DIRS[dir];
    const nx = player.x + d.dx;
    const ny = player.y + d.dy;
    if (player.dir !== dir) face(dir);
    if (!passable(nx, ny)) return false;
    player.move = {
      from: tileToWorld(player.x, player.y),
      to: tileToWorld(nx, ny),
      t: 0,
      dur: player.run ? STEP_RUN : STEP_WALK,
    };
    player.x = nx;
    player.y = ny;
    veg.rustle(nx, ny);
    if (coding) stopCoding();
    player.idle = 0;
    return true;
  }

  function paintMarker(npc, color) {
    npc.marker.material.color.copy(color);
    npc.marker.material.emissive.copy(color);
  }

  // Ocarina: achada ao pisar no tile (ou de frente para ele, com Espaço).
  function tryFindOcarina(x, y) {
    if (questEtapa !== "procurando" || x !== OCARINA_SPOT.x || y !== OCARINA_SPOT.y) return false;
    questEtapa = "achou";
    ocarina?.pop(player.root.position);
    ocarina?.setEtapa("achou");
    questMarker.setEtapa("achou");
    onQuestFind();
    return true;
  }

  function interact() {
    const f = frontOf();
    const t = targetAt(f.x, f.y);
    if (!t) {
      tryFindOcarina(f.x, f.y);
      return;
    }
    if (t.type === "pedro") {
      t.npc.talk(DIRS[OPPOSITE[player.dir]].rot);
      // Ficha de quem está no tile: marca do dono/mascote (companion.js
      // `inspectId`) ou o próprio Pedro (`id`).
      const id = t.npc.inspectId ?? t.npc.id ?? t.npc.group?.id;
      if (id) onInspect({ id });
      return;
    }
    if (t.type === "npc" && t.npc.isQuestNpc) {
      t.npc.talk(DIRS[OPPOSITE[player.dir]].rot);
      onInteract({ type: "npc", index: t.npc.index });
      return;
    }
    if (t.type === "npc") {
      const npc = t.npc;
      npc.dir = OPPOSITE[player.dir];
      npc.fig.rotation.y = DIRS[npc.dir].rot;
      // Chefe 3D: o mascote se exibe para o jogador.
      if (npc.boneco) walkers.find((w) => w.id === npc.boneco)?.cheer();
      if (!npc.talked) {
        npc.talked = true;
        // Líder só ganha o "✓" quando o ginásio é vencido (setLeadersDone).
        if (!npc.leader) paintMarker(npc, pal.markerDone);
      }
      onInteract({ type: "npc", index: npc.index });
    } else {
      onInteract({ type: "sign", id: t.sign.id });
    }
  }

  // Busca em largura até o tile (ou até um vizinho, se o alvo bloqueia).
  function findPath(tx, ty) {
    const goalIsBlocked = !passable(tx, ty);
    const isGoal = (x, y) =>
      goalIsBlocked ? Math.abs(x - tx) + Math.abs(y - ty) === 1 : x === tx && y === ty;
    const startKey = `${player.x},${player.y}`;
    const prev = new Map([[startKey, null]]);
    const queue = [[player.x, player.y]];
    while (queue.length) {
      const [x, y] = queue.shift();
      if (isGoal(x, y)) {
        const dirs = [];
        let key = `${x},${y}`;
        while (prev.get(key)) {
          const { from, dir } = prev.get(key);
          dirs.unshift(dir);
          key = from;
        }
        return dirs;
      }
      for (const [dir, d] of Object.entries(DIRS)) {
        const nx = x + d.dx;
        const ny = y + d.dy;
        const k = `${nx},${ny}`;
        if (prev.has(k) || !passable(nx, ny)) continue;
        prev.set(k, { from: `${x},${y}`, dir });
        queue.push([nx, ny]);
      }
    }
    return null;
  }

  // ---- Cenas (scene/cutscene.js) ----------------------------------------------
  // Atores por "player" ou índice em members.
  const npcByIndex = new Map(npcs.map((n) => [n.index, n]));
  const actors = {
    get(who) {
      if (who === "player") {
        return {
          get x() {
            return player.x;
          },
          get y() {
            return player.y;
          },
          object: player.root,
          face,
          moveTo(x, y, snap = true) {
            player.x = x;
            player.y = y;
            if (snap) player.root.position.copy(tileToWorld(x, y));
          },
        };
      }
      // O Pedro (3D, quest) é ator de câmera: posição e objeto; ele mesmo
      // cuida de para onde olha (scene/pedro.js).
      if (pedro && who === pedro.index) {
        return { x: pedro.x, y: pedro.y, object: pedro.root, face() {}, moveTo() {} };
      }
      const n = npcByIndex.get(who);
      if (!n) return null;
      return {
        get x() {
          return n.x;
        },
        get y() {
          return n.y;
        },
        object: n.fig,
        face(dir) {
          n.dir = dir;
          n.fig.rotation.y = DIRS[dir].rot;
        },
        moveTo(x, y, snap = true) {
          occupied.delete(`${n.x},${n.y}`);
          n.x = x;
          n.y = y;
          occupied.set(`${x},${y}`, n);
          if (snap) n.fig.position.copy(tileToWorld(x, y));
        },
      };
    },
  };
  // ---- Mundo nas cenas (passo { mundo } de scene/cutscene.js) -----------------
  // Épocas da cena da ocarina (scene/epocas.js), tempo acelerado, time reunido
  // na praça e efeitos de tela. instant = pular a cena (ou o passo): aplica o
  // estado final sem animar. Devolve quantos segundos o passo deve esperar.
  const epocas = createEpocas({
    scene,
    pal,
    track,
    tileToWorld,
    buildings: buildingGroups,
    makeLabel: (text, bg, fg) => makeLabelTexture(text, bg, fg, pal.font),
    reducedMotion,
  });
  let tempoAnim = null; // { from, to, t, dur, cmd }
  let tempoAplicado = 0; // horas somadas pela cena (o "voltar" desfaz)
  const reuniao = new Map(); // npc → { x, y, dir } de antes da festa
  function reunir(on) {
    if (on && !reuniao.size) {
      for (const n of npcs.slice(0, FESTA_SPOTS.length)) {
        reuniao.set(n, { x: n.x, y: n.y, dir: n.dir });
        occupied.delete(`${n.x},${n.y}`);
      }
      [...reuniao.keys()].forEach((n, i) => {
        const [x, y] = FESTA_SPOTS[i];
        n.x = x;
        n.y = y;
        n.dir = "down";
        occupied.set(`${x},${y}`, n);
        n.fig.position.copy(tileToWorld(x, y));
        n.fig.rotation.y = DIRS.down.rot;
      });
    } else if (!on && reuniao.size) {
      for (const n of reuniao.keys()) occupied.delete(`${n.x},${n.y}`);
      for (const [n, o] of reuniao) {
        n.x = o.x;
        n.y = o.y;
        n.dir = o.dir;
        occupied.set(`${o.x},${o.y}`, n);
        n.fig.position.copy(tileToWorld(o.x, o.y));
        n.fig.rotation.y = DIRS[o.dir].rot;
      }
      reuniao.clear();
    }
  }
  function mundo(cmd, instant) {
    const rapido = instant || reducedMotion;
    if (cmd.tocar !== undefined) {
      pedro?.tocar(cmd.tocar);
      return 0;
    }
    // Época: a construção (ou a volta) roda em `dur` segundos SEM segurar a
    // cena, para acontecer junto com o relógio do passo seguinte.
    if (cmd.epoca !== undefined) {
      epocas.set(cmd.epoca, { dur: rapido ? 0 : (cmd.dur ?? 0) });
      return 0;
    }
    if (cmd.reunir !== undefined) {
      reunir(cmd.reunir);
      return 0;
    }
    if (cmd.efeito !== undefined) {
      onCutsceneEfeito(cmd);
      return 0;
    }
    if (cmd.tempo !== undefined) {
      // O passo em andamento terminando de uma vez (pular): só fecha a animação.
      if (tempoAnim) {
        dayNight.setHours(tempoAnim.to);
        const mesmo = tempoAnim.cmd === cmd;
        tempoAnim = null;
        if (mesmo) return 0;
      }
      const h0 = dayNight.state.hours;
      let delta;
      if (cmd.tempo === "voltar") delta = -tempoAplicado;
      else {
        // Avança (1) ou volta (-1) `dias` dias inteiros e para na hora `ate`.
        const dias = cmd.dias ?? 2;
        delta =
          cmd.tempo > 0 ? dias * 24 + ((((cmd.ate - h0) % 24) + 24) % 24) : -(dias * 24 + ((((h0 - cmd.ate) % 24) + 24) % 24));
      }
      tempoAplicado = cmd.tempo === "voltar" ? 0 : tempoAplicado + delta;
      if (rapido) {
        dayNight.setHours(h0 + delta);
        return 0;
      }
      tempoAnim = { from: h0, to: h0 + delta, t: 0, dur: cmd.dur ?? 3, cmd };
      return tempoAnim.dur;
    }
    return 0;
  }

  const cutscene = createCutscene({
    mundo,
    scene,
    track,
    pal,
    tileToWorld,
    DIRS,
    reducedMotion,
    actors,
    onSay: (fala) => onCutsceneSay(fala),
  });

  // ---- Entrada ------------------------------------------------------------------
  const held = []; // direções seguradas, a última tem prioridade
  let paused = false;

  const api = {
    press(dir) {
      if (!DIRS[dir]) return;
      player.path = [];
      player.pending = null;
      if (!held.includes(dir)) held.push(dir);
      if (!player.move && player.dir !== dir && !paused) {
        face(dir);
        player.turnLock = TURN_LOCK;
      }
    },
    release(dir) {
      const i = held.indexOf(dir);
      if (i >= 0) held.splice(i, 1);
    },
    releaseAll() {
      held.length = 0;
      player.run = false;
    },
    step(dir) {
      player.pending = null;
      player.path = [dir];
    },
    setRun(on) {
      player.run = on;
    },
    interact() {
      if (!paused && !player.move && !cutscene.active) interact();
    },
    setPaused(p) {
      paused = p;
      if (p) held.length = 0;
    },
    // Etapa da quest da ocarina (quest.js): símbolo, esconderijo e o Pedro.
    // celebrar: acabou de devolver (o Pedro dança na hora).
    setQuest(etapa, { celebrar = false } = {}) {
      questEtapa = etapa;
      questMarker.setEtapa(etapa);
      ocarina?.setEtapa(etapa);
      if (etapa === "concluida") {
        if (celebrar) pedro?.celebrate();
        else pedro?.setHasOcarina(true);
      } else pedro?.setHasOcarina(false);
    },
    // Líderes já vencidos (Set/array de índices em members): estrela → "✓".
    setLeadersDone(indices) {
      const done = new Set(indices);
      for (const n of npcs) {
        if (!n.leader || n.beaten === done.has(n.index)) continue;
        n.beaten = done.has(n.index);
        paintMarker(n, n.beaten ? pal.markerDone : pal.markerLeader);
      }
    },
    // Aproxima (fator < 1) ou afasta (fator > 1) a câmera do personagem.
    zoomBy(fator) {
      userZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, userZoom * fator));
    },
    // Cena: devolve uma Promise que resolve quando ela termina (ou é pulada).
    playCutscene(steps) {
      held.length = 0;
      player.path = [];
      player.pending = null;
      player.idle = 0;
      if (coding) stopCoding();
      return cutscene.play(steps).then(reportFacing);
    },
    continueCutscene() {
      cutscene.continuar();
    },
    skipCutscene() {
      cutscene.pular();
    },
    // Modo vitrine (tela de título): câmera afastada sobrevoando a vila.
    setAttract(on) {
      attract = on;
    },
    dispose,
  };

  // ---- Mouse / toque: clique no chão para andar, em alguém para conversar ----
  // Personagens 3D e mascotes (Pedro, duplas) abrem a ficha: onInspect({ id }).
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const npcFigs = npcs.map((n) => n.fig);
  // Malhas invisíveis dos personagens 3D e mascotes (userData.inspectId).
  const inspectProxies = () => [pedro, ...walkers].flatMap((c) => c?.hitProxies ?? []);

  // { inspect: id } quando o ponteiro está sobre um personagem 3D ou mascote
  // (abre a ficha); { x, y, npc? } para um tile ou boneco chibi.
  function pick(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(npcFigs, true)[0];
    const proxyHit = raycaster.intersectObjects(inspectProxies(), true)[0];
    // Proxy na frente (ou sem boneco chibi na linha): ficha do personagem.
    if (proxyHit && (!hit || proxyHit.distance <= hit.distance)) {
      // O Pedro conversa (quest) em vez de abrir a ficha: vira alvo de tile.
      if (pedro && proxyHit.object.userData.inspectId === pedro.id) return { x: pedro.x, y: pedro.y };
      return { inspect: proxyHit.object.userData.inspectId };
    }
    if (hit) {
      const npc = npcs[hit.object.userData.npcIndex];
      return { x: npc.x, y: npc.y, npc };
    }
    const p = raycaster.ray.intersectPlane(groundPlane, v);
    if (!p) return null;
    const x = Math.floor(p.x + W / 2);
    const y = Math.floor(p.z + H / 2);
    return inBounds(x, y) ? { x, y } : null;
  }

  function onPointerMove(ev) {
    if (ev.pointerType !== "mouse") return;
    const t = pick(ev);
    if (t?.inspect) {
      renderer.domElement.classList.add("is-pointer");
      hover.visible = false;
      return;
    }
    const target = t && targetAt(t.x, t.y);
    renderer.domElement.classList.toggle("is-pointer", Boolean(target));
    if (t && passable(t.x, t.y)) {
      hover.position.copy(tileToWorld(t.x, t.y)).setY(0.012);
      hover.visible = true;
    } else hover.visible = false;
  }

  function onPointerLeave() {
    hover.visible = false;
  }

  function onClick(ev) {
    if (paused || cutscene.active) return;
    const t = pick(ev);
    if (!t) return;
    // Personagem 3D ou mascote: abre a ficha sem andar até ele.
    if (t.inspect) {
      onInspect({ id: t.inspect });
      return;
    }
    const target = targetAt(t.x, t.y);
    const path = findPath(t.x, t.y);
    if (!path) return;
    held.length = 0;
    player.path = path;
    player.pending = target ? { x: t.x, y: t.y } : null;
  }

  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);
  renderer.domElement.addEventListener("click", onClick);

  // ---- Tamanho e visibilidade ---------------------------------------------------
  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Em tela estreita, afasta a câmera para caber mais mapa.
    const far = w / h < 0.9 ? 1.35 : 1;
    camera.position.copy(camTarget).addScaledVector(CAM_OFFSET, far);
    camera.userData.far = far;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  let lastTs = null;
  let t = 0;

  // Fora da tela (rolou até a lista da equipe), para de renderizar.
  const io = new IntersectionObserver(([entry]) => {
    lastTs = null;
    renderer.setAnimationLoop(entry.isIntersecting ? tick : null);
  });
  io.observe(host);

  // ---- Loop ---------------------------------------------------------------------
  let attract = false;
  let attractT = 0;
  let zoom = 1;
  let userZoom = 1;
  const attractGoal = new THREE.Vector3();
  camTarget.copy(player.root.position);

  function tick(ts) {
    const dt = lastTs === null ? 0 : Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    t += dt;

    // Movimento em grade.
    if (player.turnLock > 0) player.turnLock -= dt;
    if (player.move) {
      const m = player.move;
      m.t += dt / m.dur;
      const k = Math.min(m.t, 1);
      player.root.position.lerpVectors(m.from, m.to, k);
      // Sem a clip `andando` (bonequinho provisório), balanço procedural.
      if (player.body && !reducedMotion && !actions?.andando) {
        player.body.position.y = Math.abs(Math.sin(k * Math.PI)) * 0.06;
        player.body.rotation.z = Math.sin(k * Math.PI * 2) * 0.07;
      }
      if (m.t >= 1) {
        player.move = null;
        tryFindOcarina(player.x, player.y);
        if (player.body) {
          player.body.position.y = 0;
          player.body.rotation.z = 0;
        }
        reportFacing();
      }
    }
    if (!player.move && !paused && !cutscene.active) {
      const want = held[held.length - 1];
      if (want && player.turnLock <= 0) tryStep(want);
      else if (!want && player.path.length) {
        const dir = player.path.shift();
        if (!tryStep(dir)) player.path = [];
      } else if (!want && player.pending) {
        const p = player.pending;
        player.pending = null;
        const dx = p.x - player.x;
        const dy = p.y - player.y;
        const dir = Object.keys(DIRS).find((k) => DIRS[k].dx === dx && DIRS[k].dy === dy);
        if (dir) {
          face(dir);
          interact();
        }
      }
    }
    if (!player.move && !held.length && !player.path.length) {
      player.idle += dt;
      if (!coding && !cutscene.active && player.idle > IDLE_BEFORE_CODING) startCoding();
    }
    if (player.move && !walking) startWalk();
    else if (!player.move && walking) stopWalk();
    if (walking && actions?.andando) actions.andando.timeScale = walkTimeScale();
    if (mixer) mixer.update(dt);
    pedro?.update(dt);
    questMarker.update(t, dt);
    ocarina?.update(t, dt);
    // Perto do Pedro: o painel da quest aparece no canto da tela.
    if (pedro) {
      const near = Math.max(Math.abs(player.x - pedro.x), Math.abs(player.y - pedro.y)) <= QUEST_NEAR;
      if (near !== questNear) {
        questNear = near;
        onQuestNear(near);
      }
    }
    for (const w of walkers) w.update(dt);
    // Pedro e as duplas andam sozinhos: a dica "Espaço: …" acompanha quem
    // entra ou sai da frente do jogador (barato: uma consulta na grade).
    if (!player.move) reportFacing();
    if (coding && laptopPose) {
      for (const p of laptopPose) {
        p.o.scale.copy(p.s);
        p.o.quaternion.copy(p.q);
      }
    }

    for (const fn of frameUpdaters) fn(t, dt);

    // Ciclo dia/noite: luz (em lighting.update), postes/janelas e relógio do HUD.
    dayNight.update(dt);
    // Cena da ocarina: o relógio corre (para frente ou para trás), acelerando
    // no começo e freando no fim.
    if (tempoAnim) {
      tempoAnim.t += dt;
      const k = Math.min(tempoAnim.t / tempoAnim.dur, 1);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      dayNight.setHours(tempoAnim.from + (tempoAnim.to - tempoAnim.from) * e);
      if (k >= 1) tempoAnim = null;
    }
    epocas.update(t, dt);
    // Festa: o time pula de alegria em volta da estátua.
    if (reuniao.size && !reducedMotion) {
      for (const n of reuniao.keys()) n.fig.position.y = Math.abs(Math.sin(t * 5 + n.phase)) * 0.12;
    }
    nightLights.update(dayNight.state.night, t);
    const clock = formatClock(dayNight.state.hours);
    if (clock !== lastClock) {
      lastClock = clock;
      onClock({ time: clock, night: dayNight.state.night > 0.5 });
    }

    // NPCs: balão de frente para a câmera e "!" → "✓" depois da conversa
    // (líderes: estrela → "✓" depois de vencidos)
    // (estado, não animação: roda mesmo com reduced motion).
    for (const n of npcs) {
      setMarkerDone(n.marker, n.leader ? n.beaten : n.talked);
      n.marker.rotation.y = -n.fig.rotation.y;
    }
    // NPCs: respiração, cabeça balançando e balão flutuante.
    if (!reducedMotion) {
      for (const n of npcs) {
        const b = n.fig.userData.body;
        b.scale.y = 1 + Math.sin(t * 2.2 + n.phase) * 0.015;
        n.fig.userData.head.rotation.z = Math.sin(t * 0.9 + n.phase) * 0.05;
        n.marker.position.y = n.markerY + Math.sin(t * 2.4 + n.phase) * 0.045;
        n.marker.rotation.y = -n.fig.rotation.y + Math.sin(t * 1.3 + n.phase) * 0.12;
      }

      // Água ondulando, vitórias-régias e reflexos (scene/ground.js).
      groundFx.update(t);
    }

    // Mato alto balançando e brisa na vegetação.
    veg.update(t, dt);

    // Câmera segue o jogador; no modo vitrine, afasta e passeia pelo mapa;
    // numa cena, vai até o alvo da cena (com reduced motion, corta direto).
    cutscene.update(dt);
    const cutCam = cutscene.camera();
    // Numa cena, o zoom é o da cena; fora dela, o que o jogador escolheu.
    const zoomGoal = attract ? ATTRACT_ZOOM : cutCam ? cutCam.zoom : userZoom;
    // O zoom do jogador responde rápido; o da vitrine e o das cenas, devagar.
    const zoomRate = attract || cutCam ? 2.2 : 9;
    zoom += (zoomGoal - zoom) * (reducedMotion ? 1 : 1 - Math.exp(-dt * zoomRate));
    if (cutCam) {
      camTarget.lerp(cutCam.target, reducedMotion ? 1 : 1 - Math.exp(-dt * 2.6));
    } else if (attract) {
      if (!reducedMotion) attractT += dt;
      attractGoal.set(Math.sin(attractT * 0.07) * 6, 0, Math.cos(attractT * 0.05) * 3 - 1);
      camTarget.lerp(attractGoal, reducedMotion ? 1 : 1 - Math.exp(-dt * 1.2));
    } else {
      camTarget.lerp(player.root.position, reducedMotion ? 1 : 1 - Math.exp(-dt * 6));
    }
    const camFar = (camera.userData.far || 1) * zoom;
    camera.position.copy(camTarget).addScaledVector(CAM_OFFSET, camFar);
    camera.lookAt(camTarget.x, camTarget.y + 0.4, camTarget.z);
    // Sol, frustum de sombra e névoa acompanham a câmera; render (com ou sem
    // pós-processamento) fica no módulo de iluminação.
    lighting.update(camTarget, camFar);
    lighting.render(ts);
  }

  renderer.setAnimationLoop(tick);
  window.__vilaDbg = { player, occupied, passable, pedro, walkers, map, epocas, get paused() { return paused; }, get cut() { return cutscene.active; } }; // TEMP-HOOK
  reportFacing();
  onReady();

  function dispose() {
    disposed = true;
    pedro?.dispose();
    ocarina?.dispose();
    for (const w of walkers) w.dispose();
    renderer.setAnimationLoop(null);
    ro.disconnect();
    io.disconnect();
    renderer.domElement.removeEventListener("pointermove", onPointerMove);
    renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
    renderer.domElement.removeEventListener("click", onClick);
    scene.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose();
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const mat of mats) {
          if (!mat) continue;
          for (const val of Object.values(mat)) if (val && val.isTexture) val.dispose();
          mat.dispose();
        }
      }
      if (o.isInstancedMesh) o.dispose();
    });
    for (const d of disposables) d.dispose?.();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return api;
}
