// Prédio Laboratório de Machine Learning da Vila SEMEC (ginásio bônus da
// Mariana): caixa de vidro e metal escuro sobre base de concreto clara.
// Fachada: faixa superior de vidro escuro com uma rede neural luminosa
// (3 camadas de nós ligados por linhas, com pulsos de luz percorrendo as
// conexões); térreo com painel de "loss" caindo colado ao vidro (esquerda),
// porta central com marquise e janela com uma gatinha de pelúcia sentada no
// peitoril (direita). Telhado: núcleo de IA em redoma de vidro sobre um chip,
// parabólica girando e um pequeno servidor com LEDs piscando.
// Coordenadas locais: centro do footprint na origem, fachada em +z.
// Contrato em ./shared.js.

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

// Painel com o gráfico de "loss" do treino. `draw(progress)` redesenha a
// curva até a fração `progress` (0..1) das épocas.
function makeLossChart(pal) {
  const W = 256;
  const H = 160;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;

  const pv = pal.pv;
  const c = {
    bg: pv("gray-950").getStyle(),
    head: pv("blue-900").getStyle(),
    grid: pv("gray-800").getStyle(),
    axis: pv("gray-500").getStyle(),
    text: pv("white").getStyle(),
    textSoft: pv("blue-200").getStyle(),
    train: pv("green-500").getStyle(),
    val: pv("yellow-400").getStyle(),
  };

  // Curvas pré-calculadas: queda exponencial com ruído que diminui.
  const N = 64;
  const rand = seeded(1337);
  const train = [];
  const val = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const noise = (rand() - 0.5) * 0.12 * (1 - u * 0.7);
    train.push(0.08 + 0.86 * Math.exp(-4.2 * u) + noise);
    val.push(0.15 + 0.8 * Math.exp(-3.4 * u) + (rand() - 0.5) * 0.08);
  }

  const px0 = 26;
  const px1 = W - 12;
  const py0 = 34;
  const py1 = H - 18;
  const toX = (i) => px0 + ((px1 - px0) * i) / N;
  const toY = (v) => py1 - (py1 - py0) * Math.min(1, Math.max(0, v));

  const line = (pts, upto, color, width, dash) => {
    g.strokeStyle = color;
    g.lineWidth = width;
    g.lineJoin = "round";
    g.setLineDash(dash);
    g.beginPath();
    for (let i = 0; i <= upto; i++) {
      if (i === 0) g.moveTo(toX(i), toY(pts[i]));
      else g.lineTo(toX(i), toY(pts[i]));
    }
    g.stroke();
    g.setLineDash([]);
  };

  const draw = (progress) => {
    const upto = Math.max(1, Math.round(N * progress));
    g.fillStyle = c.bg;
    g.fillRect(0, 0, W, H);
    // Barra de título.
    g.fillStyle = c.head;
    g.fillRect(0, 0, W, 22);
    g.fillStyle = c.text;
    g.font = `700 14px ${pal.font}`;
    g.textBaseline = "middle";
    g.fillText("loss", 8, 12);
    g.fillStyle = c.textSoft;
    g.font = `400 12px ${pal.font}`;
    g.textAlign = "right";
    g.fillText(`época ${Math.round(upto * 1.5)}`, W - 8, 12);
    g.textAlign = "left";
    // Grade.
    g.strokeStyle = c.grid;
    g.lineWidth = 1;
    for (let k = 0; k <= 4; k++) {
      const y = py0 + ((py1 - py0) * k) / 4;
      g.beginPath();
      g.moveTo(px0, y);
      g.lineTo(px1, y);
      g.stroke();
    }
    for (let k = 1; k <= 4; k++) {
      const x = px0 + ((px1 - px0) * k) / 4;
      g.beginPath();
      g.moveTo(x, py0);
      g.lineTo(x, py1);
      g.stroke();
    }
    // Eixos.
    g.strokeStyle = c.axis;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(px0, py0 - 4);
    g.lineTo(px0, py1);
    g.lineTo(px1, py1);
    g.stroke();
    // Validação (tracejada) e treino (cheia, grossa).
    line(val, upto, c.val, 2.5, [6, 5]);
    line(train, upto, c.train, 4.5, []);
    // Ponto na época atual.
    g.fillStyle = c.text;
    g.beginPath();
    g.arc(toX(upto), toY(train[upto]), 4.5, 0, Math.PI * 2);
    g.fill();
    tex.needsUpdate = true;
  };

  draw(1);
  return { tex, draw };
}

export function buildML(group, b, ctx) {
  const { pal, track, unitBox, onFrame } = ctx;
  const pv = pal.pv;
  const white = pv("white");
  const hw = b.w / 2 - 0.05;
  const hd = b.h / 2 - 0.05;

  const glow = (color, intensity) => std(color, { emissive: color, emissiveIntensity: intensity });

  const mats = {
    pavement: track(std(pv("gray-200"))),
    curb: track(std(pv("gray-300"))),
    concrete: track(std(pal.mix(pv("gray-100"), white, 0.35), { roughness: 0.9 })),
    concreteJoint: track(std(pv("gray-300"))),
    metal: track(std(pal.mix(pv("gray-800"), pv("blue-950"), 0.25), { roughness: 0.45, metalness: 0.45 })),
    metalDark: track(std(pv("gray-900"), { roughness: 0.4, metalness: 0.5 })),
    steel: track(std(pv("gray-400"), { roughness: 0.4, metalness: 0.4 })),
    roof: track(std(pal.mix(pv("gray-300"), pv("gray-400"), 0.4))),
    panel: track(std(pal.mix(pv("blue-950"), pv("gray-950"), 0.4), { roughness: 0.25, metalness: 0.3 })),
    glass: track(
      std(pal.mix(pv("blue-200"), white, 0.2), { roughness: 0.08, transparent: true, opacity: 0.22, depthWrite: false })
    ),
    interior: track(glow(pal.mix(pv("blue-100"), white, 0.55), 0.55)),
    interiorCool: track(glow(pal.mix(pv("blue-300"), pv("blue-100"), 0.5), 0.35)),
    interiorFloor: track(glow(pal.mix(pv("blue-200"), pv("gray-200"), 0.5), 0.3)),
    lamp: track(new THREE.MeshBasicMaterial({ color: pal.mix(pv("blue-100"), white, 0.7) })),
    netLine: track(new THREE.MeshBasicMaterial({ color: pal.mix(pv("blue-400"), pv("blue-600"), 0.4) })),
    pulse: track(new THREE.MeshBasicMaterial({ color: pal.mix(pv("blue-100"), white, 0.6) })),
    bezel: track(std(pv("gray-900"), { roughness: 0.35 })),
    leaves: track(std(pv("green-700"), { flatShading: true })),
    pot: track(std(pv("gray-600"))),
    // Gatinha de pelúcia: creme, orelhas rosadas, lacinho.
    plush: track(std(pal.mix(pv("yellow-400"), white, 0.78), { roughness: 1, flatShading: true })),
    plushPink: track(std(pal.mix(pv("red-300"), white, 0.35), { roughness: 1, flatShading: true })),
    plushEye: track(std(pv("gray-950"), { roughness: 0.3 })),
    bow: track(std(pv("blue-500"), { roughness: 0.7, flatShading: true })),
    // Telhado: chip e núcleo de IA.
    chip: track(std(pv("gray-900"), { roughness: 0.35, metalness: 0.3 })),
    pin: track(std(pal.mix(pv("yellow-500"), pv("gray-300"), 0.35), { roughness: 0.35, metalness: 0.7 })),
    dome: track(
      std(pal.mix(pv("blue-200"), white, 0.4), {
        roughness: 0.05,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        flatShading: true,
      })
    ),
    core: track(
      std(pv("blue-300"), { emissive: pv("blue-400"), emissiveIntensity: 1, flatShading: true, roughness: 0.3 })
    ),
    dish: track(std(pal.mix(pv("gray-100"), white, 0.5), { roughness: 0.5, side: THREE.DoubleSide })),
    ledOn: track(new THREE.MeshBasicMaterial({ color: pv("green-500") })),
    ledBlue: track(new THREE.MeshBasicMaterial({ color: pv("blue-300") })),
    ledOff: track(new THREE.MeshBasicMaterial({ color: pv("gray-700") })),
  };

  const box = makeBox(group, unitBox);

  // Haste cilíndrica entre dois pontos (linhas da rede, mastro).
  const rodGeo = track(new THREE.CylinderGeometry(1, 1, 1, 6));
  const up = new THREE.Vector3(0, 1, 0);
  const rod = (mat, ax, ay, az, bx, by, bz, r, opts = {}) => {
    const a = new THREE.Vector3(ax, ay, az);
    const d = new THREE.Vector3(bx, by, bz).sub(a);
    const m = new THREE.Mesh(rodGeo, mat);
    m.scale.set(r, d.length(), r);
    m.quaternion.setFromUnitVectors(up, d.clone().normalize());
    m.position.copy(a).addScaledVector(d, 0.5);
    if (opts.noShadow) m.userData.noShadow = true;
    group.add(m);
    return m;
  };
  const sphereGeo = track(new THREE.SphereGeometry(1, 12, 8));
  const lowSphere = track(new THREE.IcosahedronGeometry(1, 1));
  const ball = (geo, mat, x, y, z, sx, sy = sx, sz = sx, parent = group) => {
    const m = new THREE.Mesh(geo, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  // ---- Medidas -------------------------------------------------------------------
  const base = 0.06; // topo da calçada
  const plinth = 0.22; // topo da base de concreto
  const bx0 = -hw + 0.18;
  const bx1 = hw - 0.18;
  const bz0 = -hd + 0.2;
  const bz1 = hd - 0.48; // fachada (calçada larga na frente)
  const coreZ = bz1 - 0.13; // fundo do recuo das janelas
  const glassZ = bz1 - 0.03;
  const H = 2.2; // topo da laje
  const parTop = H + 0.13;
  const R = H + 0.02; // piso do telhado
  const colW = 0.1;
  const doorCol = 0.62; // pilares que ladeiam a entrada (centro em ±doorCol)
  const groundTop = 1.3; // viga entre o térreo e a faixa da rede neural
  const beamTop = 1.42;
  const bandTop = H - 0.1;

  // ---- Calçada e base de concreto ---------------------------------------------
  box(mats.pavement, -hw, hw, 0, base, -hd, hd);
  box(mats.curb, -hw, hw, base, base + 0.005, hd - 0.08, hd, { noShadow: true });
  box(mats.concrete, bx0 - 0.08, bx1 + 0.08, base, plinth, bz0 - 0.08, bz1 + 0.1);
  // Juntas da base (frisos verticais na face sul).
  for (let x = bx0 + 0.5; x < bx1 - 0.2; x += 0.6) {
    if (Math.abs(x) < 0.5) continue;
    box(mats.concreteJoint, x - 0.008, x + 0.008, base + 0.01, plinth - 0.01, bz1 + 0.1, bz1 + 0.105, { noShadow: true });
  }
  // Degraus da entrada.
  box(mats.concrete, -0.5, 0.5, base, base + 0.08, bz1 + 0.1, bz1 + 0.3);

  // ---- Núcleo e moldura metálica ----------------------------------------------
  box(mats.metal, bx0, bx1, plinth, H, bz0, coreZ);
  // Pilares: quinas e os que ladeiam a porta.
  for (const cx of [bx0 + colW / 2, -doorCol, doorCol, bx1 - colW / 2]) {
    const top = Math.abs(cx) < 1 ? beamTop : parTop;
    box(mats.metalDark, cx - colW / 2, cx + colW / 2, plinth, top, coreZ, bz1 + 0.03);
  }
  // Viga entre o térreo e a faixa superior, e verga do topo.
  box(mats.metalDark, bx0, bx1, groundTop, beamTop, coreZ, bz1 + 0.04);
  box(mats.metalDark, bx0, bx1, bandTop, H, coreZ, bz1 + 0.03);
  // Painel liso acima da porta (fundo da plaquinha).
  box(mats.metal, -doorCol, doorCol, 0.98, groundTop, coreZ, bz1 - 0.01);

  // ---- Térreo esquerdo: painel de loss colado ao vidro ------------------------
  const lx0 = bx0 + colW;
  const lx1 = -doorCol - colW / 2;
  box(mats.interior, lx0, lx1, plinth, groundTop, coreZ, coreZ + 0.004, { noShadow: true });
  box(mats.interiorFloor, lx0, lx1, plinth, plinth + 0.01, coreZ, glassZ, { noShadow: true });
  const chart = makeLossChart(pal);
  track(chart.tex);
  const scrW = lx1 - lx0 - 0.16;
  const scrH = scrW * (160 / 256);
  const scrX = (lx0 + lx1) / 2;
  const scrY = 0.36 + scrH / 2 + 0.06;
  box(mats.bezel, scrX - scrW / 2 - 0.03, scrX + scrW / 2 + 0.03, scrY - scrH / 2 - 0.03, scrY + scrH / 2 + 0.03, glassZ - 0.05, glassZ - 0.02);
  // Pé do painel até o chão.
  box(mats.bezel, scrX - 0.03, scrX + 0.03, plinth, scrY - scrH / 2, glassZ - 0.06, glassZ - 0.03);
  box(mats.bezel, scrX - 0.16, scrX + 0.16, plinth, plinth + 0.02, glassZ - 0.1, glassZ - 0.01);
  const screen = new THREE.Mesh(
    track(new THREE.PlaneGeometry(scrW, scrH)),
    track(new THREE.MeshBasicMaterial({ map: chart.tex, toneMapped: false }))
  );
  screen.position.set(scrX, scrY, glassZ - 0.018);
  screen.userData.noShadow = true;
  group.add(screen);
  box(mats.glass, lx0, lx1, plinth, groundTop, glassZ - 0.01, glassZ + 0.01, { noShadow: true });
  // Montante no meio do vão.
  box(mats.metalDark, scrX - 0.015, scrX + 0.015, plinth, scrY - scrH / 2 - 0.03, glassZ, glassZ + 0.03);

  // ---- Entrada central --------------------------------------------------------
  const dx0 = -doorCol + colW / 2;
  const dx1 = doorCol - colW / 2;
  const doorTop = 0.98;
  box(mats.interior, dx0, dx1, plinth, doorTop, coreZ - 0.02, coreZ + 0.004, { noShadow: true });
  box(mats.interiorFloor, dx0, dx1, plinth, plinth + 0.01, coreZ, glassZ, { noShadow: true });
  box(mats.glass, dx0, dx1, plinth, doorTop, glassZ - 0.01, glassZ + 0.01, { noShadow: true });
  for (const fx of [dx0 + 0.02, -0.01, 0.01, dx1 - 0.02]) {
    box(mats.metalDark, fx - 0.018, fx + 0.018, plinth, doorTop, glassZ - 0.015, glassZ + 0.025);
  }
  box(mats.metalDark, dx0, dx1, doorTop - 0.04, doorTop, glassZ - 0.015, glassZ + 0.025);
  // Puxadores iluminados.
  box(mats.lamp, -0.06, -0.045, 0.5, 0.72, glassZ + 0.025, glassZ + 0.035, { noShadow: true });
  box(mats.lamp, 0.045, 0.06, 0.5, 0.72, glassZ + 0.025, glassZ + 0.035, { noShadow: true });
  // Marquise fina com friso de luz.
  box(mats.metalDark, -doorCol - 0.06, doorCol + 0.06, doorTop - 0.02, doorTop + 0.03, bz1, bz1 + 0.34);
  box(mats.lamp, -doorCol + 0.05, doorCol - 0.05, doorTop - 0.025, doorTop - 0.02, bz1 + 0.24, bz1 + 0.28, { noShadow: true });

  // ---- Térreo direito: janela com peitoril e a gatinha ------------------------
  const rx0 = doorCol + colW / 2;
  const rx1 = bx1 - colW;
  const sillY = 0.46;
  box(mats.metal, rx0, rx1, plinth, sillY, coreZ, bz1 - 0.005); // peitoril cego
  box(mats.interior, rx0, rx1, sillY, groundTop, coreZ, coreZ + 0.004, { noShadow: true });
  box(mats.interiorFloor, rx0, rx1, sillY, sillY + 0.01, coreZ, glassZ, { noShadow: true });
  // Vasinho com planta e pilha de livros atrás do vidro.
  const potX = rx1 - 0.2;
  box(mats.pot, potX - 0.07, potX + 0.07, sillY, sillY + 0.12, glassZ - 0.1, glassZ - 0.03);
  for (const [lx, ly, lz, s] of [[0, 0.2, 0, 0.09], [-0.05, 0.26, 0.01, 0.07], [0.05, 0.25, -0.01, 0.07], [0, 0.32, 0, 0.06]]) {
    ball(lowSphere, mats.leaves, potX + lx, sillY + ly, glassZ - 0.065 + lz, s);
  }
  const books = [pv("blue-600"), pv("yellow-500"), pv("red-400"), pv("green-600")];
  books.forEach((col, i) => {
    const bx = rx0 + 0.12 + i * 0.045;
    const bh = 0.17 + ((i * 7) % 3) * 0.025;
    box(track(std(col)), bx, bx + 0.038, sillY + 0.01, sillY + bh, glassZ - 0.11, glassZ - 0.03);
  });
  box(mats.glass, rx0, rx1, sillY, groundTop, glassZ - 0.01, glassZ + 0.01, { noShadow: true });
  // Peitoril saliente (onde a gatinha senta).
  box(mats.steel, rx0 - 0.02, rx1 + 0.02, sillY - 0.03, sillY, coreZ, bz1 + 0.15);

  // Gatinha de pelúcia low-poly, de frente para a praça.
  const kitty = new THREE.Group();
  kitty.position.set((rx0 + rx1) / 2 - 0.02, sillY, bz1 + 0.07);
  kitty.rotation.y = -0.25;
  kitty.scale.setScalar(1.35);
  group.add(kitty);
  ball(lowSphere, mats.plush, 0, 0.075, 0, 0.075, 0.08, 0.065, kitty); // corpo
  ball(lowSphere, mats.plush, -0.035, 0.022, 0.045, 0.026, 0.022, 0.032, kitty); // patinhas
  ball(lowSphere, mats.plush, 0.035, 0.022, 0.045, 0.026, 0.022, 0.032, kitty);
  ball(lowSphere, mats.plush, 0, 0.19, 0.01, 0.07, 0.062, 0.062, kitty); // cabeça
  ball(lowSphere, mats.plushPink, 0, 0.18, 0.068, 0.012, 0.009, 0.008, kitty); // focinho
  ball(sphereGeo, mats.plushEye, -0.027, 0.2, 0.06, 0.011, 0.014, 0.008, kitty);
  ball(sphereGeo, mats.plushEye, 0.027, 0.2, 0.06, 0.011, 0.014, 0.008, kitty);
  ball(lowSphere, mats.plushPink, -0.045, 0.172, 0.05, 0.012, 0.008, 0.005, kitty); // bochechas
  ball(lowSphere, mats.plushPink, 0.045, 0.172, 0.05, 0.012, 0.008, 0.005, kitty);
  const earGeo = track(new THREE.ConeGeometry(1, 1, 4));
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, mats.plush);
    ear.scale.set(0.028, 0.05, 0.022);
    ear.position.set(s * 0.04, 0.255, 0.005);
    ear.rotation.z = -s * 0.3;
    kitty.add(ear);
    const inner = new THREE.Mesh(earGeo, mats.plushPink);
    inner.scale.set(0.016, 0.032, 0.01);
    inner.position.set(s * 0.04, 0.25, 0.018);
    inner.rotation.z = -s * 0.3;
    kitty.add(inner);
  }
  // Lacinho no pescoço.
  ball(lowSphere, mats.bow, -0.02, 0.135, 0.06, 0.02, 0.014, 0.01, kitty);
  ball(lowSphere, mats.bow, 0.02, 0.135, 0.06, 0.02, 0.014, 0.01, kitty);
  ball(lowSphere, mats.bow, 0, 0.135, 0.064, 0.009, 0.009, 0.009, kitty);
  // Rabo: arco de toro que balança.
  const tail = new THREE.Group();
  tail.position.set(0.06, 0.03, -0.02);
  kitty.add(tail);
  const tailMesh = new THREE.Mesh(track(new THREE.TorusGeometry(0.06, 0.016, 5, 9, Math.PI * 1.1)), mats.plush);
  tailMesh.position.set(0.03, 0.04, 0);
  tailMesh.rotation.set(0, -0.6, -1.4);
  tail.add(tailMesh);

  // ---- Faixa superior: vidro escuro com a rede neural -------------------------
  const nx0 = bx0 + colW;
  const nx1 = bx1 - colW;
  const panelZ = bz1 - 0.02;
  box(mats.panel, nx0, nx1, beamTop, bandTop, coreZ, panelZ);
  // Faixas de vidro estreitas nas pontas (o laboratório continua ali dentro).
  const sideW = 0.24;
  for (const [g0, g1] of [[nx0, nx0 + sideW], [nx1 - sideW, nx1]]) {
    box(mats.interiorCool, g0, g1, beamTop, bandTop, panelZ - 0.004, panelZ + 0.002, { noShadow: true });
    box(mats.glass, g0, g1, beamTop, bandTop, panelZ + 0.005, panelZ + 0.02, { noShadow: true });
    box(mats.metalDark, g0 - 0.015 + (g0 === nx0 ? sideW : 0), g0 + 0.015 + (g0 === nx0 ? sideW : 0), beamTop, bandTop, panelZ, panelZ + 0.03);
  }

  // Camadas da rede: 3 colunas de nós.
  const layers = [3, 4, 3];
  const layerX = [-1.0, 0, 1.0];
  const netY0 = beamTop + 0.1;
  const netY1 = bandTop - 0.09;
  const netZ = panelZ + 0.03;
  const nodeBase = pal.mix(pv("blue-500"), pv("blue-300"), 0.4);
  const nodeHot = pal.mix(pv("blue-100"), white, 0.7);
  const NODE_R = 0.062;
  const nodes = layers.map((n, li) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? (netY0 + netY1) / 2 : netY1 - ((netY1 - netY0) * (i + (4 - n) / 2)) / 3;
      const mat = track(new THREE.MeshBasicMaterial({ color: nodeBase.clone() }));
      const m = ball(sphereGeo, mat, layerX[li], y, netZ, NODE_R, NODE_R, 0.035);
      m.userData.noShadow = true;
      // Anel escuro (soquete) em volta do nó.
      const ring = ball(sphereGeo, mats.metalDark, layerX[li], y, netZ - 0.012, NODE_R + 0.017, NODE_R + 0.017, 0.02);
      ring.userData.noShadow = true;
      out.push({ x: layerX[li], y, mesh: m, mat, act: 0 });
    }
    return out;
  });
  // Conexões entre camadas vizinhas (todas com todas).
  for (let li = 0; li < layers.length - 1; li++) {
    for (const a of nodes[li]) {
      for (const c of nodes[li + 1]) {
        rod(mats.netLine, a.x, a.y, netZ - 0.004, c.x, c.y, netZ - 0.004, 0.011, { noShadow: true });
      }
    }
  }
  // Pulsos de luz: começam escondidos e só aparecem com animação ligada.
  const pulseRand = seeded(2024);
  const pickPath = () => nodes.map((layer) => layer[Math.floor(pulseRand() * layer.length)]);
  const pulses = [];
  for (let i = 0; i < 5; i++) {
    const m = ball(sphereGeo, mats.pulse, 0, 0, netZ + 0.005, 0.03);
    m.userData.noShadow = true;
    m.visible = false;
    pulses.push({ mesh: m, path: pickPath(), p: -i * 0.45, lastHop: -1 });
  }

  // Friso de luz sob a verga do topo.
  box(mats.lamp, nx0, nx1, bandTop - 0.015, bandTop, panelZ, panelZ + 0.02, { noShadow: true });

  // ---- Laterais (leste/oeste): metal com rasgo de vidro -------------------------
  for (const s of [-1, 1]) {
    const fx = s > 0 ? bx1 : bx0;
    box(mats.interior, fx - 0.004, fx + 0.004, 0.5, 1.95, bz0 + 0.5, bz1 - 0.5, { noShadow: true });
    box(mats.glass, fx + s * 0.01 - 0.008, fx + s * 0.01 + 0.008, 0.5, 1.95, bz0 + 0.5, bz1 - 0.5, { noShadow: true });
    for (const z of [bz0 + 0.5, (bz0 + bz1) / 2, bz1 - 0.5]) {
      box(mats.metalDark, fx - 0.02, fx + 0.02 + s * 0.01, 0.5, 1.95, z - 0.02, z + 0.02);
    }
    box(mats.metalDark, fx - 0.02, fx + 0.03 * s + 0.01, 1.3, 1.4, bz0 + 0.5, bz1 - 0.5);
  }

  // ---- Platibanda e piso do telhado -------------------------------------------
  const pt = 0.08;
  box(mats.metalDark, bx0, bx1, H, parTop, bz1 - pt, bz1 + 0.03);
  box(mats.metalDark, bx0, bx1, H, parTop, bz0, bz0 + pt);
  box(mats.metalDark, bx0, bx0 + pt, H, parTop, bz0, bz1);
  box(mats.metalDark, bx1 - pt, bx1, H, parTop, bz0, bz1);
  box(mats.roof, bx0 + pt, bx1 - pt, H, R, bz0 + pt, bz1 - pt);
  // Faixa de luz no topo da platibanda frontal.
  box(mats.lamp, bx0 + 0.1, bx1 - 0.1, parTop - 0.03, parTop - 0.015, bz1 + 0.03, bz1 + 0.035, { noShadow: true });

  // ---- Telhado: chip com núcleo de IA em redoma de vidro -----------------------
  const cxC = 0.05;
  const czC = 0.05;
  const chipS = 0.62;
  box(mats.concrete, cxC - chipS / 2 - 0.06, cxC + chipS / 2 + 0.06, R, R + 0.05, czC - chipS / 2 - 0.06, czC + chipS / 2 + 0.06);
  box(mats.chip, cxC - chipS / 2, cxC + chipS / 2, R + 0.05, R + 0.12, czC - chipS / 2, czC + chipS / 2);
  // Pinos dourados nos quatro lados.
  const pins = [];
  const PIN = 6;
  for (let i = 0; i < PIN; i++) {
    const o = -chipS / 2 + ((i + 0.5) * chipS) / PIN;
    pins.push([cxC + o, czC + chipS / 2 + 0.04, 0.035, 0.08]);
    pins.push([cxC + o, czC - chipS / 2 - 0.04, 0.035, 0.08]);
    pins.push([cxC + chipS / 2 + 0.04, czC + o, 0.08, 0.035]);
    pins.push([cxC - chipS / 2 - 0.04, czC + o, 0.08, 0.035]);
  }
  const pinMesh = new THREE.InstancedMesh(unitBox, mats.pin, pins.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const s3 = new THREE.Vector3();
  pins.forEach(([x, z, sx, sz], i) => {
    pinMesh.setMatrixAt(i, m4.compose(v.set(x, R + 0.075, z), q, s3.set(sx, 0.02, sz)));
  });
  pinMesh.instanceMatrix.needsUpdate = true;
  pinMesh.computeBoundingBox();
  pinMesh.computeBoundingSphere();
  group.add(pinMesh);
  // Trilhas iluminadas no topo do chip.
  for (const o of [-0.18, 0.18]) {
    box(mats.ledBlue, cxC + o - 0.008, cxC + o + 0.008, R + 0.12, R + 0.125, czC - 0.27, czC + 0.27, { noShadow: true });
    box(mats.ledBlue, cxC - 0.27, cxC + 0.27, R + 0.12, R + 0.125, czC + o - 0.008, czC + o + 0.008, { noShadow: true });
  }
  // Redoma facetada e o núcleo (icosaedro) pulsando.
  const domeGeo = track(new THREE.SphereGeometry(0.24, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2));
  const dome = new THREE.Mesh(domeGeo, mats.dome);
  dome.position.set(cxC, R + 0.12, czC);
  dome.userData.noShadow = true;
  group.add(dome);
  const core = new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.11, 0)), mats.core);
  core.position.set(cxC, R + 0.25, czC);
  core.userData.noShadow = true;
  group.add(core);

  // ---- Telhado: parabólica no mastro (fundo, à direita) -------------------------
  const ax = bx1 - 0.45;
  const az = -0.05;
  box(mats.concrete, ax - 0.16, ax + 0.16, R, R + 0.06, az - 0.16, az + 0.16);
  rod(mats.steel, ax, R + 0.06, az, ax, R + 0.55, az, 0.025);
  const dishPivot = new THREE.Group();
  dishPivot.position.set(ax, R + 0.55, az);
  group.add(dishPivot);
  const dishTilt = new THREE.Group();
  dishTilt.rotation.x = 0.85; // boca virada para o céu, inclinada para o sul
  dishPivot.add(dishTilt);
  const dishMesh = new THREE.Mesh(track(new THREE.SphereGeometry(0.3, 16, 6, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38)), mats.dish);
  dishMesh.position.y = 0.26;
  dishTilt.add(dishMesh);
  const feed = new THREE.Mesh(rodGeo, mats.steel);
  feed.scale.set(0.012, 0.22, 0.012);
  feed.position.y = 0.11;
  dishTilt.add(feed);
  const feedTip = new THREE.Mesh(sphereGeo, mats.ledBlue);
  feedTip.scale.setScalar(0.03);
  feedTip.position.y = 0.23;
  feedTip.userData.noShadow = true;
  dishTilt.add(feedTip);

  // ---- Telhado: servidorzinho com LEDs (fundo, à esquerda) -----------------------
  const sx0 = bx0 + 0.22;
  const sx1 = sx0 + 0.42;
  const sz0 = -0.35;
  const sz1 = sz0 + 0.34;
  const sTop = R + 0.52;
  box(mats.concrete, sx0 - 0.05, sx1 + 0.05, R, R + 0.04, sz0 - 0.05, sz1 + 0.05);
  box(mats.metal, sx0, sx1, R + 0.04, sTop, sz0, sz1);
  box(mats.metalDark, sx0 - 0.02, sx1 + 0.02, sTop, sTop + 0.03, sz0 - 0.02, sz1 + 0.02);
  // Baias na face sul com um LED cada.
  const leds = [];
  const ledRand = seeded(99);
  for (let r = 0; r < 5; r++) {
    const y = R + 0.1 + r * 0.08;
    box(mats.bezel, sx0 + 0.04, sx1 - 0.04, y, y + 0.055, sz1, sz1 + 0.01);
    for (let k = 0; k < 3; k++) {
      const lx = sx1 - 0.08 - k * 0.05;
      const led = box(ledRand() < 0.6 ? mats.ledOn : mats.ledOff, lx - 0.012, lx + 0.012, y + 0.02, y + 0.035, sz1 + 0.01, sz1 + 0.016, {
        noShadow: true,
      });
      leds.push(led);
    }
  }
  // Calha de cabos do servidor até o chip.
  box(mats.steel, sx1, cxC - chipS / 2 - 0.08, R, R + 0.04, sz1 - 0.12, sz1 - 0.06);

  // ---- Telhado: placas solares inclinadas para o sul (frente) --------------------
  const solarMat = track(std(pv("blue-900"), { roughness: 0.25, metalness: 0.4 }));
  const solarLine = track(new THREE.MeshBasicMaterial({ color: pv("blue-700") }));
  for (const [x0, x1] of [[bx0 + 0.2, -0.55], [0.55, bx1 - 0.2]]) {
    const n = 2;
    const pw = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const panel = new THREE.Group();
      panel.position.set(x0 + pw * (i + 0.5), R + 0.12, bz1 - 0.38);
      panel.rotation.x = -0.45;
      group.add(panel);
      const pbox = makeBox(panel, unitBox);
      pbox(mats.steel, -pw / 2 + 0.02, pw / 2 - 0.02, -0.02, 0, -0.17, 0.17);
      pbox(solarMat, -pw / 2 + 0.04, pw / 2 - 0.04, 0, 0.012, -0.15, 0.15);
      for (const gz of [-0.05, 0.05]) pbox(solarLine, -pw / 2 + 0.04, pw / 2 - 0.04, 0.012, 0.014, gz - 0.004, gz + 0.004, { noShadow: true });
      // Pés de apoio.
      box(mats.steel, x0 + pw * (i + 0.5) - 0.02, x0 + pw * (i + 0.5) + 0.02, R, R + 0.18, bz1 - 0.48, bz1 - 0.44);
    }
  }

  // ---- Floreiras na calçada, ladeando a entrada --------------------------------
  for (const s of [-1, 1]) {
    const px = s * 0.9;
    const pz = bz1 + 0.3;
    box(mats.concrete, px - 0.17, px + 0.17, base, base + 0.16, pz - 0.1, pz + 0.1);
    box(mats.pot, px - 0.14, px + 0.14, base + 0.16, base + 0.165, pz - 0.07, pz + 0.07, { noShadow: true });
    for (const [ox, oz, r] of [[-0.08, 0, 0.08], [0.07, -0.01, 0.085], [0, 0.02, 0.07]]) {
      ball(lowSphere, mats.leaves, px + ox, base + 0.2, pz + oz, r, r * 0.8, r);
    }
  }

  // ---- Animações ------------------------------------------------------------------
  const hot = new THREE.Color();
  const blink = seeded(7);
  let nextBlink = 0;
  let nextChart = 0;
  const CHART_CYCLE = 10; // segundos: 8 de treino + 2 parado no fim
  onFrame((t, dt) => {
    // Pulsos percorrem a rede da camada 0 à 2 (p de 0 a 2).
    for (const pl of pulses) {
      pl.p += dt * 0.9;
      if (pl.p >= 2.25) {
        pl.p = -0.3;
        pl.path = pickPath();
        pl.lastHop = -1;
      }
      const p = Math.min(2, Math.max(0, pl.p));
      const hop = Math.min(1, Math.floor(p));
      const k = p - hop;
      const a = pl.path[hop];
      const c = pl.path[hop + 1];
      pl.mesh.visible = pl.p >= 0 && pl.p <= 2;
      pl.mesh.position.x = a.x + (c.x - a.x) * k;
      pl.mesh.position.y = a.y + (c.y - a.y) * k;
      // Acende o nó ao passar por ele.
      const node = Math.round(p);
      if (pl.p >= 0 && node !== pl.lastHop && Math.abs(p - node) < 0.08) {
        pl.path[node].act = 1;
        pl.lastHop = node;
      }
    }
    for (const layer of nodes) {
      for (const n of layer) {
        n.act = Math.max(0, n.act - dt * 1.6);
        n.mat.color.copy(nodeBase).lerp(hot.copy(nodeHot), n.act);
        const sc = NODE_R * (1 + 0.25 * n.act);
        n.mesh.scale.set(sc, sc, 0.035);
      }
    }
    // Núcleo de IA girando e "respirando".
    core.rotation.y += dt * 0.6;
    core.rotation.x += dt * 0.25;
    mats.core.emissiveIntensity = 0.75 + 0.35 * Math.sin(t * 2.2);
    // Parabólica varrendo o céu devagar.
    dishPivot.rotation.y = Math.sin(t * 0.25) * 0.9;
    // Rabo da gatinha balançando.
    tail.rotation.y = Math.sin(t * 2.1) * 0.35;
    tail.rotation.z = Math.sin(t * 1.3) * 0.12;
    // LEDs do servidor.
    if (t >= nextBlink) {
      for (const led of leds) if (blink() < 0.3) led.material = blink() < 0.6 ? mats.ledOn : mats.ledOff;
      nextBlink = t + 0.2;
    }
    // Gráfico de loss: a curva avança e recomeça.
    if (t >= nextChart) {
      const ct = t % CHART_CYCLE;
      chart.draw(Math.min(1, 0.1 + ct / 8));
      nextChart = t + 0.25;
    }
  });

  return {
    labelPos: new THREE.Vector3(0, (doorTop + groundTop) / 2 + 0.01, bz1 + 0.045),
    labelBg: pv("blue-800"),
  };
}
