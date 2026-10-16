// Pista de bicicleta da Vila SEMEC: a corrida, numa cena própria.
//
// Mesmo contrato dos interiores (predio/escritorio.js e scene/museu/index.js):
// o motor (vila-engine.js) cria isto, troca a cena renderizada e passa a usar
// `passable`/`tileToWorld` daqui para o jogador. Chega-se pelo portão do box
// (entradaRua = chegada, com o portão logo atrás) e sai-se pisando no portão
// (saidaEm → "rua", que o motor trata como "voltar para a Vila").
//
// O traçado (grade, checkpoints, box) está em ./circuito.js, puro e testável;
// aqui fica o 3D. Croqui do circuito com as peças (86 × 56 tiles; sentido →,
// anti-horário na tela; o mapa exato, tile a tile, está no topo de circuito.js):
//
//   x →     10        20        30        40        50        60        70        80
//   y  7         ###########3###                                                       3 = arco "alto"
//      9       ###           ####                                ######1####           1 = arco "grampo"
//     12      ##                ###                           ####          ####
//     16     ###                 ##                           ##              ###
//     20     ###  (S)            ##                          ###               ###
//     24      ###                ###                         ##                 ##
//     28     ###                  ###                       ###                 ##
//     30    ##4##                  ####     ("U")         ###                   ##       4 = arco "esse"
//     33    ###                      ####2##########    ####                   #0#    2 = "vale", 0 = "subida"
//     36    ###                        ##########                              ##
//     40     ###     AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA                         ###      A = arquibancada
//     44      #####   f   f   f  T f   f   f   f                    ######             f = bandeira, T = semáforo
//     47        ####################F#L######################################          F = chegada (pórtico), L = largada
//     49                  ===========...======                                         = = muro dos boxes, ... = abertura
//     50                  B R :::: BOX ::::  GGGGG                                     B = bancada, R = placa das regras, G = garagem
//     54                  =========PP=========                                          P = portão (volta para a Vila)
//
// Peças:
//   - chão (1 draw call): gramado em faixas de corte, asfalto em fita lisa
//     seguindo a Catmull-Rom, zebras vermelho/branco, linhas de borda, faixa
//     quadriculada da chegada, linhas dos checkpoints, piso do box e a
//     estradinha de terra do portão até a borda do mapa;
//   - objetos fixos (1 draw call, cores por vértice): pórtico, muro dos
//     boxes, garagem, bancada, arquibancada, cerca do mapa, mastros, placas;
//   - um atlas de canvas (1 draw call) com tudo que tem texto ou desenho:
//     placas SEMEC, "BOX SEMEC", "LARGADA · CHEGADA", quadro de regras,
//     números dos arcos e as bandeiras quadriculadas;
//   - instanciados: árvores (2 tipos), público (corpo e cabeça), cones,
//     pilhas de pneus, lâmpadas do semáforo, faíscas e confete;
//   - um material por arco de checkpoint (o próximo pulsa), a cortina de luz
//     do próximo arco e o portão (que desliza).
// Medido (renderer.info, já com a passada de sombra): 17–24 draw calls na
// câmera de jogo e ~135 mil triângulos; no `lite` (sem sombras, metade da
// mata de fora e do público, sem pneus nem fogos) 14–17 e ~45 mil.
//
// Uso (motor):
//   const pista = createPista({ pal, lite, reducedMotion });
//   pista.corrida            // { largada, voltas, checkpoints, saidaVila, tilesPorVolta }
//   pista.setProximo(i)      // destaca o arco i (os outros ficam discretos)
//   pista.passou(i)          // faíscas e flash no arco i
//   pista.largada(fase)      // semáforo: null | 3 | 2 | 1 | "vermelho" | "verde"
//   pista.festa()            // confete e fogos (estático com reducedMotion)
//   pista.update(t, dt); pista.dispose();

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { std } from "../../buildings/shared";
import {
  ABERTURA,
  ARQUIBANCADA,
  BANCADA,
  BOX,
  CHEGADA,
  GARAGEM,
  LARGADA,
  LARGURA_ZEBRA,
  MH,
  MURO_Y,
  MW,
  PLACA_REGRAS,
  PORTAO,
  RAIO_ASFALTO,
  medirVolta,
  montarCircuito,
} from "./circuito";

export { MH, MW };

const VOLTAS = 2;
// Câmera: um pouco mais longe que dentro do prédio (de bicicleta, ver adiante).
const ZOOM = 1.18;
// Ângulo da câmera do motor (CAM_OFFSET = (0, 10.5, 9)): placas "de frente
// para a câmera" giram isto em X.
const ANG_CAM = Math.atan2(10.5, 9);

// Tile (contínuo) → mundo: o centro do tile (x, y) cai em (x - MW/2 + 0.5, z).
const wx = (x) => x - MW / 2 + 0.5;
const wz = (y) => y - MH / 2 + 0.5;
export const tileToWorld = (x, y) => new THREE.Vector3(wx(x), 0, wz(y));

const chave = (x, y) => `${x},${y}`;

// Gerador pseudoaleatório com semente (o mapa sai sempre igual).
function semente(s) {
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
function criarLote({ uv = false } = {}) {
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

// Caixa pelos limites em coordenadas de tile (x0..x1, y0..y1) e altura h0..h1.
function caixa(x0, x1, h0, h1, y0, y1) {
  const g = new THREE.BoxGeometry(x1 - x0, h1 - h0, y1 - y0);
  g.translate(wx((x0 + x1) / 2), (h0 + h1) / 2, wz((y0 + y1) / 2));
  return g;
}

// Quadrilátero no chão (4 pontos [x, y] em tile, em volta, altura h) como 2
// triângulos não indexados, sempre com a frente para cima (o material é
// DoubleSide, mas a face de trás inverteria a normal e escureceria).
function quadChao(pts, h, out) {
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
function geoChao(quads) {
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

// ---- Atlas de canvas (placas, faixas, bandeiras, números) ----------------------
function criarAtlas(pal, lite) {
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

export function createPista({ pal, lite = false, reducedMotion = false }) {
  const { pv, mix } = pal;
  const white = pv("white");
  const proprios = [];
  const track = (x) => {
    proprios.push(x);
    return x;
  };
  const rand = semente(20261016);

  const c = montarCircuito();
  const { pts, checkpoints } = c;
  const N = checkpoints.length;

  const scene = new THREE.Scene();
  const root = new THREE.Group();
  scene.add(root);

  // ---- Cores (todas de tokens) ------------------------------------------------------
  const cor = {
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

  // ---- Chão: gramado, asfalto, zebras, linhas, box e estradinha -------------------
  const chao = [];
  const MARGEM = 26; // gramado além da borda do mapa (horizonte)
  // Gramado em faixas de corte (norte-sul, 4 tiles), dentro do mapa; fora,
  // um verde só mais escuro.
  chao.push({ pts: [[-MARGEM, -MARGEM], [MW + MARGEM, -MARGEM], [MW + MARGEM, MH + MARGEM], [-MARGEM, MH + MARGEM]].map(([x, y]) => [x - 0.5, y - 0.5]), h: -0.02, c: cor.gramaFora });
  for (let x = 0; x < MW; x += 4) {
    chao.push({ pts: [[x - 0.5, -0.5], [x + 3.5, -0.5], [x + 3.5, MH - 0.5], [x - 0.5, MH - 0.5]], h: 0, c: (x / 4) % 2 ? cor.gramaA : cor.gramaB });
  }
  // Fita do asfalto (e zebras/linhas) ao longo da linha central.
  const PASSO_FITA = 2; // de 0,2 em 0,2 tile → amostra a cada 0,4
  const lado = (p, d) => [p.x - p.ty * d, p.y + p.tx * d];
  const M = pts.length;
  let acumZebra = 0;
  for (let k = 0; k < M; k += PASSO_FITA) {
    const a = pts[k];
    const b = pts[(k + PASSO_FITA) % M];
    chao.push({ pts: [lado(a, -RAIO_ASFALTO), lado(b, -RAIO_ASFALTO), lado(b, RAIO_ASFALTO), lado(a, RAIO_ASFALTO)], h: 0.02, c: cor.asfalto });
    // Linhas de borda brancas.
    for (const s of [-1, 1]) {
      const d0 = s * (RAIO_ASFALTO - 0.16);
      const d1 = s * (RAIO_ASFALTO - 0.08);
      const q = [lado(a, d0), lado(b, d0), lado(b, d1), lado(a, d1)];
      chao.push({ pts: q, h: 0.025, c: cor.linha });
    }
    // Zebras: alternam a cada ~0,8 tile.
    acumZebra += 0.4;
    const zc = Math.floor(acumZebra / 0.8) % 2 ? cor.zebraV : cor.zebraB;
    for (const s of [-1, 1]) {
      const d0 = s * RAIO_ASFALTO;
      const d1 = s * (RAIO_ASFALTO + LARGURA_ZEBRA);
      chao.push({ pts: [lado(a, d0), lado(b, d0), lado(b, d1), lado(a, d1)], h: 0.03, c: zc });
    }
  }
  // Faixa quadriculada da chegada e linhas brancas dos outros checkpoints,
  // na reta do corte (coluna ou linha da grade), como o arco.
  checkpoints.forEach((cp, i) => {
    const f = cp.faixa;
    const col = cp.eixo === "col";
    const em = (u, v) => (col ? [f.x + u, f.y + v] : [f.x + v, f.y + u]);
    const m = f.meia - 0.04;
    if (i === N - 1) {
      const n = 8;
      for (let j = 0; j < n; j++) {
        for (let r = 0; r < 2; r++) {
          const v0 = -m + (j * 2 * m) / n;
          const v1 = v0 + (2 * m) / n;
          const u0 = -0.4 + r * 0.4;
          chao.push({ pts: [em(u0, v0), em(u0 + 0.4, v0), em(u0 + 0.4, v1), em(u0, v1)], h: 0.035, c: (j + r) % 2 ? pv("gray-950") : white });
        }
      }
    } else {
      chao.push({ pts: [em(-0.12, -m), em(0.12, -m), em(0.12, m), em(-0.12, m)], h: 0.035, c: cor.linha });
    }
  });
  // Marcas da largada: um "colchete" branco atrás da posição de largada.
  {
    const { x, y } = LARGADA;
    chao.push({ pts: [[x - 0.45, y - 0.45], [x - 0.3, y - 0.45], [x - 0.3, y + 0.45], [x - 0.45, y + 0.45]], h: 0.035, c: cor.linha });
    chao.push({ pts: [[x - 0.45, y - 0.45], [x + 0.3, y - 0.45], [x + 0.3, y - 0.33], [x - 0.45, y - 0.33]], h: 0.035, c: cor.linha });
    chao.push({ pts: [[x - 0.45, y + 0.33], [x + 0.3, y + 0.33], [x + 0.3, y + 0.45], [x - 0.45, y + 0.45]], h: 0.035, c: cor.linha });
  }
  // Piso do box (concreto claro) com a abertura até a pista e faixas amarelas.
  chao.push({ pts: [[BOX.x0 - 0.5, MURO_Y + 0.5], [BOX.x1 + 0.5, MURO_Y + 0.5], [BOX.x1 + 0.5, BOX.y1 + 1.5], [BOX.x0 - 0.5, BOX.y1 + 1.5]], h: 0.02, c: cor.asfaltoBox });
  chao.push({ pts: [[ABERTURA[0] - 0.5, MURO_Y - 0.4], [ABERTURA[1] + 0.5, MURO_Y - 0.4], [ABERTURA[1] + 0.5, MURO_Y + 0.5], [ABERTURA[0] - 0.5, MURO_Y + 0.5]], h: 0.022, c: cor.asfaltoBox });
  for (let x = BOX.x0 + 2; x < BOX.x1 - 4; x += 3) {
    chao.push({ pts: [[x - 0.04, BOX.y1 - 1.2], [x + 0.04, BOX.y1 - 1.2], [x + 0.04, BOX.y1 + 0.4], [x - 0.04, BOX.y1 + 0.4]], h: 0.03, c: cor.amarelo });
  }
  chao.push({ pts: [[BOX.x0 + 1, BOX.y0 + 1.45], [BOX.x1 - 5, BOX.y0 + 1.45], [BOX.x1 - 5, BOX.y0 + 1.55], [BOX.x0 + 1, BOX.y0 + 1.55]], h: 0.03, c: cor.amarelo });
  // Estradinha de terra do portão até a borda (o caminho "de volta à Vila").
  const gx0 = PORTAO[0][0] - 0.6;
  const gx1 = PORTAO.at(-1)[0] + 0.6;
  chao.push({ pts: [[gx0, BOX.y1 + 1.5], [gx1, BOX.y1 + 1.5], [gx1 + 0.4, MH + MARGEM], [gx0 - 0.4, MH + MARGEM]], h: 0.01, c: cor.terra });

  const matChao = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide }));
  const geoDoChao = track(geoChao(chao));
  const meshChao = new THREE.Mesh(geoDoChao, matChao);
  meshChao.receiveShadow = !lite;
  root.add(meshChao);

  // ---- Objetos fixos (cor por vértice) e atlas -------------------------------------
  const lote = criarLote();
  const { tex, regioes } = criarAtlas(pal, lite);
  track(tex);
  const atlas = criarLote({ uv: true });
  const add = (geo, cr) => lote.add(geo, cr);

  // Placa (plano com uma região do atlas): centro (x, y) em tile, altura h,
  // largura/altura em unidades; `giro` em Y; `deFrente` inclina para a câmera.
  const placa = (regiao, x, y, h, w, alt, { giro = 0, deFrente = false } = {}) => {
    const mt = new THREE.Matrix4().makeTranslation(wx(x), h, wz(y)).multiply(new THREE.Matrix4().makeRotationY(giro));
    if (deFrente) mt.multiply(new THREE.Matrix4().makeRotationX(-ANG_CAM));
    atlas.add(new THREE.PlaneGeometry(w, alt), regioes[regiao], mt);
  };

  // Pórtico de largada/chegada: dois pilares fora da pista, viga quadriculada
  // por cima e, no pilar norte (fora da pista, não tampa o jogador), a torre
  // com a faixa LARGADA · CHEGADA e o semáforo, virados para a câmera.
  const cpF = checkpoints[N - 1];
  const fx = cpF.tiles[0][0];
  const fyN = cpF.tiles[0][1] - 0.5 - 0.75; // pilar norte
  const fyS = cpF.tiles.at(-1)[1] + 0.5 + 0.75; // pilar sul (em cima do muro)
  const ALT_P = 2.5;
  // Pilares e viga do pórtico vão no material do "arco" da chegada (pulsa
  // quando ela é o próximo checkpoint).
  const arcoGeo = [];
  arcoGeo.push(caixa(fx - 0.14, fx + 0.14, 0, ALT_P, fyN - 0.14, fyN + 0.14));
  arcoGeo.push(caixa(fx - 0.14, fx + 0.14, 0, ALT_P, fyS - 0.14, fyS + 0.14));
  arcoGeo.push(caixa(fx - 0.12, fx + 0.12, ALT_P - 0.05, ALT_P + 0.2, fyN, fyS));
  // Topo da viga quadriculado (visto de cima).
  {
    const g = new THREE.PlaneGeometry(fyS - fyN, 0.26);
    const mt = new THREE.Matrix4().makeTranslation(wx(fx), ALT_P + 0.205, wz((fyN + fyS) / 2)).multiply(new THREE.Matrix4().makeRotationX(-Math.PI / 2)).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
    const r = regioes.xadrez;
    atlas.add(g, { ...r, v1: r.v0 + (r.v1 - r.v0) / 3 }, mt);
  }
  // Torre do semáforo: no gramado ao norte do pilar.
  const TX = fx;
  const TY = fyN - 0.2;
  add(caixa(TX - 0.9, TX + 0.9, ALT_P + 0.2, ALT_P + 1.25, TY - 0.12, TY + 0.06), cor.azulEsc);
  placa("faixa", TX, TY + 0.07, ALT_P + 0.95, 1.7, 0.21);
  // Caixa do semáforo (3 lâmpadas lado a lado, abaixo da faixa).
  add(caixa(TX - 0.62, TX + 0.62, ALT_P + 0.22, ALT_P + 0.72, TY - 0.1, TY + 0.08), pv("gray-950"));

  // Muro dos boxes (com abertura), paredes do box e o portão.
  const muro = (x0, x1, y0, y1, h = 0.6) => {
    add(caixa(x0, x1, 0, h, y0, y1), cor.concretoClaro);
    add(caixa(x0, x1, h, h + 0.08, y0, y1), cor.vermelho);
  };
  muro(BOX.x0 - 0.5, ABERTURA[0] - 0.5, MURO_Y - 0.2, MURO_Y + 0.2);
  muro(ABERTURA[1] + 0.5, BOX.x1 + 0.5, MURO_Y - 0.2, MURO_Y + 0.2);
  muro(BOX.x0 - 0.7, BOX.x0 - 0.5, MURO_Y - 0.2, BOX.y1 + 1.5, 0.5);
  muro(BOX.x1 + 0.5, BOX.x1 + 0.7, MURO_Y - 0.2, BOX.y1 + 1.5, 0.5);
  muro(BOX.x0 - 0.7, gx0, BOX.y1 + 1.3, BOX.y1 + 1.5, 0.5);
  muro(gx1, BOX.x1 + 0.7, BOX.y1 + 1.3, BOX.y1 + 1.5, 0.5);
  // Jardineiras na linha do portão (não andável), dos dois lados.
  for (const [a, b] of [[BOX.x0 - 0.5, gx0 - 0.1], [gx1 + 0.1, BOX.x1 + 0.5]]) {
    add(caixa(a, b, 0, 0.3, BOX.y1 + 0.6, BOX.y1 + 1.3), cor.concreto);
    add(caixa(a + 0.05, b - 0.05, 0.3, 0.42, BOX.y1 + 0.65, BOX.y1 + 1.25), cor.folhaA);
  }
  // Postes do portão.
  for (const x of [gx0, gx1]) add(caixa(x - 0.1, x + 0.1, 0, 1.3, BOX.y1 + 1.3, BOX.y1 + 1.5), cor.metal);

  // Garagem do box: paredes claras, telhado azul, porta de enrolar, placa.
  const G = GARAGEM;
  add(caixa(G.x0 - 0.5, G.x1 + 0.5, 0, 2.1, G.y0 - 0.5, G.y1 + 0.5), cor.concretoClaro);
  add(caixa(G.x0 - 0.6, G.x1 + 0.6, 2.1, 2.3, G.y0 - 0.6, G.y1 + 0.6), cor.azul);
  add(caixa(G.x0 + 0.1, G.x1 - 1.1, 0.02, 1.6, G.y1 + 0.5, G.y1 + 0.54), cor.concreto);
  for (let h = 0.2; h < 1.6; h += 0.2) add(caixa(G.x0 + 0.1, G.x1 - 1.1, h, h + 0.03, G.y1 + 0.54, G.y1 + 0.56), cor.metal);
  placa("box", (G.x0 + G.x1) / 2, G.y1 + 0.57, 1.85, 3.2, 0.8 * (3.2 / 4));
  // Bancada com caixa de ferramentas e bicicleta reserva (só caixas).
  const B = BANCADA;
  add(caixa(B.x0 - 0.4, B.x1 + 0.4, 0.75, 0.85, B.y0 - 0.35, B.y0 + 0.35), cor.madeira);
  for (const x of [B.x0 - 0.3, B.x1 + 0.3]) add(caixa(x - 0.05, x + 0.05, 0, 0.75, B.y0 - 0.05, B.y0 + 0.05), cor.metal);
  add(caixa(B.x0 - 0.2, B.x0 + 0.35, 0.85, 1.1, B.y0 - 0.2, B.y0 + 0.15), cor.vermelho);
  add(caixa(B.x1 - 0.1, B.x1 + 0.3, 0.85, 0.95, B.y0 - 0.1, B.y0 + 0.1), cor.amarelo);
  // Quadro de regras (Espaço de frente: infoEm).
  const R = PLACA_REGRAS;
  for (const dx of [-0.38, 0.38]) add(caixa(R.x + dx - 0.04, R.x + dx + 0.04, 0, 1.0, R.y - 0.04, R.y + 0.04), cor.metal);
  add(caixa(R.x - 0.46, R.x + 0.46, 0.55, 1.5, R.y - 0.06, R.y), cor.azulEsc);
  placa("regras", R.x, R.y + 0.01, 1.03, 0.86, 0.86);

  // Arquibancada: degraus subindo para o norte, encosto com placa SEMEC.
  const A = ARQUIBANCADA;
  const DEG = A.y1 - A.y0 + 1; // 5 degraus
  const alturaDeg = (i) => 0.3 + i * 0.32; // i = 0 na frente (sul)
  for (let i = 0; i < DEG; i++) {
    const y = A.y1 - i;
    add(caixa(A.x0 - 0.5, A.x1 + 0.5, 0, alturaDeg(i), y - 0.5, y + 0.5), i % 2 ? cor.concreto : cor.concretoClaro);
    // Beirada azul do assento.
    add(caixa(A.x0 - 0.5, A.x1 + 0.5, alturaDeg(i) - 0.06, alturaDeg(i) + 0.02, y + 0.42, y + 0.5), cor.azul);
  }
  add(caixa(A.x0 - 0.7, A.x1 + 0.7, 0, alturaDeg(DEG - 1) + 1.1, A.y0 - 0.75, A.y0 - 0.5), cor.azulEsc);
  for (let x = A.x0 + 3; x <= A.x1 - 3; x += 8) placa("semec", x, A.y0 - 0.49, alturaDeg(DEG - 1) + 0.62, 2.2, 0.55);
  // Laterais.
  for (const x of [A.x0 - 0.7, A.x1 + 0.5]) add(caixa(x, x + 0.2, 0, alturaDeg(DEG - 1) + 0.3, A.y0 - 0.5, A.y1 + 0.5), cor.concreto);
  // Corredores (escadas) a cada 10 tiles: sem público.
  const corredor = (x) => (x - A.x0) % 10 === 5;

  // Bandeiras quadriculadas em mastros ao longo da reta (lado da
  // arquibancada) e duas no pórtico.
  const bandeira = (x, y, h, giro = 0) => {
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
  const yBand = A.y1 + 1.2;
  for (let x = A.x0 + 1; x <= A.x1; x += 4) {
    if (Math.abs(x - fx) < 2) continue;
    add(caixa(x - 0.03, x + 0.03, 0, 1.75, yBand - 0.03, yBand + 0.03), cor.metal);
    bandeira(x + 0.03, yBand, 1.52);
  }
  bandeira(fx + 0.14, fyN, ALT_P - 0.25);
  bandeira(fx + 0.14, fyS, ALT_P - 0.25);

  // Placas SEMEC por fora das curvas e ao longo da reta oposta (de frente
  // para o sul, onde a câmera está).
  const PLACAS = [
    [56, 51.2], [66, 50.4], [79.6, 44.6], [82, 26], [70, 6.5], [50, 8], [27, 3.6], [6, 4.6], [3, 22], [2.6, 40], [14, 52], [58, 22], [44, 22],
  ];
  PLACAS.forEach(([x, y], n) => {
    if (c.distancia(Math.round(x), Math.round(y)) < RAIO_ASFALTO + 1) return;
    for (const dx of [-0.8, 0.8]) add(caixa(x + dx - 0.04, x + dx + 0.04, 0, 0.75, y - 0.04, y + 0.04), cor.metal);
    add(caixa(x - 1.05, x + 1.05, 0.55, 1.15, y - 0.08, y - 0.02), cor.escuro);
    placa(n % 3 === 2 ? "pista" : "semec", x, y - 0.01, 0.85, 2, 0.5);
  });

  // Cerca do mapa (mourões e duas réguas), com vão no portão.
  {
    const X0 = 0.6;
    const X1 = MW - 1.6;
    const Y0 = 0.6;
    const Y1 = MH - 0.9;
    const regua = (ax, ay, bx, by) => {
      const comp = Math.hypot(bx - ax, by - ay);
      for (const h of [0.35, 0.7]) {
        const g = new THREE.BoxGeometry(comp, 0.06, 0.05);
        const mt = new THREE.Matrix4().makeTranslation(wx((ax + bx) / 2), h, wz((ay + by) / 2)).multiply(new THREE.Matrix4().makeRotationY(-Math.atan2(by - ay, bx - ax)));
        lote.add(g, cor.concretoClaro, mt);
      }
      const n = Math.max(1, Math.round(comp / 2));
      for (let i = 0; i <= n; i++) {
        const x = ax + ((bx - ax) * i) / n;
        const y = ay + ((by - ay) * i) / n;
        add(caixa(x - 0.06, x + 0.06, 0, 0.85, y - 0.06, y + 0.06), cor.madeira);
      }
    };
    regua(X0, Y0, X1, Y0);
    regua(X1, Y0, X1, Y1);
    regua(X0, Y0, X0, Y1);
    regua(X0, Y1, gx0 - 0.4, Y1);
    regua(gx1 + 0.4, Y1, X1, Y1);
  }

  const matLote = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05 }));
  const meshLote = lote.fechar(matLote);
  track(meshLote.geometry);
  meshLote.castShadow = !lite;
  meshLote.receiveShadow = !lite;
  root.add(meshLote);
  const matAtlas = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0, side: THREE.DoubleSide }));

  // ---- Arcos dos checkpoints (um material por arco: o próximo pulsa) ---------------
  // Cada arco fica na linha do corte (coluna ou linha de tiles), com os pés
  // logo além da zebra; o da chegada é o pórtico. Numerozinho virado para a
  // câmera em cima da viga.
  const corArcoDiscreto = mix(pv("gray-400"), pv("blue-300"), 0.25);
  const corArcoProximo = pv("yellow-500");
  const arcos = checkpoints.map((cp, i) => {
    const mat = track(std(corArcoDiscreto.clone(), { emissive: pv("yellow-400"), emissiveIntensity: 0, roughness: 0.5, metalness: 0.2 }));
    let geos = [];
    let centro;
    let giro;
    let vao;
    if (i === N - 1) {
      geos = arcoGeo;
      centro = new THREE.Vector3(wx(fx), ALT_P, wz((fyN + fyS) / 2));
      giro = Math.PI / 2;
      vao = fyS - fyN;
    } else {
      const H = 1.85;
      const f = cp.tiles;
      if (cp.eixo === "col") {
        const x = f[0][0];
        const a = f[0][1] - 0.5 - 0.65;
        const b = f.at(-1)[1] + 0.5 + 0.65;
        geos.push(caixa(x - 0.08, x + 0.08, 0, H, a - 0.08, a + 0.08));
        geos.push(caixa(x - 0.08, x + 0.08, 0, H, b - 0.08, b + 0.08));
        geos.push(caixa(x - 0.07, x + 0.07, H - 0.12, H + 0.06, a, b));
        centro = new THREE.Vector3(wx(x), H, wz((a + b) / 2));
        giro = Math.PI / 2;
        vao = b - a;
      } else {
        const y = f[0][1];
        const a = f[0][0] - 0.5 - 0.65;
        const b = f.at(-1)[0] + 0.5 + 0.65;
        geos.push(caixa(a - 0.08, a + 0.08, 0, H, y - 0.08, y + 0.08));
        geos.push(caixa(b - 0.08, b + 0.08, 0, H, y - 0.08, y + 0.08));
        geos.push(caixa(a, b, H - 0.12, H + 0.06, y - 0.07, y + 0.07));
        centro = new THREE.Vector3(wx((a + b) / 2), H, wz(y));
        giro = 0;
        vao = b - a;
      }
      // Número do arco, de frente para a câmera, em cima da viga.
      const g = new THREE.PlaneGeometry(0.5, 0.5);
      const mt = new THREE.Matrix4().makeTranslation(centro.x, centro.y + 0.38, centro.z).multiply(new THREE.Matrix4().makeRotationX(-ANG_CAM));
      atlas.add(g, regioes[`n${i + 1}`], mt);
    }
    const geo = track(mergeGeometries(geos.map((g) => (g.index ? g.toNonIndexed() : g))));
    for (const g of geos) g.dispose();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = !lite;
    root.add(mesh);
    return { mat, mesh, centro, giro, vao, flash: 0 };
  });

  const meshAtlas = atlas.fechar(matAtlas);
  track(meshAtlas.geometry);
  meshAtlas.castShadow = false;
  meshAtlas.receiveShadow = !lite;
  root.add(meshAtlas);

  // Cortina de luz do próximo arco (aditiva, fina) e a faixa no chão.
  const matCortina = track(
    new THREE.MeshBasicMaterial({ color: pv("yellow-400"), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  const geoPlano = track(new THREE.PlaneGeometry(1, 1));
  const cortina = new THREE.Mesh(geoPlano, matCortina);
  cortina.userData.noShadow = true;
  const faixaLuz = new THREE.Mesh(geoPlano, matCortina);
  faixaLuz.rotation.x = -Math.PI / 2;
  const luzArco = new THREE.Group();
  luzArco.add(cortina, faixaLuz);
  luzArco.visible = false;
  root.add(luzArco);

  // ---- Semáforo: 3 lâmpadas instanciadas (cor = estado) ----------------------------
  const geoLampada = track(new THREE.CircleGeometry(0.15, 14));
  const matLampada = track(new THREE.MeshBasicMaterial({ color: white }));
  const lampadas = new THREE.InstancedMesh(geoLampada, matLampada, 3);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 3; i++) {
    m4.makeTranslation(wx(TX) + (i - 1) * 0.4, ALT_P + 0.47, wz(TY) + 0.09);
    lampadas.setMatrixAt(i, m4);
  }
  const corApagada = mix(pv("gray-800"), pv("gray-950"), 0.4);
  const corVermelha = mix(pv("red-500"), white, 0.15);
  const corVerde = mix(pv("green-500"), white, 0.2);
  for (let i = 0; i < 3; i++) lampadas.setColorAt(i, corApagada);
  root.add(lampadas);

  // ---- Instanciados: árvores, público, cones, pneus -----------------------------
  const dummy = new THREE.Object3D();
  const vertexColored = (partes) => {
    const l = criarLote();
    for (const [g, cr] of partes) l.add(g, cr);
    const m = l.fechar(null);
    return m.geometry;
  };
  const matInst = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, flatShading: true }));
  const instanciar = (geo, lista, { cast = true } = {}) => {
    track(geo);
    const mesh = new THREE.InstancedMesh(geo, matInst, Math.max(1, lista.length));
    mesh.count = lista.length;
    lista.forEach((it, i) => {
      dummy.position.set(it.x, it.h ?? 0, it.z);
      dummy.rotation.set(0, it.giro ?? 0, 0);
      dummy.scale.setScalar(it.s ?? 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, it.cor ?? white);
    });
    mesh.castShadow = cast && !lite;
    mesh.receiveShadow = !lite;
    root.add(mesh);
    return mesh;
  };

  // Ocupado (tile com algo em cima, para não plantar árvore nem cone ali).
  const ocupado = (x, y) => {
    const tx = Math.round(x);
    const ty = Math.round(y);
    if (c.andavel.has(chave(tx, ty))) return true;
    if (tx >= A.x0 - 1 && tx <= A.x1 + 1 && ty >= A.y0 - 1 && ty <= A.y1 + 2) return true;
    if (tx >= BOX.x0 - 1 && tx <= BOX.x1 + 1 && ty >= MURO_Y - 1) return true;
    if (Math.abs(tx - fx) <= 2 && ty >= fyN - 2 && ty <= fyS + 1) return true;
    return PLACAS.some(([px, py]) => Math.abs(px - x) < 1.6 && Math.abs(py - y) < 1);
  };
  // Árvore no ponto (x, y)? Longe da pista e sem pista logo ao norte (a
  // câmera vem do sul: a copa esconderia o jogador atrás dela).
  const podeArvore = (x, y) => {
    const tx = Math.round(x);
    const ty = Math.round(y);
    if (ocupado(x, y)) return false;
    if (c.distancia(tx, ty) < 3.4) return false;
    for (let dy = 1; dy <= 4; dy++) for (let dx = -1; dx <= 1; dx++) if (c.distancia(tx + dx, ty - dy) < RAIO_ASFALTO + 0.6) return false;
    return true;
  };
  const arvores = { redonda: [], conifera: [] };
  const plantar = (x, y, dentro) => {
    if (dentro && !podeArvore(x, y)) return;
    const tipo = rand() < 0.62 ? "redonda" : "conifera";
    const tint = mix(white, rand() < 0.5 ? pv("yellow-400") : pv("blue-200"), rand() * 0.25);
    arvores[tipo].push({ x: wx(x), z: wz(y), s: 0.8 + rand() * 0.55, giro: rand() * Math.PI * 2, cor: tint });
  };
  for (let y = 1.5; y < MH - 1.5; y += 2.4) {
    for (let x = 1.5; x < MW - 2; x += 2.4) {
      if (rand() < 0.42) plantar(x + (rand() - 0.5) * 1.6, y + (rand() - 0.5) * 1.6, true);
    }
  }
  // Mata além da cerca (horizonte): densa ao norte e dos lados; ao sul,
  // rala (é por onde a câmera olha).
  const MATA = 11; // faixa de mata além da cerca (o resto some na névoa)
  for (let y = -MATA; y < MH + MATA; y += 1.9) {
    for (let x = -MATA; x < MW + MATA; x += 1.9) {
      const fora = x < -0.5 || x > MW - 1 || y < -0.5 || y > MH - 0.5;
      if (!fora) continue;
      const sul = y > MH - 0.5;
      if (sul && Math.abs(x - (gx0 + gx1) / 2) < 3) continue;
      const p = sul ? 0.12 : lite ? 0.3 : 0.6;
      if (rand() < p) plantar(x + (rand() - 0.5) * 1.2, y + (rand() - 0.5) * 1.2, false);
    }
  }
  const geoRedonda = vertexColored([
    [new THREE.CylinderGeometry(0.08, 0.12, 0.7, 5).translate(0, 0.35, 0), cor.madeira],
    [new THREE.IcosahedronGeometry(0.62, 0).scale(1, 0.85, 1).translate(0, 1.08, 0), cor.folhaA],
    [new THREE.IcosahedronGeometry(0.4, 0).translate(0.26, 1.42, 0.08), cor.folhaB],
  ]);
  const geoConifera = vertexColored([
    [new THREE.CylinderGeometry(0.07, 0.1, 0.5, 5).translate(0, 0.25, 0), cor.madeira],
    [new THREE.ConeGeometry(0.6, 1.0, 6).translate(0, 0.9, 0), cor.conifera],
    [new THREE.ConeGeometry(0.42, 0.8, 6).translate(0, 1.45, 0), mix(cor.conifera, cor.folhaB, 0.4)],
  ]);
  instanciar(geoRedonda, arvores.redonda);
  instanciar(geoConifera, arvores.conifera);

  // Público: sentado nos degraus, corpo e cabeça (sem rosto), cores de
  // camisa variadas; no `lite`, metade.
  const torcida = [];
  for (let i = 0; i < DEG; i++) {
    const y = A.y1 - i;
    for (let x = A.x0; x <= A.x1 + 0.4; x += 0.58) {
      if (corredor(Math.round(x))) continue;
      if (rand() < (lite ? 0.55 : 0.18)) continue;
      torcida.push({ x: wx(x + (rand() - 0.5) * 0.12), z: wz(y + 0.05), h: alturaDeg(i), fase: rand() * Math.PI * 2, cor: cor.camisas[Math.floor(rand() * cor.camisas.length)], pele: cor.pele[Math.floor(rand() * cor.pele.length)] });
    }
  }
  const geoCorpo = track(new THREE.CylinderGeometry(0.11, 0.16, 0.44, 6).translate(0, 0.22, 0));
  const geoCabeca = track(new THREE.IcosahedronGeometry(0.12, 1).translate(0, 0.58, 0));
  const matPessoa = track(new THREE.MeshStandardMaterial({ color: white, roughness: 0.85, flatShading: true }));
  const corpos = new THREE.InstancedMesh(geoCorpo, matPessoa, torcida.length);
  const cabecas = new THREE.InstancedMesh(geoCabeca, matPessoa, torcida.length);
  const poseTorcida = (pulo) => {
    torcida.forEach((p, i) => {
      dummy.position.set(p.x, p.h + pulo(p), p.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      corpos.setMatrixAt(i, dummy.matrix);
      cabecas.setMatrixAt(i, dummy.matrix);
    });
    corpos.instanceMatrix.needsUpdate = true;
    cabecas.instanceMatrix.needsUpdate = true;
  };
  torcida.forEach((p, i) => {
    corpos.setColorAt(i, p.cor);
    cabecas.setColorAt(i, p.pele);
  });
  poseTorcida(() => 0);
  for (const m of [corpos, cabecas]) {
    m.castShadow = !lite;
    root.add(m);
  }

  // Cones (lado de dentro das curvas e na abertura do box) e pilhas de
  // pneus (lado de fora das curvas fechadas): pela curvatura da linha.
  const cones = [];
  const pneus = [];
  const curv = (k) => {
    const a = pts[(k - 10 + M) % M];
    const b = pts[(k + 10) % M];
    return a.tx * b.ty - a.ty * b.tx; // > 0: vira para a direita na tela (y para baixo)
  };
  let ultimoCone = -99;
  let ultimoPneu = -99;
  for (let k = 0; k < M; k++) {
    const kv = curv(k);
    const p = pts[k];
    if (Math.abs(kv) < 0.32) continue;
    const dentro = Math.sign(kv); // lado de dentro da curva: +normal se vira à direita
    if (p.s - ultimoCone > 1.6) {
      const [x, y] = lado(p, dentro * (RAIO_ASFALTO + LARGURA_ZEBRA + 0.35));
      if (!ocupado(x, y)) {
        cones.push({ x: wx(x), z: wz(y), giro: rand() * 6, cor: white });
        ultimoCone = p.s;
      }
    }
    if (!lite && Math.abs(kv) > 0.45 && p.s - ultimoPneu > 0.75) {
      const [x, y] = lado(p, -dentro * (RAIO_ASFALTO + LARGURA_ZEBRA + 0.75));
      // Ao sul da pista, pneus baixos não tampam; mesmo assim, longe do box.
      if (!ocupado(x, y)) {
        pneus.push({ x: wx(x), z: wz(y), giro: rand() * 6, cor: white });
        ultimoPneu = p.s;
      }
    }
  }
  for (const x of [ABERTURA[0] - 0.75, ABERTURA[1] + 0.75]) for (const y of [MURO_Y + 0.9, MURO_Y + 1.8]) cones.push({ x: wx(x), z: wz(y), cor: white });
  const geoCone = vertexColored([
    [new THREE.BoxGeometry(0.34, 0.04, 0.34).translate(0, 0.02, 0), cor.escuro],
    [new THREE.ConeGeometry(0.13, 0.44, 8).translate(0, 0.26, 0), cor.vermelho],
    [new THREE.CylinderGeometry(0.075, 0.095, 0.08, 8).translate(0, 0.27, 0), white],
  ]);
  instanciar(geoCone, cones);
  if (pneus.length) {
    const partes = [0, 1, 2].map((i) => [new THREE.CylinderGeometry(0.27, 0.27, 0.19, 9).translate(0, 0.1 + i * 0.2, 0), i === 1 ? mix(cor.pneu, white, 0.5) : cor.pneu]);
    instanciar(vertexColored(partes), pneus);
  }

  // ---- Portão do box (desliza para o leste) --------------------------------------
  const geoPortao = vertexColored([
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => [new THREE.BoxGeometry(0.04, 1.0, 0.04).translate(-0.9 + i * 0.225, 0.6, 0), cor.metal]),
    [new THREE.BoxGeometry(1.95, 0.07, 0.06).translate(0, 1.1, 0), cor.amarelo],
    [new THREE.BoxGeometry(1.95, 0.07, 0.06).translate(0, 0.12, 0), cor.amarelo],
  ]);
  track(geoPortao);
  const portao = new THREE.Mesh(geoPortao, matInst);
  const portaoBase = new THREE.Vector3(wx((gx0 + gx1) / 2), 0, wz(BOX.y1 + 1.4));
  portao.position.copy(portaoBase);
  portao.castShadow = !lite;
  root.add(portao);

  // ---- Partículas: faíscas e fogos (um pool), confete --------------------------
  const MAX_FAISCAS = lite ? 60 : 180;
  const geoFaisca = track(new THREE.OctahedronGeometry(0.06, 0));
  const matFaisca = track(new THREE.MeshBasicMaterial({ color: white, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const faiscas = new THREE.InstancedMesh(geoFaisca, matFaisca, MAX_FAISCAS);
  faiscas.count = 0;
  faiscas.frustumCulled = false;
  root.add(faiscas);
  const vivas = []; // { p: Vector3, v: Vector3, vida, total, cor }
  const coresFaisca = [pv("yellow-400"), white, pv("yellow-500"), pv("blue-300")];
  const coresFogos = [pv("red-400"), pv("yellow-400"), pv("blue-300"), pv("green-500"), white];
  const soltar = (origem, n, { vel = 2.5, sobe = 2, vida = 0.7, cores = coresFaisca, espalha = 0, tam = 1 }) => {
    for (let i = 0; i < n && vivas.length < MAX_FAISCAS; i++) {
      const d = new THREE.Vector3(rand() - 0.5, rand() - 0.2, rand() - 0.5).normalize();
      const p = origem.clone();
      if (espalha) p.x += (rand() - 0.5) * espalha;
      vivas.push({ p, v: d.multiplyScalar(vel * (0.5 + rand() * 0.6)).add(new THREE.Vector3(0, sobe * rand(), 0)), vida: vida * (0.6 + rand() * 0.5), total: vida, tam, cor: cores[Math.floor(rand() * cores.length)] });
    }
  };

  const MAX_CONFETE = lite ? 120 : 260;
  const geoConfete = track(new THREE.PlaneGeometry(0.09, 0.13));
  const matConfete = track(new THREE.MeshBasicMaterial({ color: white, side: THREE.DoubleSide }));
  const confete = new THREE.InstancedMesh(geoConfete, matConfete, MAX_CONFETE);
  confete.count = 0;
  confete.frustumCulled = false;
  root.add(confete);
  const papeis = [];
  const coresConfete = [pv("red-500"), pv("yellow-500"), pv("blue-500"), pv("green-500"), white, pv("blue-700")];

  // ---- Luzes: hemisfério e sol que acompanha o jogador ----------------------------
  const ceu = mix(mix(pv("blue-100"), white, 0.5), pv("green-500"), 0.06);
  scene.background = ceu;
  scene.fog = new THREE.Fog(ceu, 26, 62);
  const hemi = new THREE.HemisphereLight(mix(pv("blue-200"), white, 0.2), mix(pv("green-600"), pv("yellow-800"), 0.35), lite ? 2.1 : 1.5);
  root.add(hemi);
  const sol = new THREE.DirectionalLight(mix(white, pv("yellow-400"), 0.24), lite ? 1.9 : 2.2);
  const SOL_DIR = new THREE.Vector3(10, 13.5, 7).normalize().multiplyScalar(30);
  if (!lite) {
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    const sc = sol.shadow.camera;
    sc.left = -15;
    sc.right = 15;
    sc.top = 15;
    sc.bottom = -15;
    sc.near = 5;
    sc.far = 60;
    sol.shadow.bias = -0.0004;
    sol.shadow.normalBias = 0.03;
    sol.shadow.radius = 3;
  }
  root.add(sol, sol.target);
  const jogador = new THREE.Vector3().copy(tileToWorld(CHEGADA.x, CHEGADA.y));
  let jogadorRef = null;
  const posicionarSol = () => {
    const alvo = jogadorRef ?? jogador;
    // "Gruda" o centro numa grade de 1 unidade: a sombra não treme ao andar.
    const cx = Math.round(alvo.x);
    const cz = Math.round(alvo.z) - 2;
    sol.target.position.set(cx, 0, cz);
    sol.position.set(cx + SOL_DIR.x, SOL_DIR.y, cz + SOL_DIR.z);
  };
  posicionarSol();

  // ---- Estado da corrida (destaque, semáforo, festa) ------------------------------
  let proximo = -1;
  let festaT = -1;
  let tempo = 0;

  function setProximo(i) {
    proximo = Number.isInteger(i) && i >= 0 && i < N ? i : -1;
    arcos.forEach((a, j) => {
      a.mat.color.copy(j === proximo ? corArcoProximo : corArcoDiscreto);
      a.mat.emissiveIntensity = j === proximo ? 0.6 : 0;
    });
    luzArco.visible = proximo >= 0;
    if (proximo < 0) return;
    const a = arcos[proximo];
    const alt = a.centro.y;
    cortina.scale.set(a.vao - 0.3, alt, 1);
    cortina.position.set(0, alt / 2, 0);
    faixaLuz.scale.set(a.vao - 0.3, 0.5, 1);
    faixaLuz.position.set(0, 0.05, 0);
    luzArco.position.set(a.centro.x, 0, a.centro.z);
    luzArco.rotation.y = a.giro;
  }

  function passou(i) {
    const a = arcos[i];
    if (!a) return;
    a.flash = reducedMotion ? 0.25 : 0.45;
    if (reducedMotion) return;
    // Faíscas ao longo da viga.
    const passos = 6;
    const dir = new THREE.Vector3(Math.cos(a.giro), 0, -Math.sin(a.giro));
    for (let k = 0; k <= passos; k++) {
      const o = a.centro.clone().addScaledVector(dir, (k / passos - 0.5) * a.vao);
      soltar(o, lite ? 4 : 8, { vel: 2.4, sobe: 1.5, vida: 0.6 });
    }
  }

  function largada(fase) {
    const acesas = fase === 3 || fase === "3" ? 1 : fase === 2 || fase === "2" ? 2 : fase === 1 || fase === "1" || fase === "vermelho" ? 3 : 0;
    for (let i = 0; i < 3; i++) {
      const c2 = fase === "verde" ? corVerde : i < acesas ? corVermelha : corApagada;
      lampadas.setColorAt(i, c2);
    }
    lampadas.instanceColor.needsUpdate = true;
  }

  function festa() {
    festaT = 0;
    papeis.length = 0;
    const centro = arcos[N - 1].centro;
    for (let i = 0; i < MAX_CONFETE; i++) {
      const p = new THREE.Vector3(centro.x + (rand() - 0.5) * 12, reducedMotion ? 0.04 + rand() * 0.02 : 3 + rand() * 4, centro.z + (rand() - 0.5) * 7);
      // Com reducedMotion: confete parado no chão e alguns "no ar" fixos.
      if (reducedMotion && rand() < 0.3) p.y = 0.6 + rand() * 2.4;
      papeis.push({ p, v: -0.6 - rand() * 0.6, giro: new THREE.Euler(rand() * 6, rand() * 6, rand() * 6), w: 2 + rand() * 4, fase: rand() * 6, cor: coresConfete[i % coresConfete.length] });
    }
    confete.count = papeis.length;
    papeis.forEach((pp, i) => confete.setColorAt(i, pp.cor));
    if (confete.instanceColor) confete.instanceColor.needsUpdate = true;
    atualizarConfete(0);
  }

  function atualizarConfete(dt) {
    papeis.forEach((pp, i) => {
      if (!reducedMotion && pp.p.y > 0.03) {
        pp.p.y = Math.max(0.03, pp.p.y + pp.v * dt);
        pp.p.x += Math.sin(tempo * pp.w + pp.fase) * dt * 0.4;
        pp.giro.x += dt * pp.w;
        pp.giro.y += dt * pp.w * 0.7;
      }
      if (pp.p.y <= 0.031) pp.giro.set(-Math.PI / 2, pp.giro.y, 0);
      dummy.position.copy(pp.p);
      dummy.rotation.copy(pp.giro);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      confete.setMatrixAt(i, dummy.matrix);
    });
    confete.instanceMatrix.needsUpdate = true;
  }

  // ---- Interface do interior ------------------------------------------------------
  const saidas = new Map(PORTAO.map(([x, y]) => [chave(x, y), "rua"]));
  const saidaEm = (x, y) => saidas.get(chave(x, y)) ?? null;
  const INFO_REGRAS = {
    id: "pista-regras",
    titulo: "Regras da corrida",
    texto:
      "Duas voltas. Passe pelos arcos na ordem: o que brilha em amarelo é o próximo. A volta fecha no pórtico de LARGADA · CHEGADA. Para voltar para a Vila, saia pelo portão do box.",
    tiles: [[PLACA_REGRAS.x, PLACA_REGRAS.y]],
  };
  const infoPorTile = new Map(INFO_REGRAS.tiles.map(([x, y]) => [chave(x, y), INFO_REGRAS]));
  const cpPorTile = new Map();
  checkpoints.forEach((cp, i) => cp.tiles.forEach(([x, y]) => cpPorTile.set(chave(x, y), i)));
  const tilesPorVolta = medirVolta(c, [LARGADA.x, LARGADA.y], VOLTAS);

  const corrida = {
    largada: { ...LARGADA },
    voltas: VOLTAS,
    checkpoints: checkpoints.map((cp) => ({ id: cp.id, tiles: cp.tiles.map((t) => [...t]) })),
    saidaVila: PORTAO.map((t) => [...t]),
    // Caminho mais curto por volta (tiles) da largada, na ordem (medirVolta).
    tilesPorVolta,
  };

  const temp = new THREE.Vector3();
  return {
    scene,
    MW,
    MH,
    tileToWorld,
    // Chega-se da Vila pelo portão do box (logo atrás da chegada).
    chegada: { ...CHEGADA },
    entradaRua: { ...CHEGADA },
    porta: { tile: PORTAO[0] },
    // Câmera do motor: multiplicar a distância por isto (vê mais pista à
    // frente de bicicleta). Os interiores do prédio usam MUSEU_ZOOM = 1.
    zoom: ZOOM,
    piso: "asfalto",
    passable: (x, y) => c.passable(x, y),
    inBounds: (x, y) => x >= 0 && y >= 0 && x < MW && y < MH,
    saidaEm,
    ehPorta: (x, y) => saidaEm(x, y) !== null,
    infoEm: (x, y) => infoPorTile.get(chave(x, y)) ?? null,
    infos: [INFO_REGRAS],
    // Índice do checkpoint no tile (x, y) ou -1.
    checkpointEm: (x, y) => cpPorTile.get(chave(x, y)) ?? -1,
    corrida,
    setProximo,
    passou,
    largada,
    festa,
    // Sem quadros nem pessoas que falam aqui.
    pessoaEm: () => null,
    quadroNaParede: () => null,
    quadroVisto: () => null,
    pontoDeVista: () => null,
    ids: [],
    pose: () => null,
    hitQuadros: [],
    hitPessoas: [],
    setDestaque() {},
    setPerto() {},
    falar() {},
    // Posição viva do jogador (Vector3 da cena) ou null: o sol (e a sombra)
    // acompanham.
    setJogador(v) {
      jogadorRef = v ?? null;
      posicionarSol();
    },
    // Portão do box: 0 fechado, 1 aberto (desliza para o leste).
    abrirPorta(k) {
      const kk = THREE.MathUtils.clamp(k, 0, 1);
      portao.position.x = portaoBase.x + kk * (gx1 - gx0 - 0.15);
    },
    pronto: () => Promise.resolve(),
    update(t, dt) {
      tempo = t;
      posicionarSol();
      // Próximo arco pulsa (com reducedMotion, brilho fixo).
      arcos.forEach((a, j) => {
        let e = j === proximo ? (reducedMotion ? 0.7 : 0.45 + 0.35 * Math.sin(t * 5)) : 0;
        if (a.flash > 0) {
          a.flash = Math.max(0, a.flash - dt);
          e = Math.max(e, 2.2 * (a.flash / 0.45));
        }
        a.mat.emissiveIntensity = e;
      });
      if (proximo >= 0) matCortina.opacity = reducedMotion ? 0.22 : 0.16 + 0.1 * Math.sin(t * 5);
      // Torcida: uma "ola" leve sempre; na festa, pula de verdade.
      if (!reducedMotion && (!lite || festaT >= 0)) {
        const pulando = festaT >= 0 && festaT < 8;
        poseTorcida((p) => (pulando ? Math.max(0, Math.sin(t * 9 + p.fase)) * 0.18 : Math.max(0, Math.sin(t * 2.2 - p.x * 0.35)) * 0.035));
      }
      // Festa: confete caindo e fogos sobre a reta da chegada nos primeiros 5 s
      // (baixos e um pouco ao sul: a câmera alta vê o que fica perto do jogador).
      if (festaT >= 0) {
        festaT += dt;
        if (!reducedMotion) {
          atualizarConfete(dt);
          if (!lite && festaT < 5 && Math.floor((festaT - dt) / 0.7) !== Math.floor(festaT / 0.7)) {
            temp.set(wx(fx + (rand() - 0.5) * 12), 3 + rand(), wz(A.y1 + 2 + rand() * 3));
            soltar(temp, 36, { vel: 3.2, sobe: 0.4, vida: 1.1, cores: coresFogos, tam: 2.4 });
          }
        }
      }
      // Faíscas e fogos: gravidade, somem encolhendo.
      for (let i = vivas.length - 1; i >= 0; i--) {
        const s = vivas[i];
        s.vida -= dt;
        if (s.vida <= 0) {
          vivas.splice(i, 1);
          continue;
        }
        s.v.y -= 5.5 * dt;
        s.p.addScaledVector(s.v, dt);
      }
      faiscas.count = vivas.length;
      vivas.forEach((s, i) => {
        dummy.position.copy(s.p);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(Math.max(0.2, s.vida / s.total) * 1.4 * s.tam);
        dummy.updateMatrix();
        faiscas.setMatrixAt(i, dummy.matrix);
        faiscas.setColorAt(i, s.cor);
      });
      if (vivas.length) {
        faiscas.instanceMatrix.needsUpdate = true;
        if (faiscas.instanceColor) faiscas.instanceColor.needsUpdate = true;
      }
    },
    dispose() {
      root.removeFromParent();
      for (const m of [lampadas, corpos, cabecas, faiscas, confete]) m.dispose();
      root.traverse((o) => {
        if (o.isInstancedMesh) o.dispose();
      });
      for (const d of proprios) d.dispose?.();
      proprios.length = 0;
    },
  };
}
