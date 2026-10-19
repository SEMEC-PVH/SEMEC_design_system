// Prédio Back-End da Vila SEMEC: data center grafite com aletas verticais,
// faixa de janelas com racks de servidor (LEDs verdes), entrada de vidro com
// marquise, telhado técnico (condensadoras, caixas, grelha, calhas de cabo)
// e torre de antena na quina nordeste. Ver contrato em ./shared.js.
// Coordenadas locais: centro do footprint na origem, fachada em +z.

import * as THREE from "three";
import { std, makeBox } from "./shared";

// Gerador pseudoaleatório determinístico (mesmo desenho a cada carga).
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
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  return tex;
}

// Racks de servidor: 4 gabinetes lado a lado, com baias e LEDs apagados.
function makeRackTexture(pal) {
  const canvas = makeCanvas(128, 64);
  const g = canvas.getContext("2d");
  g.fillStyle = pal.pv("gray-950").getStyle();
  g.fillRect(0, 0, 128, 64);
  for (let r = 0; r < 4; r++) {
    const x = r * 32 + 2;
    g.fillStyle = pal.pv("gray-800").getStyle();
    g.fillRect(x, 2, 28, 60);
    g.fillStyle = pal.pv("gray-900").getStyle();
    for (let y = 5; y < 60; y += 5) g.fillRect(x + 2, y, 24, 3);
    g.fillStyle = pal.pv("green-800").getStyle();
    for (let y = 6; y < 60; y += 5) g.fillRect(x + 20, y, 2, 1);
  }
  return canvasTexture(canvas, true);
}

// LEDs acesos (branco sobre transparente; o material tinge de verde).
function makeLedTexture(pal) {
  const canvas = makeCanvas(128, 64);
  const g = canvas.getContext("2d");
  const rand = seeded(4242);
  g.fillStyle = pal.pv("white").getStyle();
  for (let r = 0; r < 4; r++) {
    for (let y = 6; y < 60; y += 5) {
      for (let k = 0; k < 4; k++) {
        if (rand() < 0.45) g.fillRect(r * 32 + 5 + k * 4, y, 2, 1);
      }
    }
  }
  return canvasTexture(canvas, true);
}

// Grelha/veneziana: listras escuras horizontais.
function makeGrilleTexture(pal) {
  const canvas = makeCanvas(32, 32);
  const g = canvas.getContext("2d");
  g.fillStyle = pal.pv("gray-600").getStyle();
  g.fillRect(0, 0, 32, 32);
  g.fillStyle = pal.pv("gray-950").getStyle();
  for (let y = 1; y < 32; y += 4) g.fillRect(0, y, 32, 2);
  return canvasTexture(canvas, true);
}

export function buildBackEnd(group, b, ctx) {
  const { pal, track, unitBox, onFrame } = ctx;
  const hw = b.w / 2 - 0.05;
  const hd = b.h / 2 - 0.05;
  const pv = pal.pv;
  const white = pv("white");

  const rackTex = track(makeRackTexture(pal));
  const ledTex = track(makeLedTexture(pal));
  const grilleTex = track(makeGrilleTexture(pal));
  grilleTex.repeat.set(1, 3);

  const mats = {
    pavement: track(std(pv("gray-200"))),
    curb: track(std(pv("gray-300"))),
    graphite: track(std(pal.mix(pv("gray-700"), pv("gray-800"), 0.5), { roughness: 0.75 })),
    panel: track(std(pv("gray-800"), { roughness: 0.7 })),
    dark: track(std(pv("gray-900"), { roughness: 0.6 })),
    roof: track(std(pal.mix(pv("gray-300"), pv("gray-400"), 0.4))),
    cap: track(std(pv("gray-600"))),
    unit: track(std(pal.mix(pv("gray-100"), white, 0.4), { roughness: 0.55 })),
    steel: track(std(pv("gray-500"), { roughness: 0.45, metalness: 0.3 })),
    concrete: track(std(pal.mix(pv("gray-300"), pv("gray-200"), 0.5))),
    rack: track(new THREE.MeshBasicMaterial({ map: rackTex })),
    led: track(
      new THREE.MeshBasicMaterial({
        map: ledTex,
        color: pv("green-500"),
        transparent: true,
        depthWrite: false,
      })
    ),
    glass: track(std(pal.mix(pv("gray-200"), white, 0.3), { roughness: 0.08, transparent: true, opacity: 0.2, depthWrite: false })),
    lobby: track(std(pal.mix(pv("yellow-400"), white, 0.7), { emissive: pal.mix(pv("yellow-400"), white, 0.7), emissiveIntensity: 0.8 })),
    lamp: track(new THREE.MeshBasicMaterial({ color: pal.mix(pv("yellow-400"), white, 0.8) })),
    glow: track(
      new THREE.MeshBasicMaterial({
        color: pal.mix(pv("yellow-400"), white, 0.6),
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    ),
    grille: track(std(white, { map: grilleTex, roughness: 0.7 })),
  };

  const box = makeBox(group, unitBox);

  // Haste cilíndrica entre dois pontos (treliça da torre).
  const rodGeo = track(new THREE.CylinderGeometry(1, 1, 1, 6));
  const up = new THREE.Vector3(0, 1, 0);
  const rod = (mat, ax, ay, az, bx, by, bz, r) => {
    const a = new THREE.Vector3(ax, ay, az);
    const d = new THREE.Vector3(bx, by, bz).sub(a);
    const m = new THREE.Mesh(rodGeo, mat);
    m.scale.set(r, d.length(), r);
    m.quaternion.setFromUnitVectors(up, d.clone().normalize());
    m.position.copy(a).addScaledVector(d, 0.5);
    group.add(m);
    return m;
  };

  // Plano texturizado virado para +z (fachada) ou +y (telhado) ou +x (leste).
  const plane = (mat, w, h, x, y, z, face, opts = {}) => {
    const m = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), mat);
    if (face === "up") m.rotation.x = -Math.PI / 2;
    if (face === "east") m.rotation.y = Math.PI / 2;
    m.position.set(x, y, z);
    if (opts.noShadow) m.userData.noShadow = true;
    group.add(m);
    return m;
  };

  // ---- Dimensões principais ---------------------------------------------------
  const base = 0.06; // topo da calçada
  const bx0 = -hw + 0.15;
  const bx1 = hw - 0.4; // folga a leste para a caixa de concreto das calhas
  const bz0 = -hd + 0.15;
  const bz1 = hd - 0.45; // calçada larga na frente (marquise e spots)
  const H = 2.15; // topo da laje de cobertura
  const skin = 0.14; // espessura da pele da fachada (recuo das janelas)
  const coreZ = bz1 - skin;
  const winY0 = 1.35; // faixa de janelas a ~63–75% da altura
  const winY1 = 1.62;
  const parTop = H + 0.14;
  const R = H + 0.02; // piso do telhado

  // ---- Calçada clara ------------------------------------------------------------
  box(mats.pavement, -hw, hw, 0, base, -hd, hd);
  box(mats.curb, -hw, hw, base, base + 0.005, hd - 0.08, hd, { noShadow: true });

  // ---- Volume principal ---------------------------------------------------------
  box(mats.graphite, bx0, bx1, base, H, bz0, coreZ);
  // Pele frontal acima da faixa de janelas.
  box(mats.graphite, bx0, bx1, winY1, H, coreZ, bz1);
  // Entrada (à esquerda do centro) recortada na pele do térreo.
  const door0 = -1.15;
  const door1 = -0.35;
  const doorTop = 0.86;
  box(mats.graphite, bx0, door0, base, winY0, coreZ, bz1);
  box(mats.graphite, door1, bx1, base, winY0, coreZ, bz1);
  box(mats.graphite, door0, door1, doorTop, winY0, coreZ, bz1);

  // Pilares escuros nas quinas.
  const pw = 0.16;
  for (const [x0, x1] of [[bx0 - 0.03, bx0 + pw - 0.03], [bx1 - pw + 0.03, bx1 + 0.03]]) {
    for (const [z0, z1] of [[bz0 - 0.03, bz0 + pw - 0.03], [bz1 - pw + 0.03, bz1 + 0.03]]) {
      box(mats.dark, x0, x1, base, parTop + 0.03, z0, z1);
    }
  }

  // ---- Faixa de janelas com racks de servidor ---------------------------------
  const bandX0 = bx0 + 0.14;
  const bandX1 = bx1 - 0.14;
  const bandW = bandX1 - bandX0;
  const bandMidX = (bandX0 + bandX1) / 2;
  const bandMidY = (winY0 + winY1) / 2;
  rackTex.repeat.set(bandW / 0.8, 1);
  ledTex.repeat.set(bandW / 0.8, 1);
  plane(mats.rack, bandW, winY1 - winY0, bandMidX, bandMidY, coreZ + 0.003, "south", { noShadow: true });
  plane(mats.led, bandW, winY1 - winY0, bandMidX, bandMidY, coreZ + 0.006, "south", { noShadow: true });
  // Friso de luz sob a verga, peitoril e vidro.
  box(mats.lamp, bandX0, bandX1, winY1 - 0.018, winY1, coreZ, coreZ + 0.03, { noShadow: true });
  box(mats.dark, bx0, bx1, winY0 - 0.03, winY0, coreZ, bz1 + 0.02);
  box(mats.glass, bandX0, bandX1, winY0, winY1, bz1 - 0.04, bz1 - 0.02, { noShadow: true });

  // ---- Aletas verticais (InstancedMesh) -----------------------------------------
  const finSpacing = 0.32;
  const finCount = Math.floor((bx1 - bx0 - 0.3) / finSpacing) + 1;
  const finStart = (bx0 + bx1) / 2 - ((finCount - 1) * finSpacing) / 2;
  const mq0 = door0 - 0.15;
  const mq1 = door1 + 0.15;
  const mqTop = 1.0;
  const finXs = [];
  const fins = new THREE.InstancedMesh(unitBox, mats.dark, finCount);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  for (let i = 0; i < finCount; i++) {
    const x = finStart + i * finSpacing;
    finXs.push(x);
    const y0 = x > mq0 - 0.04 && x < mq1 + 0.04 ? mqTop : base;
    const y1 = H - 0.02;
    pos.set(x, (y0 + y1) / 2, (coreZ + bz1 + 0.09) / 2);
    scl.set(0.05, y1 - y0, bz1 + 0.09 - coreZ);
    fins.setMatrixAt(i, m4.compose(pos, q, scl));
  }
  fins.instanceMatrix.needsUpdate = true;
  fins.computeBoundingBox();
  fins.computeBoundingSphere();
  group.add(fins);

  // ---- Entrada de vidro e marquise -------------------------------------------
  box(mats.lobby, door0, door1, base, doorTop, coreZ - 0.02, coreZ + 0.005, { noShadow: true });
  box(mats.lobby, door0, door1, base, base + 0.01, coreZ, bz1 - 0.05, { noShadow: true });
  box(mats.glass, door0, door1, base, doorTop, bz1 - 0.06, bz1 - 0.04, { noShadow: true });
  for (const fx of [door0, door0 + 0.27, (door0 + door1) / 2 + 0.13, door1]) {
    box(mats.dark, fx - 0.02, fx + 0.02, base, doorTop, bz1 - 0.07, bz1 - 0.03);
  }
  box(mats.dark, door0, door1, doorTop - 0.04, doorTop, bz1 - 0.07, bz1 - 0.03);
  // Laje da marquise (cinza-clara) com friso de luz na borda.
  box(mats.unit, mq0, mq1, mqTop - 0.07, mqTop, bz1, bz1 + 0.42);
  box(mats.lamp, mq0 + 0.05, mq1 - 0.05, mqTop - 0.075, mqTop - 0.07, bz1 + 0.3, bz1 + 0.34, { noShadow: true });
  // Degrau da entrada.
  box(mats.curb, mq0, mq1, base, base + 0.04, bz1, bz1 + 0.42);

  // ---- Spots de piso ao longo da base -----------------------------------------
  for (let i = 0; i < finXs.length - 1; i += 3) {
    const sx = (finXs[i] + finXs[i + 1]) / 2;
    if (sx > mq0 - 0.1 && sx < mq1 + 0.1) continue;
    box(mats.dark, sx - 0.05, sx + 0.05, base, base + 0.04, bz1 + 0.02, bz1 + 0.1);
    box(mats.lamp, sx - 0.035, sx + 0.035, base + 0.04, base + 0.045, bz1 + 0.035, bz1 + 0.085, { noShadow: true });
    plane(mats.glow, 0.16, 0.5, sx, base + 0.25, bz1 + 0.004, "south", { noShadow: true });
  }

  // ---- Fachada leste: painéis grafite e veneziana ------------------------------
  const ez0 = bz0 + 0.15;
  const ez1 = bz1 - 0.15;
  const cols = 3;
  const colW = (ez1 - ez0) / cols;
  for (let c = 0; c < cols; c++) {
    for (const [y0, y1] of [[base + 0.04, 1.08], [1.12, H - 0.04]]) {
      box(mats.panel, bx1, bx1 + 0.015, y0, y1, ez0 + c * colW + 0.02, ez0 + (c + 1) * colW - 0.02);
    }
  }
  plane(mats.grille, 0.38, 0.42, bx1 + 0.02, 1.65, bz0 + 0.45, "east");

  // ---- Platibanda e piso do telhado -------------------------------------------
  const pt = 0.08;
  box(mats.panel, bx0, bx1, H, parTop, bz1 - pt, bz1);
  box(mats.panel, bx0, bx1, H, parTop, bz0, bz0 + pt);
  box(mats.panel, bx0, bx0 + pt, H, parTop, bz0, bz1);
  box(mats.panel, bx1 - pt, bx1, H, parTop, bz0, bz1);
  box(mats.roof, bx0 + pt, bx1 - pt, H, R, bz0 + pt, bz1 - pt);

  // ---- Condensadoras com ventoinhas giratórias --------------------------------
  const fanRingGeo = track(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 16));
  const hubGeo = track(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 8));
  const fans = [];
  const condenser = (x0, x1, z0, z1) => {
    const top = R + 0.36;
    box(mats.cap, x0 - 0.04, x1 + 0.04, R, R + 0.04, z0 - 0.04, z1 + 0.04);
    box(mats.unit, x0, x1, R + 0.04, top, z0, z1);
    plane(mats.grille, x1 - x0 - 0.08, 0.24, (x0 + x1) / 2, R + 0.19, z1 + 0.002, "south");
    for (const fx of [x0 + (x1 - x0) / 4, x0 + (3 * (x1 - x0)) / 4]) {
      const fz = (z0 + z1) / 2;
      const ring = new THREE.Mesh(fanRingGeo, mats.dark);
      ring.position.set(fx, top + 0.015, fz);
      group.add(ring);
      const fan = new THREE.Group();
      fan.position.set(fx, top + 0.035, fz);
      const hub = new THREE.Mesh(hubGeo, mats.steel);
      fan.add(hub);
      for (let k = 0; k < 3; k++) {
        const blade = new THREE.Mesh(unitBox, mats.steel);
        blade.scale.set(0.3, 0.008, 0.06);
        blade.rotation.set(0.25, (k * Math.PI) / 3, 0, "YXZ");
        fan.add(blade);
      }
      group.add(fan);
      fans.push(fan);
    }
  };
  condenser(bx0 + 0.2, bx0 + 1.05, -1.0, -0.45);
  condenser(bx0 + 0.85, bx0 + 1.7, bz0 + 0.18, bz0 + 0.73);

  // ---- Caixas técnicas -------------------------------------------------------------
  // Casa de máquinas escura no fundo, com veneziana.
  box(mats.graphite, -0.35, 0.6, R, R + 0.42, bz0 + 0.15, bz0 + 0.75);
  box(mats.panel, -0.2, 0.0, R + 0.42, R + 0.46, bz0 + 0.3, bz0 + 0.5);
  plane(mats.grille, 0.26, 0.2, 0.32, R + 0.22, bz0 + 0.752, "south");
  // Unidades brancas.
  box(mats.unit, -0.55, -0.1, R, R + 0.26, -0.8, -0.42);
  box(mats.unit, 0.8, 1.45, R, R + 0.3, -0.98, -0.55);
  plane(mats.grille, 0.55, 0.2, 1.125, R + 0.15, -0.548, "south");
  box(mats.unit, 0.8, 1.12, R, R + 0.32, bz0 + 0.18, bz0 + 0.6);
  box(mats.unit, 1.14, 1.42, R, R + 0.32, bz0 + 0.18, bz0 + 0.6);
  box(mats.unit, 0.15, 0.5, R, R + 0.18, 0.05, 0.35);
  // Grelha de ventilação no piso do telhado.
  box(mats.dark, 0.0, 0.95, R, R + 0.03, 0.55, 1.08);
  plane(mats.grille, 0.85, 0.43, 0.475, R + 0.032, 0.815, "up");

  // ---- Torre de antena treliçada (quina nordeste) -----------------------------
  const tx = bx1 - 0.32;
  const tz = bz0 + 0.32;
  const tBase = R + 0.06;
  const tTop = R + 1.2;
  box(mats.concrete, tx - 0.18, tx + 0.18, R, tBase, tz - 0.18, tz + 0.18);
  const rb = 0.11; // meia-largura na base
  const rt = 0.045; // meia-largura no topo
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const at = (h) => rb + (rt - rb) * ((h - tBase) / (tTop - tBase));
  for (const [sx, sz] of corners) {
    rod(mats.steel, tx + sx * rb, tBase, tz + sz * rb, tx + sx * rt, tTop, tz + sz * rt, 0.012);
  }
  const levels = [tBase + 0.02, tBase + 0.38, tBase + 0.74, tTop];
  for (const h of levels.slice(1)) {
    const r = at(h);
    for (let k = 0; k < 4; k++) {
      const [ax, az] = corners[k];
      const [cx, cz] = corners[(k + 1) % 4];
      rod(mats.steel, tx + ax * r, h, tz + az * r, tx + cx * r, h, tz + cz * r, 0.007);
    }
  }
  // Diagonais nas faces sul e leste (as que a câmera vê).
  for (let i = 0; i < levels.length - 1; i++) {
    const h0 = levels[i];
    const h1 = levels[i + 1];
    const r0 = at(h0);
    const r1 = at(h1);
    const flip = i % 2 ? 1 : -1;
    rod(mats.steel, tx + flip * r0, h0, tz + r0, tx - flip * r1, h1, tz + r1, 0.006);
    rod(mats.steel, tx + r0, h0, tz + flip * r0, tx + r1, h1, tz - flip * r1, 0.006);
  }
  // Mastro, painéis de antena e parabólica.
  rod(mats.steel, tx, tTop - 0.1, tz, tx, tTop + 0.3, tz, 0.015);
  for (const [dx, dz] of [[0, 0.07], [0.07, -0.03], [-0.07, -0.03]]) {
    box(mats.unit, tx + dx - 0.025, tx + dx + 0.025, tTop - 0.02, tTop + 0.24, tz + dz - 0.02, tz + dz + 0.02);
  }
  const dish = new THREE.Mesh(track(new THREE.CylinderGeometry(0.09, 0.025, 0.04, 14)), mats.unit);
  dish.rotation.z = -Math.PI / 2; // boca virada para leste
  dish.position.set(tx + 0.09, tBase + 0.62, tz + 0.02);
  group.add(dish);

  // ---- Calhas de cabo: telhado -> quina leste -> descida até o chão -----------
  const trayY0 = R + 0.04;
  const trayY1 = R + 0.08;
  const trays = [
    { z0: -0.3, z1: -0.24, x0: -0.7 },
    { z0: -0.2, z1: -0.14, x0: 0.2 },
  ];
  const padXs = [];
  for (const t of trays) {
    box(mats.steel, t.x0, bx1 - pt, trayY0, trayY1, t.z0, t.z1);
    for (let x = t.x0 + 0.1; x < bx1 - pt - 0.05; x += 0.45) padXs.push([x, (t.z0 + t.z1) / 2]);
  }
  // Ramal vindo da torre.
  box(mats.steel, tx - 0.03, tx + 0.03, trayY0, trayY1, tz + 0.18, -0.3);
  for (let z = tz + 0.35; z < -0.35; z += 0.45) padXs.push([tx, z]);
  // Apoios baixos sob as calhas.
  const pads = new THREE.InstancedMesh(unitBox, mats.cap, padXs.length);
  padXs.forEach(([x, z], i) => {
    pos.set(x, (R + trayY0) / 2, z);
    scl.set(0.08, trayY0 - R, 0.1);
    pads.setMatrixAt(i, m4.compose(pos, q, scl));
  });
  pads.instanceMatrix.needsUpdate = true;
  pads.computeBoundingBox();
  pads.computeBoundingSphere();
  group.add(pads);
  // Passagem sobre a platibanda e caixa de junção na quina.
  box(mats.steel, bx1 - pt - 0.02, bx1 + 0.1, parTop, parTop + 0.05, -0.32, -0.12);
  box(mats.unit, bx1 - 0.02, bx1 + 0.12, parTop - 0.08, parTop + 0.08, -0.36, -0.08);
  // Eletrodutos descendo pela fachada leste.
  const pipeTop = parTop - 0.08;
  const groundBoxTop = base + 0.28;
  for (const pz of [-0.32, -0.24, -0.16]) {
    box(mats.steel, bx1 + 0.03, bx1 + 0.08, groundBoxTop, pipeTop, pz, pz + 0.05);
  }
  for (const by of [0.55, 1.05, 1.55]) {
    box(mats.unit, bx1 + 0.015, bx1 + 0.1, by, by + 0.04, -0.35, -0.09);
  }
  // Caixa de concreto no chão.
  box(mats.concrete, bx1 + 0.01, bx1 + 0.3, base, groundBoxTop, -0.48, 0.04);
  box(mats.cap, bx1 + 0.03, bx1 + 0.28, groundBoxTop, groundBoxTop + 0.02, -0.46, 0.02);

  // ---- Animações: ventoinhas girando e LEDs cintilando ------------------------
  const blink = seeded(7);
  let nextBlink = 0;
  onFrame((t, dt) => {
    for (let i = 0; i < fans.length; i++) fans[i].rotation.y += dt * (5 + i * 0.4);
    mats.led.opacity = 0.8 + 0.2 * Math.sin(t * 2.3);
    if (t >= nextBlink) {
      // Desloca o padrão em linhas inteiras: LEDs diferentes acendem.
      ledTex.offset.y = Math.floor(blink() * 11) * (5 / 64);
      nextBlink = t + 0.18;
    }
  });

  return {
    labelPos: new THREE.Vector3((door0 + door1) / 2, 1.18, bz1 + 0.14),
    labelBg: pv("green-800"),
  };
}
