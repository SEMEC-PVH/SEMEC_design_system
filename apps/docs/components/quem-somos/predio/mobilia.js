// Mobília dos escritórios da SEMFAZ (prédio da Vila): estação de trabalho de
// cada chefia (com o porta-retrato da foto oficial), placa de zona, elevador
// e balcão de recepção do térreo. O escritório (./escritorio.js) decide onde
// cada peça vai; aqui só se desenha.
//
// Escala da Vila: 1 tile = 1 unidade; personagens com ~1 de altura. Todas as
// peças têm a frente em +z (o escritório gira o grupo conforme a parede).
//
// Desempenho: a parte fixa da estação (divisória, mesa, gaveteiro, monitor,
// objetos de mesa) é mesclada por material e COMPARTILHADA entre as estações
// do mesmo `track` (cache abaixo) e marcada com `userData.fixo`, para o
// escritório juntá-la no nível do andar; a cadeira (`userData.cadeira`) vira
// instância. Sobram por estação a moldura, a foto, a face da plaquinha e a
// luminária (materiais próprios, porque brilham em destaque): 4 draw calls.
// As placas de zona têm 2 grupos (borda + frente), não 6. No `lite` não há
// luzes reais nem sombras, e os cilindros têm menos lados.
//
// Cores: sempre da `pal` (tokens --pv-*); no canvas, strings geradas em
// runtime a partir das THREE.Color.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// ---- Medidas da estação (coordenadas locais, origem no centro do tile) ----

const DIV = { z0: -0.48, z1: -0.43, alto: 1.32 }; // divisória atrás da mesa
const MESA = { x: 0.45, y: 0.42, tampo: 0.03, z0: -0.43, z1: 0.06 };
const TOPO = MESA.y + MESA.tampo; // 0,45: superfície da mesa
// Porta-retrato preso na divisória (moldura inteira 0,45 × 0,55).
const QUADRO = { x: -0.1, y: 0.95, w: 0.45, h: 0.55, aro: 0.035, fundo: 0.03 };
const FOTO_Z = DIV.z1 + QUADRO.fundo + 0.003; // plano da foto (à frente da moldura)
const FOTO = { w: QUADRO.w - QUADRO.aro * 2, h: QUADRO.h - QUADRO.aro * 2 };
// Plaquinha de mesa num suporte, logo abaixo do porta-retrato (entra no close).
const PLAQ = { x: QUADRO.x, y: TOPO + 0.1, z: DIV.z1 + 0.08, w: 0.3, h: 0.085, d: 0.014, incl: -0.22 };
// Cadeira: em repouso, meio virada em frente à mesa (como se a chefia tivesse
// saído); no destaque, empurrada para trás e para a esquerda, fora do close
// (a câmera do close vem de frente, deslocada para a direita).
const CADEIRA = { x: -0.16, z: 0.3, ry: 0.45 };
const CADEIRA_FORA = { x: -0.32, z: 1.15, ry: 0.95 };

// Brilho (emissive) de cada parte: em repouso, perto e em destaque.
const BRILHO = {
  foto: [0.06, 0.12, 0.3],
  moldura: [0, 0.06, 0.28],
  placa: [0.08, 0.6, 0.45],
  luz: [0.25, 0.7, 1.8],
};

// ---- Utilitários ----------------------------------------------------------

const hash = (s) => [...String(s)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

// Aleatório determinístico (mesma pessoa sempre com os mesmos objetos).
function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cor da paleta como string de canvas (opcionalmente com alfa), em runtime.
const _rgb = { r: 0, g: 0, b: 0 };
function css(c, a = 1) {
  if (a >= 1) return c.getStyle();
  c.getRGB(_rgb, THREE.SRGBColorSpace);
  const [r, g, b] = [_rgb.r, _rgb.g, _rgb.b].map((v) => Math.round(v * 255));
  return `rgb(${r} ${g} ${b} / ${a})`;
}

// Luminância relativa (THREE.Color guarda em linear) e cor de texto legível
// sobre o fundo (WCAG: 4,5:1 para o branco exige L <= 0,183).
const luminancia = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
const tintaSobre = (pal, fundo) => (luminancia(fundo) <= 0.18 ? pal.white : pal.pv("gray-950"));

function makeCanvas(w, h) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function canvasTex(canvas, lite) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = lite ? 2 : 8;
  return tex;
}

// Caixa pelos limites (x0..x1, y0..y1, z0..z1), já transladada.
function caixa(x0, x1, y0, y1, z0, z1) {
  return new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}

function cilindro(r0, r1, h, lados, x, y, z) {
  return new THREE.CylinderGeometry(r0, r1, h, lados).translate(x, y, z);
}

// Junta as peças numa geometria só (descarta as peças).
function fundir(partes) {
  const lista = partes.some((g) => !g.index) ? partes.map((g) => (g.index ? g.toNonIndexed() : g)) : partes;
  const g = mergeGeometries(lista, false);
  for (const p of new Set([...partes, ...lista])) p.dispose();
  return g;
}

// Aplica uma matriz a um conjunto de peças (ex.: cadeira girada).
const transformar = (partes, m) => partes.map((g) => g.applyMatrix4(m));

function mesh(geo, mat, lite, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast && !lite;
  m.receiveShadow = receive && !lite;
  return m;
}

// Quebra o texto em duas linhas no espaço mais perto do meio.
function duasLinhas(texto) {
  const meio = texto.length / 2;
  let melhor = -1;
  for (let k = 0; k < texto.length; k++) {
    if (texto[k] === " " && (melhor < 0 || Math.abs(k - meio) < Math.abs(melhor - meio))) melhor = k;
  }
  return melhor < 0 ? [texto] : [texto.slice(0, melhor), texto.slice(melhor + 1)];
}

// Reduz a fonte até as linhas caberem na largura.
function caber(ctx, linhas, peso, max, min, larg, font) {
  for (let size = max; size >= min; size -= 2) {
    ctx.font = `${peso} ${size}px ${font}`;
    if (Math.max(...linhas.map((l) => ctx.measureText(l).width)) <= larg) return size;
  }
  ctx.font = `${peso} ${min}px ${font}`;
  return min;
}

// Nome curto para a plaquinha: os dois primeiros nomes (pula "de", "da"...).
function nomeCurto(nome = "") {
  const partes = nome.trim().split(/\s+/);
  const ligas = new Set(["de", "da", "do", "das", "dos", "e"]);
  const out = [];
  for (const p of partes) {
    if (out.length && ligas.has(p.toLowerCase())) continue;
    out.push(p);
    if (out.length === 2) break;
  }
  return out.join(" ");
}

// Fotos carregadas uma vez por URL (várias estações podem repetir a pessoa).
const FOTOS = new Map();
function carregarFoto(url) {
  if (!FOTOS.has(url)) {
    FOTOS.set(
      url,
      new Promise((ok) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => ok(img);
        img.onerror = () => {
          FOTOS.delete(url);
          ok(null);
        };
        img.src = url;
      }),
    );
  }
  return FOTOS.get(url);
}

// Recursos compartilhados: um conjunto por `track` (cada escritório tem o
// seu e descarta tudo junto) e por variante (lite, cor do andar).
const CACHE = new WeakMap();
function compartilhado(track, chave, criar) {
  let porChave = CACHE.get(track);
  if (!porChave) {
    porChave = new Map();
    CACHE.set(track, porChave);
  }
  if (!porChave.has(chave)) porChave.set(chave, criar());
  return porChave.get(chave);
}

// Nível de brilho que persegue o alvo (suave; instantâneo com reduced motion).
function criarNiveis(base) {
  const nivel = Object.fromEntries(Object.keys(base).map((k) => [k, base[k][0]]));
  return {
    nivel,
    passo(alvos, dt, instantaneo) {
      let mudou = false;
      const k = instantaneo ? 1 : 1 - Math.exp(-(dt || 0) * 6);
      for (const parte of Object.keys(nivel)) {
        const a = alvos[parte];
        const v = nivel[parte];
        if (v === a) continue;
        nivel[parte] = Math.abs(a - v) < 1e-3 ? a : v + (a - v) * k;
        mudou = true;
      }
      return mudou;
    },
  };
}

// ---- Estação: recursos compartilhados --------------------------------------

function recursosEstacao(pal, track, lite, corAndar) {
  const { pv, mix } = pal;
  const lados = lite ? 6 : 12;
  const std = (color, extra = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }));

  const mats = {
    tecido: std(mix(mix(corAndar, pv("gray-100"), 0.72), pv("gray-400"), 0.12), { roughness: 1 }),
    aluminio: std(pv("gray-300"), { metalness: 0.5, roughness: 0.45 }),
    tampo: std(mix(pal.woodLight, pal.white, 0.25), { roughness: 0.7 }),
    gaveteiro: std(pv("gray-200"), { roughness: 0.6 }),
    plastico: std(pv("gray-800"), { roughness: 0.5 }),
    estofado: std(mix(corAndar, pv("gray-900"), 0.45), { roughness: 0.95 }),
    hit: track(new THREE.MeshBasicMaterial({ visible: false })),
  };

  // Tela do monitor: "área de trabalho" simples num canvas (compartilhada).
  const telaCanvas = makeCanvas(128, 80);
  const g = telaCanvas.getContext("2d");
  g.fillStyle = css(pal.screen);
  g.fillRect(0, 0, 128, 80);
  g.fillStyle = css(mix(pal.screen, pal.white, 0.85));
  g.fillRect(6, 6, 116, 10);
  pal.screenAccent.forEach((c, i) => {
    g.fillStyle = css(c);
    g.fillRect(8, 24 + i * 12, 30 + ((i * 37) % 70), 6);
  });
  g.fillStyle = css(mix(pal.screen, pal.white, 0.4));
  g.fillRect(84, 24, 36, 44);
  const telaTex = track(canvasTex(telaCanvas, lite));
  mats.tela = track(
    new THREE.MeshStandardMaterial({ map: telaTex, emissive: pal.white, emissiveMap: telaTex, emissiveIntensity: 0.55, roughness: 0.3 }),
  );

  // Divisória baixa: painel de tecido entre perfis de alumínio.
  const tecido = caixa(-0.48, 0.48, 0.04, DIV.alto, DIV.z0, DIV.z1);
  const aluminio = [
    caixa(-0.5, 0.5, DIV.alto, DIV.alto + 0.035, DIV.z0 - 0.01, DIV.z1 + 0.01),
    caixa(-0.5, 0.5, 0, 0.04, DIV.z0 - 0.01, DIV.z1 + 0.01),
    caixa(-0.5, -0.48, 0.04, DIV.alto, DIV.z0 - 0.005, DIV.z1 + 0.005),
    caixa(0.48, 0.5, 0.04, DIV.alto, DIV.z0 - 0.005, DIV.z1 + 0.005),
    // Pés da mesa (painéis laterais em metal) e puxadores do gaveteiro.
    caixa(-MESA.x + 0.01, -MESA.x + 0.04, 0, MESA.y, MESA.z0 + 0.02, MESA.z1 - 0.03),
    caixa(MESA.x - 0.04, MESA.x - 0.01, 0, MESA.y, MESA.z0 + 0.02, MESA.z1 - 0.03),
    caixa(-MESA.x + 0.04, MESA.x - 0.04, MESA.y - 0.08, MESA.y - 0.01, MESA.z0 + 0.03, MESA.z0 + 0.05),
    ...[0.33, 0.22, 0.1].map((y) => caixa(0.22, 0.32, y, y + 0.015, 0.035, 0.05)),
    // Suporte da luminária do porta-retrato (no perfil de cima).
    caixa(QUADRO.x - 0.01, QUADRO.x + 0.01, DIV.alto - 0.02, DIV.alto + 0.035, DIV.z1, DIV.z1 + 0.1),
    caixa(QUADRO.x - 0.13, QUADRO.x + 0.13, DIV.alto - 0.05, DIV.alto - 0.02, DIV.z1 + 0.05, DIV.z1 + 0.11),
  ];

  // Tampo e o suporte de madeira da plaquinha.
  const tampo = [
    caixa(-MESA.x, MESA.x, MESA.y, TOPO, MESA.z0, MESA.z1),
    caixa(PLAQ.x - 0.17, PLAQ.x + 0.17, TOPO, TOPO + 0.05, PLAQ.z - 0.045, PLAQ.z + 0.02),
  ];
  // Gaveteiro sob o lado direito, com as frentes das gavetas.
  const gaveteiro = [caixa(0.13, 0.41, 0.03, MESA.y, MESA.z0 + 0.04, 0.03)];

  // Monitor à direita, mais baixo que o porta-retrato e virado para a cadeira;
  // teclado à frente. (Mesclados no material de plástico; a tela é à parte.)
  const mon = new THREE.Matrix4().makeRotationY(-0.35).setPosition(0.3, 0, -0.24);
  const plastico = [
    ...transformar(
      [
        caixa(-0.08, 0.08, TOPO, TOPO + 0.012, -0.06, 0.06),
        caixa(-0.012, 0.012, TOPO, TOPO + 0.12, -0.03, -0.01),
        caixa(-0.16, 0.16, TOPO + 0.1, TOPO + 0.29, -0.01, 0.012),
      ],
      mon,
    ),
    caixa(-0.02, 0.22, TOPO, TOPO + 0.012, -0.12, -0.04),
  ];
  const tela = new THREE.PlaneGeometry(0.3, 0.17).translate(0, TOPO + 0.195, 0.0125).applyMatrix4(mon);

  // Cadeira (coordenadas da própria cadeira; a estação a põe em frente à
  // mesa e a afasta no close, ver CADEIRA).
  const estofado = [caixa(-0.14, 0.14, 0.24, 0.29, -0.13, 0.13), caixa(-0.13, 0.13, 0.33, 0.6, 0.13, 0.17)];
  const base = [
    cilindro(0.02, 0.02, 0.2, lados / 2, 0, 0.14, 0),
    caixa(-0.02, 0.02, 0.29, 0.36, 0.13, 0.15),
  ];
  if (lite) base.push(cilindro(0.14, 0.14, 0.03, lados, 0, 0.03, 0));
  else for (let i = 0; i < 5; i++) base.push(caixa(-0.012, 0.012, 0.02, 0.045, 0, 0.16).rotateY((i * Math.PI * 2) / 5));
  // Corpo da plaquinha (o acrílico; a face com o nome é um plano à parte).
  plastico.push(
    new THREE.BoxGeometry(PLAQ.w, PLAQ.h, PLAQ.d)
      .applyMatrix4(new THREE.Matrix4().makeRotationX(PLAQ.incl).setPosition(PLAQ.x, PLAQ.y, PLAQ.z)),
  );

  const geos = {
    tecido: track(tecido),
    aluminio: track(fundir(aluminio)),
    tampo: track(fundir(tampo)),
    gaveteiro: track(fundir(gaveteiro)),
    plastico: track(fundir(plastico)),
    tela: track(tela),
    estofado: track(fundir(estofado)),
    cadeiraBase: track(fundir(base)),
    hit: track(new THREE.BoxGeometry(0.96, 1.4, 0.95).translate(0, 0.7, 0)),
    // Porta-retrato: aro (4 barras + fundo) e a foto.
    moldura: track(
      fundir([
        caixa(-QUADRO.w / 2, QUADRO.w / 2, QUADRO.h / 2 - QUADRO.aro, QUADRO.h / 2, 0, QUADRO.fundo),
        caixa(-QUADRO.w / 2, QUADRO.w / 2, -QUADRO.h / 2, -QUADRO.h / 2 + QUADRO.aro, 0, QUADRO.fundo),
        caixa(-QUADRO.w / 2, -QUADRO.w / 2 + QUADRO.aro, -QUADRO.h / 2 + QUADRO.aro, QUADRO.h / 2 - QUADRO.aro, 0, QUADRO.fundo),
        caixa(QUADRO.w / 2 - QUADRO.aro, QUADRO.w / 2, -QUADRO.h / 2 + QUADRO.aro, QUADRO.h / 2 - QUADRO.aro, 0, QUADRO.fundo),
        caixa(-QUADRO.w / 2, QUADRO.w / 2, -QUADRO.h / 2, QUADRO.h / 2, 0, 0.008),
      ]),
    ),
    foto: track(new THREE.PlaneGeometry(FOTO.w, FOTO.h)),
    placa: track(new THREE.PlaneGeometry(PLAQ.w - 0.004, PLAQ.h - 0.004)),
    luz: track(new THREE.BoxGeometry(0.24, 0.008, 0.04)),
    // Objetos de mesa (variedade).
    vaso: track(cilindro(0.045, 0.034, 0.08, lados, 0, TOPO + 0.04, 0)),
    folhas: track(
      fundir([
        new THREE.IcosahedronGeometry(0.07, 0).translate(0, TOPO + 0.14, 0),
        new THREE.IcosahedronGeometry(0.05, 0).translate(0.03, TOPO + 0.2, -0.01),
        new THREE.IcosahedronGeometry(0.045, 0).translate(-0.035, TOPO + 0.18, 0.015),
      ]),
    ),
    caneca: track(
      fundir([
        cilindro(0.028, 0.026, 0.07, lados, 0, TOPO + 0.035, 0).toNonIndexed(),
        new THREE.TorusGeometry(0.018, 0.006, 4, lite ? 6 : 8).translate(0.03, TOPO + 0.038, 0).toNonIndexed(),
      ]),
    ),
    pasta: track(new THREE.BoxGeometry(0.2, 0.022, 0.27)),
    porta: track(cilindro(0.025, 0.025, 0.09, lados, 0, TOPO + 0.045, 0)),
    canetas: track(
      fundir([
        cilindro(0.004, 0.004, 0.13, 4, -0.008, TOPO + 0.07, 0.004),
        cilindro(0.004, 0.004, 0.13, 4, 0.009, TOPO + 0.075, -0.006).rotateZ(0.08),
      ]),
    ),
    // Folha fina (4 mm): com 12 mm o topo coincidia com o do teclado e piscava.
    papel: track(new THREE.BoxGeometry(0.16, 0.004, 0.21)),
  };

  // Cores dos objetos (escolhidas por pessoa).
  const vasos = [mix(pv("red-400"), pv("yellow-800"), 0.45), pal.white, pv("gray-700")].map((c) => std(c));
  const verdes = [pal.leaves, pv("green-600"), mix(pv("green-700"), pv("yellow-500"), 0.25)].map((c) =>
    std(c, { flatShading: true }),
  );
  const objetos = [pv("blue-600"), pv("red-600"), pv("yellow-500"), pv("green-600"), pal.white, pv("gray-700")].map((c) =>
    std(c, { roughness: 0.6 }),
  );
  const papel = std(pal.white, { roughness: 1 });
  // Molduras possíveis (madeira escura, preta, dourada).
  const molduras = [
    mix(pv("yellow-800"), pv("gray-950"), 0.55),
    pv("gray-900"),
    mix(pv("yellow-500"), pv("yellow-800"), 0.35),
  ];

  return { mats, geos, vasos, verdes, objetos, papel, molduras };
}

// ---- Estação: canvas da foto e da plaquinha --------------------------------

const FOTO_PX = { w: 480, h: Math.round((480 * FOTO.h) / FOTO.w) };
const PLAQ_PX = { w: 512, h: Math.round((512 * PLAQ.h) / PLAQ.w) };

// Passe-partout creme + foto (cobre a abertura, cortando as laterais) com uma
// sombra interna; sem foto, silhueta neutra. Textura final opaca.
function desenharFoto(canvas, pal, img) {
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  const passe = Math.round(w * 0.075);
  const creme = pal.mix(pal.white, pal.pv("yellow-400"), 0.12);
  ctx.fillStyle = css(creme);
  ctx.fillRect(0, 0, w, h);
  const aw = w - passe * 2;
  const ah = h - passe * 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(passe, passe, aw, ah);
  ctx.clip();
  if (img) {
    const esc = Math.max(aw / img.width, ah / img.height);
    const iw = img.width * esc;
    const ih = img.height * esc;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, passe + (aw - iw) / 2, passe + (ah - ih) * 0.4, iw, ih);
  } else {
    const fundo = pal.pv("gray-300");
    const busto = pal.pv("gray-500");
    ctx.fillStyle = css(fundo);
    ctx.fillRect(passe, passe, aw, ah);
    ctx.fillStyle = css(busto);
    ctx.beginPath();
    ctx.ellipse(w / 2, passe + ah * 0.4, aw * 0.2, aw * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(passe + aw * 0.08, passe + ah);
    ctx.bezierCurveTo(passe + aw * 0.1, passe + ah * 0.72, passe + aw * 0.3, passe + ah * 0.68, w / 2, passe + ah * 0.68);
    ctx.bezierCurveTo(passe + aw * 0.7, passe + ah * 0.68, passe + aw * 0.9, passe + ah * 0.72, passe + aw * 0.92, passe + ah);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // Sombra do passe-partout sobre a foto (chanfro) e reflexo sutil do vidro.
  const escuro = pal.pv("gray-950");
  ctx.lineWidth = 6;
  ctx.strokeStyle = css(escuro, 0.35);
  ctx.strokeRect(passe + 3, passe + 3, aw - 6, ah - 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = css(pal.mix(creme, escuro, 0.25));
  ctx.strokeRect(passe - 1.5, passe - 1.5, aw + 3, ah + 3);
  const vidro = ctx.createLinearGradient(0, 0, w, h);
  vidro.addColorStop(0, css(pal.white, 0.12));
  vidro.addColorStop(0.35, css(pal.white, 0));
  ctx.fillStyle = vidro;
  ctx.fillRect(0, 0, w, h);
}

// Plaquinha de mesa: placa de acrílico escuro com o nome curto em branco e
// um filete na cor do andar.
function desenharPlaquinha(canvas, pal, nome, cor) {
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  const fundo = pal.mix(pal.pv("gray-900"), cor, 0.18);
  ctx.fillStyle = css(fundo);
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = css(pal.mix(cor, pal.white, 0.35));
  ctx.fillRect(0, h - 12, w, 12);
  ctx.fillStyle = css(pal.white);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  caber(ctx, [nome], 700, 64, 30, w - 40, pal.font);
  ctx.fillText(nome, w / 2, (h - 12) / 2 + 2);
}

// ---- Estação --------------------------------------------------------------

export function criarEstacao({ pal, track, lite = false, reducedMotion = false, pessoa = {}, corAndar }) {
  const cor = corAndar ?? pal.pv("blue-700");
  const R = compartilhado(track, `estacao:${lite ? 1 : 0}:${cor.getHexString()}`, () =>
    recursosEstacao(pal, track, lite, cor),
  );
  const { mats, geos } = R;
  const seed = hash(pessoa.id ?? pessoa.nome ?? "");
  const rand = rng(seed);

  const grupo = new THREE.Group();
  grupo.name = `estacao-${pessoa.id ?? ""}`;
  // Parte fixa (`userData.fixo`): o escritório pode juntá-la por material no
  // nível do andar (ver fundirEstacoes em escritorio.js); fora dele, fica
  // aqui mesmo como meshes comuns.
  const fixo = (m) => {
    m.userData.fixo = true;
    return m;
  };
  grupo.add(
    fixo(mesh(geos.tecido, mats.tecido, lite)),
    fixo(mesh(geos.aluminio, mats.aluminio, lite)),
    fixo(mesh(geos.tampo, mats.tampo, lite)),
    fixo(mesh(geos.gaveteiro, mats.gaveteiro, lite)),
    fixo(mesh(geos.plastico, mats.plastico, lite)),
    fixo(mesh(geos.tela, mats.tela, lite, { cast: false })),
  );

  // Cadeira num pivô próprio (afasta-se no destaque). As peças levam
  // `userData.cadeira`: o escritório pode trocá-las por InstancedMesh e
  // seguir o pivô (que marca `userData.mudou` quando se move).
  const cadeira = new THREE.Group();
  cadeira.name = "cadeira";
  for (const m of [mesh(geos.estofado, mats.estofado, lite), mesh(geos.cadeiraBase, mats.plastico, lite)]) {
    m.userData.cadeira = true;
    cadeira.add(m);
  }
  const poseCadeira = (k) => {
    const e = k * k * (3 - 2 * k);
    cadeira.position.set(
      CADEIRA.x + (CADEIRA_FORA.x - CADEIRA.x) * e,
      0,
      CADEIRA.z + (CADEIRA_FORA.z - CADEIRA.z) * e,
    );
    cadeira.rotation.y = CADEIRA.ry + (CADEIRA_FORA.ry - CADEIRA.ry) * e;
    cadeira.userData.mudou = true;
  };
  poseCadeira(0);
  grupo.add(cadeira);

  // Porta-retrato: moldura (cor por pessoa) + foto composta no canvas.
  const corMoldura = R.molduras[seed % R.molduras.length];
  const matMoldura = track(
    new THREE.MeshStandardMaterial({ color: corMoldura, roughness: 0.55, metalness: 0.15, emissive: pal.mix(corMoldura, pal.white, 0.5), emissiveIntensity: 0 }),
  );
  const moldura = mesh(geos.moldura, matMoldura, lite);
  moldura.position.set(QUADRO.x, QUADRO.y, DIV.z1);
  grupo.add(moldura);

  const px = lite ? 0.6 : 1;
  const fotoCanvas = makeCanvas(Math.round(FOTO_PX.w * px), Math.round(FOTO_PX.h * px));
  desenharFoto(fotoCanvas, pal, null);
  const fotoTex = track(canvasTex(fotoCanvas, lite));
  const matFoto = track(
    new THREE.MeshStandardMaterial({ map: fotoTex, emissive: pal.white, emissiveMap: fotoTex, emissiveIntensity: BRILHO.foto[0], roughness: 0.35 }),
  );
  const foto = mesh(geos.foto, matFoto, lite, { cast: false });
  foto.position.set(QUADRO.x, QUADRO.y, FOTO_Z);
  grupo.add(foto);

  let vivo = true;
  if (pessoa.fotoUrl) {
    carregarFoto(pessoa.fotoUrl).then((img) => {
      if (!vivo || !img) return;
      desenharFoto(fotoCanvas, pal, img);
      fotoTex.needsUpdate = true;
    });
  }

  // Plaquinha de mesa no suporte de madeira, inclinada para trás.
  const nome = nomeCurto(pessoa.nome) || "Chefia";
  const plaqCanvas = makeCanvas(PLAQ_PX.w, PLAQ_PX.h);
  desenharPlaquinha(plaqCanvas, pal, nome, cor);
  const plaqTex = track(canvasTex(plaqCanvas, lite));
  const matPlaq = track(
    new THREE.MeshStandardMaterial({ map: plaqTex, emissive: pal.white, emissiveMap: plaqTex, emissiveIntensity: BRILHO.placa[0], roughness: 0.3 }),
  );
  // Só a face com o nome (o corpo de acrílico vai na parte fixa, no plástico).
  const placa = mesh(geos.placa, matPlaq, lite, { cast: false });
  placa.position.set(PLAQ.x, PLAQ.y, PLAQ.z);
  placa.rotation.x = PLAQ.incl;
  placa.translateZ(PLAQ.d / 2 + 0.0015);
  grupo.add(placa);
  document.fonts?.ready.then(() => {
    if (!vivo) return;
    desenharPlaquinha(plaqCanvas, pal, nome, cor);
    plaqTex.needsUpdate = true;
  });

  // Luminária do porta-retrato (faixa que brilha; acende no destaque).
  const corLuz = pal.lamp;
  const matLuz = track(new THREE.MeshStandardMaterial({ color: corLuz, emissive: corLuz, emissiveIntensity: BRILHO.luz[0] }));
  const luz = mesh(geos.luz, matLuz, lite, { cast: false, receive: false });
  luz.position.set(QUADRO.x, DIV.alto - 0.054, DIV.z1 + 0.08);
  grupo.add(luz);

  // Objetos de mesa, determinísticos por pessoa: canto esquerdo (planta ou
  // pastas), canto direito da frente (caneca ou porta-canetas) e às vezes
  // uma folha de papel perto do teclado.
  const add = (geo, mat, x, y, z, ry = 0) => {
    const m = fixo(mesh(geo, mat, lite));
    m.position.set(x, y, z);
    m.rotation.y = ry;
    grupo.add(m);
    return m;
  };
  const escolhe = (lista) => lista[Math.floor(rand() * lista.length) % lista.length];
  if (rand() < 0.55) {
    add(geos.vaso, escolhe(R.vasos), -0.37, 0, -0.05);
    add(geos.folhas, escolhe(R.verdes), -0.37, 0, -0.05, rand() * Math.PI);
  } else {
    const n = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < n; i++) add(geos.pasta, escolhe(R.objetos), -0.33, TOPO + 0.011 + i * 0.022, -0.06, (rand() - 0.5) * 0.3);
  }
  if (rand() < 0.65) add(geos.caneca, escolhe(R.objetos), 0.36, 0, -0.0, rand() * Math.PI * 2);
  else {
    add(geos.porta, escolhe(R.objetos), 0.37, 0, -0.01);
    add(geos.canetas, mats.plastico, 0.37, 0, -0.01, rand() * Math.PI);
  }
  if (rand() < 0.5) add(geos.papel, R.papel, 0.0, TOPO + 0.002, 0.0, (rand() - 0.5) * 0.5);

  // Área de clique (invisível).
  const hit = new THREE.Mesh(geos.hit, mats.hit);
  hit.userData.estacao = pessoa.id;
  grupo.add(hit);

  // Destaque e "perto": brilho da foto, moldura, plaquinha e luminária.
  let destaque = false;
  let perto = false;
  const niveis = criarNiveis(BRILHO);
  const alvos = {};
  const calcAlvos = () => {
    const k = destaque ? 2 : perto ? 1 : 0;
    for (const parte of Object.keys(BRILHO)) alvos[parte] = BRILHO[parte][k];
  };
  const aplicar = () => {
    const n = niveis.nivel;
    matFoto.emissiveIntensity = n.foto;
    matMoldura.emissiveIntensity = n.moldura;
    matPlaq.emissiveIntensity = n.placa;
    matLuz.emissiveIntensity = n.luz;
  };
  calcAlvos();
  // Cadeira: 0 em frente à mesa, 1 afastada (mesmo ritmo do brilho).
  const nivelCad = criarNiveis({ cadeira: [0, 0, 1] });
  const alvoCad = {};
  const passoCadeira = (dt, inst) => {
    alvoCad.cadeira = destaque ? 1 : 0;
    if (nivelCad.passo(alvoCad, dt, inst)) poseCadeira(nivelCad.nivel.cadeira);
  };
  const snap = () => {
    if (niveis.passo(alvos, 0, true)) aplicar();
    passoCadeira(0, true);
  };

  return {
    grupo,
    foto: {
      centro: new THREE.Vector3(QUADRO.x, QUADRO.y, FOTO_Z),
      normal: new THREE.Vector3(0, 0, 1),
      largura: QUADRO.w,
      altura: QUADRO.h,
    },
    hit,
    cadeira,
    setDestaque(on) {
      destaque = !!on;
      calcAlvos();
      if (reducedMotion) snap();
    },
    setPerto(on) {
      perto = !!on;
      calcAlvos();
      if (reducedMotion) snap();
    },
    update(_t, dt) {
      if (reducedMotion) return;
      if (niveis.passo(alvos, dt, false)) aplicar();
      passoCadeira(dt, false);
    },
    dispose() {
      vivo = false;
    },
  };
}

// ---- Placa de zona --------------------------------------------------------

const PLACA_PPU = 400; // pixels por unidade no canvas da placa

// Caixa com só 2 grupos (2 draw calls em vez de 6): material 0 nas faces de
// borda, material 1 nas faces listadas (0..5 = +x, -x, +y, -y, +z, -z).
function caixaDuasFaces(w, h, d, frentes) {
  const g = new THREE.BoxGeometry(w, h, d);
  const idx = g.index.array;
  const borda = [];
  const frente = [];
  for (let f = 0; f < 6; f++) (frentes.includes(f) ? frente : borda).push(...idx.slice(f * 6, f * 6 + 6));
  g.setIndex([...borda, ...frente]);
  g.clearGroups();
  g.addGroup(0, borda.length, 0);
  g.addGroup(borda.length, frente.length, 1);
  return g;
}

// `bandeira`: placa dupla (texto nas duas faces), para pendurar perpendicular
// à parede; `max` limita a largura (quebra o nome em duas linhas antes).
export function criarPlacaZona({ pal, track, lite = false, nome = "", cor, bandeira = false, max }) {
  const fundo = cor ?? pal.pv("blue-700");
  const tinta = tintaSobre(pal, fundo);
  const font = pal.font;
  const MAX = max ?? 2.4;
  const MIN = Math.min(1.6, MAX);
  const MARGEM = 0.36; // filete à esquerda + respiro

  // Mede o texto numa linha; se não couber, quebra em duas.
  const medidor = makeCanvas(8, 8).getContext("2d");
  const tam = 52;
  medidor.font = `700 ${tam}px ${font}`;
  let linhas = [nome];
  let larguraTexto = medidor.measureText(nome).width / PLACA_PPU;
  const maior = (ls) => Math.max(...ls.map((l) => medidor.measureText(l).width)) / PLACA_PPU;
  if (larguraTexto + MARGEM > MAX) {
    linhas = duasLinhas(nome);
    larguraTexto = maior(linhas);
  }
  // Bandeira é estreita: nome longo vai em três linhas (melhor corte entre
  // os espaços) em vez de encolher a fonte até ficar ilegível.
  if (bandeira && larguraTexto > (MAX - MARGEM) * 1.3) {
    const esp = [...nome].map((c, i) => (c === " " ? i : -1)).filter((i) => i > 0);
    let melhor = null;
    for (let a = 0; a < esp.length; a++) {
      for (let b = a + 1; b < esp.length; b++) {
        const ls = [nome.slice(0, esp[a]), nome.slice(esp[a] + 1, esp[b]), nome.slice(esp[b] + 1)];
        const w = maior(ls);
        if (!melhor || w < melhor.w) melhor = { ls, w };
      }
    }
    if (melhor && melhor.w < larguraTexto) {
      linhas = melhor.ls;
      larguraTexto = melhor.w;
    }
  }
  const largura = Math.min(MAX, Math.max(MIN, larguraTexto + MARGEM));
  const altura = [0.34, 0.34, 0.5, 0.64][linhas.length];

  const canvas = makeCanvas(Math.round(largura * PLACA_PPU), Math.round(altura * PLACA_PPU));
  const desenhar = () => {
    const ctx = canvas.getContext("2d");
    const { width: w, height: h } = canvas;
    ctx.fillStyle = css(fundo);
    ctx.fillRect(0, 0, w, h);
    // Filete claro à esquerda e borda interna sutil.
    ctx.fillStyle = css(pal.mix(fundo, tinta, 0.75));
    ctx.fillRect(28, 28, 12, h - 56);
    ctx.strokeStyle = css(pal.mix(fundo, tinta, 0.25));
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = css(tinta);
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const x0 = 68;
    const size = caber(ctx, linhas, 700, tam, 26, w - x0 - 40, font);
    const passo = size * 1.18;
    const y0 = h / 2 - ((linhas.length - 1) * passo) / 2 + 2;
    linhas.forEach((l, i) => ctx.fillText(l, x0, y0 + i * passo));
  };
  desenhar();
  const tex = track(canvasTex(canvas, lite));
  document.fonts?.ready.then(() => {
    desenhar();
    tex.needsUpdate = true;
  });

  const matFrente = track(new THREE.MeshStandardMaterial({ map: tex, emissive: pal.white, emissiveMap: tex, emissiveIntensity: 0.12, roughness: 0.6 }));
  const matBorda = track(new THREE.MeshStandardMaterial({ color: pal.mix(fundo, pal.pv("gray-950"), 0.35), roughness: 0.6 }));
  const geo = track(caixaDuasFaces(largura, altura, 0.04, bandeira ? [4, 5] : [4]));
  const grupo = new THREE.Group();
  grupo.name = "placa-zona";
  const placa = mesh(geo, [matBorda, matFrente], lite, { receive: false });
  if (!bandeira) placa.position.z = 0.02;
  grupo.add(placa);
  return { grupo, largura, altura };
}

// ---- Elevador -------------------------------------------------------------

// Vão da porta e medidas (origem no chão, no meio da face da parede).
const ELEV = { largura: 2, alto: 2.3, vaoW: 1.1, vaoH: 1.75, fundo: 0.6, curso: 0.55 };

// Aço escovado: riscos verticais finos num canvas pequeno (compartilhado).
function texturaEscovada(pal, track, lite) {
  const c = makeCanvas(64, 256);
  const g = c.getContext("2d");
  const base = pal.pv("gray-300");
  g.fillStyle = css(base);
  g.fillRect(0, 0, 64, 256);
  const rand = rng(424242);
  for (let i = 0; i < 90; i++) {
    g.fillStyle = css(rand() < 0.5 ? pal.white : pal.pv("gray-500"), 0.12 + rand() * 0.12);
    g.fillRect(rand() * 64, 0, 0.6 + rand() * 1.2, 256);
  }
  return track(canvasTex(c, lite));
}

function desenharDisplay(canvas, pal, texto, cor) {
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  ctx.fillStyle = css(pal.pv("gray-950"));
  ctx.fillRect(0, 0, w, h);
  const led = pal.mix(pal.pv("yellow-400"), pal.white, 0.15);
  // Seta para cima (subindo) na cor do andar clareada.
  ctx.fillStyle = css(pal.mix(cor, pal.white, 0.45));
  ctx.beginPath();
  ctx.moveTo(60, h * 0.22);
  ctx.lineTo(100, h * 0.62);
  ctx.lineTo(74, h * 0.62);
  ctx.lineTo(74, h * 0.8);
  ctx.lineTo(46, h * 0.8);
  ctx.lineTo(46, h * 0.62);
  ctx.lineTo(20, h * 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = css(led);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  caber(ctx, [texto], 700, 84, 36, w - 160, pal.font);
  ctx.fillText(texto, (w + 110) / 2, h / 2 + 3);
}

export function criarElevador({ pal, track, lite = false, reducedMotion = false, rotulo = "", cor }) {
  const { pv, mix } = pal;
  const acento = cor ?? pal.pv("blue-700");
  const lados = lite ? 8 : 16;
  const std = (color, extra = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }));
  const escovado = texturaEscovada(pal, track, lite);
  const matPortal = std(mix(pv("gray-600"), pv("gray-400"), 0.35), { roughness: 0.55 }); // granito
  const matBatente = std(pv("gray-400"), { metalness: 0.65, roughness: 0.3 });
  const matPorta = track(new THREE.MeshStandardMaterial({ color: pal.white, map: escovado, metalness: 0.6, roughness: 0.38 }));
  const matCabine = track(new THREE.MeshStandardMaterial({ color: mix(pv("gray-200"), pv("yellow-400"), 0.12), map: escovado, metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide }));
  const matPiso = std(pv("gray-700"), { roughness: 0.7 });
  const matAcento = std(acento, { roughness: 0.6 });
  const luzCor = pal.lamp;
  const matLuzCabine = track(new THREE.MeshStandardMaterial({ color: luzCor, emissive: luzCor, emissiveIntensity: 0.2 }));
  const matBotao = track(new THREE.MeshStandardMaterial({ color: pv("gray-200"), emissive: pv("yellow-400"), emissiveIntensity: 0, metalness: 0.4, roughness: 0.3 }));

  const grupo = new THREE.Group();
  grupo.name = "elevador";
  const L2 = ELEV.largura / 2;
  const v2 = ELEV.vaoW / 2;
  const add = (geo, mat, opts) => {
    const m = mesh(track(geo), mat, lite, opts);
    grupo.add(m);
    return m;
  };

  // Revestimento de granito em volta do vão (cobre a parede nos 2 tiles), com
  // uma faixa na cor do andar no alto.
  add(
    fundir([
      caixa(-L2, -v2 - 0.07, 0, ELEV.alto, 0, 0.03),
      caixa(v2 + 0.07, L2, 0, ELEV.alto, 0, 0.03),
      caixa(-v2 - 0.07, v2 + 0.07, ELEV.vaoH + 0.07, ELEV.alto - 0.1, 0, 0.03),
    ]),
    matPortal,
  );
  add(caixa(-L2, L2, ELEV.alto - 0.1, ELEV.alto, 0, 0.035), matAcento);
  const cz0 = -ELEV.fundo; // fundo da cabine
  // Batente de metal (ombreiras, verga e soleira).
  add(
    fundir([
      caixa(-v2 - 0.07, -v2, 0, ELEV.vaoH + 0.07, -0.03, 0.06),
      caixa(v2, v2 + 0.07, 0, ELEV.vaoH + 0.07, -0.03, 0.06),
      caixa(-v2, v2, ELEV.vaoH, ELEV.vaoH + 0.07, -0.03, 0.06),
      caixa(-v2 - 0.07, v2 + 0.07, 0, 0.012, -0.05, 0.1),
      // Botoeira (placa) à direita.
      caixa(v2 + 0.2, v2 + 0.3, 0.82, 1.12, 0.03, 0.045),
      // Moldura do display.
      caixa(-0.36, 0.36, ELEV.vaoH + 0.12, ELEV.vaoH + 0.36, 0.03, 0.05),
      // Corrimão no fundo da cabine.
      caixa(-v2 + 0.08, v2 - 0.08, 0.55, 0.58, cz0, cz0 + 0.04),
    ]),
    matBatente,
  );

  // Cabine rasa atrás das portas (vista quando abrem): paredes de aço,
  // piso escuro, corrimão e luminária no teto.
  add(
    fundir([
      caixa(-v2, v2, 0, ELEV.vaoH, cz0 - 0.02, cz0),
      caixa(-v2 - 0.02, -v2, 0, ELEV.vaoH, cz0, -0.03),
      caixa(v2, v2 + 0.02, 0, ELEV.vaoH, cz0, -0.03),
      caixa(-v2, v2, ELEV.vaoH, ELEV.vaoH + 0.02, cz0, -0.03),
    ]),
    matCabine,
    { cast: false },
  );
  add(caixa(-v2, v2, 0, 0.01, cz0, -0.03), matPiso, { cast: false });
  add(caixa(-0.3, 0.3, ELEV.vaoH - 0.012, ELEV.vaoH, cz0 + 0.12, -0.12), matLuzCabine, { cast: false, receive: false });

  // Portas de aço escovado (deslizam para os lados, por trás do revestimento).
  const geoPorta = track(caixa(-v2 / 2 - 0.01, v2 / 2 + 0.01, 0.012, ELEV.vaoH, -0.028, -0.006));
  const portas = [-1, 1].map((lado) => {
    const p = mesh(geoPorta, matPorta, lite);
    p.position.x = (lado * v2) / 2;
    grupo.add(p);
    return { p, lado };
  });

  // Display com o rótulo do andar e a seta.
  const dispCanvas = makeCanvas(512, 128);
  let texto = rotulo;
  desenharDisplay(dispCanvas, pal, texto, acento);
  const dispTex = track(canvasTex(dispCanvas, lite));
  const matDisp = track(new THREE.MeshStandardMaterial({ color: pal.white, map: dispTex, emissive: pal.white, emissiveMap: dispTex, emissiveIntensity: 0.9, roughness: 0.3 }));
  const disp = mesh(track(new THREE.PlaneGeometry(0.66, 0.165)), matDisp, lite, { cast: false });
  disp.position.set(0, ELEV.vaoH + 0.24, 0.052);
  grupo.add(disp);
  document.fonts?.ready.then(() => {
    desenharDisplay(dispCanvas, pal, texto, acento);
    dispTex.needsUpdate = true;
  });

  // Botões (subir/descer) da botoeira.
  add(
    fundir([1.02, 0.92].map((y) => cilindro(0.022, 0.022, 0.015, lados, 0, 0, 0).rotateX(Math.PI / 2).translate(v2 + 0.25, y, 0.05))),
    matBotao,
    { cast: false },
  );

  // Luz da cabine que se espalha pelo chão do escritório quando abre.
  let luz = null;
  if (!lite) {
    luz = new THREE.PointLight(luzCor, 0, 2.6, 1.6);
    luz.position.set(0, ELEV.vaoH - 0.25, -0.25);
    luz.castShadow = false;
    grupo.add(luz);
  }

  let aberto = 0;
  function abrir(k) {
    aberto = THREE.MathUtils.clamp(k ?? 0, 0, 1);
    // Suaviza o começo e o fim do curso.
    const e = aberto * aberto * (3 - 2 * aberto);
    for (const { p, lado } of portas) p.position.x = lado * (v2 / 2 + e * ELEV.curso);
    matLuzCabine.emissiveIntensity = 0.2 + e * 1.4;
    matBotao.emissiveIntensity = aberto > 0 ? 0.9 : 0;
    if (luz) luz.intensity = e * 2.2;
  }
  abrir(0);

  function setRotulo(t) {
    texto = t ?? "";
    desenharDisplay(dispCanvas, pal, texto, acento);
    dispTex.needsUpdate = true;
  }

  // Display "pulsa" de leve enquanto a porta está aberta.
  function update(t) {
    if (reducedMotion) return;
    matDisp.emissiveIntensity = aberto > 0 ? 0.85 + Math.sin(t * 5) * 0.15 : 0.9;
  }

  return { grupo, abrir, setRotulo, update, largura: ELEV.largura, vao: { largura: ELEV.vaoW, altura: ELEV.vaoH, fundo: ELEV.fundo } };
}

// ---- Recepção -------------------------------------------------------------

function desenharLogoRecepcao(canvas, pal, fundo) {
  const ctx = canvas.getContext("2d");
  const { width: w, height: h } = canvas;
  const tinta = tintaSobre(pal, fundo);
  ctx.fillStyle = css(fundo);
  ctx.fillRect(0, 0, w, h);
  // Faixa amarela fina (acento da prefeitura) e os textos.
  ctx.fillStyle = css(pal.pv("yellow-500"));
  ctx.fillRect(w * 0.3, h * 0.6, w * 0.4, 6);
  ctx.fillStyle = css(tinta);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  caber(ctx, ["SEMFAZ"], 800, 150, 60, w * 0.5, pal.font);
  ctx.fillText("SEMFAZ", w / 2, h * 0.52);
  caber(ctx, ["Secretaria Municipal de Economia"], 500, 34, 18, w * 0.8, pal.font);
  ctx.fillText("Secretaria Municipal de Economia", w / 2, h * 0.74);
  caber(ctx, ["Recepção"], 700, 46, 20, w * 0.8, pal.font);
  ctx.fillStyle = css(pal.mix(tinta, fundo, 0.15));
  ctx.fillText("Recepção", w / 2, h * 0.92);
}

export function criarRecepcao({ pal, track, lite = false }) {
  const { pv, mix } = pal;
  const lados = lite ? 8 : 14;
  const std = (color, extra = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }));
  const azul = pv("blue-700");
  const matAzul = std(azul, { roughness: 0.6 });
  const matTampo = std(mix(pal.woodLight, pal.white, 0.2), { roughness: 0.6 });
  const matBranco = std(pv("gray-100"), { roughness: 0.7 });
  const matEscuro = std(pv("gray-800"), { roughness: 0.5 });
  const matMetal = std(pv("gray-300"), { metalness: 0.6, roughness: 0.35 });

  const grupo = new THREE.Group();
  grupo.name = "recepcao";
  const add = (geo, mat, opts) => {
    const m = mesh(track(geo), mat, lite, opts);
    grupo.add(m);
    return m;
  };
  const W2 = 1.25;

  // Corpo do balcão: frente e laterais azuis, rodapé escuro recuado,
  // tampo alto de atendimento (madeira) e mesa de trabalho por trás.
  add(
    fundir([
      caixa(-W2, -W2 + 0.06, 0.05, 0.62, -0.4, 0.28),
      caixa(W2 - 0.06, W2, 0.05, 0.62, -0.4, 0.28),
    ]),
    matAzul,
  );
  add(caixa(-W2 + 0.02, W2 - 0.02, 0, 0.05, -0.38, 0.34), matEscuro);
  add(fundir([caixa(-W2 - 0.02, W2 + 0.02, 0.62, 0.66, 0.18, 0.42), caixa(-W2 + 0.06, W2 - 0.06, 0.42, 0.45, -0.4, 0.28)]), matTampo);
  add(caixa(-W2 + 0.06, W2 - 0.06, 0.45, 0.62, 0.2, 0.28), matBranco);

  // Frente do balcão: a face +z leva o canvas com "SEMFAZ" / "Recepção" (o
  // fundo do canvas é a própria cor do balcão, sem emenda).
  const canvas = makeCanvas(1280, 292);
  desenharLogoRecepcao(canvas, pal, azul);
  const tex = track(canvasTex(canvas, lite));
  document.fonts?.ready.then(() => {
    desenharLogoRecepcao(canvas, pal, azul);
    tex.needsUpdate = true;
  });
  const matLogo = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  add(caixaDuasFaces(W2 * 2, 0.57, 0.1, [4]).translate(0, 0.335, 0.33), [matAzul, matLogo]);

  // Na mesa de trabalho: dois monitores, teclado; no tampo alto: campainha
  // e porta-folhetos; uma planta no canto.
  const telaMat = std(pal.screen, { emissive: pal.screen, emissiveIntensity: 0.4, roughness: 0.3 });
  for (const x of [-0.55, 0.45]) {
    const m = new THREE.Matrix4().makeRotationY(Math.PI).setPosition(x, 0, -0.12);
    add(fundir(transformar([caixa(-0.07, 0.07, 0.45, 0.46, -0.05, 0.05), caixa(-0.01, 0.01, 0.46, 0.56, -0.01, 0.01), caixa(-0.16, 0.16, 0.54, 0.73, -0.012, 0.01)], m)), matEscuro);
    add(new THREE.PlaneGeometry(0.3, 0.17).translate(0, 0.635, 0.0105).applyMatrix4(m), telaMat, { cast: false });
    add(caixa(x - 0.12, x + 0.12, 0.45, 0.46, 0.02, 0.1), matEscuro);
  }
  add(fundir([cilindro(0.04, 0.045, 0.02, lados, 0.75, 0.67, 0.3), new THREE.SphereGeometry(0.035, lados, lite ? 4 : 8, 0, Math.PI * 2, 0, Math.PI / 2).translate(0.75, 0.68, 0.3)]), matMetal);
  add(caixa(-0.85, -0.6, 0.66, 0.84, 0.26, 0.3).rotateX(-0.15), matBranco);
  add(cilindro(0.11, 0.08, 0.26, lados, -W2 + 0.2, 0.13, -0.6), std(mix(pv("red-400"), pv("yellow-800"), 0.45)));
  add(
    fundir([
      new THREE.IcosahedronGeometry(0.2, 0).translate(-W2 + 0.2, 0.42, -0.6),
      new THREE.IcosahedronGeometry(0.15, 0).translate(-W2 + 0.26, 0.6, -0.62),
    ]),
    std(pal.leaves, { flatShading: true }),
  );
  // Cadeira da recepcionista (estofado cinza, para não parecer um monitor).
  add(
    fundir([caixa(-0.15, 0.15, 0.3, 0.35, -0.42, -0.14), caixa(-0.14, 0.14, 0.38, 0.62, -0.5, -0.46), cilindro(0.02, 0.02, 0.28, 6, 0, 0.16, -0.28), cilindro(0.15, 0.15, 0.03, lados, 0, 0.03, -0.28)]),
    std(pv("gray-500"), { roughness: 0.95 }),
  );

  return { grupo };
}
