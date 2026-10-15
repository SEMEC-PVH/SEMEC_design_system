// Galeria da Equipe: os quadros com os retratos da equipe nas paredes.
//
// Cada quadro: moldura de museu dourada (perfil em degraus com bisel, rosetas
// nos cantos e concha no topo), passe-partout creme, tela pintada com o
// retrato (fundo de pinceladas numa cor por pessoa + busto composto no canvas,
// textura opaca), placa de latão com nome e cargo e uma luminária de quadro
// em cima. Nada no chão: os tiles `ver` ficam livres para o jogador.
//
// Coordenadas locais de cada quadro: origem no centro da moldura, no plano da
// face da parede; +z aponta para dentro da sala (o `normal` do slot).

import * as THREE from "three";
import { QUADRO, SLOTS, centroQuadro } from "./layout";

// Medidas da moldura (metade da largura/altura de cada contorno).
const MW2 = QUADRO.largura / 2; // 0,65
const MH2 = QUADRO.altura / 2; // 0,80
const ARO1 = 0.09; // moldura externa (a mais alta)
const ARO2 = 0.06; // degrau interno
const ARO3 = 0.015; // filete junto da pintura
const ABERTURA = { w2: MW2 - ARO1 - ARO2 - ARO3, h2: MH2 - ARO1 - ARO2 - ARO3 };
const PASSE = 0.065; // largura do passe-partout
const TELA = { w: (ABERTURA.w2 - PASSE) * 2, h: (ABERTURA.h2 - PASSE) * 2 };
const TELA_Z = 0.058; // superfície da tela (à frente da parede)
const PLACA = { w: 0.92, h: 0.27, y: -MH2 - 0.24 };

// Tela em pixels (mesma proporção da tela 3D).
const TELA_PX = { w: 512, h: Math.round((512 * TELA.h) / TELA.w) };
const PLACA_PX = { w: 1024, h: Math.round((1024 * PLACA.h) / PLACA.w) };

// Cor de fundo de cada pintura (tokens), na ordem dos slots.
const FUNDOS = ["blue-300", "green-500", "red-300", "yellow-400", "blue-500", "red-400", "green-600", "blue-200"];

// Brilho (emissive) de cada parte: em repouso, perto e em destaque.
const BRILHO = {
  tela: [0.14, 0.2, 0.42],
  moldura: [0, 0.04, 0.22],
  placa: [0.06, 0.4, 0.3],
  lampada: [0.7, 1.3, 1.6],
};

// Aleatório determinístico (mesmo quadro sempre com as mesmas pinceladas).
function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

// Cor da paleta como string de canvas, com transparência opcional (gerada em
// runtime a partir dos tokens).
// (THREE.Color guarda em linear; getRGB/getHexString já devolvem sRGB.)
const _rgb = { r: 0, g: 0, b: 0 };
function css(c, a = 1) {
  if (a >= 1) return `#${c.getHexString()}`;
  c.getRGB(_rgb, THREE.SRGBColorSpace);
  const [r, g, b] = [_rgb.r, _rgb.g, _rgb.b].map((v) => Math.round(v * 255));
  return `rgb(${r} ${g} ${b} / ${a})`;
}

function canvasTex(canvas, lite) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = lite ? 2 : 8;
  return tex;
}

// ---- Tela pintada ---------------------------------------------------------

// Fundo de pinceladas + halo atrás da cabeça. Devolve as cores usadas.
function pintarFundo(ctx, cor, pal, seed) {
  const { w, h } = TELA_PX;
  const rand = rng(seed);
  const escuro = pal.mix(cor, pal.pv("gray-950"), 0.5);
  const claro = pal.mix(cor, pal.white, 0.45);
  const meio = cor;
  const g = ctx.createLinearGradient(0, 0, w * 0.3, h);
  g.addColorStop(0, css(claro));
  g.addColorStop(0.55, css(meio));
  g.addColorStop(1, css(escuro));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Pinceladas curtas e diagonais, claras e escuras.
  ctx.lineCap = "round";
  for (let i = 0; i < 140; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const k = rand();
    const c = k < 0.5 ? pal.mix(cor, pal.white, 0.2 + k) : pal.mix(cor, pal.pv("gray-950"), (k - 0.5) * 0.9);
    ctx.strokeStyle = css(c, 0.08 + rand() * 0.14);
    ctx.lineWidth = 8 + rand() * 26;
    const ang = -0.9 + rand() * 0.5;
    const len = 30 + rand() * 90;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(ang) * len * 0.5 + (rand() - 0.5) * 20,
      y + Math.sin(ang) * len * 0.5 + (rand() - 0.5) * 20,
      x + Math.cos(ang) * len,
      y + Math.sin(ang) * len,
    );
    ctx.stroke();
  }
  // Halo de luz atrás da cabeça.
  const halo = ctx.createRadialGradient(w / 2, h * 0.36, 10, w / 2, h * 0.36, w * 0.62);
  const luz = pal.mix(cor, pal.white, 0.7);
  halo.addColorStop(0, css(luz, 0.75));
  halo.addColorStop(1, css(luz, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  return { escuro, claro, meio };
}

// Acabamento de pintura sobre tudo: trama de tela e sombra nas bordas.
function acabamento(ctx, pal, seed, escuro) {
  const { w, h } = TELA_PX;
  const rand = rng(seed ^ 20973);
  const branco = pal.white;
  ctx.lineWidth = 1;
  for (let i = 0; i < 120; i++) {
    const y = rand() * h;
    ctx.strokeStyle = css(rand() < 0.5 ? branco : escuro, 0.018);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + (rand() - 0.5) * 6);
    ctx.stroke();
  }
  const vin = ctx.createRadialGradient(w / 2, h * 0.45, w * 0.35, w / 2, h * 0.5, h * 0.75);
  vin.addColorStop(0, css(escuro, 0));
  vin.addColorStop(1, css(escuro, 0.55));
  ctx.fillStyle = vin;
  ctx.fillRect(0, 0, w, h);
}

// Sem retrato: silhueta de busto com "?" (ex.: imagem ainda não existe).
function silhueta(ctx, cores, font) {
  const { w, h } = TELA_PX;
  ctx.fillStyle = css(cores.escuro, 0.85);
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.42, w * 0.2, w * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h);
  ctx.bezierCurveTo(w * 0.1, h * 0.7, w * 0.3, h * 0.66, w / 2, h * 0.66);
  ctx.bezierCurveTo(w * 0.7, h * 0.66, w * 0.9, h * 0.7, w * 0.92, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = css(cores.claro);
  ctx.font = `700 ${Math.round(w * 0.3)}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", w / 2, h * 0.43);
}

// Monta a tela; `img` (busto de fundo transparente) é composto no canvas,
// então a textura final é opaca: nada de franja nem plano translúcido.
function desenharTela(canvas, q, i, pal, img) {
  const ctx = canvas.getContext("2d");
  const { w, h } = TELA_PX;
  const seed = hash(q.id);
  const cor = pal.pv(FUNDOS[i % FUNDOS.length]);
  const cores = pintarFundo(ctx, cor, pal, seed);
  if (img) {
    const lado = w * 1.0;
    // Sombra suave do busto no fundo, para "descolar" a figura.
    ctx.save();
    ctx.shadowColor = css(cores.escuro, 0.45);
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 6;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (w - lado) / 2, h - lado, lado, lado);
    ctx.restore();
  } else {
    silhueta(ctx, cores, "sans-serif");
  }
  acabamento(ctx, pal, seed, cores.escuro);
}

// ---- Placa de latão -------------------------------------------------------

// Quebra o nome em duas linhas no espaço mais perto do meio.
function duasLinhas(texto) {
  const meio = texto.length / 2;
  let melhor = -1;
  for (let k = 0; k < texto.length; k++) {
    if (texto[k] === " " && (melhor < 0 || Math.abs(k - meio) < Math.abs(melhor - meio))) melhor = k;
  }
  return melhor < 0 ? [texto] : [texto.slice(0, melhor), texto.slice(melhor + 1)];
}

function caber(ctx, linhas, peso, max, min, larg, font) {
  let size = max;
  const mede = () => Math.max(...linhas.map((l) => ctx.measureText(l).width));
  do {
    ctx.font = `${peso} ${size}px ${font}`;
    if (mede() <= larg) return size;
    size -= 2;
  } while (size > min);
  ctx.font = `${peso} ${min}px ${font}`;
  return min;
}

function desenharPlaca(canvas, q, pal) {
  const ctx = canvas.getContext("2d");
  const { w, h } = PLACA_PX;
  const font = pal.font;
  const latao = pal.mix(pal.pv("yellow-500"), pal.pv("yellow-800"), 0.35);
  const claro = pal.mix(latao, pal.white, 0.4);
  const escuro = pal.mix(latao, pal.pv("gray-950"), 0.35);
  const base = latao;
  const tinta = pal.mix(pal.pv("gray-950"), pal.pv("yellow-800"), 0.2);
  // Latão escovado: degradê vertical com faixa de brilho + riscos finos.
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, css(escuro));
  g.addColorStop(0.18, css(claro));
  g.addColorStop(0.55, css(base));
  g.addColorStop(1, css(escuro));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const rand = rng(hash(q.id) ^ 31354);
  for (let i = 0; i < 120; i++) {
    const y = rand() * h;
    ctx.strokeStyle = css(rand() < 0.5 ? claro : escuro, 0.12);
    ctx.lineWidth = 1 + rand();
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  // Filete gravado + parafusos.
  ctx.lineWidth = 5;
  ctx.strokeStyle = css(escuro);
  ctx.strokeRect(20, 20, w - 40, h - 40);
  ctx.lineWidth = 2;
  ctx.strokeStyle = css(claro);
  ctx.strokeRect(25, 25, w - 50, h - 50);
  for (const [x, y] of [[44, 44], [w - 44, 44], [44, h - 44], [w - 44, h - 44]]) {
    ctx.fillStyle = css(escuro);
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = css(claro);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 6);
    ctx.lineTo(x + 6, y - 6);
    ctx.stroke();
  }
  // Texto gravado: luz embaixo (relevo) e tinta escura por cima.
  const larg = w - 170;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  let linhas = [q.nome];
  let tamNome = caber(ctx, linhas, 700, 88, 62, larg, font);
  if (ctx.measureText(q.nome).width > larg) {
    linhas = duasLinhas(q.nome);
    tamNome = caber(ctx, linhas, 700, 66, 40, larg, font);
  }
  const fontNome = ctx.font;
  const cargo = q.cargo ?? "";
  const tamCargo = cargo ? caber(ctx, [cargo], 500, linhas.length > 1 ? 44 : 50, 30, larg, font) : 0;
  const fontCargo = ctx.font;
  const gap = cargo ? tamCargo * 0.45 : 0;
  const alturaBloco = linhas.length * tamNome * 1.02 + gap + tamCargo;
  let y = (h - alturaBloco) / 2 + tamNome * 0.82;
  const gravar = (texto, yy) => {
    ctx.fillStyle = css(claro, 0.85);
    ctx.fillText(texto, w / 2, yy + 3);
    ctx.fillStyle = css(tinta);
    ctx.fillText(texto, w / 2, yy);
  };
  ctx.font = fontNome;
  for (const l of linhas) {
    gravar(l, y);
    y += tamNome * 1.02;
  }
  if (cargo) {
    ctx.font = fontCargo;
    const ultima = y - tamNome * 1.02;
    gravar(cargo, ultima + tamNome * 0.22 + gap + tamCargo * 0.8);
  }
}

// ---- Geometria da moldura -------------------------------------------------

// Aro retangular com bisel (perfil de moldura em degraus).
function aro(w2, h2, largura, altura, bisel) {
  const s = new THREE.Shape();
  const ow = w2 - bisel;
  const oh = h2 - bisel;
  s.moveTo(-ow, -oh);
  s.lineTo(ow, -oh);
  s.lineTo(ow, oh);
  s.lineTo(-ow, oh);
  s.closePath();
  const iw = w2 - largura + bisel;
  const ih = h2 - largura + bisel;
  const furo = new THREE.Path();
  furo.moveTo(-iw, -ih);
  furo.lineTo(-iw, ih);
  furo.lineTo(iw, ih);
  furo.lineTo(iw, -ih);
  furo.closePath();
  s.holes.push(furo);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(altura - bisel * 2, 0.002),
    bevelEnabled: true,
    bevelSize: bisel,
    bevelThickness: bisel,
    bevelSegments: 1,
    curveSegments: 1,
  });
  // A extrusão vai de -bisel a depth+bisel: assenta o aro em z = 0.
  geo.translate(0, 0, bisel);
  return geo;
}

function geometrias() {
  const roseta = new THREE.CylinderGeometry(0.05, 0.062, 0.03, 8);
  roseta.rotateX(Math.PI / 2);
  const conchaTopo = new THREE.CylinderGeometry(0.13, 0.13, 0.04, 7, 1, false, Math.PI / 2, Math.PI);
  conchaTopo.rotateX(Math.PI / 2);
  const conchaBase = new THREE.CylinderGeometry(0.08, 0.08, 0.035, 5, 1, false, -Math.PI / 2, Math.PI);
  conchaBase.rotateX(Math.PI / 2);
  const cupula = new THREE.CylinderGeometry(0.055, 0.07, 0.6, 8, 1, false);
  cupula.rotateZ(Math.PI / 2);
  const braco = new THREE.CylinderGeometry(0.012, 0.012, 1, 5);
  return {
    fundo: new THREE.BoxGeometry(QUADRO.largura - 0.04, QUADRO.altura - 0.04, 0.03),
    aro1: aro(MW2, MH2, ARO1, 0.13, 0.025),
    aro2: aro(MW2 - ARO1, MH2 - ARO1, ARO2, 0.095, 0.018),
    aro3: aro(MW2 - ARO1 - ARO2, MH2 - ARO1 - ARO2, ARO3, 0.075, 0.006),
    passe: new THREE.BoxGeometry(ABERTURA.w2 * 2, ABERTURA.h2 * 2, 0.02),
    tela: new THREE.PlaneGeometry(TELA.w, TELA.h),
    roseta,
    miolo: new THREE.IcosahedronGeometry(0.028, 0),
    conchaTopo,
    conchaBase,
    placa: new THREE.BoxGeometry(PLACA.w, PLACA.h, 0.018),
    suporte: new THREE.BoxGeometry(0.1, 0.06, 0.05),
    braco,
    cupula,
    lampada: new THREE.BoxGeometry(0.52, 0.012, 0.05),
    hit: new THREE.BoxGeometry(QUADRO.largura + 0.1, QUADRO.altura + 0.75, 0.3),
  };
}

// ---- Construção -----------------------------------------------------------

export function buildQuadros({ scene, pal, track, lite, reducedMotion, quadros = [] }) {
  const meus = [];
  const reg = (x) => {
    meus.push(x);
    return track ? track(x) : x;
  };
  const geo = geometrias();
  for (const g of Object.values(geo)) reg(g);

  const ouro = pal.mix(pal.pv("yellow-500"), pal.pv("yellow-800"), 0.3);
  const ouroClaro = pal.mix(pal.pv("yellow-400"), pal.white, 0.15);
  const ouroEscuro = pal.mix(pal.pv("yellow-800"), pal.pv("gray-950"), 0.25);
  const latao = pal.mix(pal.pv("yellow-500"), pal.pv("yellow-800"), 0.45);
  const madeira = pal.mix(pal.pv("yellow-800"), pal.pv("gray-950"), 0.6);
  const creme = pal.mix(pal.white, pal.pv("yellow-400"), 0.14);
  const luzQuente = pal.mix(pal.pv("yellow-400"), pal.white, 0.8);

  const metal = (cor, rough = 0.42) =>
    reg(new THREE.MeshStandardMaterial({ color: cor, metalness: 0.45, roughness: rough, flatShading: true }));
  // Compartilhados (não mudam com destaque).
  const matFundo = reg(new THREE.MeshStandardMaterial({ color: madeira, roughness: 0.9 }));
  const matPasse = reg(new THREE.MeshStandardMaterial({ color: creme, roughness: 0.95 }));
  const matOuroEscuro = metal(ouroEscuro, 0.5);
  const matOuroClaro = metal(ouroClaro, 0.35);
  const matLatao = metal(latao, 0.4);
  const matHit = reg(new THREE.MeshBasicMaterial({ visible: false }));

  // Uma só luz real, que acompanha o quadro em destaque (fora do lite).
  let spot = null;
  if (!lite) {
    spot = new THREE.SpotLight(luzQuente, 0, 4.5, 0.55, 0.65, 1.2);
    spot.castShadow = false;
    scene.add(spot, spot.target);
  }

  const raiz = new THREE.Group();
  raiz.name = "museu-quadros";
  scene.add(raiz);

  const loader = new THREE.TextureLoader();
  const hitMeshes = [];
  const itens = new Map();
  let vivo = true;

  const n = Math.min(quadros.length, SLOTS.length);
  for (let i = 0; i < n; i++) {
    const q = quadros[i];
    const slot = SLOTS[i];
    const g = new THREE.Group();
    g.name = `quadro-${q.id}`;
    g.position.copy(centroQuadro(i));
    g.rotation.y = Math.atan2(slot.normal[0], slot.normal[1]);
    raiz.add(g);

    // Materiais próprios (o brilho muda por quadro).
    const matOuro = metal(ouro);
    matOuro.emissive.copy(ouroClaro);
    matOuro.emissiveIntensity = BRILHO.moldura[0];

    const telaCanvas = document.createElement("canvas");
    telaCanvas.width = TELA_PX.w;
    telaCanvas.height = TELA_PX.h;
    desenharTela(telaCanvas, q, i, pal, null);
    const telaTex = reg(canvasTex(telaCanvas, lite));
    const matTela = reg(
      new THREE.MeshStandardMaterial({
        map: telaTex,
        emissive: pal.white,
        emissiveMap: telaTex,
        emissiveIntensity: BRILHO.tela[0],
        roughness: 0.85,
      }),
    );

    const placaCanvas = document.createElement("canvas");
    placaCanvas.width = PLACA_PX.w;
    placaCanvas.height = PLACA_PX.h;
    desenharPlaca(placaCanvas, q, pal);
    const placaTex = reg(canvasTex(placaCanvas, lite));
    const matPlaca = reg(
      new THREE.MeshStandardMaterial({
        map: placaTex,
        emissive: pal.white,
        emissiveMap: placaTex,
        emissiveIntensity: BRILHO.placa[0],
        metalness: 0.3,
        roughness: 0.5,
      }),
    );
    const matLampada = reg(
      new THREE.MeshStandardMaterial({ color: luzQuente, emissive: luzQuente, emissiveIntensity: BRILHO.lampada[0] }),
    );

    const add = (geometria, mat, x, y, z, sombra = true) => {
      const m = new THREE.Mesh(geometria, mat);
      m.position.set(x, y, z);
      m.castShadow = sombra && !lite;
      m.receiveShadow = !lite;
      g.add(m);
      return m;
    };

    // Moldura: fundo de madeira, três aros em degrau, rosetas e conchas.
    add(geo.fundo, matFundo, 0, 0, 0.015, false);
    add(geo.aro1, matOuro, 0, 0, 0);
    add(geo.aro2, matOuroEscuro, 0, 0, 0);
    add(geo.aro3, matOuroClaro, 0, 0, 0, false);
    const cx = MW2 - ARO1 / 2;
    const cy = MH2 - ARO1 / 2;
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      add(geo.roseta, matOuroClaro, sx * cx, sy * cy, 0.14, false);
      add(geo.miolo, matOuro, sx * cx, sy * cy, 0.16, false);
    }
    add(geo.conchaTopo, matOuroClaro, 0, MH2 - 0.045, 0.125);
    add(geo.conchaBase, matOuroClaro, 0, -MH2 + 0.045, 0.125, false);

    // Passe-partout e tela.
    add(geo.passe, matPasse, 0, 0, 0.042, false);
    const tela = add(geo.tela, matTela, 0, 0, TELA_Z, false);
    tela.castShadow = false;

    // Placa de latão: faces laterais em latão, frente com a gravação.
    add(geo.placa, [matLatao, matLatao, matLatao, matLatao, matPlaca, matLatao], 0, PLACA.y, 0.009, false);

    // Luminária de quadro: suporte na parede, braço e cúpula inclinada
    // sobre a moldura, com a lâmpada (faixa que brilha) por baixo.
    const topo = MH2;
    const base = new THREE.Vector3(0, topo + 0.34, 0.05);
    const ponta = new THREE.Vector3(0, topo + 0.22, 0.3);
    add(geo.suporte, matLatao, base.x, base.y, 0.025, false);
    const d = ponta.clone().sub(base);
    const braco = add(geo.braco, matLatao, 0, (base.y + ponta.y) / 2, (base.z + ponta.z) / 2);
    braco.scale.y = d.length();
    braco.rotation.x = Math.atan2(d.z, d.y);
    const cupula = new THREE.Group();
    cupula.position.copy(ponta);
    cupula.rotation.x = -0.35;
    g.add(cupula);
    const casco = new THREE.Mesh(geo.cupula, matLatao);
    casco.castShadow = !lite;
    cupula.add(casco);
    const lamp = new THREE.Mesh(geo.lampada, matLampada);
    lamp.position.y = -0.058;
    cupula.add(lamp);

    // Área de clique (invisível): moldura + placa.
    const hit = new THREE.Mesh(geo.hit, matHit);
    hit.position.set(0, -0.3, 0.15);
    hit.userData.quadroId = q.id;
    g.add(hit);
    hitMeshes.push(hit);

    const item = {
      q,
      i,
      g,
      matOuro,
      matTela,
      matPlaca,
      matLampada,
      telaCanvas,
      telaTex,
      placaCanvas,
      placaTex,
      nivel: { tela: BRILHO.tela[0], moldura: BRILHO.moldura[0], placa: BRILHO.placa[0], lampada: BRILHO.lampada[0] },
    };
    itens.set(q.id, item);

    // Retrato: carrega e compõe no canvas sobre o fundo pintado.
    if (q.retratoUrl) {
      loader.load(
        q.retratoUrl,
        (t) => {
          if (!vivo) return;
          desenharTela(telaCanvas, q, i, pal, t.image);
          telaTex.needsUpdate = true;
          t.dispose();
        },
        undefined,
        () => {
          // Falhou (ex.: retrato ainda não existe): fica a silhueta com "?".
          if (!vivo) return;
          desenharTela(telaCanvas, q, i, pal, null);
          telaTex.needsUpdate = true;
        },
      );
    }
  }
  raiz.updateMatrixWorld(true);

  // A fonte da página pode chegar depois: regrava as placas.
  document.fonts?.ready.then(() => {
    if (!vivo) return;
    for (const it of itens.values()) {
      desenharPlaca(it.placaCanvas, it.q, pal);
      it.placaTex.needsUpdate = true;
    }
  });

  let destaque = null;
  let perto = null;

  const alvo = (it, parte) => {
    const k = it.q.id === destaque ? 2 : it.q.id === perto ? 1 : 0;
    return BRILHO[parte][k];
  };

  function aplicar(it) {
    it.matTela.emissiveIntensity = it.nivel.tela;
    it.matOuro.emissiveIntensity = it.nivel.moldura;
    it.matPlaca.emissiveIntensity = it.nivel.placa;
    it.matLampada.emissiveIntensity = it.nivel.lampada;
  }

  let spotNivel = 0;
  const SPOT_MAX = 7;

  function posicionarSpot() {
    if (!spot) return;
    const it = destaque ? itens.get(destaque) : null;
    if (!it) return;
    spot.position.copy(it.g.localToWorld(new THREE.Vector3(0, MH2 + 0.2, 0.42)));
    spot.target.position.copy(it.g.localToWorld(new THREE.Vector3(0, -0.15, 0)));
    spot.target.updateMatrixWorld();
  }

  function snap() {
    for (const it of itens.values()) {
      for (const parte of Object.keys(it.nivel)) it.nivel[parte] = alvo(it, parte);
      aplicar(it);
    }
    if (spot) {
      spotNivel = destaque ? SPOT_MAX : 0;
      spot.intensity = spotNivel;
    }
  }

  function update(_t, dt) {
    if (reducedMotion) return;
    const k = 1 - Math.exp(-(dt || 0) * 6);
    for (const it of itens.values()) {
      let mudou = false;
      for (const parte of Object.keys(it.nivel)) {
        const a = alvo(it, parte);
        const v = it.nivel[parte];
        if (Math.abs(a - v) > 1e-3) {
          it.nivel[parte] = v + (a - v) * k;
          mudou = true;
        } else if (v !== a) {
          it.nivel[parte] = a;
          mudou = true;
        }
      }
      if (mudou) aplicar(it);
    }
    if (spot) {
      const a = destaque ? SPOT_MAX : 0;
      spotNivel += (a - spotNivel) * k;
      if (Math.abs(a - spotNivel) < 0.01) spotNivel = a;
      spot.intensity = spotNivel;
    }
  }

  function pose(id) {
    const it = itens.get(id);
    if (!it) return null;
    const s = SLOTS[it.i];
    return {
      centro: it.g.localToWorld(new THREE.Vector3(0, 0, TELA_Z)),
      normal: new THREE.Vector3(s.normal[0], 0, s.normal[1]),
      largura: QUADRO.largura,
      altura: QUADRO.altura,
    };
  }

  function setDestaque(id) {
    destaque = id && itens.has(id) ? id : null;
    posicionarSpot();
    if (reducedMotion) snap();
  }

  function setPerto(id) {
    perto = id && itens.has(id) ? id : null;
    if (reducedMotion) snap();
  }

  function dispose() {
    vivo = false;
    scene.remove(raiz);
    if (spot) scene.remove(spot, spot.target);
    spot?.dispose();
    for (const x of meus) x.dispose?.();
    meus.length = 0;
    hitMeshes.length = 0;
    itens.clear();
  }

  return { update, pose, hitMeshes, setDestaque, setPerto, dispose };
}
