// Mobiliário urbano da Vila SEMEC: cercas do jardim, placas e props de rua
// (postes, bancos, lixeiras, bicicletários).
//
// Tudo o que se repete vira InstancedMesh: um "lote" por par
// geometria + material, então a vila inteira de props custa ~20 draw calls.
// Cores só a partir de tokens (pal.pv / pal.mix) — nenhum hex aqui.

import * as THREE from "three";
import { std } from "../buildings/shared";

// Rotação Y para onde o prop "olha" (mesma convenção do motor: down = +z).
const ROT = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };
export const LAMP_SOUTH_OFFSET = 0.45;

// Texto e cor de cada placa. A cor ecoa o prédio/área a que ela se refere.
const SIGN_STYLE = {
  "boas-vindas": { title: "VILA SEMEC", sub: "Bem-vindo(a)!", bg: "green-800", accent: "yellow-500" },
  diretoria: { title: "SEMEC", sub: "Diretoria", bg: "blue-700", accent: "yellow-500" },
  rio: { title: "RIO MADEIRA", sub: "Porto Velho", bg: "blue-600", accent: "blue-200" },
  "front-end": { title: "FRONT-END", sub: "Front-end · UI/UX", bg: "blue-900", accent: "blue-300" },
  "back-end": { title: "BACK-END", sub: "APIs e serviços", bg: "gray-800", accent: "green-500" },
  "banco-de-dados": { title: "BANCO DE DADOS", sub: "Dados · DevOps", bg: "yellow-800", accent: "yellow-400" },
};

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

// Matriz local: posição, rotação (Euler XYZ) e escala.
function mat(px, py, pz, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(px, py, pz), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}

// Lote de instâncias: junta matrizes (e cores opcionais) por geometria +
// material e cria um InstancedMesh por par no flush.
function makeBatcher() {
  const lots = new Map();
  return {
    add(geo, material, parent, local, color) {
      const key = `${geo.uuid}|${material.uuid}`;
      let lot = lots.get(key);
      if (!lot) lots.set(key, (lot = { geo, material, items: [] }));
      lot.items.push({ m: new THREE.Matrix4().multiplyMatrices(parent, local), color });
    },
    flush(scene) {
      for (const { geo, material, items } of lots.values()) {
        const mesh = new THREE.InstancedMesh(geo, material, items.length);
        items.forEach(({ m, color }, i) => {
          mesh.setMatrixAt(i, m);
          if (color) mesh.setColorAt(i, color);
        });
        const lit = !material.userData.noShadow;
        mesh.castShadow = lit && !material.userData.noCast;
        mesh.receiveShadow = lit;
        scene.add(mesh);
      }
      lots.clear();
    },
  };
}

// Paleta do mobiliário, derivada dos tokens.
function propPalette(pal) {
  const { pv, mix } = pal;
  return {
    metalDark: mix(pv("gray-800"), pv("gray-900"), 0.3),
    metal: pv("gray-600"),
    steel: mix(pv("gray-300"), pv("white"), 0.35),
    concrete: mix(pv("gray-200"), pv("gray-300"), 0.5),
    concreteDark: mix(pv("gray-300"), pv("gray-400"), 0.45),
    pole: mix(pv("gray-700"), pv("gray-800"), 0.5),
    wood: mix(pv("yellow-800"), pv("yellow-400"), 0.32),
    woodDark: mix(pv("yellow-800"), pv("gray-800"), 0.2),
    lamp: mix(pv("yellow-400"), pv("white"), 0.75),
    tire: pv("gray-900"),
    paint: mix(pv("white"), pv("gray-100"), 0.35),
    bikes: [pv("blue-600"), pv("red-500"), pv("green-600"), pv("yellow-500")],
    bin: mix(pv("green-800"), pv("gray-800"), 0.35),
    soil: mix(pv("yellow-800"), pv("gray-900"), 0.45),
    shrub: pv("green-700"),
    shrubLight: mix(pv("green-600"), pv("green-500"), 0.4),
  };
}

// Geometrias base (unitárias, escaladas por instância), uma vez por vila.
const geoCache = new WeakMap();
function propGeometries(track, unitBox) {
  if (!geoCache.has(track)) geoCache.set(track, createGeometries(track, unitBox));
  return geoCache.get(track);
}

function createGeometries(track, unitBox) {
  const board = new THREE.Shape();
  const bw = 0.72;
  const bh = 0.46;
  const r = 0.08;
  board.moveTo(-bw / 2 + r, -bh / 2);
  board.lineTo(bw / 2 - r, -bh / 2);
  board.quadraticCurveTo(bw / 2, -bh / 2, bw / 2, -bh / 2 + r);
  board.lineTo(bw / 2, bh / 2 - r);
  board.quadraticCurveTo(bw / 2, bh / 2, bw / 2 - r, bh / 2);
  board.lineTo(-bw / 2 + r, bh / 2);
  board.quadraticCurveTo(-bw / 2, bh / 2, -bw / 2, bh / 2 - r);
  board.lineTo(-bw / 2, -bh / 2 + r);
  board.quadraticCurveTo(-bw / 2, -bh / 2, -bw / 2 + r, -bh / 2);
  const boardGeo = new THREE.ExtrudeGeometry(board, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 6,
  });
  boardGeo.translate(0, 0, -0.0175);

  const cap = new THREE.ConeGeometry(0.075, 0.08, 4);
  cap.rotateY(Math.PI / 4);

  return {
    box: unitBox,
    cyl: track(new THREE.CylinderGeometry(1, 1, 1, 14)),
    rod: track(new THREE.CylinderGeometry(1, 1, 1, 8)),
    sphere: track(new THREE.SphereGeometry(1, 12, 8)),
    cap: track(cap),
    hoop: track(new THREE.TorusGeometry(0.17, 0.016, 6, 14, Math.PI)),
    wheel: track(new THREE.TorusGeometry(0.12, 0.02, 6, 16)),
    shrub: track(new THREE.IcosahedronGeometry(1, 0)),
    board: track(boardGeo),
  };
}

// ---- Cercas -----------------------------------------------------------------
// Cerca de jardim branca: pilaretes com ponteira piramidal, duas travessas,
// ripas verticais e mureta de concreto na base. Os pilares ao lado do
// portão são mais robustos, com esfera no topo.
export function buildFences(scene, ctx, { tiles, isFence, isGate, tileToWorld }) {
  const { pal, track, unitBox } = ctx;
  const c = propPalette(pal);
  const geo = propGeometries(track, unitBox);
  const paint = track(std(c.paint, { roughness: 0.55 }));
  const curb = track(std(c.concrete, { roughness: 0.9 }));
  const batch = makeBatcher();

  for (const [x, y] of tiles) {
    const p = tileToWorld(x, y);
    const at = new THREE.Matrix4().makeTranslation(p.x, 0, p.z);
    const gatePost = isGate(x + 1, y) || isGate(x - 1, y) || isGate(x, y + 1) || isGate(x, y - 1);
    if (gatePost) {
      batch.add(geo.box, curb, at, mat(0, 0.05, 0, 0, 0, 0, 0.24, 0.1, 0.24));
      batch.add(geo.box, paint, at, mat(0, 0.42, 0, 0, 0, 0, 0.16, 0.66, 0.16));
      batch.add(geo.box, paint, at, mat(0, 0.765, 0, 0, 0, 0, 0.2, 0.03, 0.2));
      batch.add(geo.sphere, paint, at, mat(0, 0.83, 0, 0, 0, 0, 0.065, 0.065, 0.065));
    } else {
      batch.add(geo.box, paint, at, mat(0, 0.3, 0, 0, 0, 0, 0.09, 0.6, 0.09));
      batch.add(geo.cap, paint, at, mat(0, 0.64, 0, 0, 0, 0, 0.9, 1, 0.9));
    }

    // Trechos para leste e para sul (cada trecho é desenhado uma vez).
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (!isFence(x + dx, y + dy)) continue;
      const along = dx ? 0 : Math.PI / 2;
      const seg = new THREE.Matrix4()
        .makeTranslation(p.x + dx * 0.5, 0, p.z + dy * 0.5)
        .multiply(new THREE.Matrix4().makeRotationY(along));
      batch.add(geo.box, curb, seg, mat(0, 0.035, 0, 0, 0, 0, 1, 0.07, 0.11));
      for (const h of [0.2, 0.47]) batch.add(geo.box, paint, seg, mat(0, h, 0, 0, 0, 0, 0.92, 0.045, 0.035));
      for (const off of [-0.3, -0.1, 0.1, 0.3]) {
        batch.add(geo.box, paint, seg, mat(off, 0.31, 0, 0, 0, 0, 0.05, 0.48, 0.022));
        batch.add(geo.cap, paint, seg, mat(off, 0.575, 0, 0, 0, 0, 0.36, 0.6, 0.16));
      }
    }
  }
  batch.flush(scene);
}

// ---- Placas -----------------------------------------------------------------
// Totem baixo: dois montantes escuros, tabuleiro arredondado com moldura
// grafite e face colorida (cor da área) com título e filete de destaque.
function makeSignTexture(style, pal) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const g = canvas.getContext("2d");
  g.fillStyle = pal.pv(style.bg).getStyle();
  g.beginPath();
  g.roundRect(0, 0, 512, 320, 44);
  g.fill();
  // Brilho sutil no topo (faixa um pouco mais clara).
  g.fillStyle = pal.mix(pal.pv(style.bg), pal.pv("white"), 0.1).getStyle();
  g.beginPath();
  g.roundRect(0, 0, 512, 120, [44, 44, 0, 0]);
  g.fill();

  g.fillStyle = pal.pv("white").getStyle();
  g.textAlign = "center";
  g.textBaseline = "middle";
  let size = 92;
  do {
    g.font = `700 ${size}px ${pal.font}`;
    size -= 2;
  } while (g.measureText(style.title).width > 456 && size > 30);
  g.fillText(style.title, 256, 124);

  g.fillStyle = pal.pv(style.accent).getStyle();
  g.beginPath();
  g.roundRect(206, 184, 100, 10, 5);
  g.fill();

  // Subtítulo maior e quase branco: precisa ser lido na distância do jogo.
  g.fillStyle = pal.mix(pal.pv("white"), pal.pv(style.bg), 0.08).getStyle();
  size = 62;
  do {
    g.font = `600 ${size}px ${pal.font}`;
    size -= 2;
  } while (g.measureText(style.sub).width > 456 && size > 30);
  g.fillText(style.sub, 256, 250);

  // Filete interno claro: dá acabamento de moldura à face.
  g.strokeStyle = pal.mix(pal.pv(style.bg), pal.pv("white"), 0.28).getStyle();
  g.lineWidth = 6;
  g.beginPath();
  g.roundRect(14, 14, 484, 292, 32);
  g.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function buildSigns(scene, ctx, { signs, tileToWorld }) {
  const { pal, track, unitBox } = ctx;
  const c = propPalette(pal);
  const geo = propGeometries(track, unitBox);
  const frame = track(std(c.metalDark, { roughness: 0.45, metalness: 0.3 }));
  const footing = track(std(c.concrete, { roughness: 0.9 }));
  const faceGeo = track(new THREE.PlaneGeometry(0.68, 0.425));
  const batch = makeBatcher();
  const TILT = -0.16; // tabuleiro inclinado para trás, de frente para a câmera
  const BOARD_Y = 0.5;

  for (const sgn of signs) {
    const style = SIGN_STYLE[sgn.id] || { title: sgn.id.toUpperCase(), sub: "", bg: "blue-700", accent: "yellow-500" };
    const p = tileToWorld(sgn.x, sgn.y);
    const at = new THREE.Matrix4().makeTranslation(p.x, 0, p.z);
    for (const sx of [-0.29, 0.29]) {
      batch.add(geo.box, footing, at, mat(sx, 0.03, 0, 0, 0, 0, 0.1, 0.06, 0.1));
      batch.add(geo.rod, frame, at, mat(sx, 0.36, 0, 0, 0, 0, 0.022, 0.6, 0.022));
    }
    const boardM = mat(0, BOARD_Y, 0, TILT, 0, 0);
    batch.add(geo.board, frame, at, boardM);

    // alphaTest recorta os cantos arredondados sem ordenação de transparência.
    const face = new THREE.Mesh(
      faceGeo,
      track(new THREE.MeshStandardMaterial({ map: track(makeSignTexture(style, pal)), roughness: 0.6, alphaTest: 0.5 }))
    );
    face.matrixAutoUpdate = false;
    face.matrix.multiplyMatrices(at, boardM).multiply(mat(0, 0, 0.034));
    face.receiveShadow = true;
    scene.add(face);
  }
  batch.flush(scene);
}

// ---- Props de rua -------------------------------------------------------------
function addLamp(batch, geo, m, at) {
  // Poste "post-top": sapata de concreto, coluna afunilada, luminária
  // cilíndrica de vidro leitoso e chapéu em disco.
  batch.add(geo.cyl, m.concrete, at, mat(0, 0.04, 0, 0, 0, 0, 0.1, 0.08, 0.1));
  batch.add(geo.cyl, m.pole, at, mat(0, 0.12, 0, 0, 0, 0, 0.042, 0.08, 0.042));
  batch.add(geo.rod, m.pole, at, mat(0, 0.54, 0, 0, 0, 0, 0.026, 0.8, 0.026));
  batch.add(geo.cyl, m.pole, at, mat(0, 0.955, 0, 0, 0, 0, 0.06, 0.035, 0.06));
  batch.add(geo.cyl, m.lens, at, mat(0, 1.05, 0, 0, 0, 0, 0.078, 0.16, 0.078));
  batch.add(geo.cyl, m.pole, at, mat(0, 1.145, 0, 0, 0, 0, 0.115, 0.03, 0.115));
  batch.add(geo.cyl, m.pole, at, mat(0, 1.172, 0, 0, 0, 0, 0.055, 0.025, 0.055));
}

function addBench(batch, geo, m, at) {
  // Pés de concreto, assento de três ripas e encosto inclinado.
  for (const sx of [-0.32, 0.32]) {
    batch.add(geo.box, m.metalDark, at, mat(sx, 0.2, 0.02, 0, 0, 0, 0.05, 0.4, 0.34));
    batch.add(geo.box, m.metalDark, at, mat(sx, 0.48, -0.14, -0.22, 0, 0, 0.045, 0.32, 0.04));
  }
  for (const z of [-0.1, 0.02, 0.14]) batch.add(geo.box, m.wood, at, mat(0, 0.415, z, 0, 0, 0, 0.86, 0.035, 0.1));
  for (const h of [0.52, 0.64]) batch.add(geo.box, m.wood, at, mat(0, h, -0.16 - (h - 0.52) * 0.22, -0.22, 0, 0, 0.86, 0.09, 0.03));
}

function addBin(batch, geo, m, at) {
  batch.add(geo.cyl, m.bin, at, mat(0, 0.23, 0, 0, 0, 0, 0.13, 0.44, 0.13));
  batch.add(geo.cyl, m.wood, at, mat(0, 0.3, 0, 0, 0, 0, 0.134, 0.1, 0.134));
  batch.add(geo.cyl, m.metalDark, at, mat(0, 0.47, 0, 0, 0, 0, 0.145, 0.04, 0.145));
  batch.add(geo.cyl, m.metalDark, at, mat(0, 0.5, 0, 0, 0, 0, 0.07, 0.03, 0.07));
}

// Barra entre dois pontos no plano xy local (quadro da bicicleta).
function bar(x0, y0, x1, y1, t, z = 0) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  return mat((x0 + x1) / 2, (y0 + y1) / 2, z, 0, 0, Math.atan2(y1 - y0, x1 - x0), len, t, t);
}

function addBikeRack(batch, geo, m, at, colors) {
  // Base de concreto, três arcos de inox e duas bicicletas de perfil.
  batch.add(geo.box, m.pad, at, mat(0, 0.012, 0, 0, 0, 0, 0.84, 0.024, 0.78));
  for (const z of [-0.3, 0, 0.3]) batch.add(geo.hoop, m.steel, at, mat(0, 0.03, z, 0, 0, 0, 1, 1.25, 1));
  [-0.15, 0.15].forEach((z, i) => {
    const color = colors[i];
    const dx = i ? 0.04 : -0.04;
    // Eixo a 0,165: raio 0,12 + pneu 0,02 apoia o pneu sobre o piso (0,024).
    const rear = [-0.25 + dx, 0.165];
    const front = [0.25 + dx, 0.165];
    const crank = [-0.02 + dx, 0.165];
    const seat = [-0.1 + dx, 0.415];
    const head = [0.18 + dx, 0.415];
    batch.add(geo.wheel, m.tire, at, mat(rear[0], rear[1], z));
    batch.add(geo.wheel, m.tire, at, mat(front[0], front[1], z));
    for (const [a, b] of [[rear, crank], [rear, seat], [crank, seat], [crank, head], [seat, head], [head, front]])
      batch.add(geo.box, m.bike, at, bar(a[0], a[1], b[0], b[1], 0.022, z), color);
    batch.add(geo.box, m.metalDark, at, mat(seat[0] - 0.02, seat[1] + 0.035, z, 0, 0, 0, 0.1, 0.025, 0.045));
    batch.add(geo.box, m.metalDark, at, mat(head[0] + 0.01, head[1] + 0.05, z, 0, 0, 0, 0.025, 0.025, 0.2));
  });
}

function addPlanter(batch, geo, m, at, rand) {
  batch.add(geo.box, m.concrete, at, mat(0, 0.15, 0, 0, 0, 0, 0.78, 0.3, 0.78));
  batch.add(geo.box, m.soil, at, mat(0, 0.302, 0, 0, 0, 0, 0.68, 0.01, 0.68));
  for (const [sx, sz, k] of [[-0.15, -0.12, 0.2], [0.14, -0.1, 0.17], [0, 0.14, 0.19], [0.18, 0.18, 0.12], [-0.2, 0.16, 0.11]]) {
    const kk = k * (0.9 + rand() * 0.2);
    batch.add(geo.shrub, sx > 0 ? m.shrubLight : m.shrub, at, mat(sx, 0.31 + kk * 0.6, sz, 0, rand() * 3, 0, kk, kk * 0.9, kk));
  }
}

export function buildStreetProps(scene, ctx, { props, tileToWorld }) {
  const { pal, track, unitBox } = ctx;
  const c = propPalette(pal);
  const geo = propGeometries(track, unitBox);
  const lens = track(
    std(c.lamp, { emissive: c.lamp, emissiveIntensity: 1.3, roughness: 0.25 })
  );
  lens.userData.noCast = true;
  // Luminária: quase apagada de dia, acesa à noite (scene/nightlights.js).
  lens.userData.streetLamp = true;
  const m = {
    metalDark: track(std(c.metalDark, { roughness: 0.45, metalness: 0.35 })),
    pole: track(std(c.pole, { roughness: 0.4, metalness: 0.4 })),
    pad: track(std(c.concreteDark, { roughness: 0.95 })),
    steel: track(std(c.steel, { roughness: 0.3, metalness: 0.55 })),
    concrete: track(std(c.concrete, { roughness: 0.9 })),
    wood: track(std(c.wood, { roughness: 0.7 })),
    bin: track(std(c.bin, { roughness: 0.6 })),
    tire: track(std(c.tire, { roughness: 0.8 })),
    bike: track(std(pal.pv("white"), { roughness: 0.45, metalness: 0.2 })),
    soil: track(std(c.soil)),
    shrub: track(std(c.shrub, { flatShading: true })),
    shrubLight: track(std(c.shrubLight, { flatShading: true })),
    lens,
  };
  const batch = makeBatcher();
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  let bikeN = 0;
  for (const pr of props) {
    const p = tileToWorld(pr.x, pr.y);
    // Poste encostado na borda sul do tile: com a câmera ao sul, a luminária
    // projeta para o norte e, no centro do tile, cobriria o jogador no tile
    // de trás. Na borda, a sobreposição termina antes do centro vizinho.
    if (pr.kind === "lamp") p.z += LAMP_SOUTH_OFFSET;
    const at = new THREE.Matrix4().makeTranslation(p.x, 0, p.z).multiply(new THREE.Matrix4().makeRotationY(ROT[pr.dir] ?? 0));
    if (pr.kind === "lamp") addLamp(batch, geo, m, at);
    else if (pr.kind === "bench") addBench(batch, geo, m, at);
    else if (pr.kind === "bin") addBin(batch, geo, m, at);
    else if (pr.kind === "planter") addPlanter(batch, geo, m, at, rand);
    else if (pr.kind === "bikes") {
      addBikeRack(batch, geo, m, at, [c.bikes[bikeN % 4], c.bikes[(bikeN + 1) % 4]]);
      bikeN += 2;
    }
  }
  batch.flush(scene);
}
