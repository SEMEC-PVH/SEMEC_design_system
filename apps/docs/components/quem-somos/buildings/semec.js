// Sede da SEMFAZ (Secretaria Municipal de Economia), inspirada no prédio real
// da Av. Sete de Setembro, 744 (Porto Velho): marquise branca larga em
// balanço com o letreiro por extenso, térreo de vidro escuro recuado com
// escada central entre dois blocos brancos e acesso à garagem à direita. Sobre
// a laje da marquise (terraço com guarda-corpo de vidro e mastros de bandeira),
// recuada, a torre de pele de vidro azul espelhado em dois volumes: o da
// esquerda mais alto e com a quina chanfrada, o da direita mais baixo, apoiado
// numa faixa branca. Ipê-amarelo na calçada. Ver contrato em ./shared.js.
// Coordenadas locais: centro do footprint na origem, fachada em +z.
//
// A torre passa de 3 m: a fileira atrás do prédio (y = 2) é floresta no mapa
// (vila-engine.js, buildMap), senão o jogador sumiria atrás dela na câmera alta.

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

// Calçada: placas de concreto claro com juntas finas.
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

// Pele de vidro: 2×2 painéis por ladrilho (0,5 m), cada um com o céu
// refletido em gradiente e tons levemente diferentes, caixilhos claros.
function makeCurtainWallTexture(pal) {
  const canvas = makeCanvas(128, 128);
  const g = canvas.getContext("2d");
  const pv = pal.pv;
  const tones = [
    [pv("blue-200"), pv("blue-500")],
    [pv("blue-300"), pv("blue-600")],
    [pv("blue-300"), pv("blue-500")],
    [pv("blue-100"), pv("blue-400")],
  ];
  tones.forEach(([top, bottom], i) => {
    const x = (i % 2) * 64;
    const y = (i >> 1) * 64;
    const grad = g.createLinearGradient(x, y, x + 24, y + 64);
    grad.addColorStop(0, top.getStyle());
    grad.addColorStop(1, bottom.getStyle());
    g.fillStyle = grad;
    g.fillRect(x, y, 64, 64);
    // Reflexo diagonal claro.
    g.fillStyle = pal.mix(pv("white"), top, 0.4).getStyle();
    g.globalAlpha = 0.35;
    g.beginPath();
    g.moveTo(x + 10, y + 64);
    g.lineTo(x + 26, y + 64);
    g.lineTo(x + 58, y);
    g.lineTo(x + 42, y);
    g.closePath();
    g.fill();
    g.globalAlpha = 1;
  });
  // Caixilhos: linhas nas bordas e no meio (bordas com metade da largura,
  // para o ladrilho emendar sem costura).
  g.fillStyle = pal.mix(pv("gray-200"), pv("blue-100"), 0.4).getStyle();
  for (const [x, w] of [[0, 2], [62, 4], [126, 2]]) {
    g.fillRect(x, 0, w, 128);
    g.fillRect(0, x, 128, w);
  }
  return canvasTexture(canvas, true);
}

// Letreiro da marquise: brasão redondo + nome por extenso, fundo transparente.
function makeLetteringTexture(pal) {
  const W = 2048;
  const H = 110;
  const canvas = makeCanvas(W, H);
  const g = canvas.getContext("2d");
  const font = pal.font;
  // Brasão: anel dourado, miolo azul com "S" branco.
  g.fillStyle = pal.pv("yellow-500").getStyle();
  g.beginPath();
  g.arc(56, H / 2, 48, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = pal.pv("blue-700").getStyle();
  g.beginPath();
  g.arc(56, H / 2, 36, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = pal.pv("white").getStyle();
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `700 48px ${font}`;
  g.fillText("S", 56, H / 2 + 2);
  // Nome em letras caixa-alta grafite (reduz a fonte até caber).
  const text = "SECRETARIA MUNICIPAL DE ECONOMIA - SEMFAZ";
  const x0 = 130;
  const maxW = W - x0 - 16;
  let size = 76;
  g.font = `600 ${size}px ${font}`;
  while (g.measureText(text).width > maxW && size > 30) {
    size -= 2;
    g.font = `600 ${size}px ${font}`;
  }
  g.textAlign = "left";
  g.fillStyle = pal.pv("gray-600").getStyle();
  g.fillText(text, x0, H / 2 + 4);
  return { tex: canvasTexture(canvas, false), aspect: W / H };
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

// Bandeira institucional da SEMFAZ (azul com marca branca).
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
  g.fillText("SEMFAZ", 70, 56);
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
  const curtainTex = track(makeCurtainWallTexture(pal));
  // UV das paredes da torre em metros (ExtrudeGeometry): 1 ladrilho = 0,5 m.
  curtainTex.repeat.set(2, 2);
  const lettering = makeLetteringTexture(pal);
  track(lettering.tex);

  const warmLight = pal.mix(pv("yellow-400"), white, 0.55);
  const mats = {
    paving: track(std(white, { map: pavingTex })),
    curb: track(std(pal.mix(pv("gray-300"), pv("gray-200"), 0.4))),
    white: track(std(pal.mix(pv("gray-50"), white, 0.5), { roughness: 0.7 })),
    slab: track(std(pv("gray-200"), { roughness: 0.75 })),
    roof: track(std(pal.mix(pv("gray-300"), pv("gray-200"), 0.5))),
    metal: track(std(pv("gray-400"), { roughness: 0.4, metalness: 0.5 })),
    dark: track(std(pv("gray-800"), { roughness: 0.6 })),
    garage: track(std(pv("gray-900"), { roughness: 0.9 })),
    // Vidro fumê do térreo: escuro, mas deixa ver o hall iluminado.
    shopGlass: track(
      std(pv("gray-700"), {
        roughness: 0.08,
        metalness: 0.2,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    ),
    railGlass: track(
      std(pal.mix(pv("blue-200"), white, 0.4), {
        roughness: 0.06,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      })
    ),
    curtain: track(
      std(white, {
        map: curtainTex,
        roughness: 0.18,
        metalness: 0.35,
        emissive: pv("blue-300"),
        emissiveIntensity: 0.12,
      })
    ),
    interior: track(std(warmLight, { emissive: warmLight, emissiveIntensity: 0.65 })),
    interiorFloor: track(
      std(pal.mix(pv("gray-200"), pv("yellow-400"), 0.2), {
        emissive: pal.mix(pv("gray-200"), pv("yellow-400"), 0.2),
        emissiveIntensity: 0.3,
      })
    ),
    wood: track(std(pal.mix(pv("yellow-800"), pv("yellow-400"), 0.4), { roughness: 0.7 })),
    lamp: track(new THREE.MeshBasicMaterial({ color: pal.mix(pv("yellow-400"), white, 0.8) })),
    screen: track(new THREE.MeshBasicMaterial({ color: pal.mix(pv("blue-400"), white, 0.25) })),
    soil: track(std(pal.mix(pv("yellow-800"), pv("gray-800"), 0.5))),
    ipe: track(std(pv("yellow-400"), { flatShading: true })),
    ipeDeep: track(std(pv("yellow-500"), { flatShading: true })),
    trunk: track(std(pal.mix(pv("yellow-800"), pv("gray-700"), 0.4))),
    lettering: track(std(white, { map: lettering.tex, transparent: true, roughness: 0.6 })),
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
  // Prisma vertical a partir da planta [[x, z], ...] (y0..y1): laterais com a
  // pele de vidro (UV em metros), topo e fundo com `capMat`.
  const prism = (plan, y0, y1, sideMat, capMat) => {
    const shape = new THREE.Shape(plan.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = track(new THREE.ExtrudeGeometry(shape, { depth: y1 - y0, bevelEnabled: false }));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, y0, 0);
    const mesh = new THREE.Mesh(geo, [capMat, sideMat]);
    group.add(mesh);
    return mesh;
  };

  // ---- Dimensões principais -----------------------------------------------------
  const base = 0.05; // topo da calçada
  const bx0 = -hw + 0.1;
  const bx1 = hw - 0.1;
  const bz0 = -hd + 0.2;
  const gz = 0.5; // vidro do térreo (recuado sob a marquise)
  const fz = 0.85; // face da marquise
  const cb = 1.1; // fundo da marquise
  const ct = 1.45; // topo da marquise = piso do terraço
  const hallZ = gz - 0.35; // fundo do hall visível pelo vidro
  const doorX0 = 0.02; // tile da porta: x local 0..1
  const doorX1 = 0.98;
  const doorMid = (doorX0 + doorX1) / 2;
  const steps = 4;
  const stepH = 0.05;
  const stepD = 0.12;
  const hallFloor = base + steps * stepH; // hall elevado: a escada sobe até ele
  const wallL1 = bx0 + 0.12; // pilar fino à esquerda
  const wallR0 = bx1 - 0.32; // pilar largo à direita
  const garageX0 = wallR0 - 0.75; // portão da garagem
  // Torre: planta em x/z.
  const tM = 0.15; // divisa entre os dois volumes
  const tL0 = -2.15;
  const tChamfer = -0.55; // início do chanfro na face do volume alto
  const zL = 0.3; // face do volume alto (esquerda)
  const zR = -0.25; // face do volume baixo (direita)
  const tR1 = wallR0 - 0.05;
  const bandTop = 1.8; // faixa branca sob o volume baixo
  const topL = 3.45;
  const topR = 2.9;

  // ---- Calçada ------------------------------------------------------------------
  box(mats.paving, -hw, hw, 0, base, -hd, hd);
  pavingTex.repeat.set((2 * hw) / 0.8, (2 * hd) / 0.8);
  // Meio-fio na borda, interrompido na saída para o caminho.
  box(mats.curb, -hw, doorX0 - 0.15, base, base + 0.025, hd - 0.06, hd);
  box(mats.curb, doorX1 + 0.15, hw, base, base + 0.025, hd - 0.06, hd);

  // ---- Térreo -------------------------------------------------------------------
  // Núcleo dos fundos e pilares das pontas, até a face da marquise.
  box(mats.white, bx0, bx1, base, cb, bz0, hallZ - 0.02);
  box(mats.white, bx0, wallL1, base, cb, hallZ - 0.02, fz);
  box(mats.white, wallR0, bx1, base, cb, hallZ - 0.02, fz);

  // Hall elevado e iluminado atrás do vidro.
  box(mats.interiorFloor, wallL1, garageX0, base, hallFloor, hallZ, gz, { noShadow: true });
  box(mats.interior, wallL1, garageX0, hallFloor, cb, hallZ - 0.02, hallZ, { noShadow: true });
  // Balcão de atendimento com monitor, à esquerda da porta.
  box(mats.wood, -1.55, -0.55, hallFloor, hallFloor + 0.3, hallZ + 0.08, hallZ + 0.22);
  box(mats.white, -1.58, -0.52, hallFloor + 0.3, hallFloor + 0.33, hallZ + 0.06, hallZ + 0.24);
  box(mats.dark, -1.2, -0.95, hallFloor + 0.33, hallFloor + 0.47, hallZ + 0.12, hallZ + 0.14);
  box(mats.screen, -1.19, -0.96, hallFloor + 0.34, hallFloor + 0.46, hallZ + 0.14, hallZ + 0.145, { noShadow: true });
  // Painel de senhas / TV no hall à direita.
  box(mats.dark, 1.2, 1.6, 0.5, 0.75, hallZ, hallZ + 0.03);
  box(mats.screen, 1.22, 1.58, 0.52, 0.73, hallZ + 0.03, hallZ + 0.035, { noShadow: true });

  // Vidro fumê do térreo com caixilhos escuros.
  box(mats.shopGlass, wallL1, garageX0, base, cb, gz - 0.02, gz, { noShadow: true });
  const mullions = [];
  for (const mx of [wallL1 + 0.5, -1.6, -1.0, -0.45, doorX0 - 0.03, doorMid, doorX1 + 0.03, 1.55, garageX0 - 0.02]) {
    mullions.push([mx - 0.016, mx + 0.016, base, cb, gz - 0.03, gz + 0.01]);
  }
  mullions.push([wallL1, garageX0, 0.88, 0.9, gz - 0.03, gz + 0.01]); // travessa
  instanced(mats.dark, mullions);
  // Portas de vidro com puxadores, no alto da escada.
  box(mats.metal, doorMid - 0.09, doorMid - 0.07, hallFloor + 0.2, hallFloor + 0.45, gz + 0.01, gz + 0.025);
  box(mats.metal, doorMid + 0.07, doorMid + 0.09, hallFloor + 0.2, hallFloor + 0.45, gz + 0.01, gz + 0.025);

  // Garagem à direita: vão escuro com rampa descendo e portão aberto.
  box(mats.garage, garageX0, wallR0, base, cb, hallZ - 0.02, gz - 0.1);
  box(mats.dark, garageX0, wallR0, cb - 0.12, cb, gz - 0.1, gz);
  box(mats.curb, garageX0 + 0.04, wallR0, 0, base + 0.004, gz - 0.1, hd - 0.06, { noShadow: true });
  const gateBars = [];
  for (let gx = garageX0 + 0.08; gx < wallR0 - 0.02; gx += 0.1) {
    gateBars.push([gx - 0.008, gx + 0.008, cb - 0.12, cb - 0.04, gz - 0.02, gz - 0.005]);
  }
  instanced(mats.metal, gateBars, { noShadow: true });
  // Guarda-corpo metálico na lateral da rampa.
  box(mats.metal, garageX0 - 0.02, garageX0 + 0.02, base, base + 0.32, gz, fz + 0.3);
  box(mats.metal, garageX0 - 0.02, garageX0 + 0.02, base + 0.3, base + 0.33, gz, fz + 0.3);

  // Escada central de granito, saindo da linha da marquise até o hall.
  for (let i = 0; i < steps; i++) {
    box(mats.slab, doorX0 - 0.05, doorX1 + 0.05, base, base + stepH * (i + 1), gz, gz + stepD * (steps - i));
  }
  // Corrimãos metálicos nas bordas da escada.
  for (const rx of [doorX0 - 0.02, doorX1 + 0.02]) {
    box(mats.metal, rx - 0.01, rx + 0.01, base, base + 0.42, gz + stepD * steps - 0.03, gz + stepD * steps - 0.01);
    box(mats.metal, rx - 0.012, rx + 0.012, base + 0.4, base + 0.43, gz, gz + stepD * steps - 0.01);
  }
  // Blocos brancos ladeando a escada (mureta/floreira na calçada).
  box(mats.white, doorX0 - 0.7, doorX0 - 0.08, base, 0.52, gz + 0.25, fz + 0.12);
  box(mats.white, doorX1 + 0.08, doorX1 + 0.7, base, 0.52, gz + 0.25, fz + 0.12);

  // ---- Marquise ------------------------------------------------------------------
  box(mats.white, bx0 - 0.05, bx1 + 0.05, cb, ct, bz0, fz);
  // Spots embutidos no forro.
  const spots = [];
  for (let sx = wallL1 + 0.25; sx < wallR0 - 0.1; sx += 0.5) {
    spots.push([sx - 0.035, sx + 0.035, cb - 0.006, cb - 0.001, (gz + fz) / 2 - 0.035, (gz + fz) / 2 + 0.035]);
  }
  instanced(mats.lamp, spots, { noShadow: true });
  // Letreiro por extenso na face da marquise (à direita do ipê).
  const signX0 = -2.15;
  const signX1 = bx1 - 0.05;
  const signW = signX1 - signX0;
  const sign = new THREE.Mesh(track(new THREE.PlaneGeometry(signW, signW / lettering.aspect)), mats.lettering);
  sign.position.set((signX0 + signX1) / 2, (cb + ct) / 2, fz + 0.004);
  sign.userData.noShadow = true;
  group.add(sign);

  // Terraço sobre a marquise, com guarda-corpo de vidro na frente e nas pontas.
  box(mats.roof, bx0, bx1, ct, ct + 0.006, bz0, fz - 0.04, { noShadow: true });
  const railH = 0.15;
  const railZ = fz - 0.04;
  box(mats.railGlass, bx0 - 0.03, bx1 + 0.03, ct, ct + railH, railZ, railZ + 0.015, { noShadow: true });
  box(mats.railGlass, bx0 - 0.03, bx0 - 0.015, ct, ct + railH, zL, railZ, { noShadow: true });
  box(mats.railGlass, bx1 + 0.015, bx1 + 0.03, ct, ct + railH, zR, railZ, { noShadow: true });
  box(mats.metal, bx0 - 0.04, bx1 + 0.04, ct + railH, ct + railH + 0.018, railZ - 0.005, railZ + 0.02);
  box(mats.metal, bx0 - 0.04, bx0 - 0.01, ct + railH, ct + railH + 0.018, zL, railZ);
  box(mats.metal, bx1 + 0.01, bx1 + 0.04, ct + railH, ct + railH + 0.018, zR, railZ);

  // ---- Torre de vidro ------------------------------------------------------------
  // Volume alto à esquerda: quina frontal direita chanfrada até a face do baixo.
  prism(
    [[tL0, bz0], [tL0, zL], [tChamfer, zL], [tM, zR], [tM, bz0]],
    ct,
    topL,
    mats.curtain,
    mats.roof
  );
  // Volume baixo à direita, sobre a faixa branca que avança um pouco.
  box(mats.white, tM, tR1 + 0.03, ct, bandTop, bz0, zR + 0.05);
  prism([[tM, bz0], [tM, zR], [tR1, zR], [tR1, bz0]], bandTop, topR, mats.curtain, mats.roof);
  // Arremate branco no topo dos dois volumes.
  const copings = [
    [tL0 - 0.02, tChamfer, topL, topL + 0.05, zL - 0.04, zL + 0.02],
    [tL0 - 0.02, tL0 + 0.04, topL, topL + 0.05, bz0, zL + 0.02],
    [tM - 0.02, tR1 + 0.02, topR, topR + 0.05, zR - 0.04, zR + 0.02],
    [tR1 - 0.04, tR1 + 0.02, topR, topR + 0.05, bz0, zR + 0.02],
  ];
  instanced(mats.white, copings);
  // Casa de máquinas no volume baixo.
  box(mats.white, tR1 - 0.9, tR1 - 0.2, topR, topR + 0.22, bz0 + 0.15, bz0 + 0.75);
  box(mats.dark, tR1 - 0.75, tR1 - 0.35, topR + 0.06, topR + 0.18, bz0 + 0.75, bz0 + 0.76, { noShadow: true });

  // ---- Mastros com bandeiras no terraço, à frente do volume alto ------------------
  const poleGeo = track(new THREE.CylinderGeometry(0.016, 0.022, 1, 8));
  const knobGeo = track(new THREE.SphereGeometry(0.028, 8, 6));
  const poleTop = ct + 1.2;
  const flagW = 0.38;
  const flagH = 0.25;
  const flagTexMakers = [makeBrazilFlag, makeRondoniaFlag, makeSemecFlag];
  const flags = [];
  const poleZ = (zL + railZ) / 2;
  const poleXs = [-2.0, -1.62, -1.24];
  poleXs.forEach((px, i) => {
    const pole = new THREE.Mesh(poleGeo, mats.metal);
    pole.scale.y = poleTop - ct - (i === 1 ? 0 : 0.1);
    pole.position.set(px, ct + pole.scale.y / 2, poleZ);
    group.add(pole);
    const knob = new THREE.Mesh(knobGeo, mats.metal);
    knob.position.set(px, ct + pole.scale.y + 0.02, poleZ);
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
    flag.position.set(px + 0.02, ct + pole.scale.y - flagH / 2 - 0.02, poleZ);
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
        arr[v + 2] = Math.sin(x * 14 - t * 4 + f.phase) * 0.03 * s;
        arr[v + 1] = f.base[v + 1] - s * s * 0.03;
      }
      f.attr.needsUpdate = true;
    }
  };
  waveFlags(0.6); // pose estática (prefers-reduced-motion)

  // ---- Ipê-amarelo em floreira de madeira, na calçada à esquerda -----------------
  const ipeX = bx0 + 0.32;
  const ipeZ = hd - 0.42;
  box(mats.wood, ipeX - 0.22, ipeX + 0.22, base, base + 0.26, ipeZ - 0.22, ipeZ + 0.22);
  box(mats.soil, ipeX - 0.18, ipeX + 0.18, base + 0.26, base + 0.265, ipeZ - 0.18, ipeZ + 0.18, { noShadow: true });
  const trunk = new THREE.Mesh(track(new THREE.CylinderGeometry(0.025, 0.04, 0.8, 6)), mats.trunk);
  trunk.position.set(ipeX, base + 0.6, ipeZ);
  trunk.rotation.z = 0.08;
  group.add(trunk);
  const crownGeo = track(new THREE.IcosahedronGeometry(0.22, 0));
  for (const [dx, dy, dz, s, mat] of [
    [0, 1.2, 0, 1, mats.ipe],
    [0.18, 1.08, 0.06, 0.75, mats.ipeDeep],
    [-0.16, 1.1, -0.05, 0.7, mats.ipe],
    [0.04, 1.36, -0.04, 0.6, mats.ipeDeep],
  ]) {
    const crown = new THREE.Mesh(crownGeo, mat);
    crown.position.set(ipeX + dx, base + dy, ipeZ + dz);
    crown.scale.setScalar(s);
    crown.rotation.set(dx * 4, dy * 2, dz * 3);
    group.add(crown);
  }
  // Flores caídas na terra da floreira.
  const petalGeo = track(new THREE.IcosahedronGeometry(0.03, 0));
  for (const [dx, dz] of [[-0.1, 0.08], [0.09, -0.06], [0.12, 0.11], [-0.05, -0.12]]) {
    const petal = new THREE.Mesh(petalGeo, mats.ipe);
    petal.position.set(ipeX + dx, base + 0.275, ipeZ + dz);
    petal.scale.y = 0.4;
    petal.userData.noShadow = true;
    group.add(petal);
  }

  flushBoxes();

  // ---- Animação: bandeiras tremulando ------------------------------------------
  onFrame((t) => waveFlags(t));

  // Placa "SEMFAZ" do motor na faixa branca sob o volume baixo.
  return {
    labelPos: new THREE.Vector3((tM + tR1) / 2, (ct + bandTop) / 2, zR + 0.056),
    labelBg: blue,
  };
}
