// Tema do 4º andar · Planejamento: a cidade vista de cima (ver ./index.js).
//
// Peça central: a maquete de Porto Velho numa mesa grande (Rio Madeira, Ponte
// Rondon-Roosevelt, as Três Caixas d'Água, a Estrada de Ferro Madeira-Mamoré
// com a locomotiva indo e vindo, quadras e verde), com um drone de mapeamento
// sobrevoando. Em volta, o trabalho de cada departamento:
// - Implementação do Plano Diretor (oeste): mesa inclinada com o mapa de
//   zoneamento e prancheta de urbanismo;
// - Pesquisa, Estatística e Indicadores (norte-oeste): telões de indicadores e
//   mapa de calor na parede norte, no lugar da estante;
// - Geoprocessamento (norte-leste): plotter imprimindo um mapa e mesa de luz na
//   área comum leste (no lugar da impressora e do quadro branco).
//
// Tiles reservados: telões (7,1)(8,1) · mesa do Plano Diretor (4..6, 4..5) ·
// prancheta (5,8) · maquete (14..17, 5..7) · plotter (20,4)(20,5) · mesa de
// luz (20,6)(20,7).
//
// Desempenho: o que é de cor lisa vai nos `lotes` (sem draw call novo); mapas
// e placas vêm de UM atlas de canvas (papel e luz), os telões de um canvas
// redesenhado poucas vezes por segundo. Animados à parte: locomotiva, drone e o
// papel saindo do plotter (um mesh cada).

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// ---- Planta -------------------------------------------------------------------

const TELOES = [[7, 1], [8, 1]];
const PLANO = { x0: 4, x1: 6, y0: 4, y1: 5 };
const PRANCHETA = [5, 8];
const MAQUETE = { x0: 14, x1: 17, y0: 5, y1: 7 };
const PLOTTER = [[20, 4], [20, 5]];
const MESA_LUZ = [[20, 6], [20, 7]];
const PONTE_V = -0.88; // v (fundo da maquete) da Ponte Rondon-Roosevelt

const retangulo = ({ x0, x1, y0, y1 }) => {
  const t = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) t.push([x, y]);
  return t;
};

const TEXTOS = {
  maquete: [
    "Esta maquete mostra Porto Velho do alto: o Rio Madeira, a Ponte Rondon-Roosevelt ligando as duas margens e as Três Caixas d'Água, símbolo da cidade, instaladas entre 1910 e 1912, na época da Estrada de Ferro Madeira-Mamoré, para abastecer de água a cidade que nascia.",
    "A ferrovia Madeira-Mamoré foi construída entre 1907 e 1912, e a cidade cresceu em volta dela. Olhar a cidade inteira de uma vez, como numa maquete, é o ponto de partida de quem planeja.",
  ],
  planoDiretor: [
    "O Plano Diretor é a lei municipal que organiza o crescimento da cidade: diz onde pode ter moradia, comércio e indústria, o que deve ser preservado e como o território deve ser usado.",
    "Pelo Estatuto da Cidade (Lei 10.257/2001), ele é obrigatório para cidades com mais de 20 mil habitantes e deve ser revisto pelo menos a cada 10 anos, com participação da população em audiências públicas.",
    "O mapa colorido é o zoneamento: cada cor é uma zona com regras próprias de uso do solo e de tamanho das construções.",
  ],
  geo: [
    "Geoprocessamento é juntar mapas e dados num só lugar. Cada rua, lote ou escola vira um ponto no mapa com informações, e o computador cruza tudo: onde falta creche, onde alaga, onde a cidade mais cresceu.",
    "Os dados vêm de levantamentos de campo, imagens de satélite e de drone. Com o mapa certo, a prefeitura enxerga o problema no lugar exato e decide melhor onde investir.",
  ],
  indicadores: [
    "Indicador é um número que mostra como algo está e como muda com o tempo: crianças na escola, casas com esgoto, tempo de espera num atendimento.",
    "Medir sempre do mesmo jeito mostra se uma política pública está dando certo e onde é preciso corrigir o rumo. Por isso os dados precisam ser confiáveis e abertos a todos.",
  ],
};

function planejar(ctx) {
  // Libera a parede da Pesquisa (estante e planta da borda) para os telões e a
  // área comum leste (impressora e quadro branco) para o geoprocessamento.
  ctx.removerDecor((d) => d.seg === "norteO" && (d.x === 7 || d.x === 8));
  ctx.removerDecor((d) => d.seg === "leste" && (d.tipo === "impressora" || d.tipo === "quadroBranco"));

  const reservar = (tiles) => tiles.forEach(([x, y]) => ctx.reservar(x, y));
  const maquete = retangulo(MAQUETE);
  const plano = retangulo(PLANO);
  reservar([...TELOES, ...plano, PRANCHETA, ...maquete, ...PLOTTER, ...MESA_LUZ]);

  ctx.info("maquete", maquete, "Maquete de Porto Velho", TEXTOS.maquete);
  ctx.info("plano-diretor", [...plano, PRANCHETA], "O que é o Plano Diretor", TEXTOS.planoDiretor);
  ctx.info("geoprocessamento", [...PLOTTER, ...MESA_LUZ], "Geoprocessamento", TEXTOS.geo);
  ctx.info("indicadores", TELOES, "Indicadores: medir para melhorar", TEXTOS.indicadores);

  const falhas = ctx.alcancavel();
  if (falhas.length) console.warn("Tema planejamento: inalcançável", falhas);
}

// ---- Texturas -----------------------------------------------------------------

// Atlas 1024 × 1024 com todos os mapas e placas estáticos (x, y, w, h em px).
const S = 1024;
const R = {
  zoneamento: [0, 0, 1024, 560],
  luz: [0, 576, 640, 256],
  topo: [640, 576, 384, 256],
  prancheta: [0, 840, 288, 184],
  placa: [304, 848, 720, 96],
};

// Mapeia o uv (0..1) de uma geometria para uma região do atlas.
function uvRegiao(geo, [x, y, w, h]) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (x + uv.getX(i) * w) / S, 1 - (y + (1 - uv.getY(i)) * h) / S);
  }
  return geo;
}

// Curva suave por pontos (o rio, as avenidas).
function curva(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  const u = pts[pts.length - 1];
  g.lineTo(u[0], u[1]);
}

function desenharAtlas(canvas, pal, cor) {
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const white = pv("white");
  const css = (c) => c.getStyle();
  const font = pal.font;
  g.clearRect(0, 0, S, S);
  g.textBaseline = "middle";

  // Zonas do Plano Diretor (legenda e cor).
  const Z = {
    residencial: mix(pv("yellow-400"), white, 0.25),
    comercial: pv("red-500"),
    industrial: mix(pv("blue-600"), pv("red-500"), 0.45),
    social: mix(pv("red-500"), pv("yellow-500"), 0.5),
    verde: pv("green-500"),
    expansao: mix(pv("gray-200"), pv("green-50"), 0.5),
  };

  // -- Zoneamento do Plano Diretor -------------------------------------------
  {
    const [X, Y, W, Hh] = R.zoneamento;
    g.save();
    g.translate(X, Y);
    g.beginPath();
    g.rect(0, 0, W, Hh);
    g.clip(); // nada vaza para a região vizinha do atlas
    g.fillStyle = css(mix(white, pv("yellow-400"), 0.08));
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = css(cor);
    g.fillRect(0, 0, W, 64);
    g.fillStyle = css(white);
    g.textAlign = "left";
    g.font = `700 38px ${font}`;
    g.fillText("PLANO DIRETOR · ZONEAMENTO", 24, 34);
    // Mapa.
    const mx0 = 20;
    const my0 = 80;
    const mx1 = 716;
    const my1 = Hh - 16;
    g.fillStyle = css(Z.expansao);
    g.fillRect(mx0, my0, mx1 - mx0, my1 - my0);
    g.save();
    g.beginPath();
    g.rect(mx0, my0, mx1 - mx0, my1 - my0);
    g.clip();
    const centro = [300, 300];
    const passo = 26;
    for (let x = 150; x < mx1; x += passo) {
      for (let y = my0 + 6; y < my1; y += passo) {
        const d = Math.hypot(x - centro[0], (y - centro[1]) * 1.2);
        const k = (x * 7 + y * 13) % 17;
        let c = Z.expansao;
        if (x < 185) c = Z.verde;
        else if (x > 560 && y > 380) c = Z.industrial;
        else if (d < 95) c = Z.comercial;
        else if (d < 330 && k === 3) c = Z.verde;
        else if (d > 120 && d < 330 && (k === 5 || k === 9)) c = Z.social;
        else if (d < 330) c = Z.residencial;
        g.fillStyle = css(c);
        g.fillRect(x, y, passo - 5, passo - 5);
      }
    }
    // Faixa verde da margem e o Rio Madeira.
    const rio = [[110, my0 - 20], [70, 200], [120, 330], [80, 460], [100, my1 + 20]];
    g.lineCap = "round";
    g.strokeStyle = css(mix(Z.verde, white, 0.25));
    g.lineWidth = 96;
    curva(g, rio);
    g.stroke();
    g.strokeStyle = css(pv("blue-400"));
    g.lineWidth = 40;
    curva(g, rio);
    g.stroke();
    // Avenidas.
    g.strokeStyle = css(white);
    g.lineWidth = 7;
    for (const av of [
      [[140, 300], [400, 296], [720, 310]],
      [[430, my0], [424, 300], [440, my1]],
      [[150, 140], [420, 300], [700, my1]],
    ]) {
      curva(g, av);
      g.stroke();
    }
    g.restore();
    // Perímetro urbano tracejado.
    g.setLineDash([14, 9]);
    g.strokeStyle = css(pv("red-700"));
    g.lineWidth = 4;
    g.strokeRect(150, my0 + 18, 540, my1 - my0 - 36);
    g.setLineDash([]);
    g.strokeStyle = css(pv("gray-700"));
    g.lineWidth = 3;
    g.strokeRect(mx0, my0, mx1 - mx0, my1 - my0);
    // Rosa dos ventos (norte).
    g.fillStyle = css(pv("gray-800"));
    g.beginPath();
    g.moveTo(680, 96);
    g.lineTo(694, 140);
    g.lineTo(680, 130);
    g.lineTo(666, 140);
    g.closePath();
    g.fill();
    g.textAlign = "center";
    g.font = `700 22px ${font}`;
    g.fillText("N", 680, 160);
    // Legenda.
    g.textAlign = "left";
    g.fillStyle = css(pv("gray-800"));
    g.font = `700 28px ${font}`;
    g.fillText("Zonas", 740, 104);
    const itens = [
      ["Residencial", Z.residencial],
      ["Comercial", Z.comercial],
      ["Industrial", Z.industrial],
      ["Interesse social", Z.social],
      ["Proteção ambiental", Z.verde],
      ["Expansão urbana", Z.expansao],
    ];
    itens.forEach(([nome, c], i) => {
      const y = 148 + i * 58;
      g.fillStyle = css(c);
      g.fillRect(740, y - 17, 34, 34);
      g.strokeStyle = css(pv("gray-600"));
      g.lineWidth = 2;
      g.strokeRect(740, y - 17, 34, 34);
      g.fillStyle = css(pv("gray-800"));
      g.font = `500 24px ${font}`;
      g.fillText(nome, 786, y + 1);
    });
    g.setLineDash([10, 6]);
    g.strokeStyle = css(pv("red-700"));
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(740, 504);
    g.lineTo(774, 504);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = css(pv("gray-800"));
    g.fillText("Perímetro urbano", 786, 505);
    g.restore();
  }

  // -- Mesa de luz: camadas de um SIG sobre fundo iluminado --------------------
  {
    const [X, Y, W, Hh] = R.luz;
    g.save();
    g.translate(X, Y);
    g.beginPath();
    g.rect(0, 0, W, Hh);
    g.clip(); // nada vaza para a região vizinha do atlas
    g.fillStyle = css(mix(white, pv("blue-100"), 0.35));
    g.fillRect(0, 0, W, Hh);
    g.strokeStyle = css(pv("blue-200"));
    g.lineWidth = 1.5;
    for (let x = 0; x <= W; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, Hh);
      g.stroke();
    }
    for (let y = 0; y <= Hh; y += 32) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
    }
    // Lotes.
    g.strokeStyle = css(pv("gray-400"));
    g.lineWidth = 2;
    for (let x = 150; x < W - 20; x += 54) for (let y = 20; y < Hh - 20; y += 44) g.strokeRect(x, y, 46, 36);
    // Lote em destaque (a consulta).
    g.fillStyle = css(pv("yellow-500"));
    g.globalAlpha = 0.55;
    g.fillRect(366, 108, 46, 36);
    g.globalAlpha = 1;
    g.strokeStyle = css(pv("red-600"));
    g.lineWidth = 4;
    g.strokeRect(366, 108, 46, 36);
    // Rio e ruas.
    g.lineCap = "round";
    g.strokeStyle = css(pv("blue-400"));
    g.lineWidth = 30;
    curva(g, [[70, -10], [40, 90], [90, 170], [60, Hh + 10]]);
    g.stroke();
    g.strokeStyle = css(pv("gray-600"));
    g.lineWidth = 6;
    curva(g, [[110, 150], [330, 150], [W, 160]]);
    g.stroke();
    curva(g, [[310, 0], [306, 130], [320, Hh]]);
    g.stroke();
    // Pontos (escolas, postos de saúde, alagamentos).
    const pontos = [pv("green-600"), pv("red-500"), pv("blue-600")];
    for (let i = 0; i < 26; i++) {
      const x = 140 + ((i * 97) % (W - 170));
      const y = 18 + ((i * 61) % (Hh - 36));
      g.fillStyle = css(pontos[i % 3]);
      g.beginPath();
      g.arc(x, y, 7, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  // -- Plotter: carta topográfica com curvas de nível -------------------------
  {
    const [X, Y, W, Hh] = R.topo;
    g.save();
    g.translate(X, Y);
    g.beginPath();
    g.rect(0, 0, W, Hh);
    g.clip(); // nada vaza para a região vizinha do atlas
    g.fillStyle = css(white);
    g.fillRect(0, 0, W, Hh);
    for (let i = 9; i >= 1; i--) {
      g.fillStyle = css(mix(mix(pv("green-50"), pv("green-500"), 0.25), pv("yellow-800"), i < 4 ? 0.3 + (4 - i) * 0.12 : 0));
      g.strokeStyle = css(mix(pv("yellow-800"), white, 0.2));
      g.lineWidth = 2;
      g.beginPath();
      for (let a = 0; a <= 40; a++) {
        const ang = (a / 40) * Math.PI * 2;
        const r = i * 17 * (1 + 0.16 * Math.sin(ang * 3 + i));
        const x = 230 + Math.cos(ang) * r * 1.3;
        const y = 120 + Math.sin(ang) * r * 0.8;
        if (a) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.closePath();
      g.fill();
      g.stroke();
    }
    g.lineCap = "round";
    g.strokeStyle = css(pv("blue-400"));
    g.lineWidth = 12;
    curva(g, [[40, -5], [20, 110], [60, 180], [30, Hh + 5]]);
    g.stroke();
    g.strokeStyle = css(pv("gray-700"));
    g.lineWidth = 3;
    g.strokeRect(4, 4, W - 8, Hh - 8);
    g.restore();
  }

  // -- Prancheta: planta de loteamento em traço azul --------------------------
  {
    const [X, Y, W, Hh] = R.prancheta;
    g.save();
    g.translate(X, Y);
    g.beginPath();
    g.rect(0, 0, W, Hh);
    g.clip(); // nada vaza para a região vizinha do atlas
    g.fillStyle = css(mix(white, pv("blue-50"), 0.6));
    g.fillRect(0, 0, W, Hh);
    g.strokeStyle = css(pv("blue-800"));
    g.lineWidth = 2;
    for (let x = 20; x < W - 30; x += 40) for (let y = 18; y < 80; y += 30) g.strokeRect(x, y, 34, 26);
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(0, 100);
    g.lineTo(W, 100);
    g.moveTo(0, 124);
    g.lineTo(W, 124);
    g.stroke();
    g.beginPath();
    g.arc(200, 150, 22, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(20, 172);
    g.lineTo(140, 172);
    g.moveTo(20, 166);
    g.lineTo(20, 178);
    g.moveTo(140, 166);
    g.lineTo(140, 178);
    g.stroke();
    g.restore();
  }

  // -- Placa da maquete -----------------------------------------------------
  {
    const [X, Y, W, Hh] = R.placa;
    g.save();
    g.translate(X, Y);
    g.beginPath();
    g.rect(0, 0, W, Hh);
    g.clip(); // nada vaza para a região vizinha do atlas
    g.fillStyle = css(pv("gray-800"));
    g.fillRect(0, 0, W, Hh);
    g.fillStyle = css(cor);
    g.fillRect(0, Hh - 10, W, 10);
    g.fillStyle = css(white);
    g.textAlign = "center";
    g.font = `700 46px ${font}`;
    g.fillText("PORTO VELHO · RO", W / 2, Hh / 2 - 4);
    g.restore();
  }
}

// Telões da Pesquisa e Estatística: indicadores (esq.) e mapa de calor (dir.).
const TW = 1024;
const TH = 300;
function desenharTeloes(canvas, pal, cor, t) {
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const css = (c) => c.getStyle();
  const white = pv("white");
  const fundo = mix(pv("gray-900"), pv("blue-950"), 0.6);
  const font = pal.font;
  g.fillStyle = css(fundo);
  g.fillRect(0, 0, TW, TH);
  g.textBaseline = "middle";
  g.textAlign = "left";

  // -- Indicadores -----------------------------------------------------------
  g.fillStyle = css(pv("blue-300"));
  g.font = `700 28px ${font}`;
  g.fillText("INDICADORES", 22, 30);
  const cards = [
    ["Educação", pv("green-500")],
    ["Saúde", pv("blue-400")],
    ["Saneamento", pv("yellow-500")],
  ];
  cards.forEach(([nome, c], i) => {
    const x = 22 + i * 160;
    g.fillStyle = css(mix(fundo, white, 0.08));
    g.fillRect(x, 54, 148, 92);
    g.fillStyle = css(mix(white, fundo, 0.25));
    g.font = `500 20px ${font}`;
    g.fillText(nome, x + 10, 74);
    // Linha do tempo (sparkline) subindo devagar.
    g.strokeStyle = css(c);
    g.lineWidth = 4;
    g.beginPath();
    for (let k = 0; k <= 8; k++) {
      const v = 0.3 + k * 0.06 + 0.08 * Math.sin(k * 1.7 + i * 2 + t * 0.8);
      const px = x + 10 + k * 16;
      const py = 138 - v * 50;
      if (k) g.lineTo(px, py);
      else g.moveTo(px, py);
    }
    g.stroke();
  });
  // Barras por região da cidade.
  for (let k = 0; k < 9; k++) {
    const v = 0.35 + 0.25 * Math.sin(k * 1.3) + 0.15 * Math.sin(t * 1.1 + k * 0.9);
    const h = Math.max(0.08, Math.min(0.95, v)) * 120;
    g.fillStyle = css(k % 3 === 0 ? pv("blue-400") : k % 3 === 1 ? pv("green-500") : mix(pv("blue-300"), white, 0.3));
    g.fillRect(28 + k * 52, 282 - h, 36, h);
  }
  g.fillStyle = css(mix(white, fundo, 0.6));
  g.fillRect(22, 283, 470, 2);

  // -- Mapa de calor ---------------------------------------------------------
  const X0 = 512;
  g.fillStyle = css(pv("blue-300"));
  g.font = `700 28px ${font}`;
  g.fillText("MAPA DE CALOR", X0 + 22, 30);
  const rampa = [pv("blue-600"), pv("green-500"), pv("yellow-500"), pv("red-500")];
  const tom = (v) => {
    const x = Math.max(0, Math.min(0.999, v)) * 3;
    const i = Math.floor(x);
    return mix(rampa[i], rampa[i + 1], x - i);
  };
  const focos = [
    [0.35 + 0.08 * Math.sin(t * 0.5), 0.45, 0.22],
    [0.68, 0.3 + 0.1 * Math.cos(t * 0.4), 0.16],
    [0.6 + 0.06 * Math.cos(t * 0.6), 0.75, 0.18],
  ];
  const C = 18;
  const gx0 = X0 + 22;
  const gy0 = 54;
  const cols = 26;
  const rows = 13;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const u = i / cols;
      const v = j / rows;
      // Margem esquerda: o rio (sem dado).
      const rioX = 0.1 + 0.03 * Math.sin(v * 5);
      if (u < rioX) {
        g.fillStyle = css(mix(pv("blue-400"), fundo, 0.35));
      } else {
        let val = 0.08;
        for (const [fx, fy, r] of focos) val += Math.exp(-((u - fx) ** 2 + (v - fy) ** 2) / (r * r)) * 0.9;
        g.fillStyle = css(tom(val));
      }
      g.fillRect(gx0 + i * C, gy0 + j * C, C - 2, C - 2);
    }
  }
  // Escala.
  for (let k = 0; k < 40; k++) {
    g.fillStyle = css(tom(k / 40));
    g.fillRect(gx0 + k * 6, 300 - 30, 6, 10);
  }
  // Moldura entre as duas telas.
  g.fillStyle = css(cor);
  g.fillRect(0, 0, TW, 4);
}

// ---- Geometria ----------------------------------------------------------------

// Junta peças [geometria, cor] num só BufferGeometry com cor por vértice.
function juntarColorido(partes) {
  const lista = partes.map(([g, c]) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (n.attributes.uv) n.deleteAttribute("uv");
    const cores = new Float32Array(n.attributes.position.count * 3);
    for (let i = 0; i < cores.length; i += 3) cores.set([c.r, c.g, c.b], i);
    n.setAttribute("color", new THREE.BufferAttribute(cores, 3));
    return n;
  });
  const geo = mergeGeometries(lista, false);
  for (const g of new Set([...partes.map((p) => p[0]), ...lista])) g.dispose();
  return geo;
}

// Barra (cilindro fino) entre dois pontos.
function barra(a, b, r, seg = 4) {
  const d = new THREE.Vector3().subVectors(b, a);
  const g = new THREE.CylinderGeometry(r, r, d.length(), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  return g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
}

// Faixa curva (o rio) no plano do chão: polígono pelas margens da linha central.
function faixaCurva(pts, largura) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([u, v]) => new THREE.Vector3(u, 0, v)));
  const N = 40;
  const esq = [];
  const dir = [];
  for (let i = 0; i <= N; i++) {
    const p = curve.getPoint(i / N);
    const tg = curve.getTangent(i / N);
    const nx = -tg.z;
    const nz = tg.x;
    const w = largura * (1 + 0.12 * Math.sin(i * 0.7));
    esq.push([p.x - (nx * w) / 2, p.z - (nz * w) / 2]);
    dir.push([p.x + (nx * w) / 2, p.z + (nz * w) / 2]);
  }
  return { curve, esq, dir };
}

// Polígono (lista [u, v] no chão) → geometria horizontal virada para cima.
function poligono(pts, y) {
  const shape = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, -v)));
  return new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2).translate(0, y, 0);
}

// ---- Construtor -------------------------------------------------------------

function construir(ctx) {
  const { root, lotes, M, pal, track, lite, reducedMotion, cor, tileToWorld, caixa, colocar, rand, std, FACE } = ctx;
  const { pv, mix } = pal;
  const white = pv("white");
  const semSombra = { cast: false };
  const rad = lite ? 6 : 10;
  const liso = (c, extra) => track(std(c, extra));
  const centroDe = (tiles) => {
    const a = tileToWorld(tiles[0][0], tiles[0][1]);
    const b = tileToWorld(tiles[tiles.length - 1][0], tiles[tiles.length - 1][1]);
    return a.add(b).multiplyScalar(0.5);
  };

  // Materiais lisos do tema (cor por vértice nos lotes: sem draw call novo).
  const C = {
    agua: liso(mix(pv("blue-400"), pv("blue-500"), 0.4), { roughness: 0.3 }),
    mata: liso(mix(pv("green-700"), pv("green-800"), 0.3)),
    gramado: liso(mix(pv("green-500"), pv("yellow-400"), 0.15)),
    praca: liso(mix(pv("gray-100"), pv("yellow-400"), 0.12)),
    rua: liso(mix(pv("gray-300"), pv("gray-400"), 0.3)),
    base: liso(mix(pv("gray-200"), white, 0.4)),
    predio: [white, mix(pv("gray-100"), pv("yellow-400"), 0.18), pv("gray-200"), mix(white, pv("blue-100"), 0.5)].map((c) => liso(c)),
    telhado: liso(mix(pv("red-700"), pv("yellow-800"), 0.35)),
    caixaDagua: liso(mix(pv("gray-400"), pv("gray-300"), 0.4), { roughness: 0.5, metalness: 0.3 }),
    ponte: liso(white, { roughness: 0.6 }),
    trilho: liso(pv("gray-600"), { roughness: 0.5, metalness: 0.4 }),
    dormente: liso(mix(pv("yellow-800"), pv("gray-900"), 0.4)),
    zona: liso(mix(cor, white, 0.55)),
  };

  // Atlas (papel e luz) e o canvas dos telões.
  const atlasCanvas = ctx.makeCanvas(S, S);
  desenharAtlas(atlasCanvas, pal, cor);
  const atlasTex = track(ctx.canvasTexture(atlasCanvas));
  const papelMat = track(new THREE.MeshStandardMaterial({ map: atlasTex, roughness: 0.8 }));
  const luzMat = track(new THREE.MeshBasicMaterial({ map: atlasTex }));
  const telaoCanvas = ctx.makeCanvas(TW, TH);
  desenharTeloes(telaoCanvas, pal, cor, 0);
  const telaoTex = track(ctx.canvasTexture(telaoCanvas));
  const telaoMat = track(new THREE.MeshBasicMaterial({ map: telaoTex }));
  document.fonts?.ready.then(() => {
    desenharAtlas(atlasCanvas, pal, cor);
    atlasTex.needsUpdate = true;
    desenharTeloes(telaoCanvas, pal, cor, 0);
    telaoTex.needsUpdate = true;
  });

  // Plano com uma região do atlas (ou dos telões), já orientado.
  const plano = (w, h, regiao) => uvRegiao(new THREE.PlaneGeometry(w, h), regiao);

  const vivos = []; // meshes animados (removidos no dispose)
  const addVivo = (geo, mat, sombra = true) => {
    const mesh = new THREE.Mesh(track(geo), mat);
    mesh.castShadow = sombra && !lite;
    mesh.receiveShadow = false;
    root.add(mesh);
    vivos.push(mesh);
    return mesh;
  };

  // ==== Maquete de Porto Velho ===================================================
  const mq = centroDe([[MAQUETE.x0, MAQUETE.y0], [MAQUETE.x1, MAQUETE.y1]]);
  const TOPO = 0.8; // superfície da maquete
  const BW = 1.75; // meia-largura (x) do tabuleiro
  const BD = 1.25; // meia-profundidade (z)
  // Peça em coordenadas da maquete (u = x, v = z, a partir do centro).
  const em = (geo) => geo.translate(mq.x, 0, mq.z);
  const add = (mat, geo, op) => lotes.add(mat, em(geo), op);
  {
    // Tapete e mesa (tampo, saia e pés).
    lotes.add(M.tapeteChefe, caixa(mq.x - 2.05, mq.x + 2.05, 0, 0.012, mq.z - 1.55, mq.z + 1.55), semSombra);
    add(M.escuro, caixa(-1.86, 1.86, 0.7, 0.78, -1.36, 1.36));
    add(M.madeira, caixa(-1.82, 1.82, 0.42, 0.7, -1.32, 1.32));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(M.escuro, caixa(sx * 1.7 - 0.06, sx * 1.7 + 0.06, 0, 0.42, sz * 1.2 - 0.06, sz * 1.2 + 0.06));
    // Tabuleiro: ruas (a base clara).
    add(C.base, caixa(-BW, BW, 0.78, TOPO, -BD, BD), semSombra);

    // Rio Madeira: entra pelo fundo e sai pela frente, do lado oeste.
    const rio = faixaCurva([[-0.95, -BD - 0.05], [-1.15, -0.6], [-0.95, 0], [-0.72, 0.6], [-0.88, BD + 0.05]], 0.42);
    const clamp = ([u, v]) => [u, Math.max(-BD, Math.min(BD, v))];
    add(C.agua, poligono([...rio.esq, ...rio.dir.slice().reverse()].map(clamp), TOPO + 0.006), semSombra);
    // Margem esquerda (mata) e margem urbana gramada (orla).
    add(C.mata, poligono([[-BW, -BD], ...rio.esq.map(clamp), [-BW, BD]], TOPO + 0.004), semSombra);
    add(C.gramado, poligono([...rio.dir.map(clamp), [-0.3, BD], [-0.3, -BD]], TOPO + 0.003), semSombra);
    // Árvores da mata e da orla.
    const nMata = lite ? 16 : 30;
    for (let i = 0; i < nMata; i++) {
      const v = -BD + 0.1 + rand() * (BD * 2 - 0.2);
      // Margem oeste do rio (`dir`, pela orientação da normal em faixaCurva).
      const borda = rio.dir.reduce((m, p) => (Math.abs(p[1] - v) < Math.abs(m[1] - v) ? p : m));
      const u = -BW + 0.07 + rand() * Math.max(0, borda[0] - 0.09 + BW - 0.07);
      const r = 0.05 + rand() * 0.035;
      if (Math.abs(v - PONTE_V) < 0.1) continue; // não atravessa a ponte
      add(i % 3 ? M.folha : M.folhaClara, new THREE.IcosahedronGeometry(r, 0).translate(u, TOPO + r * 0.9, v));
    }

    // Ponte Rondon-Roosevelt (estilizada): ponte de concreto em viga reta
    // sobre pilares (não é estaiada), com guarda-corpo dos dois lados.
    const pv0 = PONTE_V;
    const DY = TOPO + 0.09;
    add(C.ponte, caixa(-1.6, -0.42, DY - 0.03, DY, pv0 - 0.045, pv0 + 0.045));
    add(C.rua, caixa(-1.6, -0.42, DY, DY + 0.003, pv0 - 0.03, pv0 + 0.03), semSombra);
    for (const s of [-1, 1]) add(C.ponte, caixa(-1.6, -0.42, DY, DY + 0.014, pv0 + s * 0.04 - 0.005, pv0 + s * 0.04 + 0.005), semSombra);
    // Cabeceiras nas margens e pilares ao longo da travessia (inclusive no rio).
    for (const [u0, u1] of [[-1.75, -1.6], [-0.42, -0.28]]) add(C.ponte, caixa(u0, u1, TOPO, DY, pv0 - 0.045, pv0 + 0.045));
    for (let u = -1.48; u < -0.5; u += 0.16) add(C.ponte, caixa(u - 0.018, u + 0.018, TOPO, DY - 0.03, pv0 - 0.032, pv0 + 0.032));

    // Três Caixas d'Água: três torres cilíndricas na orla, numa pracinha.
    add(C.praca, caixa(-0.62, -0.26, TOPO, TOPO + 0.008, -0.42, -0.14), semSombra);
    for (let i = 0; i < 3; i++) {
      const u = -0.54 + i * 0.1;
      const v = -0.28 + (i === 1 ? -0.04 : 0.02);
      const h = 0.3;
      add(C.caixaDagua, new THREE.CylinderGeometry(0.042, 0.046, h, rad).translate(u, TOPO + h / 2, v));
      for (const y of [0.1, 0.2]) add(M.escuro, new THREE.CylinderGeometry(0.044, 0.044, 0.008, rad).translate(u, TOPO + y, v), semSombra);
      add(C.caixaDagua, new THREE.ConeGeometry(0.05, 0.05, rad).translate(u, TOPO + h + 0.025, v));
      add(M.escuro, new THREE.CylinderGeometry(0.006, 0.006, 0.04, 4).translate(u, TOPO + h + 0.06, v), semSombra);
    }

    // Estrada de Ferro Madeira-Mamoré: trilhos na frente e o galpão na orla.
    const VT = 0.98; // v dos trilhos
    for (const s of [-1, 1]) add(C.trilho, caixa(-0.62, BW - 0.04, TOPO + 0.01, TOPO + 0.02, VT + s * 0.03 - 0.005, VT + s * 0.03 + 0.005), semSombra);
    const dormentes = [];
    for (let u = -0.6; u < BW - 0.05; u += 0.06) dormentes.push(caixa(u - 0.012, u + 0.012, TOPO, TOPO + 0.01, VT - 0.055, VT + 0.055));
    add(C.dormente, mergeGeometries(dormentes, false), semSombra);
    dormentes.forEach((d) => d.dispose());
    // Galpão da estação, com telhado em duas águas.
    add(C.predio[1], caixa(-0.6, -0.26, TOPO, TOPO + 0.09, 0.58, 0.82));
    const telhado = new THREE.CylinderGeometry(0.15, 0.15, 0.36, 3).rotateZ(Math.PI / 2).scale(1, 0.45, 0.95).translate(-0.43, TOPO + 0.12, 0.7);
    add(C.telhado, telhado);

    // Quadras da cidade: prédios baixos, alguns mais altos no centro, praças.
    const q = 0.26;
    const rua = 0.07;
    for (let u = -0.2; u + q <= BW - 0.02; u += q + rua) {
      for (let v = -1.18; v + q <= 0.76; v += q + rua) {
        const cu = u + q / 2;
        const cv = v + q / 2;
        if (rand() < 0.14) {
          // Praça com árvores.
          add(C.gramado, caixa(u, u + q, TOPO, TOPO + 0.01, v, v + q), semSombra);
          for (let k = 0; k < 2; k++) {
            add(k ? M.folhaClara : M.folha, new THREE.IcosahedronGeometry(0.045, 0).translate(cu + (k ? 0.05 : -0.05), TOPO + 0.05, cv + (k ? -0.04 : 0.05)));
          }
          continue;
        }
        add(C.praca, caixa(u, u + q, TOPO, TOPO + 0.006, v, v + q), semSombra);
        const centro = Math.max(0, 1 - Math.hypot(cu - 0.4, cv + 0.3) / 1.2);
        const n = lite ? 2 : 4;
        for (let k = 0; k < n; k++) {
          const bu = u + 0.02 + (k % 2) * (q / 2);
          const bv = v + 0.02 + Math.floor(k / 2) * (q / 2);
          const w = q / 2 - 0.035 - rand() * 0.02;
          const h = 0.03 + rand() * 0.06 + (rand() < centro * 0.5 ? 0.08 + rand() * 0.14 * centro : 0);
          const mat = C.predio[Math.floor(rand() * C.predio.length)];
          add(mat, caixa(bu, bu + w, TOPO, TOPO + h, bv, bv + w));
          if (h < 0.06 && rand() < 0.5) add(C.telhado, caixa(bu - 0.004, bu + w + 0.004, TOPO + h, TOPO + h + 0.012, bv - 0.004, bv + w + 0.004), semSombra);
        }
      }
    }

    // Placa "PORTO VELHO · RO" inclinada na borda da frente.
    const placa = plano(1.5, 0.2, R.placa).rotateX(-0.9).translate(0, 0.76, 1.37);
    lotes.add(papelMat, em(placa), semSombra);
    add(M.escuro, caixa(-0.78, 0.78, 0.66, 0.74, 1.3, 1.4));
  }

  // Locomotiva com vagão (anda nos trilhos, para na estação).
  const trem = (() => {
    const preto = pv("gray-900");
    const vermelho = pv("red-600");
    const partes = [
      [new THREE.CylinderGeometry(0.03, 0.03, 0.14, rad).rotateZ(Math.PI / 2).translate(0.03, 0.06, 0), preto],
      [caixa(-0.08, -0.02, 0.025, 0.11, -0.035, 0.035), preto],
      [caixa(-0.09, -0.01, 0.11, 0.12, -0.042, 0.042), vermelho],
      [new THREE.CylinderGeometry(0.012, 0.008, 0.04, 6).translate(0.07, 0.1, 0), preto],
      [caixa(-0.1, 0.11, 0.012, 0.03, -0.04, 0.04), vermelho],
      [caixa(-0.27, -0.12, 0.03, 0.09, -0.04, 0.04), mix(pv("yellow-800"), pv("red-700"), 0.4)],
      [caixa(-0.28, -0.11, 0.09, 0.098, -0.044, 0.044), preto],
    ];
    for (const u of [-0.24, -0.15, -0.06, 0.02, 0.08]) {
      for (const s of [-1, 1]) partes.push([new THREE.CylinderGeometry(0.016, 0.016, 0.01, 8).rotateX(Math.PI / 2).translate(u, 0.02, s * 0.034), preto]);
    }
    const mesh = addVivo(juntarColorido(partes), track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 })));
    mesh.position.set(mq.x - 0.15, TOPO + 0.01, mq.z + 0.98);
    return mesh;
  })();

  // Drone de mapeamento sobrevoando a maquete.
  const drone = (() => {
    const corpo = pv("gray-100");
    const escuro = pv("gray-800");
    const partes = [
      [caixa(-0.07, 0.07, -0.025, 0.025, -0.09, 0.09), corpo],
      [caixa(-0.04, 0.04, -0.06, -0.025, -0.03, 0.05), escuro],
      [caixa(-0.02, 0.02, 0.025, 0.035, -0.06, 0.06), cor],
    ];
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const p = new THREE.Vector3(sx * 0.15, 0.01, sz * 0.15);
      partes.push([barra(new THREE.Vector3(0, 0, 0), p, 0.01), escuro]);
      partes.push([new THREE.CylinderGeometry(0.018, 0.018, 0.03, 6).translate(p.x, 0.02, p.z), escuro]);
      partes.push([new THREE.CylinderGeometry(0.075, 0.075, 0.004, rad).translate(p.x, 0.04, p.z), mix(pv("gray-400"), white, 0.3)]);
    }
    const mesh = addVivo(juntarColorido(partes), track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 })));
    mesh.position.set(mq.x, 1.85, mq.z);
    return mesh;
  })();

  // ==== Mesa inclinada do Plano Diretor ======================================
  {
    const c = centroDe([[PLANO.x0, PLANO.y0], [PLANO.x1, PLANO.y1]]);
    const W = 2.7;
    const D = 1.45;
    const tilt = 0.34;
    const yF = 0.8; // borda da frente (sul)
    const yc = yF + (D / 2) * Math.sin(tilt);
    const yT = yF + D * Math.sin(tilt);
    const zF = c.z + (D / 2) * Math.cos(tilt);
    const zT = c.z - (D / 2) * Math.cos(tilt);
    const m = new THREE.Matrix4().makeRotationX(tilt).setPosition(c.x, yc, c.z);
    const tampo = caixa(-W / 2 - 0.06, W / 2 + 0.06, -0.06, -0.005, -D / 2 - 0.06, D / 2 + 0.06).applyMatrix4(m);
    lotes.add(M.madeira, tampo);
    const mapa = plano(W, (W * R.zoneamento[3]) / R.zoneamento[2], R.zoneamento).rotateX(-Math.PI / 2);
    // O mapa (proporção do atlas) ocupa o tampo quase todo.
    mapa.scale(1, 1, D / ((W * R.zoneamento[3]) / R.zoneamento[2]) * 0.96);
    lotes.add(papelMat, mapa.applyMatrix4(m), semSombra);
    // Filete de borda na cor do andar.
    lotes.add(M.acento, caixa(-W / 2 - 0.07, W / 2 + 0.07, -0.02, 0.012, D / 2 + 0.02, D / 2 + 0.07).applyMatrix4(m), semSombra);
    // Pés (mais altos atrás) e travessa.
    for (const sx of [-1, 1]) {
      const x = c.x + sx * (W / 2 - 0.1);
      lotes.add(M.escuro, caixa(x - 0.05, x + 0.05, 0, yF - 0.05, zF - 0.15, zF - 0.05));
      lotes.add(M.escuro, caixa(x - 0.05, x + 0.05, 0, yT - 0.05, zT + 0.05, zT + 0.15));
      lotes.add(M.escuro, caixa(x - 0.04, x + 0.04, 0.12, 0.2, zT + 0.1, zF - 0.1), semSombra);
    }
    lotes.add(M.escuro, caixa(c.x - W / 2 + 0.1, c.x + W / 2 - 0.1, 0.12, 0.2, c.z - 0.04, c.z + 0.04), semSombra);
    // Régua sobre o mapa.
    lotes.add(M.friso, caixa(-1.25, -0.6, 0.006, 0.02, 0.6, 0.65).applyMatrix4(m), semSombra);
  }

  // ==== Prancheta de urbanismo ===============================================
  {
    const p = tileToWorld(PRANCHETA[0], PRANCHETA[1]);
    const tilt = 0.6;
    const W = 0.95;
    const D = 0.66;
    const yc = 0.86 + (D / 2) * Math.sin(tilt);
    const m = new THREE.Matrix4().makeRotationX(tilt).setPosition(p.x, yc, p.z - 0.05);
    lotes.add(M.madeiraClara, caixa(-W / 2, W / 2, -0.04, 0, -D / 2, D / 2).applyMatrix4(m));
    lotes.add(papelMat, plano(W - 0.12, D - 0.14, R.prancheta).rotateX(-Math.PI / 2).translate(0, 0.002, -0.01).applyMatrix4(m), semSombra);
    // Régua paralela e esquadro.
    lotes.add(M.friso, caixa(-W / 2 + 0.02, W / 2 - 0.02, 0, 0.015, 0.16, 0.2).applyMatrix4(m), semSombra);
    const esquadro = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.2, 0), new THREE.Vector2(0, 0.14)]);
    const furo = new THREE.Path([new THREE.Vector2(0.03, 0.03), new THREE.Vector2(0.11, 0.03), new THREE.Vector2(0.03, 0.085)]);
    esquadro.holes.push(furo);
    lotes.add(M.acento, new THREE.ShapeGeometry(esquadro).rotateX(-Math.PI / 2).translate(0.12, 0.018, 0.15).applyMatrix4(m), semSombra);
    // Coluna, pés em cruz e banqueta.
    lotes.add(M.escuro, caixa(p.x - 0.04, p.x + 0.04, 0, yc - 0.12, p.z - 0.09, p.z - 0.01));
    lotes.add(M.escuro, caixa(p.x - 0.4, p.x + 0.4, 0, 0.04, p.z - 0.09, p.z - 0.01), semSombra);
    lotes.add(M.escuro, caixa(p.x - 0.04, p.x + 0.04, 0, 0.04, p.z - 0.4, p.z + 0.2), semSombra);
    const b = new THREE.Vector3(p.x + 0.12, 0, p.z + 0.38);
    lotes.add(M.estofado, new THREE.CylinderGeometry(0.15, 0.15, 0.05, rad).translate(b.x, 0.62, b.z));
    lotes.add(M.escuro, new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6).translate(b.x, 0.3, b.z));
    lotes.add(M.escuro, new THREE.CylinderGeometry(0.16, 0.16, 0.03, rad).translate(b.x, 0.015, b.z), semSombra);
    // Cesto com rolos de projeto.
    const c = new THREE.Vector3(p.x - 0.38, 0, p.z + 0.3);
    lotes.add(M.caixilho, new THREE.CylinderGeometry(0.1, 0.09, 0.4, rad, 1, true).translate(c.x, 0.2, c.z));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      lotes.add(i % 2 ? M.friso : C.zona, new THREE.CylinderGeometry(0.025, 0.025, 0.6, 6).rotateZ(0.12 * Math.cos(a)).translate(c.x + Math.cos(a) * 0.04, 0.32, c.z + Math.sin(a) * 0.04));
    }
  }

  // ==== Telões de indicadores (parede norte) ===================================
  {
    const a = tileToWorld(TELOES[0][0], TELOES[0][1]);
    const b = tileToWorld(TELOES[1][0], TELOES[1][1]);
    const cx = (a.x + b.x) / 2;
    const ZN = FACE.norte;
    const w = 0.94;
    const h = (w * TH) / (TW / 2);
    const y = 1.52;
    for (const s of [-1, 1]) {
      const x = cx + s * (w / 2 + 0.03);
      lotes.add(M.escuro, caixa(x - w / 2 - 0.035, x + w / 2 + 0.035, y - h / 2 - 0.035, y + h / 2 + 0.035, ZN, ZN + 0.05));
      const g = new THREE.PlaneGeometry(w, h);
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, (s < 0 ? 0 : 0.5) + uv.getX(i) * 0.5);
      lotes.add(telaoMat, g.translate(x, y, ZN + 0.052), semSombra);
    }
    // Aparador baixo com notebook e pasta.
    lotes.add(M.madeira, caixa(cx - 0.88, cx + 0.88, 0.08, 0.6, ZN, ZN + 0.42));
    lotes.add(M.escuro, caixa(cx - 0.86, cx + 0.86, 0, 0.08, ZN + 0.02, ZN + 0.38), semSombra);
    lotes.add(M.friso, caixa(cx - 0.85, cx + 0.85, 0.3, 0.31, ZN + 0.42, ZN + 0.425), semSombra);
    lotes.add(M.escuro, caixa(cx - 0.5, cx - 0.16, 0.6, 0.62, ZN + 0.1, ZN + 0.32));
    lotes.add(M.escuro, caixa(cx - 0.5, cx - 0.16, 0.62, 0.82, ZN + 0.08, ZN + 0.1));
    lotes.add(M.livros[0], caixa(cx + 0.2, cx + 0.5, 0.6, 0.64, ZN + 0.12, ZN + 0.34));
    lotes.add(M.livros[2], caixa(cx + 0.22, cx + 0.48, 0.64, 0.67, ZN + 0.14, ZN + 0.32));
  }

  // ==== Plotter (geoprocessamento) ==========================================
  let papel = null;
  const PAPEL = { w: 1.3, max: 0.62, y: 0.98 };
  {
    const c = centroDe(PLOTTER);
    const XL = FACE.leste;
    const x0 = XL - 0.56;
    const z0 = c.z - 0.86;
    const z1 = c.z + 0.86;
    // Corpo, tampa escura e painel.
    lotes.add(M.metal, caixa(x0, XL - 0.06, 0.86, 1.14, z0, z1));
    lotes.add(M.escuro, caixa(x0 - 0.01, x0 + 0.2, 1.02, 1.15, z0 + 0.08, z1 - 0.3));
    lotes.add(M.escuro, caixa(x0 - 0.02, x0, 0.95, 1.0, z0 + 0.1, z1 - 0.1), semSombra);
    lotes.add(M.acento, caixa(x0 + 0.02, x0 + 0.22, 1.14, 1.17, z1 - 0.26, z1 - 0.06), semSombra);
    // Suportes e cesto do papel.
    for (const z of [z0 + 0.08, z1 - 0.08]) {
      lotes.add(M.escuro, caixa(x0 + 0.18, x0 + 0.26, 0.05, 0.86, z - 0.04, z + 0.04));
      lotes.add(M.escuro, caixa(x0 + 0.02, XL - 0.08, 0, 0.05, z - 0.05, z + 0.05), semSombra);
    }
    lotes.add(M.caixilho, caixa(x0 - 0.2, x0 + 0.16, 0.24, 0.26, z0 + 0.12, z1 - 0.12), semSombra);
    // Mapa saindo da fenda: um mesh à parte que cresce e recomeça.
    const g = new THREE.PlaneGeometry(PAPEL.w, 1).translate(0, -0.5, 0).rotateY(-Math.PI / 2);
    uvRegiao(g, R.topo);
    papel = addVivo(g, papelMat, false);
    papel.position.set(x0 - 0.025, PAPEL.y, c.z);
    papel.userData.uv0 = g.attributes.uv.array.slice();
  }

  // ==== Mesa de luz (geoprocessamento) ==========================================
  {
    const c = centroDe(MESA_LUZ);
    const XL = FACE.leste;
    const x0 = XL - 0.86;
    const x1 = XL - 0.08;
    const z0 = c.z - 0.86;
    const z1 = c.z + 0.86;
    const y = 0.88;
    lotes.add(M.metal, caixa(x0, x1, y - 0.12, y, z0, z1));
    const tela = plano(z1 - z0 - 0.12, x1 - x0 - 0.12, R.luz).rotateX(-Math.PI / 2).rotateY(-Math.PI / 2);
    lotes.add(luzMat, tela.translate((x0 + x1) / 2, y + 0.003, c.z), semSombra);
    for (const [x, z] of [[x0 + 0.06, z0 + 0.06], [x0 + 0.06, z1 - 0.06], [x1 - 0.06, z0 + 0.06], [x1 - 0.06, z1 - 0.06]]) {
      lotes.add(M.escuro, caixa(x - 0.035, x + 0.035, 0, y - 0.12, z - 0.035, z + 0.035));
    }
    lotes.add(M.escuro, caixa(x0 + 0.06, x1 - 0.06, 0.2, 0.24, z0 + 0.05, z1 - 0.05), semSombra);
    // Luminária com lupa de braço articulado.
    const base = new THREE.Vector3(x1 - 0.1, y, z1 - 0.12);
    const cot = new THREE.Vector3(x1 - 0.2, y + 0.45, z1 - 0.3);
    const ponta = new THREE.Vector3(x0 + 0.45, y + 0.42, z1 - 0.45);
    lotes.add(M.escuro, barra(base, cot, 0.012, 6));
    lotes.add(M.escuro, barra(cot, ponta, 0.012, 6));
    lotes.add(M.escuro, new THREE.CylinderGeometry(0.075, 0.075, 0.035, rad).translate(ponta.x, ponta.y - 0.02, ponta.z));
    lotes.add(M.agua, new THREE.CylinderGeometry(0.06, 0.06, 0.005, rad).translate(ponta.x, ponta.y - 0.04, ponta.z), semSombra);
    // Mapas enrolados num canto.
    for (let i = 0; i < 3; i++) {
      lotes.add(i === 1 ? C.zona : M.friso, new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6).rotateX(Math.PI / 2).translate(x0 + 0.15 + i * 0.065, y + 0.03, z0 + 0.4));
    }
  }

  // ---- Animação ---------------------------------------------------------------
  const quieto = reducedMotion;
  const teloesPasso = lite ? 0.5 : 0.25;
  let teloesT = 0;
  const VT_U = [-0.35, 1.45]; // percurso da locomotiva (u da maquete)
  const atualizarPapel = (f) => {
    const L = Math.max(0.02, f * PAPEL.max);
    papel.scale.y = L;
    // Mostra só o trecho já impresso do mapa (de cima para baixo).
    const uv = papel.geometry.attributes.uv;
    const base = papel.userData.uv0;
    const [, ry, , rh] = R.topo;
    const vTopo = 1 - ry / S;
    for (let i = 0; i < uv.count; i++) {
      const v0 = base[i * 2 + 1];
      const emBaixo = v0 < vTopo - 0.001;
      uv.setY(i, emBaixo ? vTopo - (rh / S) * f : v0);
    }
    uv.needsUpdate = true;
  };
  atualizarPapel(0.7);
  if (quieto) desenharTeloes(telaoCanvas, pal, cor, 2);

  const update = (t, dt) => {
    if (quieto) return;
    // Telões: poucos quadros por segundo bastam.
    teloesT += dt;
    if (teloesT >= teloesPasso) {
      teloesT = 0;
      desenharTeloes(telaoCanvas, pal, cor, t);
      telaoTex.needsUpdate = true;
    }
    // Locomotiva: vai, para na estação, volta (ciclo de 20 s).
    const ciclo = (t % 20) / 20;
    const ida = ciclo < 0.4 ? ciclo / 0.4 : ciclo < 0.5 ? 1 : ciclo < 0.9 ? 1 - (ciclo - 0.5) / 0.4 : 0;
    const s = ida * ida * (3 - 2 * ida);
    trem.position.x = mq.x + VT_U[0] + (VT_U[1] - VT_U[0]) * s;
    // Drone: volta lenta sobre a cidade, balançando de leve.
    const a = t * 0.22;
    drone.position.set(mq.x + 0.3 + Math.cos(a) * 0.9, 1.85 + Math.sin(t * 1.7) * 0.04, mq.z - 0.2 + Math.sin(a) * 0.55);
    drone.rotation.y = -a;
    drone.rotation.z = Math.sin(t * 1.3) * 0.05;
    // Papel do plotter: imprime em 12 s e recomeça.
    atualizarPapel(((t % 14) / 12) > 1 ? 1 : (t % 14) / 12);
  };

  const dispose = () => {
    for (const m of vivos) root.remove(m);
  };
  return { update, dispose };
}

export const planejamento = { planejar, construir };
