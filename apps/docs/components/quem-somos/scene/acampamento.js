// Cantinho de acampamento da roda de história (cena noturna do Zé Carlos):
// bancos em volta da fogueira (toras, tocos e caixotes com almofada), postes
// com cordão de luzinhas, lanternas, barraquinha, manta, cesta e vaga-lumes.
//
//   createAcampamento({ pal, track, lite, reducedMotion, assentos })
//     -> { object, setOn(on), update(t, dt), alturaAssento, dispose }
//
//   assentos: [{ x, z, yaw }] locais (fogueira na origem). Cada assento ganha
//   uma superfície plana em y = alturaAssento. O chamador posiciona `object`.
//
// Custo: 4 draw calls (sólidos, lâmpadas, halos, vaga-lumes) em qualquer
// modo. A animação de surgir é feita no shader (pivô + atraso por vértice),
// então tudo continua num único mesh mesclado. Nenhuma luz real: o brilho é
// só material básico e pontos aditivos.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const ALTURA_ASSENTO = 0.25;
const ITEM = 0.45; // s, duração do "pop" de cada item
const LIGHT = 0.22; // s, tempo de cada lâmpada acender
const FADE_FF = 0.35; // s, vaga-lumes surgindo no fim

// PRNG determinístico (mesmo cantinho a cada visita).
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const _e = new THREE.Euler();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
function M(px, py, pz, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(_p.set(px, py, pz), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(sx, sy, sz));
}

// Lote mesclado: cada peça leva cor, pivô do item e atrasos por vértice.
function makeBatch() {
  const parts = [];
  return {
    add(geo, color, m, pivot, delay, lit = 0) {
      let g = geo.index ? geo.toNonIndexed() : geo;
      if (g !== geo) geo.dispose();
      if (g.attributes.uv) g.deleteAttribute("uv");
      if (g.attributes.uv1) g.deleteAttribute("uv1");
      if (m) g.applyMatrix4(m);
      const n = g.attributes.position.count;
      const col = new Float32Array(n * 3);
      const piv = new Float32Array(n * 3);
      const del = new Float32Array(n);
      const lt = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        col.set([color.r, color.g, color.b], i * 3);
        piv.set([pivot.x, pivot.y, pivot.z], i * 3);
        del[i] = delay;
        lt[i] = lit;
      }
      g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      g.setAttribute("aPivot", new THREE.BufferAttribute(piv, 3));
      g.setAttribute("aDelay", new THREE.BufferAttribute(del, 1));
      g.setAttribute("aLit", new THREE.BufferAttribute(lt, 1));
      parts.push(g);
    },
    build() {
      if (!parts.length) return null;
      const g = mergeGeometries(parts, false);
      for (const p of parts) p.dispose();
      g.computeBoundingSphere();
      return g;
    },
  };
}

// Item cresce do pivô com leve overshoot e sobe do chão.
const GROW_HEAD = /* glsl */ `
uniform float uP;
attribute vec3 aPivot;
attribute float aDelay;
attribute float aLit;
`;
const GROW_BODY = /* glsl */ `
float kGrow = clamp((uP - aDelay) / ${ITEM.toFixed(3)}, 0.0, 1.0);
float xg = kGrow - 1.0;
float sGrow = kGrow <= 0.0 ? 0.0 : 1.0 + 2.3 * xg * xg * xg + 1.3 * xg * xg;
transformed = aPivot + (transformed - aPivot) * sGrow;
transformed.y -= (1.0 - kGrow) * 0.12;
`;

function growPatch(mat, uniforms, key, extraHead = "", extraBody = "") {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${GROW_HEAD}${extraHead}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${GROW_BODY}${extraBody}`);
  };
  mat.customProgramCacheKey = () => key;
  return mat;
}

export function createAcampamento({ pal, track, lite = false, reducedMotion = false, assentos = [] }) {
  const { pv, mix } = pal;
  const white = pv("white");
  const rand = mulberry32(20261014);

  // ---- Paleta (tokens) ------------------------------------------------------
  const C = {
    bark: mix(pv("yellow-800"), pv("gray-900"), 0.42),
    barkLight: mix(pv("yellow-800"), pv("gray-700"), 0.25),
    cut: mix(pv("yellow-400"), pv("yellow-800"), 0.35),
    rings: mix(pv("yellow-800"), pv("yellow-400"), 0.3),
    wood: mix(pv("yellow-800"), pv("yellow-400"), 0.32),
    woodDark: mix(pv("yellow-800"), pv("gray-800"), 0.3),
    metal: mix(pv("gray-800"), pv("gray-900"), 0.4),
    cord: pv("gray-900"),
    stone: pv("gray-500"),
    tent: mix(pv("red-500"), pv("yellow-500"), 0.42),
    tentDark: mix(pv("red-700"), pv("yellow-800"), 0.4),
    tentDoor: mix(pv("yellow-500"), pv("red-500"), 0.3),
    flag: pv("yellow-500"),
    cushions: [pv("blue-500"), pv("red-500"), mix(pv("green-600"), pv("yellow-500"), 0.25), pv("yellow-600")],
    plaidA: pv("red-600"),
    plaidB: mix(pv("red-700"), pv("gray-900"), 0.35),
    plaidC: mix(pv("red-100"), white, 0.4),
    basket: mix(pv("yellow-600"), pv("yellow-800"), 0.45),
    mugs: [pv("blue-600"), pv("gray-50")],
    mushCap: pv("red-500"),
    mushStem: pv("gray-50"),
    bulbs: [mix(pv("yellow-400"), white, 0.45), mix(pv("yellow-500"), pv("red-400"), 0.3), mix(pv("yellow-400"), white, 0.7)],
    lantern: mix(pv("yellow-400"), white, 0.35),
    firefly: mix(pv("yellow-400"), pv("green-500"), 0.4),
  };

  const solids = makeBatch();
  const glows = makeBatch();
  const halos = []; // { pos, color, size, lit, k }
  let maxDelay = 0;
  const item = (x, z, delay) => {
    maxDelay = Math.max(maxDelay, delay);
    const pivot = new THREE.Vector3(x, 0, z);
    return {
      s: (geo, color, m) => solids.add(geo, color, m, pivot, delay),
      g: (geo, color, m, lit) => glows.add(geo, color, m, pivot, delay, lit),
    };
  };

  // ---- Bancos ---------------------------------------------------------------
  const H = ALTURA_ASSENTO;
  // Tora deitada de A até B com a face de cima reta em y = H.
  function tora(it, ax, az, bx, bz, r) {
    const dx = bx - ax;
    const dz = bz - az;
    const L = Math.hypot(dx, dz);
    const ang = Math.atan2(-dz, dx);
    const cy = H - r * Math.cos(Math.PI / 8);
    const cx = (ax + bx) / 2;
    const cz = (az + bz) / 2;
    const place = (g, along = 0) => {
      g.rotateZ(Math.PI / 2);
      g.rotateX(Math.PI / 8);
      g.translate(along, 0, 0);
      g.rotateY(ang);
      g.translate(cx, cy, cz);
      return g;
    };
    it.s(place(new THREE.CylinderGeometry(r, r * 0.94, L, 8, 1, true)), C.bark);
    for (const sgn of [-1, 1]) {
      it.s(place(new THREE.CylinderGeometry(r * 0.97, r * 0.97, 0.03, 8), sgn * (L / 2)), C.cut);
      it.s(place(new THREE.CylinderGeometry(r * 0.45, r * 0.45, 0.034, 8), sgn * (L / 2)), C.rings);
    }
    // Galhinho cortado na lateral.
    const stub = new THREE.CylinderGeometry(0.03, 0.04, 0.12, 6);
    stub.rotateX(Math.PI / 2 + 0.5);
    stub.translate(L * 0.18, 0.02, r * 0.95);
    stub.rotateY(ang);
    stub.translate(cx, cy, cz);
    it.s(stub, C.barkLight);
  }

  function toco(it, x, z, rr) {
    const r = 0.17 + rr * 0.03;
    it.s(new THREE.CylinderGeometry(r, r * 1.22, H - 0.01, 8), C.bark, M(x, (H - 0.01) / 2, z, 0, rr * 3, 0));
    it.s(new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.012, 8), C.cut, M(x, H - 0.004, z, 0, rr * 3, 0));
    it.s(new THREE.CylinderGeometry(r * 0.5, r * 0.5, 0.014, 8), C.rings, M(x, H - 0.002, z, 0, rr * 3, 0));
    // Raízes.
    for (let i = 0; i < 4; i++) {
      const a = rr * 6 + (i / 4) * Math.PI * 2;
      const root = new THREE.ConeGeometry(0.05, 0.16, 5);
      it.s(root, C.bark, M(x + Math.cos(a) * r * 1.15, 0.03, z + Math.sin(a) * r * 1.15, 0, -a, Math.PI / 2 - 0.35, 1, 1, 0.7));
    }
  }

  function almofada(it, x, z, yaw, color) {
    const ch = 0.16;
    it.s(new THREE.BoxGeometry(0.36, ch, 0.36), C.woodDark, M(x, ch / 2, z, 0, yaw));
    for (const y of [0.045, 0.125]) it.s(new THREE.BoxGeometry(0.375, 0.045, 0.375), C.wood, M(x, y, z, 0, yaw));
    const cush = new THREE.SphereGeometry(0.2, 8, 6);
    it.s(cush, color, M(x, ch + 0.035, z, 0, yaw + Math.PI / 8, 0, 1, 0.28, 1));
    it.s(new THREE.SphereGeometry(0.025, 6, 4), mix(color, white, 0.3), M(x, H, z, 0, 0, 0, 1, 0.5, 1));
  }

  function cogumelo(it, x, z, s) {
    it.s(new THREE.CylinderGeometry(0.018 * s, 0.024 * s, 0.07 * s, 6), C.mushStem, M(x, 0.035 * s, z));
    it.s(new THREE.SphereGeometry(0.05 * s, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), C.mushCap, M(x, 0.065 * s, z));
  }

  // Ordena os assentos por ângulo e decide o tipo de banco (semente fixa).
  const seats = assentos
    .map((a, i) => ({ ...a, i, ang: Math.atan2(a.z, a.x) }))
    .sort((a, b) => a.ang - b.ang);
  const used = new Set();
  let delay = 0.02;
  let last = "";
  for (let k = 0; k < seats.length; k++) {
    const a = seats[k];
    if (used.has(a)) continue;
    const b = seats[k + 1];
    const it = item(a.x, a.z, delay);
    delay += 0.055;
    // Dois vizinhos próximos podem dividir uma tora comprida.
    if (b && Math.hypot(b.x - a.x, b.z - a.z) < 1.15 && rand() < 0.45 && last !== "tora") {
      used.add(b);
      const ux = (b.x - a.x) / Math.hypot(b.x - a.x, b.z - a.z);
      const uz = (b.z - a.z) / Math.hypot(b.x - a.x, b.z - a.z);
      tora(it, a.x - ux * 0.28, a.z - uz * 0.28, b.x + ux * 0.28, b.z + uz * 0.28, 0.15);
      last = "tora";
      continue;
    }
    let tipo = ["toco", "tora", "almofada"][Math.floor(rand() * 3)];
    if (tipo === last) tipo = ["toco", "tora", "almofada"][Math.floor(rand() * 3)];
    last = tipo;
    if (tipo === "toco") {
      const rr = rand();
      toco(it, a.x, a.z, rr);
      if (!lite && rr > 0.5) cogumelo(it, a.x + Math.cos(a.ang + 0.6) * 0.3, a.z + Math.sin(a.ang + 0.6) * 0.3, 1);
    } else if (tipo === "tora") {
      // Tangente ao círculo.
      const tx = -Math.sin(a.ang);
      const tz = Math.cos(a.ang);
      tora(it, a.x - tx * 0.33, a.z - tz * 0.33, a.x + tx * 0.33, a.z + tz * 0.33, 0.14);
    } else {
      almofada(it, a.x, a.z, a.yaw ?? 0, C.cushions[a.i % C.cushions.length]);
    }
  }

  // ---- Barraquinha ao norte -------------------------------------------------
  {
    const tx = 0.15;
    const tz = -2.75;
    const it = item(tx, tz, 0.12);
    // Prisma triangular: cilindro de 3 lados deitado ao longo de z.
    const r = 0.62;
    const prism = (rad, depth) => {
      const g = new THREE.CylinderGeometry(rad, rad, depth, 3);
      g.rotateX(-Math.PI / 2); // cume para cima
      return g;
    };
    it.s(prism(r, 1.0), C.tent, M(tx, r * 0.5, tz));
    it.s(prism(r * 1.04, 0.06), C.tentDark, M(tx, r * 0.5 - 0.01, tz + 0.5));
    it.s(prism(r * 1.04, 0.06), C.tentDark, M(tx, r * 0.5 - 0.01, tz - 0.5));
    // Mastro do cume e bandeirinha.
    it.s(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 5), C.woodDark, M(tx, r * 1.5, tz, Math.PI / 2));
    it.s(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 5), C.woodDark, M(tx, r * 1.5 + 0.15, tz + 0.6));
    it.s(new THREE.BoxGeometry(0.16, 0.09, 0.01), C.flag, M(tx + 0.08, r * 1.5 + 0.25, tz + 0.6));
    // Porta: luz quente lá dentro (emissivo).
    it.g(prism(r * 0.55, 0.03), C.tentDoor, M(tx, r * 0.275, tz + 0.51), 0.5);
    if (!lite) {
      // Abas abertas.
      for (const sgn of [-1, 1]) {
        it.s(new THREE.BoxGeometry(0.3, 0.5, 0.02), C.tent, M(tx + sgn * 0.3, 0.24, tz + 0.6, 0, sgn * 0.7, sgn * -0.5));
      }
    }
    halos.push({ pos: new THREE.Vector3(tx, 0.22, tz + 0.58), color: C.tentDoor, size: 1.3, lit: 0.5, k: 0.5 });
  }

  // ---- Postes e cordão de luzinhas -----------------------------------------
  const POST_H = 1.35;
  const posts = [
    [-2.5, 0.2],
    [-0.6, -3.05],
    [2.5, 0.0],
  ];
  posts.forEach(([x, z], i) => {
    const it = item(x, z, 0.22 + i * 0.06);
    it.s(new THREE.CylinderGeometry(0.045, 0.06, POST_H, 6), C.woodDark, M(x, POST_H / 2, z));
    it.s(new THREE.ConeGeometry(0.065, 0.08, 6), C.wood, M(x, POST_H + 0.04, z));
    if (!lite) {
      for (let s = 0; s < 3; s++) {
        const a = s * 2.1 + i;
        it.s(new THREE.DodecahedronGeometry(0.06, 0), C.stone, M(x + Math.cos(a) * 0.1, 0.03, z + Math.sin(a) * 0.1, a, a));
      }
    }
  });
  let bulbIdx = 0;
  const bulbGeo = () => new THREE.SphereGeometry(0.038, 7, 5);
  for (let i = 0; i < posts.length - 1; i++) {
    const [ax, az] = posts[i];
    const [bx, bz] = posts[i + 1];
    const A = new THREE.Vector3(ax, POST_H - 0.04, az);
    const B = new THREE.Vector3(bx, POST_H - 0.04, bz);
    const sag = 0.32;
    const at = (u) => new THREE.Vector3().lerpVectors(A, B, u).setY(A.y - sag * 4 * u * (1 - u));
    const pts = Array.from({ length: 13 }, (_, k) => at(k / 12));
    // O cordão "sai" do primeiro poste (pivô nele).
    const cordDelay = 0.42 + i * 0.07;
    maxDelay = Math.max(maxDelay, cordDelay);
    const pivot = new THREE.Vector3(ax, POST_H, az);
    solids.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.008, 3), C.cord, null, pivot, cordDelay);
    const n = Math.max(5, Math.round(A.distanceTo(B) / 0.3));
    for (let k = 0; k < n; k++) {
      const p = at((k + 0.5) / n);
      const lit = 0.62 + bulbIdx * 0.028;
      const col = C.bulbs[bulbIdx % C.bulbs.length];
      solids.add(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 5), C.metal, M(p.x, p.y - 0.02, p.z), pivot, cordDelay);
      glows.add(bulbGeo(), col, M(p.x, p.y - 0.06, p.z, 0, 0, 0, 1, 1.25, 1), pivot, cordDelay, lit);
      halos.push({ pos: new THREE.Vector3(p.x, p.y - 0.06, p.z), color: col, size: 0.55, lit, k: 0.32 });
      maxDelay = Math.max(maxDelay, lit);
      bulbIdx++;
    }
  }

  // ---- Lanternas no chão ----------------------------------------------------
  [
    [-2.05, 1.05, 0.3],
    [2.0, -1.45, -0.4],
  ].forEach(([x, z, ry], i) => {
    const it = item(x, z, 0.32 + i * 0.08);
    const lit = 0.55 + i * 0.1;
    it.s(new THREE.BoxGeometry(0.2, 0.04, 0.2), C.metal, M(x, 0.02, z, 0, ry));
    for (const [ox, oz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const o = new THREE.Vector3(ox * 0.085, 0, oz * 0.085).applyAxisAngle(THREE.Object3D.DEFAULT_UP, ry);
      it.s(new THREE.BoxGeometry(0.022, 0.2, 0.022), C.metal, M(x + o.x, 0.14, z + o.z, 0, ry));
    }
    it.g(new THREE.BoxGeometry(0.15, 0.19, 0.15), C.lantern, M(x, 0.135, z, 0, ry), lit);
    it.s(new THREE.ConeGeometry(0.16, 0.1, 4), C.metal, M(x, 0.29, z, 0, ry + Math.PI / 4));
    it.s(new THREE.TorusGeometry(0.05, 0.009, 4, 10, Math.PI), C.metal, M(x, 0.34, z, 0, ry));
    halos.push({ pos: new THREE.Vector3(x, 0.15, z), color: C.lantern, size: 1.5, lit, k: 0.55 });
  });

  // ---- Decoração menor (fora do lite) ---------------------------------------
  if (!lite) {
    // Manta xadrez dobrada, perto da barraca.
    {
      const x = -0.95;
      const z = -2.2;
      const ry = 0.35;
      const it = item(x, z, 0.3);
      const W = 0.48;
      const D = 0.34;
      it.s(new THREE.BoxGeometry(W, 0.04, D), C.plaidB, M(x, 0.02, z, 0, ry));
      it.s(new THREE.BoxGeometry(W - 0.02, 0.04, D - 0.02), C.plaidA, M(x, 0.06, z, 0, ry + 0.05));
      // Xadrez em cima: listras cruzadas.
      const top = 0.083;
      for (let k = 0; k < 4; k++) {
        const ox = -W / 2 + 0.06 + k * ((W - 0.12) / 3);
        const o = new THREE.Vector3(ox, 0, 0).applyAxisAngle(THREE.Object3D.DEFAULT_UP, ry + 0.05);
        it.s(new THREE.BoxGeometry(0.035, 0.006, D - 0.03), C.plaidC, M(x + o.x, top, z + o.z, 0, ry + 0.05));
      }
      for (let k = 0; k < 3; k++) {
        const oz = -D / 2 + 0.07 + k * ((D - 0.14) / 2);
        const o = new THREE.Vector3(0, 0, oz).applyAxisAngle(THREE.Object3D.DEFAULT_UP, ry + 0.05);
        it.s(new THREE.BoxGeometry(W - 0.03, 0.007, 0.035), C.plaidB, M(x + o.x, top + 0.001, z + o.z, 0, ry + 0.05));
      }
    }
    // Cesta de piquenique com canecas.
    {
      const x = 1.2;
      const z = -2.15;
      const ry = -0.3;
      const it = item(x, z, 0.36);
      it.s(new THREE.BoxGeometry(0.36, 0.18, 0.25), C.basket, M(x, 0.09, z, 0, ry));
      for (const y of [0.05, 0.11]) it.s(new THREE.BoxGeometry(0.37, 0.025, 0.26), C.woodDark, M(x, y, z, 0, ry));
      it.s(new THREE.BoxGeometry(0.38, 0.03, 0.27), C.wood, M(x, 0.195, z, 0, ry));
      it.s(new THREE.TorusGeometry(0.11, 0.012, 4, 12, Math.PI), C.woodDark, M(x, 0.21, z, 0, ry));
      C.mugs.forEach((col, i) => {
        const o = new THREE.Vector3(0.3 + i * 0.13, 0, 0.08 - i * 0.1).applyAxisAngle(THREE.Object3D.DEFAULT_UP, ry);
        it.s(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 8), col, M(x + o.x, 0.05, z + o.z));
        it.s(new THREE.TorusGeometry(0.025, 0.008, 4, 8), col, M(x + o.x + 0.045, 0.055, z + o.z, 0, 0.2));
      });
    }
    // Pilha de lenha ao oeste.
    {
      const x = -2.3;
      const z = -1.15;
      const it = item(x, z, 0.4);
      const layers = [
        [-0.13, 0, 0.065],
        [0.0, 0, 0.065],
        [0.13, 0, 0.065],
        [-0.065, 0, 0.18],
        [0.065, 0, 0.18],
      ];
      for (const [ox, , y] of layers) {
        const g = new THREE.CylinderGeometry(0.065, 0.065, 0.5, 7);
        g.rotateX(Math.PI / 2);
        g.rotateY(0.9);
        const o = new THREE.Vector3(ox, 0, 0).applyAxisAngle(THREE.Object3D.DEFAULT_UP, 0.9);
        it.s(g, C.barkLight, M(x + o.x, y, z + o.z));
      }
    }
    // Cogumelinhos espalhados.
    const mush = item(2.3, -0.6, 0.45);
    cogumelo(mush, 2.3, -0.6, 1.2);
    cogumelo(mush, 2.4, -0.48, 0.8);
  }

  // ---- Materiais e meshes ---------------------------------------------------
  const TOTAL = maxDelay + ITEM;
  const uniforms = {
    uP: { value: 0 },
    uTime: { value: 0 },
    uMotion: { value: reducedMotion ? 0 : 1 },
    uFF: { value: 0 },
  };

  const object = new THREE.Group();
  object.name = "acampamento";
  object.visible = false;
  const own = [];
  const keep = (x) => {
    own.push(x);
    return track ? track(x) : x;
  };

  const solidGeo = keep(solids.build());
  const solidMat = keep(
    growPatch(
      new THREE.MeshStandardMaterial({ color: white, vertexColors: true, flatShading: true, roughness: 0.88, metalness: 0 }),
      uniforms,
      "acamp-solid"
    )
  );
  const solidMesh = new THREE.Mesh(solidGeo, solidMat);
  solidMesh.castShadow = true;
  solidMesh.receiveShadow = true;
  solidMesh.customDepthMaterial = keep(growPatch(new THREE.MeshDepthMaterial(), uniforms, "acamp-depth"));
  solidMesh.customDistanceMaterial = keep(growPatch(new THREE.MeshDistanceMaterial(), uniforms, "acamp-dist"));
  object.add(solidMesh);

  // Lâmpadas: vidro escuro que acende em sequência (aLit) e tremula de leve.
  const glowGeo = keep(glows.build());
  const glowMat = keep(new THREE.MeshBasicMaterial({ color: white, vertexColors: true, toneMapped: false }));
  glowMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${GROW_HEAD}\nuniform float uTime;\nuniform float uMotion;`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\n${GROW_BODY}`
      )
      .replace(
        "#include <color_vertex>",
        `#include <color_vertex>
        float lt = clamp((uP - aLit) / ${LIGHT.toFixed(3)}, 0.0, 1.0);
        float fl = 1.0 - uMotion * 0.12 * (0.5 + 0.5 * sin(uTime * 7.0 + aLit * 91.0));
        vColor.rgb *= mix(0.16, 1.0, lt) * mix(1.0, fl, lt);`
      );
  };
  glowMat.customProgramCacheKey = () => "acamp-glow";
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  glowMesh.userData.noShadow = true;
  object.add(glowMesh);

  // Brilhos aditivos como quads virados para a câmera (um mesh por grupo):
  // sem limite de tamanho de ponto da GPU e sem textura.
  function billboards(key, sprites, head, body) {
    const n = sprites.length;
    const pos = new Float32Array(n * 12);
    const corner = new Float32Array(n * 8);
    const col = new Float32Array(n * 12);
    const size = new Float32Array(n * 4);
    const data = new Float32Array(n * 16);
    const idx = [];
    const CORNERS = [-1, -1, 1, -1, 1, 1, -1, 1];
    sprites.forEach((sp, i) => {
      for (let v = 0; v < 4; v++) {
        const k = i * 4 + v;
        pos.set([sp.pos.x, sp.pos.y, sp.pos.z], k * 3);
        corner.set([CORNERS[v * 2], CORNERS[v * 2 + 1]], k * 2);
        col.set([sp.color.r, sp.color.g, sp.color.b], k * 3);
        size[k] = sp.size;
        data.set(sp.data, k * 4);
      }
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    });
    const g = keep(new THREE.BufferGeometry());
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aCorner", new THREE.BufferAttribute(corner, 2));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aData", new THREE.BufferAttribute(data, 4));
    g.setIndex(idx);
    const m = keep(
      new THREE.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */ `
          uniform float uP;
          uniform float uTime;
          uniform float uMotion;
          uniform float uFF;
          attribute vec2 aCorner;
          attribute vec3 color;
          attribute float aSize;
          attribute vec4 aData;
          varying vec3 vCol;
          varying vec2 vUv;
          ${head}
          void main() {
            vec3 c = position;
            float br = 1.0;
            float vis = 1.0;
            ${body}
            vec4 mv = modelViewMatrix * vec4(c, 1.0);
            float h = aSize * 0.5 * vis;
            // Puxa para a câmera para o chão não cortar o brilho.
            mv.xyz += vec3(aCorner * h, h * 0.9);
            gl_Position = projectionMatrix * mv;
            vCol = color * br;
            vUv = aCorner;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vCol;
          varying vec2 vUv;
          void main() {
            float d = length(vUv);
            if (d > 1.0) discard;
            float a = pow(1.0 - d, 1.8);
            gl_FragColor = vec4(vCol, a);
            #include <colorspace_fragment>
          }`,
      })
    );
    m.customProgramCacheKey = () => key;
    const mesh = new THREE.Mesh(g, m);
    mesh.userData.noShadow = true;
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    object.add(mesh);
    return mesh;
  }

  // Halos das lâmpadas, lanternas e porta da barraca.
  billboards(
    "acamp-halo",
    halos.map((h) => ({
      pos: h.pos,
      color: new THREE.Color(h.color.r * h.k, h.color.g * h.k * 0.8, h.color.b * h.k * 0.45),
      size: h.size,
      data: [h.lit, 0, 0, 0],
    })),
    "",
    `float lt = clamp((uP - aData.x) / ${LIGHT.toFixed(3)}, 0.0, 1.0);
    br = lt * (1.0 - uMotion * 0.15 * (0.5 + 0.5 * sin(uTime * 6.0 + aData.x * 73.0)));
    vis = lt;`
  );

  // Vaga-lumes: vagueiam devagar fora da roda e piscam em tempos diferentes.
  {
    const n = lite ? 8 : 20;
    const ff = [];
    for (let i = 0; i < n; i++) {
      let a = rand() * Math.PI * 2;
      // Menos vaga-lumes no sul (frente da câmera).
      if (Math.sin(a) > 0.55) a += Math.PI;
      const r = 2.0 + rand() * 1.6;
      ff.push({
        pos: new THREE.Vector3(Math.cos(a) * r, 0.3 + rand() * 1.1, Math.sin(a) * r),
        color: C.firefly,
        size: 0.13 + rand() * 0.08,
        data: [rand() * 6.28, 0.6 + rand() * 0.9, rand() * 6.28, 0],
      });
    }
    billboards(
      "acamp-ff",
      ff,
      "",
      `float tt = uTime * aData.y;
      c += uMotion * vec3(sin(tt * 0.7 + aData.x) * 0.35, sin(tt * 1.1 + aData.z) * 0.18, cos(tt * 0.5 + aData.z) * 0.35);
      float blink = pow(0.5 + 0.5 * sin(uTime * 1.7 * aData.y + aData.x * 3.0), 3.0);
      br = mix(0.6, 0.15 + 0.85 * blink, uMotion) * uFF;
      vis = uFF * (0.6 + 0.4 * br);`
    );
  }

  // ---- Estado ---------------------------------------------------------------
  let on = false;
  let p = 0;

  function apply() {
    uniforms.uP.value = p;
    uniforms.uFF.value = THREE.MathUtils.clamp((p - (TOTAL - FADE_FF)) / FADE_FF, 0, 1);
  }

  function setOn(v) {
    on = !!v;
    if (on) object.visible = true;
    if (reducedMotion) {
      p = on ? TOTAL : 0;
      apply();
      object.visible = on;
    }
  }

  function update(t, dt) {
    if (!reducedMotion) uniforms.uTime.value = t;
    if (!object.visible) return;
    const target = on ? TOTAL : 0;
    if (p !== target) {
      p = on ? Math.min(TOTAL, p + dt) : Math.max(0, p - dt * 1.3);
      apply();
      if (!on && p <= 0) object.visible = false;
    }
  }

  function dispose() {
    object.removeFromParent();
    for (const x of own) x.dispose?.();
    own.length = 0;
  }

  apply();
  return { object, setOn, update, alturaAssento: ALTURA_ASSENTO, dispose };
}
