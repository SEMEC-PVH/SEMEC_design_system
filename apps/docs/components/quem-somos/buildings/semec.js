// Sede da SEMEC (Secretaria Municipal de Educação): prédio institucional
// moderno de dois pavimentos. Térreo de vidro recuado com hall iluminado,
// pavimento superior branco em balanço com faixa de janelas e brises,
// pórtico azul (pv-blue-700) marcando a entrada, letreiro na fachada,
// placas solares na cobertura e praça na frente com mastros de bandeira,
// totem, jardineiras e banco. Ver contrato em ./shared.js.
// Coordenadas locais: centro do footprint na origem, fachada em +z.

import * as THREE from "three";
import { std } from "./shared";

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

// Piso da praça: placas de pedra clara com juntas finas.
function makePavingTexture(pal) {
  const canvas = makeCanvas(128, 128);
  const g = canvas.getContext("2d");
  const pv = pal.pv;
  g.fillStyle = pal.mix(pv("gray-200"), pv("yellow-400"), 0.06).getStyle();
  g.fillRect(0, 0, 128, 128);
  // Algumas placas um pouco mais claras para quebrar a repetição.
  g.fillStyle = pal.mix(pv("gray-100"), pv("yellow-400"), 0.05).getStyle();
  for (const [x, y] of [[0, 0], [64, 32], [32, 96], [96, 64]]) g.fillRect(x, y, 32, 32);
  g.fillStyle = pal.mix(pv("gray-300"), pv("gray-200"), 0.3).getStyle();
  for (let i = 0; i <= 128; i += 32) {
    g.fillRect(i - 1, 0, 2, 128);
    g.fillRect(0, i - 1, 128, 2);
  }
  return canvasTexture(canvas, true);
}

// Painel solar: células azuis com grade clara.
function makeSolarTexture(pal) {
  const canvas = makeCanvas(64, 64);
  const g = canvas.getContext("2d");
  const pv = pal.pv;
  g.fillStyle = pal.mix(pv("blue-900"), pv("blue-700"), 0.35).getStyle();
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = pal.mix(pv("blue-400"), pv("blue-700"), 0.5).getStyle();
  for (let i = 0; i <= 64; i += 16) {
    g.fillRect(i - 1, 0, 1, 64);
    g.fillRect(0, i - 1, 64, 1);
  }
  g.fillStyle = pal.mix(pv("gray-300"), pv("white"), 0.4).getStyle();
  g.fillRect(0, 0, 64, 2);
  g.fillRect(0, 62, 64, 2);
  g.fillRect(0, 0, 2, 64);
  g.fillRect(62, 0, 2, 64);
  return canvasTexture(canvas, false);
}

// Letreiro da fachada: nome por extenso em azul, fundo transparente.
function makeLetteringTexture(pal) {
  const canvas = makeCanvas(1024, 384);
  const g = canvas.getContext("2d");
  const font = pal.font;
  g.textAlign = "left";
  g.textBaseline = "alphabetic";
  // Marca: quadrado azul com "S" branco.
  g.fillStyle = pal.pv("blue-700").getStyle();
  g.beginPath();
  g.roundRect(24, 72, 240, 240, 36);
  g.fill();
  g.fillStyle = pal.pv("white").getStyle();
  g.textAlign = "center";
  g.font = `700 200px ${font}`;
  g.fillText("S", 144, 262);
  g.textAlign = "left";
  g.fillStyle = pal.pv("blue-800").getStyle();
  g.font = `700 92px ${font}`;
  g.fillText("SECRETARIA", 300, 160);
  g.font = `600 64px ${font}`;
  g.fillText("MUNICIPAL DE", 302, 236);
  g.fillText("EDUCAÇÃO", 302, 306);
  return canvasTexture(canvas, false);
}

// Totem institucional: faixa vertical com marca e nome.
function makeTotemTexture(pal) {
  const canvas = makeCanvas(128, 384);
  const g = canvas.getContext("2d");
  const font = pal.font;
  g.fillStyle = pal.pv("blue-700").getStyle();
  g.fillRect(0, 0, 128, 384);
  g.fillStyle = pal.pv("white").getStyle();
  g.beginPath();
  g.roundRect(24, 28, 80, 80, 14);
  g.fill();
  g.fillStyle = pal.pv("blue-700").getStyle();
  g.textAlign = "center";
  g.font = `700 64px ${font}`;
  g.fillText("S", 64, 92);
  g.fillStyle = pal.pv("white").getStyle();
  g.save();
  g.translate(74, 140);
  g.rotate(Math.PI / 2);
  g.textAlign = "left";
  g.font = `700 52px ${font}`;
  g.fillText("SEMEC", 0, 0);
  g.restore();
  g.fillStyle = pal.pv("yellow-500").getStyle();
  g.fillRect(0, 366, 128, 18);
  return canvasTexture(canvas, false);
}

// Bandeira do Brasil simplificada (verde, losango amarelo, círculo azul).
function makeBrazilFlag(pal) {
  const canvas = makeCanvas(140, 96);
  const g = canvas.getContext("2d");
  g.fillStyle = pal.pv("green-600").getStyle();
  g.fillRect(0, 0, 140, 96);
  g.fillStyle = pal.pv("yellow-400").getStyle();
  g.beginPath();
  g.moveTo(70, 10);
  g.lineTo(130, 48);
  g.lineTo(70, 86);
  g.lineTo(10, 48);
  g.closePath();
  g.fill();
  g.fillStyle = pal.pv("blue-800").getStyle();
  g.beginPath();
  g.arc(70, 48, 20, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = pal.pv("white").getStyle();
  g.lineWidth = 3;
  g.beginPath();
  g.arc(70, 66, 26, Math.PI * 1.22, Math.PI * 1.78);
  g.stroke();
  return canvasTexture(canvas, false);
}

// Bandeira de Rondônia simplificada (azul em cima com estrela, verde e amarelo).
function makeRondoniaFlag(pal) {
  const canvas = makeCanvas(140, 96);
  const g = canvas.getContext("2d");
  g.fillStyle = pal.pv("green-600").getStyle();
  g.fillRect(0, 48, 70, 48);
  g.fillStyle = pal.pv("yellow-400").getStyle();
  g.fillRect(70, 48, 70, 48);
  g.fillStyle = pal.pv("blue-700").getStyle();
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(140, 0);
  g.lineTo(140, 48);
  g.lineTo(70, 74);
  g.lineTo(0, 48);
  g.closePath();
  g.fill();
  g.fillStyle = pal.pv("white").getStyle();
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 7 : 16;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = 70 + Math.cos(a) * r;
    const py = 32 + Math.sin(a) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fill();
  return canvasTexture(canvas, false);
}

// Bandeira institucional da SEMEC (azul com marca branca).
function makeSemecFlag(pal) {
  const canvas = makeCanvas(140, 96);
  const g = canvas.getContext("2d");
  g.fillStyle = pal.pv("blue-700").getStyle();
  g.fillRect(0, 0, 140, 96);
  g.fillStyle = pal.pv("yellow-500").getStyle();
  g.fillRect(0, 84, 140, 12);
  g.fillStyle = pal.pv("white").getStyle();
  g.textAlign = "center";
  g.font = `700 30px ${pal.font}`;
  g.fillText("SEMEC", 70, 56);
  return canvasTexture(canvas, false);
}

export function buildSemec(group, b, ctx) {
  const { pal, track, unitBox, onFrame } = ctx;
  const pv = pal.pv;
  const white = pv("white");
  const blue = pv("blue-700");
  const hw = b.w / 2 - 0.05;
  const hd = b.h / 2 - 0.05;

  const pavingTex = track(makePavingTexture(pal));
  const solarTex = track(makeSolarTexture(pal));
  const letterTex = track(makeLetteringTexture(pal));
  const totemTex = track(makeTotemTexture(pal));

  const warmLight = pal.mix(pv("yellow-400"), white, 0.55);
  const mats = {
    paving: track(std(white, { map: pavingTex })),
    curb: track(std(pal.mix(pv("gray-300"), pv("gray-200"), 0.4))),
    white: track(std(pal.mix(pv("gray-50"), white, 0.5), { roughness: 0.7 })),
    slab: track(std(pv("gray-100"), { roughness: 0.75 })),
    roof: track(std(pal.mix(pv("gray-300"), pv("gray-200"), 0.5))),
    stone: track(std(pal.mix(pv("gray-300"), pv("yellow-400"), 0.1), { roughness: 0.9 })),
    blue: track(std(blue, { roughness: 0.55 })),
    blueDark: track(std(pv("blue-900"), { roughness: 0.6 })),
    metal: track(std(pv("gray-400"), { roughness: 0.4, metalness: 0.5 })),
    dark: track(std(pv("gray-800"), { roughness: 0.6 })),
    glass: track(
      std(pal.mix(pv("blue-200"), white, 0.25), {
        roughness: 0.06,
        metalness: 0.1,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      })
    ),
    interior: track(std(warmLight, { emissive: warmLight, emissiveIntensity: 0.65 })),
    // Fundo do escritório do superior: mais claro, para ler bem sob a verga.
    officeWall: track(std(warmLight, { emissive: warmLight, emissiveIntensity: 0.85 })),
    interiorFloor: track(
      std(pal.mix(pv("gray-200"), pv("yellow-400"), 0.2), {
        emissive: pal.mix(pv("gray-200"), pv("yellow-400"), 0.2),
        emissiveIntensity: 0.3,
      })
    ),
    lobbyWall: track(std(pal.mix(blue, white, 0.15), { emissive: blue, emissiveIntensity: 0.25 })),
    wood: track(std(pal.mix(pv("yellow-800"), pv("yellow-400"), 0.4), { roughness: 0.7 })),
    lamp: track(new THREE.MeshBasicMaterial({ color: pal.mix(pv("yellow-400"), white, 0.8) })),
    glow: track(
      new THREE.MeshBasicMaterial({
        color: pal.mix(pv("yellow-400"), white, 0.6),
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    ),
    screen: track(new THREE.MeshBasicMaterial({ color: pal.mix(pv("blue-400"), white, 0.25) })),
    solar: track(std(white, { map: solarTex, roughness: 0.25, metalness: 0.35 })),
    soil: track(std(pal.mix(pv("yellow-800"), pv("gray-800"), 0.5))),
    leaves: track(std(pv("green-700"), { flatShading: true })),
    leavesLight: track(std(pal.mix(pv("green-600"), pv("green-500"), 0.4), { flatShading: true })),
    trunk: track(std(pv("yellow-800"))),
    lettering: track(std(white, { map: letterTex, transparent: true, roughness: 0.6 })),
    totem: track(std(white, { map: totemTex, roughness: 0.5 })),
  };

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  // Várias caixas iguais num único draw call.
  const instanced = (mat, list, opts = {}) => {
    const inst = new THREE.InstancedMesh(unitBox, mat, list.length);
    list.forEach(([x0, x1, y0, y1, z0, z1], i) => {
      pos.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      scl.set(x1 - x0, y1 - y0, z1 - z0);
      inst.setMatrixAt(i, m4.compose(pos, q, scl));
    });
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingBox();
    inst.computeBoundingSphere();
    if (opts.noShadow) inst.userData.noShadow = true;
    group.add(inst);
    return inst;
  };
  // Caixas soltas são agrupadas por material (e sombra) e viram um
  // InstancedMesh por grupo no fim: dezenas de peças em poucos draw calls.
  const boxQueue = new Map();
  const box = (mat, x0, x1, y0, y1, z0, z1, opts = {}) => {
    const key = `${mat.uuid}|${opts.noShadow ? 1 : 0}`;
    if (!boxQueue.has(key)) boxQueue.set(key, { mat, noShadow: !!opts.noShadow, list: [] });
    boxQueue.get(key).list.push([x0, x1, y0, y1, z0, z1]);
  };
  const flushBoxes = () => {
    for (const { mat, noShadow, list } of boxQueue.values()) instanced(mat, list, { noShadow });
    boxQueue.clear();
  };

  // ---- Dimensões principais -----------------------------------------------------
  const base = 0.05; // topo da praça
  const bx0 = -hw + 0.15;
  const bx1 = hw - 0.15;
  const bz0 = -hd + 0.2;
  const gz = 0.35; // vidro do térreo (recuado)
  const uz = 0.62; // fachada do pavimento superior (em balanço)
  const g1 = 1.02; // fundo da laje do pavimento superior
  const s1 = 1.18; // topo da laje (piso do superior)
  const winY0 = 1.28; // faixa de janelas do superior
  const winY1 = 1.78;
  const R = 1.92; // topo da cobertura
  const parTop = 2.02;
  const doorX0 = 0.02; // tile da porta: x local 0..1
  const doorX1 = 0.98;
  const doorMid = (doorX0 + doorX1) / 2;

  // ---- Praça e calçada --------------------------------------------------------------
  box(mats.paving, -hw, hw, 0, base, -hd, hd);
  pavingTex.repeat.set((2 * hw) / 0.8, (2 * hd) / 0.8);
  // Meio-fio na borda da praça, interrompido na saída para o caminho.
  box(mats.curb, -hw, doorX0 - 0.15, base, base + 0.025, hd - 0.06, hd);
  box(mats.curb, doorX1 + 0.15, hw, base, base + 0.025, hd - 0.06, hd);

  // ---- Térreo: embasamento em pedra nas pontas, vidro no meio ------------------
  // Núcleo dos fundos (atrás do hall).
  box(mats.white, bx0, bx1, base, g1, bz0, gz - 0.62);
  // Paredes de pedra nas extremidades, avançando até a linha do balanço.
  const stoneL1 = bx0 + 0.95;
  const stoneR0 = bx1 - 0.7;
  box(mats.stone, bx0, stoneL1, base, g1, gz - 0.62, uz);
  box(mats.stone, stoneR0, bx1, base, g1, gz - 0.62, uz);
  // Juntas horizontais na pedra (frisos escuros finos, à frente da face).
  const joints = [];
  for (const y of [0.3, 0.55, 0.8]) {
    joints.push([bx0, stoneL1, y, y + 0.012, uz, uz + 0.004]);
    joints.push([stoneR0, bx1, y, y + 0.012, uz, uz + 0.004]);
  }
  instanced(mats.curb, joints, { noShadow: true });

  // Hall iluminado (visível pelo vidro: só ~0,4 m de profundidade aparece).
  box(mats.interiorFloor, stoneL1, stoneR0, base, base + 0.012, gz - 0.62, gz, { noShadow: true });
  box(mats.interior, stoneL1, stoneR0, base, g1, gz - 0.64, gz - 0.6, { noShadow: true });
  // Painel azul atrás da recepção com a marca.
  box(mats.lobbyWall, -1.25, -0.2, 0.3, 0.9, gz - 0.6, gz - 0.57, { noShadow: true });
  const brand = new THREE.Mesh(track(new THREE.PlaneGeometry(0.62, 0.23)), mats.lettering);
  brand.position.set(-0.72, 0.62, gz - 0.565);
  brand.userData.noShadow = true;
  group.add(brand);
  // Balcão de recepção (madeira com tampo branco) colado ao vidro.
  box(mats.wood, -1.3, -0.25, base, 0.38, gz - 0.32, gz - 0.14);
  box(mats.white, -1.33, -0.22, 0.38, 0.41, gz - 0.34, gz - 0.12);
  box(mats.dark, -0.95, -0.7, 0.41, 0.55, gz - 0.28, gz - 0.26);
  box(mats.screen, -0.94, -0.71, 0.42, 0.54, gz - 0.258, gz - 0.255, { noShadow: true });
  // Vaso com planta no hall, à direita da porta.
  box(mats.dark, 1.3, 1.46, base, 0.28, gz - 0.3, gz - 0.14);
  const potPlant = new THREE.Mesh(track(new THREE.IcosahedronGeometry(0.15, 0)), mats.leavesLight);
  potPlant.position.set(1.38, 0.42, gz - 0.22);
  potPlant.scale.set(1, 1.3, 1);
  group.add(potPlant);
  // Painel de avisos / TV no hall à direita.
  box(mats.dark, 1.6, 2.05, 0.5, 0.78, gz - 0.58, gz - 0.55);
  box(mats.screen, 1.62, 2.03, 0.52, 0.76, gz - 0.55, gz - 0.545, { noShadow: true });
  // Luminárias pendentes.
  const pendants = [];
  const pendantLamps = [];
  for (const px of [-1.5, -0.6, 1.4, 2.0]) {
    pendants.push([px - 0.006, px + 0.006, 0.78, g1, gz - 0.22, gz - 0.21]);
    pendantLamps.push([px - 0.05, px + 0.05, 0.72, 0.78, gz - 0.26, gz - 0.17]);
  }
  instanced(mats.dark, pendants, { noShadow: true });
  instanced(mats.lamp, pendantLamps, { noShadow: true });

  // Vidro do térreo com caixilhos escuros finos.
  box(mats.glass, stoneL1, stoneR0, base, g1, gz - 0.02, gz, { noShadow: true });
  const mullions = [];
  for (const mx of [stoneL1 + 0.02, -0.75, doorX0 - 0.03, doorMid, doorX1 + 0.03, 1.7, stoneR0 - 0.02]) {
    mullions.push([mx - 0.018, mx + 0.018, base, g1, gz - 0.03, gz + 0.01]);
  }
  mullions.push([stoneL1, stoneR0, 0.86, 0.885, gz - 0.03, gz + 0.01]); // travessa (bandeira)
  instanced(mats.dark, mullions);

  // Teto do balanço (sob o pavimento superior) com spots embutidos.
  const soffitSpots = [];
  for (let sx = stoneL1 + 0.3; sx < stoneR0 - 0.1; sx += 0.55) {
    if (sx > doorX0 - 0.25 && sx < doorX1 + 0.25) continue;
    soffitSpots.push([sx - 0.04, sx + 0.04, g1 - 0.006, g1 - 0.001, (gz + uz) / 2 - 0.04, (gz + uz) / 2 + 0.04]);
  }
  instanced(mats.lamp, soffitSpots, { noShadow: true });

  // ---- Pavimento superior em balanço ----------------------------------------------
  // Laje inferior (faixa branca) e volume dos fundos.
  box(mats.white, bx0 - 0.05, bx1 + 0.05, g1, s1, bz0, uz + 0.02);
  box(mats.white, bx0, bx1, s1, R, bz0, uz - 0.5);
  // Bloco cego à esquerda (letreiro) e moldura da faixa de janelas.
  const blindX1 = bx0 + 1.7;
  box(mats.white, bx0 - 0.05, blindX1, s1, R, uz - 0.5, uz + 0.02);
  box(mats.white, blindX1, bx1 + 0.05, s1, winY0, uz - 0.5, uz + 0.02); // peitoril
  box(mats.white, blindX1, bx1 + 0.05, winY1, R, uz - 0.5, uz + 0.02); // verga
  box(mats.white, bx1 - 0.1, bx1 + 0.05, winY0, winY1, uz - 0.5, uz + 0.02); // lateral direita
  // Letreiro "SECRETARIA MUNICIPAL DE EDUCAÇÃO" no bloco cego.
  const sign = new THREE.Mesh(track(new THREE.PlaneGeometry(1.5, 0.5625)), mats.lettering);
  sign.position.set((bx0 + blindX1) / 2 - 0.04, (s1 + 2.05) / 2 + 0.02, uz + 0.024);
  sign.userData.noShadow = true;
  group.add(sign);

  // Faixa de janelas: interior do escritório colado ao vidro.
  const winX0 = blindX1;
  const winX1 = bx1 - 0.1;
  const glassZ = uz - 0.1;
  // O volume dos fundos termina em uz - 0,5 (= glassZ - 0,4): todo o interior
  // precisa ficar à frente dele, senão some dentro da parede. Piso fino 4 mm
  // acima do peitoril (sem z-fighting).
  box(mats.interiorFloor, winX0, winX1, winY0, winY0 + 0.004, glassZ - 0.4, glassZ - 0.016, { noShadow: true });
  box(mats.officeWall, winX0, winX1, winY0, winY1, glassZ - 0.396, glassZ - 0.37, { noShadow: true });
  // Estantes com livros e mesas com monitores (instanciados).
  const shelves = [];
  const books = [];
  const desks = [];
  const monitors = [];
  const screens = [];
  let k = 0;
  for (let x = winX0 + 0.15; x < winX1 - 0.3; x += 0.62, k++) {
    if (k % 2 === 0) {
      // Estante encostada no fundo.
      shelves.push([x, x + 0.42, winY0, winY0 + 0.36, glassZ - 0.37, glassZ - 0.27]);
      for (let row = 0; row < 2; row++) {
        let bx = x + 0.03;
        let n = 0;
        while (bx < x + 0.38) {
          const bw = 0.03 + ((n * 7 + row * 3 + k) % 3) * 0.008;
          const bh = 0.09 + ((n * 5 + row + k) % 4) * 0.012;
          const y0 = winY0 + 0.03 + row * 0.17;
          books.push([bx, bx + bw - 0.004, y0, y0 + bh, glassZ - 0.35, glassZ - 0.262]);
          bx += bw;
          n++;
        }
      }
    } else {
      // Mesa com monitor virado para fora.
      desks.push([x - 0.05, x + 0.47, winY0 + 0.1, winY0 + 0.13, glassZ - 0.3, glassZ - 0.08]);
      monitors.push([x + 0.1, x + 0.32, winY0 + 0.15, winY0 + 0.3, glassZ - 0.13, glassZ - 0.11]);
      screens.push([x + 0.11, x + 0.31, winY0 + 0.16, winY0 + 0.29, glassZ - 0.11, glassZ - 0.105]);
    }
  }
  instanced(mats.slab, shelves);
  const bookInst = instanced(mats.white, books, { noShadow: true });
  const bookColors = [pv("blue-700"), pv("red-500"), pv("yellow-500"), pv("green-600"), pv("blue-400"), pv("gray-100")];
  for (let i = 0; i < books.length; i++) bookInst.setColorAt(i, bookColors[(i * 5 + (i >> 2)) % bookColors.length]);
  if (bookInst.instanceColor) bookInst.instanceColor.needsUpdate = true;
  instanced(mats.white, desks);
  instanced(mats.dark, monitors, { noShadow: true });
  instanced(mats.screen, screens, { noShadow: true });
  // Luminária linear no teto, perto do vidro.
  box(mats.lamp, winX0 + 0.1, winX1 - 0.1, winY1 - 0.012, winY1, glassZ - 0.2, glassZ - 0.15, { noShadow: true });
  // Vidro e brises verticais brancos.
  box(mats.glass, winX0, winX1, winY0, winY1, glassZ - 0.015, glassZ, { noShadow: true });
  const fins = [];
  const finCount = Math.round((winX1 - winX0) / 0.34);
  for (let i = 1; i < finCount; i++) {
    const fx = winX0 + ((winX1 - winX0) * i) / finCount;
    fins.push([fx - 0.022, fx + 0.022, winY0, winY1, glassZ, uz + 0.015]);
  }
  instanced(mats.white, fins);

  // ---- Cobertura -----------------------------------------------------------------
  // Bloco do letreiro sobe um pouco acima do resto: quebra a caixa única e dá
  // hierarquia à fachada (teto ~2,2 por causa da fileira andável atrás).
  const tallTop = 2.12;
  const tallPar = 2.2;
  box(mats.white, bx0 - 0.05, blindX1, R, tallTop, bz0, uz + 0.02);
  const pt = 0.07;
  const rimL = [
    [bx0 - 0.05, blindX1, tallTop, tallPar, uz - pt + 0.02, uz + 0.02],
    [bx0 - 0.05, blindX1, tallTop, tallPar, bz0, bz0 + pt],
    [bx0 - 0.05, bx0 - 0.05 + pt, tallTop, tallPar, bz0, uz + 0.02],
    [blindX1 - pt, blindX1, tallTop, tallPar, bz0, uz + 0.02],
    // Platibanda do volume mais baixo (à direita).
    [blindX1, bx1 + 0.05, R, parTop, uz - pt + 0.02, uz + 0.02],
    [blindX1, bx1 + 0.05, R, parTop, bz0, bz0 + pt],
    [bx1 + 0.05 - pt, bx1 + 0.05, R, parTop, bz0, uz + 0.02],
  ];
  instanced(mats.white, rimL);
  box(mats.roof, bx0 + 0.02, blindX1 - pt, tallTop, tallTop + 0.008, bz0 + pt, uz - pt + 0.02, { noShadow: true });
  box(mats.roof, blindX1, bx1 + 0.05 - pt, R, R + 0.008, bz0 + pt, uz - pt + 0.02, { noShadow: true });
  // Claraboia e casa de máquinas no bloco alto.
  box(mats.slab, bx0 + 0.25, bx0 + 0.85, tallTop, tallTop + 0.06, bz0 + 0.3, bz0 + 0.95);
  box(mats.glass, bx0 + 0.3, bx0 + 0.8, tallTop + 0.06, tallTop + 0.075, bz0 + 0.35, bz0 + 0.9, { noShadow: true });
  box(mats.interior, bx0 + 0.3, bx0 + 0.8, tallTop + 0.055, tallTop + 0.06, bz0 + 0.35, bz0 + 0.9, { noShadow: true });
  box(mats.slab, bx0 + 1.05, blindX1 - 0.2, tallTop, tallTop + 0.08, bz0 + 0.2, bz0 + 0.6);
  // Friso azul institucional no topo da fachada (4 mm à frente: sem z-fighting).
  box(mats.blue, blindX1, bx1 + 0.05, R - 0.07, R - 0.01, uz + 0.024, uz + 0.05);
  box(mats.blue, bx0 - 0.05, blindX1, tallTop - 0.07, tallTop - 0.01, uz + 0.024, uz + 0.05);
  // Lâmina azul vertical na junção dos dois volumes, do térreo ao topo.
  box(mats.blue, blindX1 - 0.04, blindX1 + 0.08, s1 - 0.16, tallPar + 0.04, uz - 0.3, uz + 0.12);

  // Placas solares inclinadas para o sul (face para a câmera) no volume baixo.
  const solarRows = [bz0 + 0.42, bz0 + 1.02, bz0 + 1.62];
  const solarCols = [];
  for (let px = blindX1 + 0.45; px < bx1 - 0.3; px += 0.7) solarCols.push(px);
  const solar = new THREE.InstancedMesh(unitBox, mats.solar, solarRows.length * solarCols.length);
  const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.36);
  const solarLegs = [];
  let si = 0;
  for (const rz of solarRows) {
    for (const px of solarCols) {
      pos.set(px, R + 0.11, rz);
      scl.set(0.64, 0.025, 0.44);
      solar.setMatrixAt(si++, m4.compose(pos, tilt, scl));
      solarLegs.push([px - 0.24, px - 0.21, R, R + 0.15, rz - 0.14, rz - 0.11]);
      solarLegs.push([px + 0.21, px + 0.24, R, R + 0.15, rz - 0.14, rz - 0.11]);
    }
  }
  solar.instanceMatrix.needsUpdate = true;
  solar.computeBoundingBox();
  solar.computeBoundingSphere();
  group.add(solar);
  instanced(mats.metal, solarLegs);

  // ---- Pórtico azul da entrada --------------------------------------------------
  const pz0 = gz - 0.05;
  const pz1 = hd - 0.85; // avanço do pórtico sobre a praça
  const pTop = 1.34;
  const pBeam = 1.04;
  const pw = 0.13;
  box(mats.blue, doorX0 - 0.2 - pw, doorX0 - 0.2, base, pTop, pz0, pz1);
  box(mats.blue, doorX1 + 0.2, doorX1 + 0.2 + pw, base, pTop, pz0, pz1);
  box(mats.blue, doorX0 - 0.2 - pw, doorX1 + 0.2 + pw, pBeam, pTop, pz0, pz1);
  // Forro claro sob o pórtico, com spots.
  box(mats.slab, doorX0 - 0.2, doorX1 + 0.2, pBeam - 0.01, pBeam, pz0, pz1 - 0.02, { noShadow: true });
  const porchSpots = [];
  for (const sz of [uz + 0.15, pz1 - 0.15]) {
    for (const sx of [doorX0 + 0.12, doorX1 - 0.12]) {
      porchSpots.push([sx - 0.04, sx + 0.04, pBeam - 0.016, pBeam - 0.01, sz - 0.04, sz + 0.04]);
    }
  }
  instanced(mats.lamp, porchSpots, { noShadow: true });
  // Piso de granito escuro e degrau sob o pórtico.
  box(mats.slab, doorX0 - 0.2, doorX1 + 0.2, base, base + 0.02, gz, pz1, { noShadow: true });
  box(mats.curb, doorX0 - 0.2, doorX1 + 0.2, base, base + 0.015, pz1, pz1 + 0.18);
  // Portas de vidro automáticas com puxadores.
  box(mats.dark, doorMid - 0.02, doorMid + 0.02, base, 0.86, gz + 0.005, gz + 0.03);
  box(mats.metal, doorMid - 0.09, doorMid - 0.07, 0.36, 0.6, gz + 0.03, gz + 0.045);
  box(mats.metal, doorMid + 0.07, doorMid + 0.09, 0.36, 0.6, gz + 0.03, gz + 0.045);

  // ---- Praça: mastros, totem, jardineiras, banco e balizadores -----------------
  // Jardineira longa à esquerda (rente à pedra), com arbustos facetados.
  const shrubGeo = track(new THREE.IcosahedronGeometry(0.12, 0));
  const coneGeo = track(new THREE.OctahedronGeometry(0.12, 0));
  const planter = (x0, x1, z0, z1) => {
    box(mats.white, x0, x1, base, base + 0.14, z0, z1);
    box(mats.soil, x0 + 0.035, x1 - 0.035, base + 0.14, base + 0.145, z0 + 0.035, z1 - 0.035, { noShadow: true });
  };
  const shrub = (geo, mat, x, z, sx, sy) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, base + 0.15 + 0.1 * sy, z);
    m.scale.set(sx, sy, sx);
    m.rotation.y = x * 3.1 + z;
    group.add(m);
  };
  planter(bx0, stoneL1 - 0.05, uz + 0.06, uz + 0.36);
  for (let i = 0; i < 4; i++) {
    const x = bx0 + 0.13 + i * 0.22;
    shrub(i % 2 ? shrubGeo : coneGeo, i % 2 ? mats.leaves : mats.leavesLight, x, uz + 0.21, 1, i % 2 ? 1 : 1.6);
  }
  planter(stoneR0 + 0.05, bx1, uz + 0.06, uz + 0.36);
  for (let i = 0; i < 3; i++) {
    const x = stoneR0 + 0.17 + i * 0.2;
    shrub(i % 2 ? coneGeo : shrubGeo, i % 2 ? mats.leavesLight : mats.leaves, x, uz + 0.21, 0.95, i % 2 ? 1.5 : 1);
  }

  // Mastros com bandeiras (Brasil, Rondônia, SEMEC) à esquerda da praça.
  const poleGeo = track(new THREE.CylinderGeometry(0.018, 0.024, 1, 8));
  const knobGeo = track(new THREE.SphereGeometry(0.03, 8, 6));
  const poleTop = 1.85;
  const flagW = 0.42;
  const flagH = 0.28;
  const flagTexMakers = [makeBrazilFlag, makeRondoniaFlag, makeSemecFlag];
  const flags = [];
  const poleZ = hd - 0.55;
  const poleXs = [-hw + 0.35, -hw + 0.8, -hw + 1.25];
  // Base de granito para os três mastros.
  box(mats.curb, poleXs[0] - 0.16, poleXs[2] + 0.16, base, base + 0.035, poleZ - 0.16, poleZ + 0.16);
  poleXs.forEach((px, i) => {
    const pole = new THREE.Mesh(poleGeo, mats.metal);
    pole.scale.y = poleTop - base - (i === 1 ? 0 : 0.12);
    pole.position.set(px, base + pole.scale.y / 2, poleZ);
    group.add(pole);
    const knob = new THREE.Mesh(knobGeo, mats.metal);
    knob.position.set(px, base + pole.scale.y + 0.02, poleZ);
    group.add(knob);
    const geo = track(new THREE.PlaneGeometry(flagW, flagH, 10, 3));
    geo.translate(flagW / 2, 0, 0);
    const mat = track(
      new THREE.MeshStandardMaterial({
        map: track(flagTexMakers[i](pal)),
        roughness: 0.8,
        side: THREE.DoubleSide,
      })
    );
    const flag = new THREE.Mesh(geo, mat);
    flag.position.set(px + 0.02, base + pole.scale.y - flagH / 2 - 0.02, poleZ);
    group.add(flag);
    const p = geo.attributes.position;
    flags.push({ attr: p, base: Float32Array.from(p.array), phase: i * 1.7 });
  });
  // Ondulação da bandeira (desloca z dos vértices em função de x).
  const waveFlags = (t) => {
    for (const f of flags) {
      const arr = f.attr.array;
      for (let v = 0; v < arr.length; v += 3) {
        const x = f.base[v];
        const s = x / flagW;
        arr[v + 2] = Math.sin(x * 14 - t * 4 + f.phase) * 0.035 * s;
        arr[v + 1] = f.base[v + 1] - s * s * 0.03;
      }
      f.attr.needsUpdate = true;
    }
  };
  waveFlags(0.6); // pose estática (prefers-reduced-motion)

  // Totem institucional à direita da praça.
  const totemX = hw - 0.42;
  const totemZ = hd - 0.4;
  box(mats.blueDark, totemX - 0.2, totemX + 0.2, base, base + 0.04, totemZ - 0.08, totemZ + 0.08);
  box(mats.blue, totemX - 0.16, totemX + 0.16, base + 0.04, base + 0.98, totemZ - 0.05, totemZ + 0.05);
  const totemFace = new THREE.Mesh(track(new THREE.PlaneGeometry(0.3, 0.9)), mats.totem);
  totemFace.position.set(totemX, base + 0.51, totemZ + 0.054);
  group.add(totemFace);

  // Árvore em canteiro redondo e banco de madeira à direita do caminho.
  const treeX = doorX1 + 0.85;
  const treeZ = hd - 0.48;
  const ring = new THREE.Mesh(track(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16)), mats.white);
  ring.position.set(treeX, base + 0.05, treeZ);
  group.add(ring);
  const ringSoil = new THREE.Mesh(track(new THREE.CylinderGeometry(0.205, 0.205, 0.01, 16)), mats.soil);
  ringSoil.position.set(treeX, base + 0.102, treeZ);
  ringSoil.userData.noShadow = true;
  group.add(ringSoil);
  const trunk = new THREE.Mesh(track(new THREE.CylinderGeometry(0.03, 0.045, 0.7, 6)), mats.trunk);
  trunk.position.set(treeX, base + 0.45, treeZ);
  group.add(trunk);
  const crownGeo = track(new THREE.IcosahedronGeometry(0.3, 0));
  for (const [dx, dy, dz, s, mat] of [
    [0, 0.98, 0, 1, mats.leaves],
    [0.14, 1.12, 0.05, 0.7, mats.leavesLight],
    [-0.12, 1.1, -0.04, 0.65, mats.leavesLight],
  ]) {
    const crown = new THREE.Mesh(crownGeo, mat);
    crown.position.set(treeX + dx, base + dy, treeZ + dz);
    crown.scale.setScalar(s);
    crown.rotation.set(dx * 4, dy * 2, dz * 3);
    group.add(crown);
  }
  // Banco: tampo de madeira sobre dois pés de concreto.
  const benchX0 = doorX1 + 0.32;
  const benchX1 = benchX0 + 0.5;
  const benchZ = hd - 0.14;
  box(mats.curb, benchX0 + 0.04, benchX0 + 0.1, base, base + 0.13, benchZ - 0.08, benchZ + 0.04);
  box(mats.curb, benchX1 - 0.1, benchX1 - 0.04, base, base + 0.13, benchZ - 0.08, benchZ + 0.04);
  box(mats.wood, benchX0, benchX1, base + 0.13, base + 0.165, benchZ - 0.1, benchZ + 0.06);

  // Balizadores de luz ladeando a saída do caminho.
  const bollardGeo = track(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10));
  const bollardCapGeo = track(new THREE.CylinderGeometry(0.038, 0.038, 0.03, 10));
  for (const bx of [doorX0 - 0.12, doorX1 + 0.12]) {
    const bz = hd - 0.15;
    const post = new THREE.Mesh(bollardGeo, mats.dark);
    post.position.set(bx, base + 0.11, bz);
    group.add(post);
    const cap = new THREE.Mesh(bollardCapGeo, mats.lamp);
    cap.position.set(bx, base + 0.18, bz);
    cap.userData.noShadow = true;
    group.add(cap);
  }
  // Brilho suave dos spots no pé da pedra (planos aditivos, sem sombra).
  const glowGeo = track(new THREE.PlaneGeometry(0.2, 0.55));
  for (const gx of [bx0 + 0.3, stoneL1 - 0.25, stoneR0 + 0.25, bx1 - 0.25]) {
    const gl = new THREE.Mesh(glowGeo, mats.glow);
    gl.position.set(gx, base + 0.3, uz + 0.006);
    gl.userData.noShadow = true;
    group.add(gl);
  }

  flushBoxes();

  // ---- Animação: bandeiras tremulando ------------------------------------------
  onFrame((t) => waveFlags(t));

  return {
    labelPos: new THREE.Vector3(doorMid, (pBeam + pTop) / 2, pz1 + 0.006),
    labelBg: blue,
  };
}
