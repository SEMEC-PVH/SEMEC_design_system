// Pista de bicicleta da Vila SEMEC: utilitários comuns e o contrato dos módulos.
//
// A cena da pista é montada por módulos, cada um dono de um arquivo e de
// uma zona do mapa (zonas.js): tracado.js, beira.js, arquibancadas.js,
// vila.js e paisagem.js. O núcleo (index.js) cria o `ctx` abaixo, chama
// cada `montarX(ctx)` (nesta ordem, cada um num try/catch: um módulo que
// quebra não derruba a corrida) e fecha os lotes compartilhados no fim.
//
// ---- Contrato: o que o módulo recebe (ctx) -------------------------------------
//   pal, pv, mix, white     paleta (SÓ tokens: pv("blue-700"), mix(a, b, t))
//   cor                     cores prontas da pista (criarCores, abaixo)
//   lite, reducedMotion     qualidade baixa (menos objetos, sem sombra extra)
//                           e sem animação (pose parada)
//   c                       o circuito (montarCircuito): pts, checkpoints,
//                           distancia(x, y), corredor(px, py), andavel, box…
//   pts, checkpoints, N     atalhos de c (N = nº de checkpoints)
//   portico                 { fx, fyN, fyS, alt }: pórtico da chegada (tiles)
//   zonas                   criarZonas(c): ZONAS, dono(x, y), naZona(dono|id,
//                           x, y), livre(x, y, raio), alturaMax(x, y)
//   scene, root             a cena e o grupo onde tudo entra (root.add)
//   track(x)                registra geometria/material/textura para o
//                           dispose (devolve x). TUDO que criar passa aqui.
//   semente(n)              gerador pseudoaleatório com semente (use a sua:
//                           o mapa sai sempre igual e não embaralha o vizinho)
//   lote, add(geo, cor)     lote compartilhado de cor por vértice (1 draw
//                           call para todos os objetos fixos; sombra se !lite)
//   atlas, regioes          lote compartilhado de uv no atlas de canvas e as
//                           regiões: semec, box, faixa, regras, xadrez,
//                           n1..n5, pista
//   placa(reg, x, y, h, w, alt, { giro, deFrente })   plano com uma região
//   bandeira(x, y, h, giro) bandeira quadriculada ondulada (atlas)
//   matInst                 material de cor por vértice dos instanciados
//   vertexColored(partes)   [[geo, cor], …] → uma geometria com cor por vértice
//   instanciar(geo, lista, { cast })   InstancedMesh em matInst; lista de
//                           { x, z, h?, giro?, s?, cor? } (mundo)
//   reservar(x0, x1, y0, y1)           tiles (inclusivos) ocupados
//   reservarArea(x, y, rx, ry)         área contínua |dx| < rx, |dy| < ry
//   ocupado(x, y)           asfalto/box andável ou algo já reservado (quem
//                           monta depois desvia de quem montou antes)
//   soltar(origem, n, opts) faíscas/fogos do pool de partículas do núcleo
//   coresFaisca, coresFogos
//   carregar(promise)       registra uma carga (GLB etc.): a tela de
//                           carregamento espera por ela (pista.pronto /
//                           pista.progresso)
//   loader, baseUrl         GLTFLoader do motor e a pasta dos .glb (pode ser
//                           null fora do jogo: confira antes de usar)
//   jogador()               posição viva do jogador (Vector3) ou null
//
// ---- Contrato: o que o módulo devolve -----------------------------------------
//   { update?(t, dt), festa?(), largada?(fase), passou?(i), setProximo?(i),
//     abrirPorta?(k), dispose?() } — tudo opcional; o núcleo repassa os
//   eventos da corrida a todos. dispose só para o que não passou por track
//   (InstancedMesh em root já são descartados pelo núcleo).
//
// Regras: cores só de tokens; nada no traçado nem acima de alturaMax (a
// câmera vem do sul, alta); lotes e InstancedMesh, low-poly; respeitar
// `lite` e `reducedMotion`.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { MH, MW, PORTAO } from "./circuito";

// Ângulo da câmera do motor (CAM_OFFSET = (0, 10.5, 9)): placas "de frente
// para a câmera" giram isto em X.
export const ANG_CAM = Math.atan2(10.5, 9);

// Tile (contínuo) → mundo: o centro do tile (x, y) cai em (x - MW/2 + 0.5, z).
export const wx = (x) => x - MW / 2 + 0.5;
export const wz = (y) => y - MH / 2 + 0.5;
export const tileToWorld = (x, y) => new THREE.Vector3(wx(x), 0, wz(y));

export const chave = (x, y) => `${x},${y}`;

// Gramado além da borda do mapa (horizonte), em tiles.
export const MARGEM = 26;
// Vão do portão do box (x em tile): a estradinha de terra e a cerca.
export const GX0 = PORTAO[0][0] - 0.6;
export const GX1 = PORTAO.at(-1)[0] + 0.6;

// Ponto ao lado da linha central: p = amostra de c.pts, d = distância
// (positiva para a esquerda da tangente na tela).
export const lado = (p, d) => [p.x - p.ty * d, p.y + p.tx * d];

// Pórtico de largada/chegada (tiles): pilares fora da pista no último
// checkpoint, o norte no gramado e o sul em cima do muro.
export function geometriaPortico(checkpoints) {
  const cpF = checkpoints[checkpoints.length - 1];
  return {
    fx: cpF.tiles[0][0],
    fyN: cpF.tiles[0][1] - 0.5 - 0.75,
    fyS: cpF.tiles.at(-1)[1] + 0.5 + 0.75,
    alt: 2.5,
  };
}

// Gerador pseudoaleatório com semente (o mapa sai sempre igual).
export function semente(s) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- Lotes: muitas geometrias pequenas → uma malha por material ---------------
// Cor por vértice (lote "liso") ou uv remapeado para uma região do atlas.
export function criarLote({ uv = false } = {}) {
  const geos = [];
  return {
    add(geo, corOuRegiao, matriz) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      geo.dispose();
      if (matriz) g.applyMatrix4(matriz);
      if (!g.attributes.normal) g.computeVertexNormals();
      const n = g.attributes.position.count;
      if (uv) {
        const r = corOuRegiao;
        const a = g.attributes.uv;
        for (let i = 0; i < n; i++) a.setXY(i, r.u0 + a.getX(i) * (r.u1 - r.u0), r.v0 + a.getY(i) * (r.v1 - r.v0));
      } else {
        g.deleteAttribute("uv");
        const c = corOuRegiao;
        const cores = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) cores.set([c.r, c.g, c.b], i * 3);
        g.setAttribute("color", new THREE.BufferAttribute(cores, 3));
      }
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "color", "uv"].includes(k)) g.deleteAttribute(k);
      geos.push(g);
    },
    fechar(material) {
      if (!geos.length) return null;
      const geo = mergeGeometries(geos, false);
      for (const g of geos) g.dispose();
      geos.length = 0;
      return new THREE.Mesh(geo, material);
    },
  };
}

// [[geo, cor], …] → uma geometria só, com cor por vértice (para instanciar).
export function vertexColored(partes) {
  const l = criarLote();
  for (const [g, cr] of partes) l.add(g, cr);
  const m = l.fechar(null);
  return m.geometry;
}

// Caixa pelos limites em coordenadas de tile (x0..x1, y0..y1) e altura h0..h1.
export function caixa(x0, x1, h0, h1, y0, y1) {
  const g = new THREE.BoxGeometry(x1 - x0, h1 - h0, y1 - y0);
  g.translate(wx((x0 + x1) / 2), (h0 + h1) / 2, wz((y0 + y1) / 2));
  return g;
}

// Quadrilátero no chão (4 pontos [x, y] em tile, em volta, altura h) como 2
// triângulos não indexados, sempre com a frente para cima (o material é
// DoubleSide, mas a face de trás inverteria a normal e escureceria).
export function quadChao(pts, h, out) {
  const [a, b, c, d] = pts.map(([x, y]) => [wx(x), h, wz(y)]);
  const tri = (p, q, r) => {
    // y de (q - p) × (r - p) > 0: frente para cima.
    const ny = (q[2] - p[2]) * (r[0] - p[0]) - (q[0] - p[0]) * (r[2] - p[2]);
    if (ny >= 0) out.push(...p, ...q, ...r);
    else out.push(...p, ...r, ...q);
  };
  tri(a, b, c);
  tri(a, c, d);
}

// Malha de chão a partir de uma lista de quads, com cor por quad.
export function geoChao(quads) {
  const pos = [];
  const cor = [];
  for (const { pts, h, c } of quads) {
    quadChao(pts, h, pos);
    for (let i = 0; i < 6; i++) cor.push(c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(cor, 3));
  const n = new Float32Array(pos.length);
  for (let i = 1; i < n.length; i += 3) n[i] = 1;
  g.setAttribute("normal", new THREE.BufferAttribute(n, 3));
  return g;
}

// Placa (plano com uma região do atlas): centro (x, y) em tile, altura h,
// largura/altura em unidades; `giro` em Y; `deFrente` inclina para a câmera.
export function criarPlaca(atlas, regioes) {
  return (regiao, x, y, h, w, alt, { giro = 0, deFrente = false } = {}) => {
    const mt = new THREE.Matrix4().makeTranslation(wx(x), h, wz(y)).multiply(new THREE.Matrix4().makeRotationY(giro));
    if (deFrente) mt.multiply(new THREE.Matrix4().makeRotationX(-ANG_CAM));
    atlas.add(new THREE.PlaneGeometry(w, alt), regioes[regiao], mt);
  };
}

// Bandeira quadriculada ondulada (atlas), presa pela borda esquerda no
// ponto (x, y) em tile, altura h.
export function criarBandeira(atlas, regioes) {
  return (x, y, h, giro = 0) => {
    const g = new THREE.PlaneGeometry(0.62, 0.42, 6, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = (p.getX(i) + 0.31) / 0.62;
      p.setZ(i, Math.sin(u * Math.PI * 1.6) * 0.06 * u);
    }
    g.computeVertexNormals();
    const mt = new THREE.Matrix4().makeTranslation(wx(x), h, wz(y)).multiply(new THREE.Matrix4().makeRotationY(giro)).multiply(new THREE.Matrix4().makeTranslation(0.31, 0, 0));
    atlas.add(g, regioes.xadrez, mt);
  };
}

// ---- Cores (todas de tokens) --------------------------------------------------------
export function criarCores(pal) {
  const { pv, mix } = pal;
  const white = pv("white");
  return {
    gramaA: mix(pv("green-600"), pv("green-500"), 0.35),
    gramaB: mix(pv("green-600"), pv("green-700"), 0.3),
    gramaFora: mix(pv("green-700"), pv("green-600"), 0.4),
    asfalto: mix(mix(pv("gray-600"), pv("gray-700"), 0.45), pv("gray-400"), 0.12),
    asfaltoBox: mix(pv("gray-300"), pv("gray-200"), 0.5),
    linha: mix(white, pv("gray-100"), 0.3),
    zebraV: pv("red-600"),
    zebraB: white,
    terra: mix(pv("yellow-800"), pv("gray-400"), 0.45),
    concreto: pv("gray-300"),
    concretoClaro: pv("gray-100"),
    metal: pv("gray-600"),
    escuro: pv("gray-800"),
    pneu: mix(pv("black"), pv("gray-700"), 0.3),
    azul: pv("blue-700"),
    azulEsc: pv("blue-900"),
    amarelo: pv("yellow-500"),
    vermelho: pv("red-600"),
    madeira: mix(pv("yellow-800"), pv("gray-700"), 0.3),
    folhaA: mix(pv("green-600"), pv("green-700"), 0.45),
    folhaB: mix(pv("green-700"), pv("green-800"), 0.35),
    conifera: mix(pv("green-800"), pv("blue-900"), 0.12),
    pele: [
      mix(mix(pv("yellow-400"), pv("red-200"), 0.55), white, 0.25),
      mix(pv("yellow-800"), pv("red-300"), 0.35),
      mix(pv("yellow-800"), pv("gray-900"), 0.35),
    ],
    camisas: [pv("blue-700"), pv("blue-500"), pv("yellow-500"), pv("red-500"), pv("green-600"), white, pv("blue-900"), pv("red-400")],
  };
}

// ---- Atlas de canvas (placas, faixas, bandeiras, números) ----------------------
export function criarAtlas(pal, lite) {
  const { pv, mix } = pal;
  const W = 1024;
  const H = 512;
  const k = lite ? 0.5 : 1;
  const canvas = document.createElement("canvas");
  canvas.width = W * k;
  canvas.height = H * k;
  const g = canvas.getContext("2d");
  g.scale(k, k);
  const regioes = {};
  const reg = (nome, x, y, w, h) => {
    // Meio texel de folga para não vazar a região vizinha.
    regioes[nome] = { u0: (x + 1) / W, u1: (x + w - 1) / W, v0: 1 - (y + h - 1) / H, v1: 1 - (y + 1) / H };
  };
  const texto = (str, x, y, { tam = 64, peso = 700, cor, max = 1000, alinh = "center" }) => {
    let s = tam;
    g.font = `${peso} ${s}px ${pal.font}`;
    while (g.measureText(str).width > max && s > 10) {
      s -= 2;
      g.font = `${peso} ${s}px ${pal.font}`;
    }
    g.fillStyle = cor.getStyle();
    g.textAlign = alinh;
    g.textBaseline = "middle";
    g.fillText(str, x, y);
  };
  const xadrez = (x, y, w, h, n, m, c1, c2) => {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        g.fillStyle = ((i + j) % 2 ? c2 : c1).getStyle();
        g.fillRect(x + (i * w) / n, y + (j * h) / m, w / n + 0.5, h / m + 0.5);
      }
    }
  };
  const branco = pv("white");
  const preto = pv("gray-950");
  // Placa SEMEC (azul institucional).
  g.fillStyle = pv("blue-700").getStyle();
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = pv("yellow-500").getStyle();
  g.fillRect(0, 112, 512, 16);
  texto("SEMEC", 256, 58, { tam: 88, cor: branco, max: 460 });
  reg("semec", 0, 0, 512, 128);
  // BOX SEMEC (amarelo, letra escura).
  g.fillStyle = pv("yellow-500").getStyle();
  g.fillRect(512, 0, 512, 128);
  xadrez(512, 0, 512, 14, 32, 1, preto, branco);
  texto("BOX SEMEC", 768, 70, { tam: 72, cor: pv("gray-900"), max: 470 });
  reg("box", 512, 0, 512, 128);
  // Faixa do pórtico: LARGADA · CHEGADA entre dois quadriculados.
  g.fillStyle = pv("blue-900").getStyle();
  g.fillRect(0, 128, 1024, 128);
  xadrez(0, 128, 128, 128, 4, 4, preto, branco);
  xadrez(896, 128, 128, 128, 4, 4, preto, branco);
  texto("LARGADA · CHEGADA", 512, 194, { tam: 70, cor: branco, max: 740 });
  reg("faixa", 0, 128, 1024, 128);
  // Quadro de regras (no box).
  g.fillStyle = mix(pv("gray-50"), branco, 0.5).getStyle();
  g.fillRect(0, 256, 256, 256);
  g.fillStyle = pv("blue-700").getStyle();
  g.fillRect(0, 256, 256, 52);
  texto("REGRAS", 128, 283, { tam: 36, cor: branco, max: 230 });
  const linhas = ["2 voltas", "Passe nos arcos", "na ordem", "O arco que brilha", "é o próximo"];
  linhas.forEach((l, i) => texto(l, 128, 334 + i * 34, { tam: 24, peso: i === 0 ? 700 : 500, cor: pv("gray-900"), max: 236 }));
  reg("regras", 0, 256, 256, 256);
  // Bandeira quadriculada.
  xadrez(256, 256, 256, 256, 6, 6, preto, branco);
  reg("xadrez", 256, 256, 256, 256);
  // Números dos arcos (1..5) e a placa do "SEMEC" curta para os arcos.
  for (let i = 0; i < 5; i++) {
    const x = 512 + i * 100;
    g.fillStyle = pv("blue-900").getStyle();
    g.beginPath();
    g.roundRect(x + 2, 258, 96, 96, 18);
    g.fill();
    texto(String(i + 1), x + 50, 308, { tam: 64, cor: pv("yellow-400") });
    reg(`n${i + 1}`, x, 256, 100, 100);
  }
  // Placa "VILA SEMEC · PISTA" (para a garagem e a cerca).
  g.fillStyle = pv("green-700").getStyle();
  g.fillRect(512, 384, 512, 128);
  texto("PISTA VILA SEMEC", 768, 448, { tam: 60, cor: branco, max: 470 });
  reg("pista", 512, 384, 512, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, regioes };
}
