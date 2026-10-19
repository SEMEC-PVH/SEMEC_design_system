// Tema do Térreo (Gabinete): a entrada institucional da SEMFAZ.
//
// Atrás da ilha do Secretário, mastros com as bandeiras do Brasil, de
// Rondônia e de Porto Velho; ao lado do elevador, o brasão estilizado da
// SEMFAZ em relevo (com o livro de visitas) e o diretório dos andares. Na
// parte pública: tapete vermelho da porta até o gabinete, painel de senhas
// suspenso sobre a recepção, totem de autoatendimento, expositor da Carta de
// Serviços, balcão do Protocolo (carimbos, bandeja de processos e escaninho) e
// a mesa de reunião do Gabinete.
//
// Desempenho: tudo o que é texto/desenho sai de UM atlas de canvas (um draw
// call); as peças de cor lisa vão para os lotes do andar (cor por vértice,
// sem draw call novo). O painel de senhas tem canvas próprio (troca a senha a
// cada poucos segundos; parado com prefers-reduced-motion).

import * as THREE from "three";
import { ANDARES } from "../andares";

// ---- Planta ---------------------------------------------------------------

// Peças do tema e os tiles que ocupam (relativos ao eixo central CX). A peça
// só entra se todos os tiles estiverem livres (a planta-base pode mudar).
function pecas(CX) {
  return {
    bandeiras: [[CX, 4], [CX + 1, 4]],
    brasao: [[CX - 1, 1]],
    diretorio: [[CX + 2, 1]],
    carta: [[CX + 5, 4], [CX + 6, 4], [CX + 7, 4]],
    totem: [[CX + 5, 9]],
    reuniao: [CX - 6, CX - 5, CX - 4, CX - 3].flatMap((x) => [[x, 4], [x, 5]]),
    protocolo: [CX - 7, CX - 6, CX - 5].flatMap((x) => [[x, 8], [x, 9]]),
  };
}

const TEXTOS = {
  bandeiras: [
    "Atrás do Secretário ficam as bandeiras do Brasil, de Rondônia e de Porto Velho. Pela Lei nº 5.700/1971 (Lei dos Símbolos Nacionais), a Bandeira Nacional ocupa o lugar de honra: no centro, quando há um número ímpar de bandeiras.",
    "A de Rondônia tem o céu azul, a estrela branca, o verde das florestas e o amarelo das riquezas minerais. A de Porto Velho traz, numa faixa dourada, as Três Caixas d'Água (as \"Três Marias\"), símbolo da cidade.",
  ],
  secretaria: [
    "A Secretaria Municipal de Economia cuida do dinheiro público da cidade. A Receita arrecada os tributos municipais, como IPTU, ISS e ITBI, e atende o contribuinte.",
    "Finanças e Contabilidade pagam as despesas e registram cada centavo. Orçamento prepara e acompanha a lei que diz quanto a Prefeitura pode gastar em cada área. Planejamento ajuda a organizar metas e programas, como os do Plano Plurianual.",
    "Tecnologia e Administração dão suporte a tudo isso: sistemas, pessoas, compras e materiais. Cada andar deste prédio é uma dessas áreas: suba de elevador para conhecer.",
  ],
  carta: [
    "A Carta de Serviços ao Usuário é um documento público que todo órgão deve divulgar (Lei nº 13.460/2017). Ela lista os serviços oferecidos, os documentos exigidos, as principais etapas e o prazo previsto de atendimento.",
    "Também informa os canais e locais de atendimento, as prioridades (como idosos e pessoas com deficiência) e como reclamar, sugerir ou elogiar. Assim o cidadão sabe o que esperar antes mesmo de chegar ao balcão.",
  ],
  protocolo: [
    "O Protocolo é a porta de entrada dos pedidos. Quando você entrega um requerimento, ele recebe um número e uma data: a partir daí vira um processo administrativo, que pode ser acompanhado.",
    "O processo segue para o setor responsável, que analisa, pede documentos se faltar algo e decide. Cada passo fica registrado (hoje quase sempre em sistema eletrônico) e o número do protocolo serve para consultar o andamento.",
  ],
};

function planejar(ctx) {
  const { CX, livre, reservar, removerDecor, info, plano } = ctx;
  // Os vasos altos ao lado do elevador dão lugar ao brasão e ao diretório.
  removerDecor((d) => d.tipo === "plantaAlta");
  const postas = new Set();
  for (const [id, tiles] of Object.entries(pecas(CX))) {
    if (!tiles.every(([x, y]) => livre(x, y))) continue;
    tiles.forEach(([x, y]) => reservar(x, y));
    postas.add(id);
  }
  const P = pecas(CX);
  if (postas.has("bandeiras")) info("terreo-bandeiras", P.bandeiras, "Bandeiras oficiais", TEXTOS.bandeiras);
  if (postas.has("diretorio")) info("terreo-secretaria", P.diretorio, "O que faz a Secretaria de Economia", TEXTOS.secretaria);
  if (postas.has("carta")) info("terreo-carta", P.carta, "Carta de Serviços", TEXTOS.carta);
  if (postas.has("protocolo")) info("terreo-protocolo", P.protocolo.filter(([, y]) => y === 9), "Protocolo", TEXTOS.protocolo);
  // Se algo ficou inalcançável, desfaz a peça culpada (a última que entrou).
  for (const id of [...postas].reverse()) {
    if (!ctx.alcancavel().length) break;
    for (const [x, y] of P[id]) plano.bloq.delete(`${x},${y}`);
    plano.infos.splice(0, plano.infos.length, ...plano.infos.filter((i) => !i.id.endsWith(id === "diretorio" ? "secretaria" : id)));
    postas.delete(id);
  }
  plano.terreo = { postas };
}

// ---- Atlas (todas as artes estáticas num canvas) --------------------------

const AW = 2048;
const AH = 1024;
const R = {
  brasil: { x: 0, y: 0, w: 400, h: 280 },
  rondonia: { x: 410, y: 0, w: 400, h: 280 },
  portoVelho: { x: 820, y: 0, w: 400, h: 280 },
  brasao: { x: 1230, y: 0, w: 300, h: 340 },
  protocolo: { x: 1540, y: 0, w: 500, h: 110 },
  faixa: { x: 1540, y: 120, w: 500, h: 100 },
  totem: { x: 1540, y: 230, w: 300, h: 220 },
  carta: { x: 0, y: 350, w: 1000, h: 600 },
  diretorio: { x: 1010, y: 350, w: 420, h: 630 },
};

// Estrela de 5 pontas (ponta para cima) centrada em (cx, cy).
function estrela(g, cx, cy, r, ri = r * 0.4) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? ri : r;
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  g.closePath();
  g.fill();
}

function desenharAtlas(canvas, pal, cor) {
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const branco = pv("white");
  const verde = pv("green-600");
  const amarelo = pv("yellow-400");
  const ouro = mix(pv("yellow-500"), pv("yellow-600"), 0.4);
  const azulBR = pv("blue-800");
  const escuro = pv("gray-900");
  const f = (c) => (g.fillStyle = c.getStyle());
  const texto = (t, x, y, peso, max, min, larg, alinhar = "center") => {
    g.textAlign = alinhar;
    g.textBaseline = "middle";
    caber(g, t, peso, max, min, larg, pal.font);
    g.fillText(t, x, y);
  };
  g.clearRect(0, 0, AW, AH);
  f(mix(branco, pv("gray-200"), 0.5));
  g.fillRect(0, 0, AW, AH);

  // Brasil: campo verde, losango amarelo, círculo azul com a faixa branca.
  {
    const { x, y, w, h } = R.brasil;
    f(verde);
    g.fillRect(x, y, w, h);
    f(amarelo);
    g.beginPath();
    g.moveTo(x + w * 0.085, y + h / 2);
    g.lineTo(x + w / 2, y + h * 0.12);
    g.lineTo(x + w * 0.915, y + h / 2);
    g.lineTo(x + w / 2, y + h * 0.88);
    g.closePath();
    g.fill();
    const r = h * 0.25;
    f(azulBR);
    g.beginPath();
    g.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
    g.fill();
    g.save();
    g.beginPath();
    g.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
    g.clip();
    g.strokeStyle = branco.getStyle();
    g.lineWidth = h * 0.045;
    g.beginPath();
    g.arc(x + w / 2 - r * 0.25, y + h / 2 + r * 2.2, r * 2.35, -Math.PI * 0.62, -Math.PI * 0.3);
    g.stroke();
    f(branco);
    for (const [dx, dy, s] of [[-0.35, 0.35, 3], [0, 0.5, 4], [0.3, 0.3, 3], [0.45, 0.55, 2.5], [-0.1, 0.25, 2.5], [0.15, 0.7, 3], [-0.5, 0.05, 2.5], [0.55, -0.05, 2.5]]) {
      g.beginPath();
      g.arc(x + w / 2 + dx * r, y + h / 2 + dy * r, s, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
  // Rondônia: céu azul em cima; embaixo, verde entre as diagonais e amarelo
  // dos lados; estrela branca um pouco acima do centro (proporção 7:10).
  {
    const { x, y, w, h } = R.rondonia;
    const m = h / 14;
    f(pv("blue-600"));
    g.fillRect(x, y, w, h / 2);
    f(amarelo);
    g.fillRect(x, y + h / 2, w, h / 2);
    const cx = x + w / 2;
    const cy = y + h / 2 - 1.35 * m;
    const r = 3.5 * m;
    const ponta = (deg) => [cx + Math.cos((deg * Math.PI) / 180) * r, cy + Math.sin((deg * Math.PI) / 180) * r];
    const [ax, ay] = ponta(126);
    const [bx, by] = ponta(54);
    f(verde);
    g.beginPath();
    g.moveTo(x, y + h);
    g.lineTo(ax, ay);
    g.lineTo(cx, cy);
    g.lineTo(bx, by);
    g.lineTo(x + w, y + h);
    g.closePath();
    g.fill();
    f(branco);
    estrela(g, cx, cy, r, r * 0.42);
  }
  // Porto Velho: campo azul, faixa dourada junto ao mastro e, no alto dela,
  // as Três Caixas d'Água estilizadas em preto.
  {
    const { x, y, w, h } = R.portoVelho;
    f(mix(pv("blue-600"), pv("blue-700"), 0.4));
    g.fillRect(x, y, w, h);
    const fw = w * 0.3;
    f(ouro);
    g.fillRect(x, y, fw, h);
    f(escuro);
    const base = y + h * 0.42;
    for (let i = 0; i < 3; i++) {
      const cx = x + fw * (0.22 + i * 0.28);
      const alt = i === 1 ? 0.06 : 0;
      const topo = y + h * (0.1 - alt);
      g.fillRect(cx - 13, topo + 8, 26, 30); // reservatório
      g.beginPath();
      g.ellipse(cx, topo + 8, 13, 7, 0, Math.PI, 0);
      g.fill();
      g.fillRect(cx - 11, topo + 38, 3, base - topo - 38); // pernas
      g.fillRect(cx + 8, topo + 38, 3, base - topo - 38);
      g.fillRect(cx - 11, topo + 60, 22, 2);
    }
    g.fillRect(x + fw * 0.08, base, fw * 0.84, 4);
  }
  // Brasão da SEMFAZ (face do escudo): fachada clássica, gráfico de barras
  // subindo e estrelas; o fundo é a cor do andar.
  {
    const { x, y, w, h } = R.brasao;
    f(cor);
    g.fillRect(x, y, w, h);
    const cx = x + w / 2;
    f(ouro);
    g.beginPath();
    g.moveTo(cx - 92, y + 112);
    g.lineTo(cx, y + 62);
    g.lineTo(cx + 92, y + 112);
    g.closePath();
    g.fill();
    f(branco);
    g.fillRect(cx - 86, y + 116, 172, 10);
    for (let i = 0; i < 5; i++) g.fillRect(cx - 78 + i * 36, y + 130, 14, 70);
    g.fillRect(cx - 92, y + 202, 184, 12);
    f(ouro);
    [26, 40, 56].forEach((bh, i) => g.fillRect(cx - 44 + i * 32, y + 290 - bh, 24, bh));
    g.fillRect(cx - 54, y + 292, 108, 5);
    f(branco);
    estrela(g, cx - 104, y + 40, 12);
    estrela(g, cx, y + 30, 14);
    estrela(g, cx + 104, y + 40, 12);
  }
  // Fita do brasão e placa do Protocolo.
  {
    const { x, y, w, h } = R.faixa;
    f(ouro);
    g.fillRect(x, y, w, h);
    f(escuro);
    texto("SEMFAZ", x + w / 2, y + h / 2 + 2, 700, 76, 30, w - 40);
  }
  {
    const { x, y, w, h } = R.protocolo;
    f(pv("gray-800"));
    g.fillRect(x, y, w, h);
    f(cor);
    g.fillRect(x, y + h - 12, w, 12);
    f(branco);
    texto("PROTOCOLO", x + w / 2, y + 40, 700, 56, 24, w - 40);
    f(mix(branco, pv("gray-400"), 0.3));
    texto("Entrada de documentos e requerimentos", x + w / 2, y + 80, 500, 24, 14, w - 40);
  }
  // Tela do totem de autoatendimento.
  {
    const { x, y, w, h } = R.totem;
    f(pv("gray-900"));
    g.fillRect(x, y, w, h);
    f(cor);
    g.fillRect(x, y, w, 46);
    f(branco);
    texto("AUTOATENDIMENTO", x + w / 2, y + 24, 700, 28, 14, w - 24);
    const botoes = ["Certidões", "2ª via IPTU", "Nota fiscal", "Retirar senha"];
    const cores = [pv("green-600"), pv("blue-500"), mix(pv("yellow-500"), pv("yellow-600"), 0.5), pv("red-600")];
    botoes.forEach((b, i) => {
      const bx = x + 14 + (i % 2) * (w / 2 - 7);
      const by = y + 60 + Math.floor(i / 2) * 76;
      f(cores[i]);
      g.fillRect(bx, by, w / 2 - 21, 64);
      f(branco);
      texto(b, bx + (w / 2 - 21) / 2, by + 32, 600, 22, 12, w / 2 - 33);
    });
  }
  // Carta de Serviços: cabeçalho e seis cartões de serviço.
  {
    const { x, y, w, h } = R.carta;
    f(branco);
    g.fillRect(x, y, w, h);
    f(cor);
    g.fillRect(x, y, w, 110);
    f(ouro);
    g.fillRect(x, y + 110, w, 8);
    f(branco);
    texto("CARTA DE SERVIÇOS AO USUÁRIO", x + w / 2, y + 44, 700, 54, 26, w - 60);
    f(mix(branco, cor, 0.25));
    texto("O que a SEMFAZ oferece, como pedir e em quanto tempo", x + w / 2, y + 88, 500, 28, 16, w - 60);
    const servicos = [
      ["Certidões", "negativa de débitos"],
      ["IPTU", "2ª via, revisão e isenção"],
      ["ISS e Nota Fiscal", "emissão e cadastro"],
      ["Parcelamento", "de débitos municipais"],
      ["Protocolo", "abrir e acompanhar processos"],
      ["Atendimento", "canais, prazos e prioridades"],
    ];
    const cw = (w - 80) / 3;
    const ch = 188;
    servicos.forEach(([t, s], i) => {
      const cx = x + 20 + (i % 3) * (cw + 20);
      const cy = y + 140 + Math.floor(i / 3) * (ch + 20);
      f(mix(branco, pv("gray-200"), 0.6));
      g.fillRect(cx, cy, cw, ch);
      f(i % 2 ? pv("green-600") : cor);
      g.fillRect(cx, cy, 10, ch);
      g.beginPath();
      g.arc(cx + 62, cy + 62, 34, 0, Math.PI * 2);
      g.fill();
      f(branco);
      // Ícone: folha com linhas.
      g.fillRect(cx + 48, cy + 42, 28, 38);
      f(i % 2 ? pv("green-600") : cor);
      for (let k = 0; k < 3; k++) g.fillRect(cx + 53, cy + 50 + k * 9, 18, 3);
      f(pv("gray-900"));
      texto(t, cx + 112, cy + 62, 700, 34, 18, cw - 124, "left");
      f(pv("gray-600"));
      texto(s, cx + 24, cy + 132, 500, 26, 14, cw - 44, "left");
      f(i % 2 ? pv("green-600") : cor);
      texto("Prazo e documentos", cx + 24, cy + 166, 600, 20, 12, cw - 44, "left");
    });
    f(pv("gray-600"));
    texto("Lei nº 13.460/2017 · Código de Defesa do Usuário do Serviço Público", x + w / 2, y + h - 24, 500, 24, 14, w - 60);
  }
  // Diretório dos andares (de cima para baixo), com a cor de cada andar.
  {
    const { x, y, w, h } = R.diretorio;
    f(pv("gray-900"));
    g.fillRect(x, y, w, h);
    f(ouro);
    g.fillRect(x, y + 92, w, 5);
    f(branco);
    texto("SEMFAZ", x + w / 2, y + 36, 700, 44, 20, w - 40);
    f(mix(branco, pv("gray-400"), 0.4));
    texto("Secretaria Municipal de Economia", x + w / 2, y + 72, 500, 22, 12, w - 40);
    const lista = [...ANDARES].reverse();
    const lh = (h - 120) / lista.length;
    // Mesmo corpo de letra em todas as linhas (o do nome mais comprido).
    let tam = 30;
    for (const a of lista) {
      g.font = `600 ${tam}px ${pal.font}`;
      while (g.measureText(a.nome).width > w - 128 && tam > 14) g.font = `600 ${(tam -= 1)}px ${pal.font}`;
    }
    lista.forEach((a, i) => {
      const ly = y + 110 + i * lh;
      f(pv(a.cor));
      g.fillRect(x + 20, ly + 10, 72, lh - 20);
      f(branco);
      texto(a.numero === 0 ? "T" : `${a.numero}º`, x + 56, ly + lh / 2, 700, 32, 16, 64);
      texto(a.nome, x + 108, ly + lh / 2, 600, tam, tam, w - 128, "left");
      if (i < lista.length - 1) {
        f(pv("gray-700"));
        g.fillRect(x + 20, ly + lh - 1, w - 40, 2);
      }
    });
  }
}

function caber(g, texto, peso, max, min, largura, font) {
  let size = max;
  g.font = `${peso} ${size}px ${font}`;
  while (g.measureText(texto).width > largura && size > min) {
    size -= 2;
    g.font = `${peso} ${size}px ${font}`;
  }
}

// Remapeia o uv (0..1) de uma geometria para a região `r` do atlas.
function noAtlas(geo, r) {
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (r.x + uv.getX(i) * r.w) / AW, 1 - (r.y + (1 - uv.getY(i)) * r.h) / AH);
  }
  return geo;
}

// Cópia da geometria com as faces viradas para o outro lado (verso).
function inverter(geo) {
  const g = geo.clone();
  const idx = g.index;
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i + 1);
    idx.setX(i + 1, idx.getX(i + 2));
    idx.setX(i + 2, a);
  }
  const n = g.attributes.normal;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
  return g;
}

// ---- Painel de senhas ---------------------------------------------------------

function desenharSenha(canvas, pal, n, guiche) {
  const g = canvas.getContext("2d");
  const { pv, mix } = pal;
  const W = canvas.width;
  const H = canvas.height;
  g.fillStyle = pv("gray-950").getStyle();
  g.fillRect(0, 0, W, H);
  g.fillStyle = pv("blue-700").getStyle();
  g.fillRect(0, 0, W, 54);
  g.fillStyle = pv("white").getStyle();
  g.textAlign = "center";
  g.textBaseline = "middle";
  caber(g, "ATENDIMENTO", 700, 38, 18, W - 40, pal.font);
  g.fillText("ATENDIMENTO", W / 2, 29);
  g.fillStyle = mix(pv("gray-400"), pv("white"), 0.2).getStyle();
  g.font = `600 24px ${pal.font}`;
  g.fillText("SENHA", W * 0.3, 82);
  g.fillText("GUICHÊ", W * 0.78, 82);
  g.fillStyle = pv("yellow-500").getStyle();
  g.font = `700 76px ${pal.font}`;
  g.fillText(`A${String(n).padStart(3, "0")}`, W * 0.3, 148);
  g.fillStyle = pv("green-500").getStyle();
  g.fillText(String(guiche), W * 0.78, 148);
}

// ---- Construção ---------------------------------------------------------------

function construir(ctx) {
  const { root, lotes, M, pal, track, lite, reducedMotion, cor, plano, CX, FACE, tileToWorld, caixa, colocar, std, makeCanvas, canvasTexture } = ctx;
  const postas = plano.terreo?.postas ?? new Set();
  const { pv, mix } = pal;
  const white = pv("white");
  const sem = { cast: false };
  const rad = lite ? 6 : 12;
  const matCache = new Map();
  const liso = (c, opts) => {
    const k = c.getHexString();
    if (!matCache.has(k)) matCache.set(k, track(std(c, opts)));
    return matCache.get(k);
  };
  const ouro = liso(mix(pv("yellow-500"), pv("yellow-600"), 0.4));
  const azul = liso(cor);
  const azulEsc = liso(mix(cor, pv("gray-900"), 0.35));
  const vermelho = liso(pv("red-700"));
  const verde = liso(pv("green-600"));
  const branco = liso(mix(white, pv("gray-100"), 0.3));
  const parda = liso(mix(pv("yellow-400"), pv("yellow-800"), 0.45));
  const cil = (r0, r1, h, x, y, z, seg = rad) => new THREE.CylinderGeometry(r0, r1, h, seg).translate(x, y, z);
  const p = (x, y) => tileToWorld(x, y);

  // Atlas: canvas único com as artes; um material (um draw call).
  const atlasCanvas = makeCanvas(AW, AH);
  desenharAtlas(atlasCanvas, pal, cor);
  const atlasTex = track(canvasTexture(atlasCanvas));
  const atlas = track(new THREE.MeshStandardMaterial({ map: atlasTex, roughness: 0.7 }));
  let vivo = true;
  document.fonts?.ready.then(() => {
    if (!vivo) return;
    desenharAtlas(atlasCanvas, pal, cor);
    atlasTex.needsUpdate = true;
  });
  const arte = (geo, r) => lotes.add(atlas, noAtlas(geo, r), sem);

  // ---- Tapete vermelho: da porta da rua até o gabinete ------------------------
  {
    const z0 = p(CX, 7).z + 0.5; // logo ao sul da frente da ilha
    lotes.add(ouro, caixa(-0.82, 0.82, 0.012, 0.02, z0, FACE.sul - 0.04), sem);
    lotes.add(vermelho, caixa(-0.72, 0.72, 0.012, 0.024, z0 + 0.08, FACE.sul - 0.1), sem);
  }

  // ---- Bandeiras atrás do Secretário -------------------------------------------
  if (postas.has("bandeiras")) {
    const c = p(CX, 4).add(p(CX + 1, 4)).multiplyScalar(0.5);
    const z = c.z + 0.1;
    lotes.add(M.madeira, caixa(c.x - 1.05, c.x + 1.05, 0, 0.1, z - 0.24, z + 0.24));
    lotes.add(ouro, caixa(c.x - 1.07, c.x + 1.07, 0.1, 0.12, z - 0.26, z + 0.26), sem);
    // Ordem de quem olha do sul: Rondônia, Brasil (centro e mais alta), Porto Velho.
    const mastros = [
      { x: c.x - 0.86, alt: 2.5, r: R.rondonia },
      { x: c.x - 0.2, alt: 2.72, r: R.brasil },
      { x: c.x + 0.46, alt: 2.5, r: R.portoVelho },
    ];
    const fw = 0.6;
    const fh = fw * 0.7;
    const segs = lite ? 4 : 10;
    for (const m of mastros) {
      lotes.add(M.metal, cil(0.11, 0.13, 0.06, m.x, 0.15, z));
      lotes.add(M.metal, cil(0.016, 0.016, m.alt, m.x, 0.12 + m.alt / 2, z, lite ? 5 : 8));
      lotes.add(ouro, new THREE.ConeGeometry(0.035, 0.12, lite ? 4 : 8).translate(m.x, 0.12 + m.alt + 0.06, z));
      lotes.add(ouro, cil(0.025, 0.025, 0.03, m.x, 0.12 + m.alt, z, 6));
      // Bandeira com ondulação leve (fixa), presa no mastro e voando para leste.
      const geo = new THREE.PlaneGeometry(fw, fh, segs, 1).translate(fw / 2, 0, 0);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i) / fw;
        pos.setZ(i, Math.sin(u * Math.PI * 1.6) * 0.045 * u);
        pos.setY(i, pos.getY(i) - u * 0.04);
      }
      geo.computeVertexNormals();
      noAtlas(geo, m.r).translate(m.x + 0.018, 0.12 + m.alt - 0.05 - fh / 2, z);
      lotes.add(atlas, geo, { cast: !lite });
      // Verso liso (mesma malha com as faces invertidas): não some de lado.
      lotes.add(azulEsc, inverter(geo), sem);
    }
  }

  // ---- Brasão SEMFAZ em relevo + livro de visitas ------------------------------
  if (postas.has("brasao")) {
    const t = p(CX - 1, 1);
    const x = t.x + 0.02;
    const zw = FACE.norte;
    const forma = (s) => {
      const sh = new THREE.Shape();
      const w = 0.33 * s;
      sh.moveTo(-w, 0.42 * s);
      sh.lineTo(-w * 0.55, 0.36 * s);
      sh.lineTo(0, 0.44 * s);
      sh.lineTo(w * 0.55, 0.36 * s);
      sh.lineTo(w, 0.42 * s);
      sh.lineTo(w, -0.05 * s);
      sh.quadraticCurveTo(w * 0.95, -0.32 * s, 0, -0.44 * s);
      sh.quadraticCurveTo(-w * 0.95, -0.32 * s, -w, -0.05 * s);
      sh.closePath();
      return sh;
    };
    const yb = 1.58;
    const ext = (s, prof) => new THREE.ExtrudeGeometry(forma(s), { depth: prof, bevelEnabled: false, curveSegments: lite ? 3 : 6 });
    lotes.add(ouro, ext(1.1, 0.04).translate(x, yb, zw), sem);
    lotes.add(azulEsc, ext(1, 0.07).translate(x, yb, zw), sem);
    // Face com o desenho (uv da forma → região do brasão no atlas).
    const face = new THREE.ShapeGeometry(forma(1), lite ? 3 : 6);
    face.computeBoundingBox();
    const bb = face.boundingBox;
    const uv = face.attributes.uv;
    const pos = face.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
    arte(face.translate(x, yb, zw + 0.071), R.brasao);
    // Fita dourada com o nome, sob o escudo.
    lotes.add(ouro, caixa(x - 0.44, x + 0.44, yb - 0.6, yb - 0.44, zw, zw + 0.06), sem);
    for (const s of [-1, 1]) {
      lotes.add(liso(mix(pv("yellow-600"), pv("yellow-800"), 0.4)), caixa(x + s * 0.44 - (s > 0 ? 0 : 0.1), x + s * 0.44 + (s > 0 ? 0.1 : 0), yb - 0.64, yb - 0.48, zw, zw + 0.04), sem);
    }
    arte(new THREE.PlaneGeometry(0.84, 0.15).translate(x, yb - 0.52, zw + 0.062), R.faixa);
    // Pedestal com o livro de visitas aberto.
    const zp = t.z - 0.05;
    lotes.add(M.madeira, cil(0.14, 0.17, 0.9, x, 0.45, zp));
    lotes.add(M.madeira, caixa(x - 0.25, x + 0.25, 0.9, 0.95, zp - 0.18, zp + 0.18));
    lotes.add(azul, caixa(x - 0.21, x + 0.21, 0.95, 0.97, zp - 0.13, zp + 0.13), sem);
    lotes.add(branco, caixa(x - 0.19, x - 0.01, 0.97, 0.99, zp - 0.11, zp + 0.11), sem);
    lotes.add(branco, caixa(x + 0.01, x + 0.19, 0.97, 0.99, zp - 0.11, zp + 0.11), sem);
    lotes.add(M.escuro, caixa(x + 0.04, x + 0.17, 0.995, 1.005, zp + 0.02, zp + 0.035), sem);
  }

  // ---- Diretório dos andares (ao lado do elevador) -----------------------------
  if (postas.has("diretorio")) {
    const t = p(CX + 2, 1);
    const x = t.x - 0.02;
    const zw = FACE.norte;
    const w = 0.82;
    const h = w * (R.diretorio.h / R.diretorio.w);
    const y0 = 0.72;
    lotes.add(M.caixilho, caixa(x - w / 2 - 0.04, x + w / 2 + 0.04, y0 - 0.04, y0 + h + 0.04, zw, zw + 0.07));
    for (const s of [-1, 1]) lotes.add(M.caixilho, caixa(x + s * 0.3 - 0.03, x + s * 0.3 + 0.03, 0, y0, zw + 0.02, zw + 0.08));
    lotes.add(ouro, caixa(x - w / 2 - 0.04, x + w / 2 + 0.04, y0 + h + 0.04, y0 + h + 0.07, zw, zw + 0.08), sem);
    arte(new THREE.PlaneGeometry(w, h).translate(x, y0 + h / 2, zw + 0.072), R.diretorio);
  }

  // ---- Expositor da Carta de Serviços ------------------------------------------
  if (postas.has("carta")) {
    const c = p(CX + 6, 4);
    // Mais baixo que um painel de parede: quem passa atrás (y = 3) continua
    // visível na câmera do jogo.
    const w = 2.1;
    const h = w * (R.carta.h / R.carta.w);
    const y0 = 0.3;
    const z = c.z;
    lotes.add(azul, caixa(c.x - w / 2 - 0.06, c.x + w / 2 + 0.06, y0 - 0.06, y0 + h + 0.06, z - 0.05, z + 0.03));
    lotes.add(ouro, caixa(c.x - w / 2 - 0.06, c.x + w / 2 + 0.06, y0 + h + 0.06, y0 + h + 0.09, z - 0.05, z + 0.04), sem);
    for (const s of [-1, 1]) {
      const px = c.x + s * (w / 2 - 0.15);
      lotes.add(M.caixilho, caixa(px - 0.035, px + 0.035, 0, y0, z - 0.04, z + 0.02));
      lotes.add(M.caixilho, caixa(px - 0.05, px + 0.05, 0, 0.04, z - 0.32, z + 0.32));
    }
    arte(new THREE.PlaneGeometry(w, h).translate(c.x, y0 + h / 2, z + 0.032), R.carta);
    // Porta-folhetos aos pés do expositor.
    lotes.add(M.caixilho, caixa(c.x - 0.3, c.x + 0.3, 0, 0.18, z + 0.05, z + 0.17));
    for (let i = 0; i < 3; i++) {
      const fx = c.x - 0.2 + i * 0.2;
      lotes.add([azul, verde, branco][i], caixa(fx - 0.075, fx + 0.075, 0.1, 0.28, z + 0.09, z + 0.12), sem);
    }
  }

  // ---- Totem de autoatendimento -------------------------------------------------
  if (postas.has("totem")) {
    const t = p(CX + 5, 9);
    const z = t.z;
    lotes.add(M.escuro, caixa(t.x - 0.3, t.x + 0.3, 0, 0.05, z - 0.25, z + 0.25));
    lotes.add(azul, caixa(t.x - 0.24, t.x + 0.24, 0.05, 1.5, z - 0.18, z + 0.08));
    lotes.add(ouro, caixa(t.x - 0.245, t.x + 0.245, 1.5, 1.53, z - 0.185, z + 0.085), sem);
    // Tela inclinada (atlas), leitor de cartão e saída do comprovante.
    const tela = new THREE.PlaneGeometry(0.4, 0.4 * (R.totem.h / R.totem.w));
    const m = new THREE.Matrix4().makeRotationX(-0.28).setPosition(t.x, 1.18, z + 0.1);
    lotes.add(M.escuro, caixa(-0.23, 0.23, -0.17, 0.17, -0.03, 0).applyMatrix4(m));
    lotes.add(atlas, noAtlas(tela, R.totem).translate(0, 0, 0.002).applyMatrix4(m), sem);
    lotes.add(M.escuro, caixa(t.x - 0.12, t.x + 0.12, 0.82, 0.86, z + 0.08, z + 0.12), sem);
    lotes.add(M.escuro, caixa(t.x - 0.08, t.x + 0.08, 0.62, 0.7, z + 0.08, z + 0.1), sem);
    lotes.add(branco, caixa(t.x - 0.05, t.x + 0.05, 0.6, 0.64, z + 0.09, z + 0.13), sem);
  }

  // ---- Mesa de reunião do Gabinete ----------------------------------------------
  if (postas.has("reuniao")) {
    const c = p(CX - 5, 4).add(p(CX - 4, 5)).multiplyScalar(0.5);
    const { x: cx, z: cz } = c;
    lotes.add(M.passadeira, caixa(cx - 1.85, cx + 1.85, 0, 0.012, cz - 0.95, cz + 0.95), sem);
    lotes.add(M.tapeteChefe, caixa(cx - 1.75, cx + 1.75, 0.012, 0.018, cz - 0.85, cz + 0.85), sem);
    lotes.add(M.madeira, caixa(cx - 1.2, cx + 1.2, 0.68, 0.74, cz - 0.5, cz + 0.5));
    lotes.add(M.escuro, caixa(cx - 0.85, cx + 0.85, 0.02, 0.68, cz - 0.08, cz + 0.08));
    lotes.add(M.escuro, caixa(cx - 0.95, cx + 0.95, 0, 0.03, cz - 0.35, cz + 0.35), sem);
    const cadeira = (x, z, rot) => {
      const pcs = [
        [M.estofado, caixa(-0.2, 0.2, 0.36, 0.45, -0.18, 0.18)],
        [M.estofado, caixa(-0.2, 0.2, 0.45, 0.9, 0.15, 0.21)],
        [M.escuro, cil(0.025, 0.025, 0.36, 0, 0.18, 0, 6)],
        [M.escuro, cil(0.17, 0.17, 0.03, 0, 0.015, 0)],
      ];
      for (const [mat, geo] of pcs) lotes.add(mat, colocar(geo, x, z, rot));
    };
    for (const sx of [-0.75, 0, 0.75]) {
      cadeira(cx + sx, cz - 0.78, Math.PI);
      cadeira(cx + sx, cz + 0.78, 0);
    }
    cadeira(cx - 1.5, cz, -Math.PI / 2);
    cadeira(cx + 1.5, cz, Math.PI / 2);
    // Jarra d'água, copos, pastas e uma bandeirinha de mesa.
    lotes.add(M.agua, cil(0.06, 0.07, 0.22, cx, 0.85, cz), sem);
    for (const [dx, dz] of [[-0.25, 0.2], [0.25, -0.2], [0.6, 0.22], [-0.6, -0.22]]) lotes.add(M.agua, cil(0.03, 0.025, 0.08, cx + dx, 0.78, cz + dz, 6), sem);
    lotes.add(azul, caixa(cx - 0.8, cx - 0.5, 0.74, 0.76, cz + 0.12, cz + 0.36), sem);
    lotes.add(parda, caixa(cx + 0.45, cx + 0.75, 0.74, 0.77, cz - 0.38, cz - 0.14), sem);
    lotes.add(branco, caixa(cx + 0.1, cx + 0.32, 0.74, 0.745, cz + 0.12, cz + 0.36), sem);
    lotes.add(M.metal, cil(0.004, 0.004, 0.22, cx - 0.98, 0.85, cz, 5), sem);
    lotes.add(M.escuro, cil(0.04, 0.045, 0.02, cx - 0.98, 0.75, cz, 6), sem);
    arte(new THREE.PlaneGeometry(0.12, 0.084).translate(cx - 0.98 + 0.062, 0.92, cz), R.brasil);
  }

  // ---- Balcão do Protocolo -------------------------------------------------------
  if (postas.has("protocolo")) {
    const c = p(CX - 6, 9);
    const { x: cx } = c;
    const cz = c.z - 0.05;
    const W2 = 1.3;
    // Balcão: corpo de madeira, tampo alto de atendimento, rodapé escuro.
    lotes.add(M.madeira, caixa(cx - W2, cx + W2, 0.06, 1.0, cz - 0.08, cz + 0.3));
    lotes.add(M.escuro, caixa(cx - W2 + 0.03, cx + W2 - 0.03, 0, 0.06, cz - 0.05, cz + 0.27), sem);
    lotes.add(M.madeiraClara, caixa(cx - W2 - 0.04, cx + W2 + 0.04, 1.0, 1.04, cz - 0.12, cz + 0.4));
    lotes.add(azul, caixa(cx - W2, cx + W2, 0.88, 0.94, cz + 0.3, cz + 0.31), sem);
    arte(new THREE.PlaneGeometry(1.9, 1.9 * (R.protocolo.h / R.protocolo.w)).translate(cx, 0.52, cz + 0.302), R.protocolo);
    // Mesa de trabalho por trás, com monitor e cadeira.
    lotes.add(M.madeiraClara, caixa(cx - W2 + 0.05, cx + W2 - 0.05, 0.7, 0.74, cz - 0.6, cz - 0.08));
    // Monitor virado para quem trabalha (norte), de costas para o público.
    lotes.add(M.escuro, caixa(cx - 0.75, cx - 0.35, 0.78, 1.02, cz - 0.3, cz - 0.27));
    lotes.add(M.escuro, caixa(cx - 0.58, cx - 0.52, 0.74, 0.8, cz - 0.29, cz - 0.24));
    lotes.add(liso(pal.screen), caixa(cx - 0.73, cx - 0.37, 0.8, 1.0, cz - 0.305, cz - 0.3), sem);
    lotes.add(M.estofado, caixa(cx - 0.75, cx - 0.35, 0.4, 0.48, cz - 1.0, cz - 0.62));
    lotes.add(M.estofado, caixa(cx - 0.75, cx - 0.35, 0.48, 0.9, cz - 1.06, cz - 1.0));
    lotes.add(M.escuro, cil(0.025, 0.025, 0.4, cx - 0.55, 0.2, cz - 0.82, 6));
    // No tampo: carrossel com três carimbos, almofada de tinta e a bandeja
    // de processos (pastas com capa colorida e papéis).
    const kx = cx - 0.85;
    const kz = cz + 0.12;
    lotes.add(M.metal, cil(0.12, 0.12, 0.02, kx, 1.05, kz));
    lotes.add(M.metal, cil(0.012, 0.012, 0.14, kx, 1.12, kz, 6));
    lotes.add(M.metal, cil(0.1, 0.1, 0.015, kx, 1.19, kz));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.4;
      const sx = kx + Math.cos(a) * 0.08;
      const sz = kz + Math.sin(a) * 0.08;
      lotes.add(M.escuro, caixa(sx - 0.03, sx + 0.03, 1.2, 1.22, sz - 0.02, sz + 0.02), sem);
      lotes.add(M.madeira, cil(0.008, 0.008, 0.07, sx, 1.255, sz, 5), sem);
      lotes.add([vermelho, azul, verde][i], new THREE.SphereGeometry(0.022, lite ? 5 : 8, lite ? 3 : 5).translate(sx, 1.3, sz), sem);
    }
    lotes.add(M.escuro, caixa(cx - 0.6, cx - 0.42, 1.04, 1.06, cz + 0.08, cz + 0.2), sem);
    lotes.add(azul, caixa(cx - 0.585, cx - 0.435, 1.06, 1.062, cz + 0.095, cz + 0.185), sem);
    // Carimbo solto, deitado no tampo.
    lotes.add(M.escuro, caixa(cx - 0.3, cx - 0.24, 1.04, 1.07, cz + 0.12, cz + 0.16), sem);
    lotes.add(M.madeira, caixa(cx - 0.3, cx - 0.17, 1.045, 1.065, cz + 0.13, cz + 0.15), sem);
    // Bandeja (bordas de metal) com pilha de processos.
    const bx = cx + 0.55;
    const bz = cz + 0.12;
    lotes.add(M.metal, caixa(bx - 0.26, bx + 0.26, 1.04, 1.05, bz - 0.19, bz + 0.19), sem);
    for (const [a, b, c2, d] of [[-0.26, 0.26, -0.19, -0.17], [-0.26, 0.26, 0.17, 0.19], [-0.26, -0.24, -0.19, 0.19], [0.24, 0.26, -0.19, 0.19]]) {
      lotes.add(M.metal, caixa(bx + a, bx + b, 1.04, 1.1, bz + c2, bz + d), sem);
    }
    const capas = [parda, azul, parda, verde, parda, vermelho];
    capas.forEach((mat, i) => {
      const y = 1.05 + i * 0.022;
      const dx = Math.sin(i * 2.1) * 0.02;
      lotes.add(mat, caixa(bx - 0.21 + dx, bx + 0.21 + dx, y, y + 0.012, bz - 0.15, bz + 0.15), sem);
      lotes.add(branco, caixa(bx - 0.2 + dx, bx + 0.19 + dx, y + 0.012, y + 0.02, bz - 0.14, bz + 0.14), sem);
    });
    // Escaninho de processos encostado atrás (linha de cima, y = 8).
    const e = p(CX - 6, 8);
    const ez = e.z - 0.3;
    const EW = 1.35;
    const alt = 1.0; // baixo: não esconde quem passa atrás (y = 7)
    const mad = [
      caixa(-EW, EW, 0, 0.08, -0.2, 0.2),
      caixa(-EW, EW, alt - 0.04, alt, -0.2, 0.2),
      caixa(-EW, EW, 0, alt, -0.2, -0.17),
    ];
    for (let i = 0; i <= 6; i++) mad.push(caixa(-EW + (i * 2 * EW) / 6 - 0.02, -EW + (i * 2 * EW) / 6 + 0.02, 0, alt, -0.2, 0.2));
    mad.push(caixa(-EW, EW, 0.5, 0.54, -0.2, 0.2));
    for (const g of mad) lotes.add(M.madeira, g.translate(cx, 0, ez));
    // Pastas em pé nos nichos (cores alternadas, alturas variadas).
    const rnd = ctx.rand;
    for (const [y0, y1] of [[0.08, 0.48], [0.56, 0.94]]) {
      for (let i = 0; i < 6; i++) {
        const x0 = cx - EW + (i * 2 * EW) / 6 + 0.04;
        let x = x0;
        const n = 2 + Math.floor(rnd() * 3);
        for (let k = 0; k < n; k++) {
          const lw = 0.05 + rnd() * 0.04;
          const lh = (y1 - y0) * (0.65 + rnd() * 0.25);
          lotes.add(capas[(i + k) % capas.length], caixa(x, x + lw, y0, y0 + lh, ez - 0.15, ez + 0.14), sem);
          x += lw + 0.012;
        }
      }
    }
  }

  // ---- Painel de senhas suspenso sobre a recepção --------------------------------
  const recep = plano.decor.find((d) => d.tipo === "recepcao");
  let painel = null;
  if (recep) {
    const t = p(recep.x, recep.y);
    const canvas = makeCanvas(512, 200);
    const estado = { n: 23, guiche: 2, t: 0 };
    desenharSenha(canvas, pal, estado.n, estado.guiche);
    const tex = track(canvasTexture(canvas));
    const matTela = track(new THREE.MeshStandardMaterial({ map: tex, emissive: white, emissiveMap: tex, emissiveIntensity: lite ? 0.55 : 0.45, roughness: 0.4 }));
    const w = 1.2;
    const h = w * (200 / 512);
    const y = 2.05;
    const z = t.z - 0.25;
    lotes.add(M.escuro, caixa(t.x - w / 2 - 0.04, t.x + w / 2 + 0.04, y - h / 2 - 0.04, y + h / 2 + 0.04, z - 0.06, z), sem);
    for (const s of [-1, 1]) lotes.add(M.caixilho, caixa(t.x + s * 0.4 - 0.006, t.x + s * 0.4 + 0.006, y + h / 2 + 0.04, ctx.H, z - 0.036, z - 0.024), sem);
    const tela = new THREE.Mesh(track(new THREE.PlaneGeometry(w, h)), matTela);
    tela.position.set(t.x, y, z + 0.002);
    root.add(tela);
    painel = { canvas, tex, estado };
    document.fonts?.ready.then(() => {
      if (!vivo) return;
      desenharSenha(canvas, pal, estado.n, estado.guiche);
      tex.needsUpdate = true;
    });
  }

  return {
    update(t, dt) {
      if (!painel || reducedMotion) return;
      const e = painel.estado;
      e.t += dt;
      if (e.t < 6) return;
      e.t = 0;
      e.n = e.n >= 999 ? 1 : e.n + 1;
      e.guiche = 1 + (e.n % 4);
      desenharSenha(painel.canvas, pal, e.n, e.guiche);
      painel.tex.needsUpdate = true;
    },
    dispose() {
      vivo = false;
    },
  };
}

export const terreo = { planejar, construir };
