// Vegetação da Vila SEMEC: árvores (copa redonda, conífera, açaizeiro e
// ipê), arbustos, pedras, mato alto em tufos e flores.
//
// Tudo é InstancedMesh com geometria compartilhada: cada espécie custa duas
// chamadas de desenho, não importa quantas árvores existam. As cores vêm só
// de tokens (pal.pv / pal.mix); o volume vem de cores por vértice (base mais
// escura, topo mais claro), que se multiplicam pela cor de cada instância.
//
// Brisa: deslocamento no vertex shader (sem custo de CPU), dirigido por um
// uniform de tempo que só avança sem prefers-reduced-motion.
//
// API usada pelo motor:
//   const veg = buildVegetation({ scene, map, pal, track, tileToWorld, W, H, tiles, reducedMotion });
//   veg.rustle(x, y)   -> balança o mato alto do tile (jogador passou).
//   veg.update(t, dt)  -> chamado a cada quadro pelo tick.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// PRNG próprio (determinístico): não consome a sequência do motor.
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

// Ruído por posição: vértices coincidentes recebem o mesmo valor, então o
// deslocamento não abre fendas entre faces.
function hash3(x, y, z) {
  const s = Math.sin(Math.round(x * 1e3) * 12.9898 + Math.round(y * 1e3) * 78.233 + Math.round(z * 1e3) * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

const smooth = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

// Desloca vértices ao longo da direção radial (copa "amassada", orgânica).
function jitter(geo, amount, cx = 0, cy = 0, cz = 0) {
  const pos = geo.attributes.position;
  const d = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    d.set(pos.getX(i) - cx, pos.getY(i) - cy, pos.getZ(i) - cz);
    const n = hash3(pos.getX(i), pos.getY(i), pos.getZ(i)) - 0.5;
    d.normalize().multiplyScalar(n * amount);
    pos.setXYZ(i, pos.getX(i) + d.x, pos.getY(i) + d.y, pos.getZ(i) + d.z);
  }
  return geo;
}

// Cor por vértice: fn(x, y, z, outColor).
function paint(geo, fn) {
  const pos = geo.attributes.position;
  const arr = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    fn(pos.getX(i), pos.getY(i), pos.getZ(i), c);
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

// Gradiente de luminância (oclusão falsa): escuro embaixo, claro em cima.
const shade = (y0, y1, lo, hi, grain = 0.05) => (x, y, z, c) => {
  const v = lo + (hi - lo) * smooth(y0, y1, y) + (hash3(x, y, z) - 0.5) * grain;
  c.setRGB(v, v, v);
};

// Junta partes (indexadas ou não) com os mesmos atributos: position, normal, color.
function merge(parts) {
  const flat = parts.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (n !== g) g.dispose();
    n.deleteAttribute("uv");
    if (!n.attributes.normal) n.computeVertexNormals();
    return n;
  });
  const out = mergeGeometries(flat);
  for (const g of flat) g.dispose();
  out.computeVertexNormals();
  out.computeBoundingSphere();
  return out;
}

// Brisa no vertex shader. `radial` mede a altura pela distância ao eixo (folhas
// de palmeira, que pendem abaixo da origem).
function addWind(material, uTime, { amp = 0.04, freq = 1.4, base = 0, radial = 0 } = {}) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = uTime;
    shader.uniforms.uWindAmp = { value: amp };
    shader.uniforms.uWindFreq = { value: freq };
    shader.uniforms.uWindBase = { value: base };
    shader.uniforms.uWindRadial = { value: radial };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uWindTime;\nuniform float uWindAmp;\nuniform float uWindFreq;\nuniform float uWindBase;\nuniform float uWindRadial;"
      )
      .replace(
        "#include <begin_vertex>",
        [
          "#include <begin_vertex>",
          "#ifdef USE_INSTANCING",
          "  vec2 windAt = instanceMatrix[3].xz;",
          "#else",
          "  vec2 windAt = vec2(0.0);",
          "#endif",
          "float windH = mix(max(transformed.y - uWindBase, 0.0), length(transformed.xz), uWindRadial);",
          "float windPh = uWindTime * uWindFreq + windAt.x * 0.55 + windAt.y * 0.35;",
          "float windGust = 0.65 + 0.35 * sin(uWindTime * 0.37 + windAt.x * 0.11);",
          "transformed.x += sin(windPh) * uWindAmp * windH * windGust;",
          "transformed.z += cos(windPh * 0.83) * uWindAmp * 0.55 * windH * windGust;",
        ].join("\n")
      );
  };
  material.customProgramCacheKey = () => "vila-wind";
  material.userData.wind = { uTime, opts: { amp, freq, base, radial } };
  return material;
}

// Material de profundidade com a mesma brisa: a sombra projetada acompanha o
// balanço da copa (sem ele a sombra ficaria parada enquanto a árvore mexe).
function windDepthFor(material, track) {
  const w = material.userData.wind;
  if (!w) return null;
  return track(addWind(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), w.uTime, w.opts));
}

// ---- Geometrias -------------------------------------------------------------

// Copa redonda: quatro lóbulos facetados, centro do lóbulo principal na origem.
function roundCrownGeo() {
  const lobe = (r, x, y, z, sy = 1) => {
    const g = new THREE.IcosahedronGeometry(r, 1);
    g.scale(1, sy, 1);
    jitter(g, r * 0.32);
    g.translate(x, y, z);
    return g;
  };
  const geo = merge([
    lobe(0.42, 0, 0, 0, 0.86),
    lobe(0.29, 0.25, 0.1, 0.1),
    lobe(0.27, -0.24, 0.06, -0.08),
    lobe(0.25, 0.03, 0.33, -0.05),
    lobe(0.22, -0.06, 0.02, 0.27),
  ]);
  return paint(geo, shade(-0.36, 0.55, 0.5, 1.12, 0.1));
}

// Tronco com base alargada e um galho curto.
function trunkGeo(height = 0.62) {
  const main = new THREE.CylinderGeometry(0.06, 0.1, height, 7);
  main.translate(0, height / 2, 0);
  const flare = new THREE.CylinderGeometry(0.1, 0.16, 0.09, 7);
  flare.translate(0, 0.045, 0);
  const branch = new THREE.CylinderGeometry(0.025, 0.04, 0.24, 5);
  branch.rotateZ(-0.85);
  branch.translate(0.09, height * 0.68, 0);
  const geo = merge([main, flare, branch]);
  return paint(geo, shade(0, height, 0.72, 1.05, 0.06));
}

// Conífera: quatro camadas cônicas; cada camada escurece na base.
function coniferGeo() {
  const tiers = [
    [0.5, 0.5, 0.55],
    [0.4, 0.46, 0.86],
    [0.29, 0.4, 1.13],
    [0.16, 0.32, 1.36],
  ];
  const parts = tiers.map(([r, h, y], i) => {
    const g = new THREE.ConeGeometry(r, h, 8, 1);
    g.rotateY(i * 0.4);
    jitter(g, 0.05);
    g.translate(0, y, 0);
    return paint(g, (x, yy, z, c) => {
      const k = smooth(y - h / 2, y + h / 2, yy);
      const v = 0.56 + 0.42 * k + i * 0.05 + (hash3(x, yy, z) - 0.5) * 0.06;
      c.setRGB(v, v, v);
    });
  });
  const trunk = new THREE.CylinderGeometry(0.05, 0.08, 0.36, 6);
  trunk.translate(0, 0.18, 0);
  return { crown: merge(parts), trunk: paint(trunk, shade(0, 0.36, 0.7, 1, 0.04)) };
}

// Folha de palmeira: ráquis arqueada com as bordas caídas (seção em "V" invertido).
function frondGeo(angle, len, rise, droop, colorAt) {
  const N = 7;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const w = 0.16 * Math.sin(Math.PI * Math.min(1, u * 1.08)) + 0.012;
    const cx = u * len;
    const cy = rise * u - droop * u * u;
    pts.push([
      [cx, cy - w * 0.45, -w],
      [cx, cy, 0],
      [cx, cy - w * 0.45, w],
    ]);
  }
  const pos = [];
  const col = [];
  const c = new THREE.Color();
  const push = (p, u) => {
    pos.push(p[0], p[1], p[2]);
    colorAt(u, c);
    col.push(c.r, c.g, c.b);
  };
  for (let i = 0; i < N; i++) {
    const u0 = i / N;
    const u1 = (i + 1) / N;
    const [l0, m0, r0] = pts[i];
    const [l1, m1, r1] = pts[i + 1];
    push(l0, u0); push(m0, u0); push(l1, u1);
    push(m0, u0); push(m1, u1); push(l1, u1);
    push(m0, u0); push(r0, u0); push(m1, u1);
    push(r0, u0); push(r1, u1); push(m1, u1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.rotateY(angle);
  g.computeVertexNormals();
  return g;
}

// Açaizeiro: estipe fino levemente curvo, palmito verde e cacho roxo.
const PALM_H = 1.75;
const PALM_BEND = 0.12;
function palmGeos(colors, rand) {
  const trunk = new THREE.CylinderGeometry(0.035, 0.055, PALM_H, 6, 10);
  trunk.translate(0, PALM_H / 2, 0);
  const tp = trunk.attributes.position;
  for (let i = 0; i < tp.count; i++) {
    const k = tp.getY(i) / PALM_H;
    tp.setX(i, tp.getX(i) + PALM_BEND * k * k);
  }
  // Anéis do estipe: faixas claras e escuras alternadas.
  paint(trunk, (x, y, z, c) => {
    const ring = Math.round((y / PALM_H) * 10) % 2 === 0 ? 1 : 0.86;
    c.copy(colors.palmTrunk).multiplyScalar(ring * (0.8 + 0.25 * (y / PALM_H)));
  });

  const top = [PALM_BEND, PALM_H, 0];
  const parts = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.4;
    const len = 0.62 + rand() * 0.2;
    const g = frondGeo(angle, len, 0.26 + rand() * 0.1, 0.62 + rand() * 0.22, (u, c) => {
      c.copy(colors.frondBase).lerp(colors.frondTip, u);
    });
    g.translate(top[0], top[1], top[2]);
    parts.push(g);
  }
  // Folhas novas, quase em pé.
  for (const a of [0.6, 2.9]) {
    const g = frondGeo(a, 0.42, 0.42, 0.18, (u, c) => c.copy(colors.frondTip).lerp(colors.frondYoung, u));
    g.translate(top[0], top[1], top[2]);
    parts.push(g);
  }
  const shaft = new THREE.CylinderGeometry(0.042, 0.05, 0.3, 6);
  shaft.translate(top[0], top[1] - 0.13, top[2]);
  parts.push(paint(shaft, (x, y, z, c) => c.copy(colors.shaft)));
  // Cacho de açaí pendurado sob o palmito.
  for (let i = 0; i < 7; i++) {
    const b = new THREE.IcosahedronGeometry(0.032, 0);
    const a = i * 0.9;
    b.translate(top[0] + 0.07 + Math.cos(a) * 0.035, top[1] - 0.3 - (i % 3) * 0.035, top[2] + Math.sin(a) * 0.035);
    parts.push(paint(b, (x, y, z, c) => c.copy(colors.berry)));
  }
  return { trunk, crown: merge(parts) };
}

// Arbusto: três lóbulos baixos.
function bushGeo() {
  const lobe = (r, x, y, z) => {
    const g = new THREE.IcosahedronGeometry(r, 1);
    g.scale(1, 0.82, 1);
    jitter(g, r * 0.35);
    g.translate(x, y, z);
    return g;
  };
  const geo = merge([lobe(0.25, 0, 0.16, 0), lobe(0.19, 0.21, 0.12, 0.06), lobe(0.17, -0.19, 0.1, 0.07), lobe(0.15, 0.04, 0.1, -0.17)]);
  return paint(geo, shade(0, 0.38, 0.6, 1.1, 0.08));
}

// Pedra facetada com musgo no topo.
function rockGeo(colors) {
  const g = new THREE.DodecahedronGeometry(0.24, 0);
  jitter(g, 0.12);
  g.scale(1.2, 0.55, 0.95);
  g.translate(0, 0.07, 0);
  const geo = merge([g]);
  return paint(geo, (x, y, z, c) => {
    const k = smooth(0.08, 0.17, y);
    const v = 0.78 + 0.3 * smooth(-0.05, 0.17, y) + (hash3(x, y, z) - 0.5) * 0.1;
    c.setRGB(v, v, v).lerp(colors.moss, k * 0.55);
  });
}

// Tufo de mato: lâminas afinando e curvando para fora, em leque.
function tuftGeo(colors) {
  const pos = [];
  const col = [];
  const c = new THREE.Color();
  const blades = 9;
  const SEG = 3;
  for (let b = 0; b < blades; b++) {
    const a = (b / blades) * Math.PI * 2 + b * 0.7;
    const h = 0.28 + ((b * 37) % 7) * 0.03;
    const lean = 0.1 + ((b * 13) % 5) * 0.035;
    const w0 = 0.032;
    const dx = Math.cos(a);
    const dz = Math.sin(a);
    const px = -dz;
    const pz = dx;
    const ring = [];
    for (let s = 0; s <= SEG; s++) {
      const u = s / SEG;
      const off = lean * u * u;
      const w = w0 * (1 - u * 0.92);
      const cx = dx * (0.03 + off);
      const cz = dz * (0.03 + off);
      ring.push([[cx - px * w, h * u, cz - pz * w], [cx + px * w, h * u, cz + pz * w], u]);
    }
    const put = (p, u) => {
      pos.push(p[0], p[1], p[2]);
      c.copy(colors.grassBase).lerp(colors.grassTip, u);
      col.push(c.r, c.g, c.b);
    };
    for (let s = 0; s < SEG; s++) {
      const [l0, r0, u0] = ring[s];
      const [l1, r1, u1] = ring[s + 1];
      put(l0, u0); put(r0, u0); put(l1, u1);
      put(r0, u0); put(r1, u1); put(l1, u1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

// Flor: cinco pétalas (cabeça) + miolo + caule com folhinha.
function petalsGeo() {
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.SphereGeometry(0.05, 7, 4);
    g.scale(1, 0.3, 0.6);
    g.translate(0.052, 0, 0);
    g.rotateY((i / 5) * Math.PI * 2);
    parts.push(g);
  }
  return paint(merge(parts), (x, y, z, c) => {
    const r = Math.hypot(x, z);
    const v = 0.74 + 0.34 * smooth(0.0, 0.09, r);
    c.setRGB(v, v, v);
  });
}

function stemGeo() {
  const stem = new THREE.CylinderGeometry(0.007, 0.01, 1, 4);
  stem.translate(0, 0.5, 0);
  const leaf = new THREE.SphereGeometry(0.03, 5, 3);
  leaf.scale(1.4, 0.18, 0.55);
  leaf.rotateZ(0.5);
  leaf.translate(0.035, 0.35, 0);
  const leaf2 = new THREE.SphereGeometry(0.026, 5, 3);
  leaf2.scale(1.4, 0.18, 0.55);
  leaf2.rotateZ(-0.5);
  leaf2.translate(-0.03, 0.22, 0);
  return merge([stem, leaf, leaf2]);
}

// ---- Construção ---------------------------------------------------------------

export function buildVegetation({ scene, map, pal, track, tileToWorld, W, H, tiles, reducedMotion = false }) {
  const { TREE, TALL, FLOWER, WATER, FENCE, BUILDING } = tiles;
  // Tile onde o jogador pode estar (andável ou mato/flor).
  const isOpen = (x, y) => {
    const t = map[y]?.[x];
    return t !== undefined && t !== TREE && t !== WATER && t !== FENCE && t !== BUILDING;
  };
  const rand = mulberry32(80261008);
  const { pv, mix } = pal;
  const white = pv("white");

  const colors = {
    leafLight: mix(mix(pv("green-600"), pv("green-700"), 0.2), pv("yellow-500"), 0.06),
    leafMid: mix(pv("green-600"), pv("green-700"), 0.45),
    leafDeep: mix(pv("green-700"), pv("green-800"), 0.35),
    leafCool: mix(mix(pv("green-700"), pv("blue-700"), 0.1), pv("green-600"), 0.3),
    coniferA: mix(pv("green-800"), pv("blue-900"), 0.12),
    coniferB: mix(pv("green-700"), pv("green-800"), 0.45),
    ipeYellow: mix(pv("yellow-500"), pv("yellow-400"), 0.35),
    ipePink: mix(mix(pv("red-300"), pv("red-400"), 0.25), white, 0.12),
    wood: mix(pv("yellow-800"), pv("gray-700"), 0.3),
    palmTrunk: mix(mix(pv("gray-500"), pv("yellow-800"), 0.4), white, 0.12),
    frondBase: mix(pv("green-700"), pv("green-800"), 0.3),
    frondTip: mix(pv("green-600"), pv("green-500"), 0.45),
    frondYoung: mix(pv("green-500"), pv("yellow-400"), 0.3),
    shaft: mix(pv("green-600"), pv("yellow-500"), 0.18),
    berry: mix(pv("blue-950"), pv("red-900"), 0.45),
    bushA: mix(pv("green-600"), pv("green-700"), 0.4),
    bushB: mix(pv("green-700"), pv("green-800"), 0.3),
    rockA: mix(mix(pv("gray-200"), pv("yellow-800"), 0.22), pv("gray-300"), 0.35),
    rockB: mix(mix(pv("gray-300"), pv("yellow-800"), 0.25), pv("gray-400"), 0.35),
    moss: mix(pv("green-600"), pv("green-700"), 0.4),
    grassBase: mix(pv("green-700"), pv("green-800"), 0.55),
    grassTip: mix(mix(pv("green-500"), pv("green-600"), 0.3), pv("yellow-400"), 0.12),
    stem: mix(pv("green-700"), pv("green-600"), 0.3),
    flowers: [
      pv("red-500"),
      pv("yellow-500"),
      mix(white, pv("yellow-400"), 0.06),
      pv("blue-300"),
      mix(pv("red-300"), white, 0.3),
      mix(pv("blue-300"), pv("red-300"), 0.5),
    ],
    flowerCenter: mix(pv("yellow-500"), pv("yellow-600"), 0.4),
    flowerCenterDark: mix(pv("yellow-800"), pv("gray-900"), 0.3),
  };

  const windTime = { value: 0 };
  const leafMat = (extra = {}) =>
    track(new THREE.MeshStandardMaterial({ color: white, vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0, ...extra }));

  // Matrizes temporárias (nada é alocado no loop).
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();
  const c = new THREE.Color();

  // ---- Distribuição -----------------------------------------------------------
  const specs = { round: [], conifer: [], palm: [], bush: [], rock: [] };
  const add = (kind, x, z, y, k, color) => {
    specs[kind].push({ x, z, y, k, rot: rand() * Math.PI * 2, tx: (rand() - 0.5) * 0.08, tz: (rand() - 0.5) * 0.08, color });
  };
  // Ipês aleatórios só longe do caminho (anel externo e borda norte).
  const roundColor = (allowIpe = false) => {
    const r = rand();
    if (allowIpe && r < 0.03) return colors.ipeYellow;
    if (allowIpe && r < 0.045) return colors.ipePink;
    const base = r < 0.4 ? colors.leafMid : r < 0.7 ? colors.leafDeep : r < 0.85 ? colors.leafCool : colors.leafLight;
    return c.copy(base).offsetHSL((rand() - 0.5) * 0.02, 0, (rand() - 0.5) * 0.05).clone();
  };
  const coniferColor = () => c.copy(colors.coniferA).lerp(colors.coniferB, rand()).offsetHSL(0, 0, (rand() - 0.5) * 0.04).clone();
  const bushColor = () => c.copy(colors.bushA).lerp(colors.bushB, rand()).offsetHSL(0, 0, (rand() - 0.5) * 0.04).clone();
  const rockColor = () => c.copy(colors.rockA).lerp(colors.rockB, rand()).clone();
  const palmTint = () => {
    const g = 0.9 + rand() * 0.15;
    return new THREE.Color(g, g, g);
  };

  // Árvores de destaque em tiles soltos do mapa.
  const special = {
    "8,2": "palm",
    "9,2": "palm",
    "12,12": "ipeYellow",
    "27,19": "ipePink",
  };
  const nearLake = (x, y) => x >= 18 && y <= 8;

  // Sob as árvores: arbusto e pedra num canto do tile (só em tile TREE).
  const underbrush = (p, y0, chanceBush, chanceRock) => {
    if (rand() < chanceBush) {
      const a = rand() * Math.PI * 2;
      add("bush", p.x + Math.cos(a) * 0.32, p.z + Math.sin(a) * 0.32, y0, 0.6 + rand() * 0.35, bushColor());
    }
    if (rand() < chanceRock) {
      const a = rand() * Math.PI * 2;
      add("rock", p.x + Math.cos(a) * 0.34, p.z + Math.sin(a) * 0.34, y0, 0.55 + rand() * 0.6, rockColor());
    }
  };

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (map[y][x] !== TREE) continue;
      const p = tileToWorld(x, y);
      const jx = (rand() - 0.5) * 0.18;
      const jz = (rand() - 0.5) * 0.18;
      const sp = special[`${x},${y}`];
      const border = x <= 1 || y <= 1 || x >= W - 2 || y >= H - 2;
      // Chão aberto logo ao norte: com a câmera ao sul, uma copa alta aqui
      // cobriria as pernas do jogador (ex.: fileira y=9 colada na rua y=8).
      const openNorth = y > 1 && isOpen(x, y - 1);
      if (sp === "palm") {
        add("palm", p.x + jx, p.z + jz, 0, 0.95 + rand() * 0.15, palmTint());
        underbrush(p, 0, 0.7, 0.3);
      } else if (sp) {
        // Ipê de destaque: um pouco menor e recuado para o sul do tile.
        if (openNorth) add("round", p.x, p.z + 0.26, 0, 0.86, colors[sp]);
        else add("round", p.x, p.z, 0, 1.08, colors[sp]);
        underbrush(p, 0, 0.6, 0.2);
      } else if (openNorth && y !== H - 2) {
        // Cerca viva: arbustos aparados ao longo do caminho, com uma árvore
        // baixa de vez em quando para quebrar a repetição.
        if (rand() < 0.22) add("round", p.x + jx, p.z + 0.15, 0, 0.58 + rand() * 0.08, roundColor());
        else {
          add("bush", p.x + jx * 0.5 - 0.18, p.z + 0.05, 0, 1.05 + rand() * 0.25, bushColor());
          add("bush", p.x + jx * 0.5 + 0.24, p.z + 0.12 + jz, 0, 0.85 + rand() * 0.25, bushColor());
        }
        if (rand() < 0.15) add("rock", p.x + (rand() - 0.5) * 0.5, p.z + 0.32, 0, 0.5 + rand() * 0.3, rockColor());
      } else if (y === H - 2) {
        // Fileira sul, mais perto da câmera: arbustos e árvores baixas para
        // não cobrir o caminho logo acima.
        if (rand() < 0.38) add("round", p.x + jx, p.z + jz, 0, 0.62 + rand() * 0.14, roundColor());
        else {
          add("bush", p.x + jx, p.z + jz, 0, 0.95 + rand() * 0.35, bushColor());
          if (rand() < 0.55) add("bush", p.x - jx * 2 + 0.3, p.z - 0.12, 0, 0.6 + rand() * 0.3, bushColor());
        }
        if (rand() < 0.22) add("rock", p.x + (rand() - 0.5) * 0.6, p.z + 0.25, 0, 0.6 + rand() * 0.5, rockColor());
      } else if (border) {
        const r = rand();
        if (nearLake(x, y) && r < 0.55) add("palm", p.x + jx, p.z + jz, 0, 0.9 + rand() * 0.25, palmTint());
        else if (y !== H - 1 && r < 0.6) add("conifer", p.x + jx, p.z + jz, 0, 0.9 + rand() * 0.3, coniferColor());
        else add("round", p.x + jx, p.z + jz, 0, 0.92 + rand() * 0.25, roundColor(y <= 1));
        underbrush(p, 0, 0.3, 0.12);
      } else {
        // Árvores do miolo (atrás dos prédios e soltas): copa redonda,
        // tamanho contido para não roubar a cena.
        add("round", p.x + jx, p.z + jz, 0, 0.85 + rand() * 0.15, roundColor());
        underbrush(p, 0, 0.25, 0.08);
      }
    }

  // Anel decorativo fora do mapa (chão externo em y = -0.3).
  const OY = -0.3;
  for (let y = -6; y < H + 6; y++)
    for (let x = -7; x < W + 7; x++) {
      if (x >= 0 && x < W && y >= 0 && y < H) continue;
      const p = tileToWorld(x, y);
      p.x += (rand() - 0.5) * 0.6;
      p.z += (rand() - 0.5) * 0.6;
      const r = rand();
      if (r < 0.52) {
        const k = 0.95 + rand() * 0.35;
        const kind = rand();
        if (y >= H) add(kind < 0.8 ? "round" : "conifer", p.x, p.z, OY, k, kind < 0.8 ? roundColor(true) : coniferColor());
        else if ((x >= 17 && y < 0) || (x >= W && y < 9)) {
          if (kind < 0.45) add("palm", p.x, p.z, OY, k * 0.95, palmTint());
          else if (kind < 0.75) add("round", p.x, p.z, OY, k, roundColor(true));
          else add("conifer", p.x, p.z, OY, k, coniferColor());
        } else if (kind < 0.55) add("conifer", p.x, p.z, OY, k * 1.05, coniferColor());
        else if (kind < 0.92) add("round", p.x, p.z, OY, k, roundColor(true));
        else add("palm", p.x, p.z, OY, k, palmTint());
      } else if (r < 0.72) add("bush", p.x, p.z, OY, 0.8 + rand() * 0.5, bushColor());
      else if (r < 0.8) add("rock", p.x, p.z, OY, 0.7 + rand() * 0.7, rockColor());
    }

  // ---- Malhas instanciadas ------------------------------------------------------
  const instanced = (geo, mat, list, place, colorOf) => {
    const mesh = new THREE.InstancedMesh(geo, mat, Math.max(list.length, 1));
    mesh.count = list.length;
    list.forEach((it, i) => {
      place(it);
      mesh.setMatrixAt(i, m4);
      if (colorOf) mesh.setColorAt(i, colorOf(it));
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const depth = windDepthFor(mat, track);
    if (depth) mesh.customDepthMaterial = depth;
    mesh.computeBoundingSphere();
    scene.add(track(mesh));
    return mesh;
  };
  const placeAt = (it, dy = 0, kScale = 1) => {
    q.setFromEuler(e.set(it.tx, it.rot, it.tz));
    const k = it.k * kScale;
    m4.compose(v.set(it.x, it.y + dy * it.k, it.z), q, s.set(k, k, k));
  };

  // Copa redonda + tronco.
  const ROUND_TRUNK = 0.62;
  instanced(track(trunkGeo(ROUND_TRUNK)), leafMat({ flatShading: false }), specs.round, (it) => placeAt(it), () => colors.wood);
  instanced(
    track(roundCrownGeo()),
    addWind(leafMat(), windTime, { amp: 0.035, base: -0.2 }),
    specs.round,
    (it) => placeAt(it, 0.88),
    (it) => it.color
  );

  // Coníferas.
  const conifer = coniferGeo();
  instanced(track(conifer.trunk), leafMat({ flatShading: false }), specs.conifer, (it) => placeAt(it), () => colors.wood);
  instanced(
    track(conifer.crown),
    addWind(leafMat(), windTime, { amp: 0.022, base: 0.5, freq: 1.1 }),
    specs.conifer,
    (it) => placeAt(it),
    (it) => it.color
  );

  // Açaizeiros.
  const palm = palmGeos(colors, rand);
  instanced(track(palm.trunk), leafMat({ flatShading: false }), specs.palm, (it) => placeAt(it), (it) => it.color);
  instanced(
    track(palm.crown),
    addWind(leafMat({ side: THREE.DoubleSide }), windTime, { amp: 0.05, base: PALM_H - 0.2, freq: 1.7 }),
    specs.palm,
    (it) => placeAt(it),
    (it) => it.color
  );

  // Arbustos e pedras.
  instanced(track(bushGeo()), addWind(leafMat(), windTime, { amp: 0.02, base: 0.1 }), specs.bush, (it) => placeAt(it), (it) => it.color);
  instanced(track(rockGeo(colors)), leafMat({ roughness: 0.95 }), specs.rock, (it) => placeAt(it), (it) => it.color);

  // ---- Mato alto (tufos que balançam quando o jogador passa) -----------------
  const tallTiles = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] === TALL) tallTiles.push([x, y]);
  // 9 tufos por tile (grade 3x3 sorteada): mato fechado, sem gramado
  // aparecendo entre as touceiras.
  const TUFTS = 9;
  const tufts = new THREE.InstancedMesh(
    track(tuftGeo(colors)),
    addWind(leafMat({ side: THREE.DoubleSide }), windTime, { amp: 0.09, base: 0, freq: 2.1 }),
    Math.max(tallTiles.length * TUFTS, 1)
  );
  tufts.count = tallTiles.length * TUFTS;
  const tuftBase = [];
  const tallIndex = new Map();
  const warm = mix(white, pv("yellow-400"), 0.14);
  const cool = mix(white, pv("green-800"), 0.18);
  tallTiles.forEach(([x, y], ti) => {
    const p = tileToWorld(x, y);
    tallIndex.set(`${x},${y}`, ti);
    for (let b = 0; b < TUFTS; b++) {
      const i = ti * TUFTS + b;
      // Grade 3x3 com sorteio dentro de cada célula: cobre o tile sem fileiras.
      const cx = ((b % 3) + 0.5) / 3 - 0.5;
      const cz = (Math.floor(b / 3) + 0.5) / 3 - 0.5;
      const pos = new THREE.Vector3(p.x + cx + (rand() - 0.5) * 0.3, 0, p.z + cz + (rand() - 0.5) * 0.3);
      const rotY = rand() * Math.PI * 2;
      const k = 0.75 + rand() * 0.45;
      const ky = k * (0.85 + rand() * 0.3);
      tuftBase.push({ pos, rotY, k, ky });
      m4.compose(pos, q.setFromEuler(e.set(0, rotY, 0)), s.set(k, ky, k));
      tufts.setMatrixAt(i, m4);
      const r = rand();
      tufts.setColorAt(i, c.copy(white).lerp(r < 0.5 ? warm : cool, rand()));
    }
  });
  tufts.castShadow = true;
  tufts.receiveShadow = true;
  tufts.customDepthMaterial = windDepthFor(tufts.material, track);
  tufts.computeBoundingSphere();
  scene.add(track(tufts));
  const rustling = new Map(); // tileIndex -> tempo restante

  // ---- Flores ---------------------------------------------------------------------
  // Touceiras: uma roseta de folhas com 3 a 5 flores de uma cor dominante.
  const flowerSpots = [];
  const clumps = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (map[y][x] === FLOWER) {
        const p = tileToWorld(x, y);
        const main = Math.floor(rand() * colors.flowers.length);
        const nClumps = 2 + Math.floor(rand() * 2);
        for (let cI = 0; cI < nClumps; cI++) {
          const a = (cI / nClumps) * Math.PI * 2 + rand() * 1.2;
          const r0 = 0.12 + rand() * 0.2;
          const cx = p.x + Math.cos(a) * r0;
          const cz = p.z + Math.sin(a) * r0;
          clumps.push({ x: cx, z: cz, k: 0.32 + rand() * 0.14, rot: rand() * Math.PI * 2 });
          const ci0 = rand() < 0.75 ? main : Math.floor(rand() * colors.flowers.length);
          const n = 3 + Math.floor(rand() * 3);
          for (let k = 0; k < n; k++) {
            const fa = rand() * Math.PI * 2;
            const fr = rand() * 0.1;
            flowerSpots.push({
              x: cx + Math.cos(fa) * fr,
              z: cz + Math.sin(fa) * fr,
              h: 0.13 + rand() * 0.11,
              k: 0.95 + rand() * 0.4,
              rot: rand() * Math.PI * 2,
              tilt: 0.2 + rand() * 0.3,
              ci: rand() < 0.85 ? ci0 : Math.floor(rand() * colors.flowers.length),
            });
          }
        }
      }
  const leafClumps = new THREE.InstancedMesh(
    track(bushGeo()),
    addWind(leafMat(), windTime, { amp: 0.03, base: 0.05 }),
    Math.max(clumps.length, 1)
  );
  leafClumps.count = clumps.length;
  clumps.forEach((cl, i) => {
    m4.compose(v.set(cl.x, -0.01, cl.z), q.setFromEuler(e.set(0, cl.rot, 0)), s.set(cl.k, cl.k * 0.8, cl.k));
    leafClumps.setMatrixAt(i, m4);
    leafClumps.setColorAt(i, c.copy(colors.stem).offsetHSL(0, 0, (rand() - 0.5) * 0.05));
  });
  leafClumps.receiveShadow = true;
  leafClumps.computeBoundingSphere();
  scene.add(track(leafClumps));

  const fCount = Math.max(flowerSpots.length, 1);
  const stems = new THREE.InstancedMesh(track(stemGeo()), track(new THREE.MeshStandardMaterial({ color: colors.stem, roughness: 0.9 })), fCount);
  const petals = new THREE.InstancedMesh(track(petalsGeo()), leafMat({ flatShading: false, roughness: 0.7 }), fCount);
  const centers = new THREE.InstancedMesh(
    track(new THREE.IcosahedronGeometry(0.026, 0)),
    track(new THREE.MeshStandardMaterial({ color: white, roughness: 0.8, flatShading: true })),
    fCount
  );
  for (const m of [stems, petals, centers]) m.count = flowerSpots.length;
  const headPos = new THREE.Vector3();
  flowerSpots.forEach((f, i) => {
    // Caule com leve inclinação para o sul (cabeça visível pela câmera).
    q.setFromEuler(e.set(f.tilt * 0.4, f.rot, 0));
    m4.compose(v.set(f.x, 0, f.z), q, s.set(1, f.h, 1));
    stems.setMatrixAt(i, m4);
    headPos.set(0, f.h, 0).applyQuaternion(q).add(v);
    q.setFromEuler(e.set(f.tilt, f.rot, 0));
    m4.compose(headPos, q, s.set(f.k, f.k, f.k));
    petals.setMatrixAt(i, m4);
    petals.setColorAt(i, colors.flowers[f.ci]);
    m4.compose(headPos.setY(headPos.y + 0.01 * f.k), q, s.set(f.k, f.k * 0.8, f.k));
    centers.setMatrixAt(i, m4);
    centers.setColorAt(i, f.ci === 1 ? colors.flowerCenterDark : colors.flowerCenter);
  });
  petals.castShadow = true;
  for (const m of [stems, petals, centers]) {
    m.receiveShadow = true;
    m.computeBoundingSphere();
    scene.add(track(m));
  }

  // ---- API ------------------------------------------------------------------------
  function rustle(x, y) {
    if (reducedMotion) return;
    const ti = tallIndex.get(`${x},${y}`);
    if (ti !== undefined) rustling.set(ti, 0.45);
  }

  function update(t, dt) {
    if (!reducedMotion) windTime.value = t;
    if (!rustling.size) return;
    for (const [ti, left] of rustling) {
      const remain = left - dt;
      for (let b = 0; b < TUFTS; b++) {
        const i = ti * TUFTS + b;
        const { pos, rotY, k, ky } = tuftBase[i];
        const sway = remain > 0 ? Math.sin(remain * 30 + b) * 0.4 * remain : 0;
        m4.compose(pos, q.setFromEuler(e.set(sway, rotY, sway * 0.6)), s.set(k, ky, k));
        tufts.setMatrixAt(i, m4);
      }
      if (remain > 0) rustling.set(ti, remain);
      else rustling.delete(ti);
    }
    tufts.instanceMatrix.needsUpdate = true;
  }

  return { rustle, update };
}
