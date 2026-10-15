// Escritório de um andar da SEMFAZ (prédio da Vila), numa cena própria.
//
// Mesmo contrato do museu (scene/museu/index.js): o motor troca a cena
// renderizada e passa a usar `passable`/`tileToWorld` daqui para o jogador.
// Os dados vêm de ./andares.js (zonas e pessoas); a mobília (estação de
// trabalho, placa de zona, elevador e recepção) vem de ./mobilia.js. Aqui se
// decide a planta, a arquitetura, a decoração e as luzes.
//
// Planta (22 × 14, 1 tile = 1 unidade, centrada na origem). A câmera vem do
// sul, alta: paredes norte/oeste/leste altas com janelas e vista da cidade,
// parede sul baixa (mureta, corte de maquete).
//
//   x → 0 1 2 3 4 5 6 7 8 9 10 11 12 13 ...  20 21
// y 0   # # # # # # # # # # E  E  #  #  ...  #  #    E = elevador (2 tiles)
//   1   # n n n n n n n n p X  .  p  n  ...  n  #    n = estações da parede norte
//   2   # . v v v v v v v . .  .  .  v  ...  v  #    v = onde o visitante para
//   3   # o v . . . . . . . .  .  .  .  ...  v  l    o/l = estações oeste/leste
//   …   # o v . . . . . . . .  .  .  .  ...  v  l
//   5   # o v . . . . . . . C  C  .  .  ...  v  l    C = aparador do gabinete
//   6   # o v . . . . . . . S  S  .  .  ...  v  l    S = estação da chefia do andar
//   7   # o v . . . . . . . v  v  .  .  ...  v  l
//   …   # o v . . . . . . . .  .  .  .  ...  v  l
//  10   # o v . . . . . . . .  .  .  .  ...  v  l
//  11   # . . . . . . . . . .  .  .  .  ...  .  #
//  12   # . . . j j j . . . .  .  .  j  j  j .  #    j = jardineira baixa
//  13   # # # # # # # # # # R  R  #  #  ...  #  #    R = porta da rua (térreo)
//
// X = chegada (saindo do elevador, olhando para o sul). A primeira zona do
// andar (a chefia da secretaria executiva, uma pessoa) fica no centro, numa
// "ilha" de gabinete; as demais zonas ocupam as faixas das paredes
// (norte-oeste, norte-leste, oeste, leste), com as estações encostadas na
// parede viradas para dentro e o tile da frente livre. Faixa sem zona vira
// área comum (bebedouro, impressora, quadro branco, sofá). Divisórias de
// vidro só entre tiles bloqueados (nunca atravessam um caminho).
//
// Desempenho: tudo o que é fixo e meu vai em lotes por material (um draw call
// por cor); as estações compartilham geometria (mobilia.js). No `lite` não há
// sombras nem luzes extras.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { std } from "../buildings/shared";
import { criarElevador, criarEstacao, criarPlacaZona, criarRecepcao } from "./mobilia";
import { TEMAS } from "./temas";

export const MW = 22;
export const MH = 14;

const H = 3; // paredes norte, oeste e leste
const HS = 0.45; // mureta sul
const T = 0.3; // espessura (a face interna fica na borda do tile)

export const tileToWorld = (x, y) => new THREE.Vector3(x - MW / 2 + 0.5, 0, y - MH / 2 + 0.5);

const FACE = {
  norte: -MH / 2 + 1,
  sul: MH / 2 - 1,
  oeste: -MW / 2 + 1,
  leste: MW / 2 - 1,
};

// Eixo central: passa entre os tiles CX e CX + 1.
const CX = MW / 2 - 1;
const ELEVADOR = [[CX, 0], [CX + 1, 0]];
const PORTA_RUA = [[CX, MH - 1], [CX + 1, MH - 1]];
const CHEGADA = { x: CX, y: 1, dir: "down" };
const ENTRADA_RUA = { x: CX, y: MH - 2, dir: "up" };
// Ilha do gabinete: estação (2 tiles) na linha 6, aparador na 5, visitante na 7.
const ILHA_Y = 6;

const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// Faixas de estações encostadas nas paredes. `frente`: do tile da estação para
// o do visitante; `dir`: para onde o visitante olha; `rot`: giro do grupo
// (frente local +z → `frente`).
const SEGMENTOS = {
  norteO: { tiles: range(1, CX - 2).map((x) => [x, 1]), frente: [0, 1], dir: "up", rot: 0, parede: "norte" },
  norteL: { tiles: range(CX + 3, MW - 2).map((x) => [x, 1]), frente: [0, 1], dir: "up", rot: 0, parede: "norte" },
  oeste: { tiles: range(3, MH - 4).map((y) => [1, y]), frente: [1, 0], dir: "left", rot: Math.PI / 2, parede: "oeste" },
  leste: { tiles: range(3, MH - 4).map((y) => [MW - 2, y]), frente: [-1, 0], dir: "right", rot: -Math.PI / 2, parede: "leste" },
};
const PRIORIDADE = ["norteO", "norteL", "oeste", "leste"];
const SOBRAS = ["oeste", "leste", "norteO", "norteL"];

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const chave = (x, y) => `${x},${y}`;

// ---- Planta ---------------------------------------------------------------

// Pessoas da zona na ordem da faixa: a chefia (menor `nivel`) no meio.
function ordemComChefeNoMeio(pessoas) {
  if (pessoas.length < 2) return pessoas.slice();
  const nivelMin = Math.min(...pessoas.map((p) => p.nivel ?? 99));
  const chefe = pessoas.find((p) => (p.nivel ?? 99) === nivelMin);
  const outros = pessoas.filter((p) => p !== chefe);
  const meio = Math.floor((pessoas.length - 1) / 2);
  return [...outros.slice(0, meio), chefe, ...outros.slice(meio)];
}

// Divide `L` tiles entre as zonas (mínimo 1 tile + 1 de respiro cada; a
// sobra vai uma a uma, em rodízio).
function repartir(L, zonas) {
  const base = zonas.map((z) => Math.max(z.pessoas.length, 1));
  let tam = base.map((b) => b + 1);
  if (tam.reduce((s, v) => s + v, 0) > L) tam = base.slice();
  let sobra = L - tam.reduce((s, v) => s + v, 0);
  for (let i = 0; sobra > 0; i = (i + 1) % tam.length, sobra--) tam[i]++;
  return tam;
}

// Planta do andar: estações, zonas desenhadas, decoração e tiles bloqueados.
export function planejar(andar) {
  const estacoes = []; // { pessoa, zona, chefe, x, z, rot, tiles, ver, dir }
  const zonas = []; // { zona, i, seg?, ilha?, u0, len }
  const decor = []; // { tipo, x, y, rot, seg? }
  const bloq = new Set();
  const lista = andar.zonas ?? [];

  let resto = lista;
  if (lista[0]?.pessoas.length === 1) {
    const z = lista[0];
    const p = tileToWorld(CX, ILHA_Y);
    estacoes.push({
      pessoa: z.pessoas[0],
      zona: z,
      chefe: true,
      ilha: true,
      x: p.x + 0.5,
      z: p.z,
      rot: 0,
      tiles: [[CX, ILHA_Y], [CX + 1, ILHA_Y]],
      ver: [[CX, ILHA_Y + 1], [CX + 1, ILHA_Y + 1]],
      dir: "up",
    });
    zonas.push({ zona: z, i: 0, ilha: true });
    resto = lista.slice(1);
  }

  const porSeg = new Map(PRIORIDADE.map((id) => [id, []]));
  resto.forEach((z, i) => porSeg.get((i < 4 ? PRIORIDADE : SOBRAS)[i % 4]).push(z));

  for (const [id, zs] of porSeg) {
    const seg = SEGMENTOS[id];
    if (!zs.length) {
      decor.push({ tipo: "areaComum", seg: id });
      continue;
    }
    const tam = repartir(seg.tiles.length, zs);
    let u0 = 0;
    zs.forEach((z, k) => {
      const len = tam[k];
      const pessoas = ordemComChefeNoMeio(z.pessoas).slice(0, len);
      const ini = u0 + Math.floor((len - pessoas.length) / 2);
      const nivelMin = Math.min(...z.pessoas.map((p) => p.nivel ?? 99));
      for (let u = u0; u < u0 + len; u++) {
        const [tx, ty] = seg.tiles[u];
        const j = u - ini;
        if (j >= 0 && j < pessoas.length) {
          const p = tileToWorld(tx, ty);
          const pessoa = pessoas[j];
          estacoes.push({
            pessoa,
            zona: z,
            chefe: (pessoa.nivel ?? 99) === nivelMin && pessoas.length > 1,
            x: p.x,
            z: p.z,
            rot: seg.rot,
            tiles: [[tx, ty]],
            ver: [[tx + seg.frente[0], ty + seg.frente[1]]],
            dir: seg.dir,
          });
        } else {
          // Tiles da faixa sem estação: arquivo colado no time, planta nas
          // bordas da zona (onde há divisória), estante no meio da sobra das
          // faixas do norte; o resto fica livre. Zona sem chefia: só peças
          // baixas (o aviso fica na parede).
          const dist = j < 0 ? -j : j - pessoas.length + 1;
          const borda = u === u0 || u === u0 + len - 1;
          let tipo = null;
          if (!pessoas.length) tipo = (u - u0) % 2 ? "planta" : "arquivo";
          else if (dist === 1) tipo = "arquivo";
          else if (borda) tipo = "planta";
          else if (dist === 2 && seg.parede === "norte") tipo = "estante";
          if (!tipo) continue;
          decor.push({ tipo, x: tx, y: ty, rot: seg.rot, seg: id });
        }
        bloq.add(chave(tx, ty));
      }
      zonas.push({ zona: z, i: zonas.length, seg: id, u0, len });
      u0 += len;
    });
  }

  for (const e of estacoes) for (const [x, y] of e.tiles) bloq.add(chave(x, y));

  // Área comum nas faixas sem zona.
  const comum = (id) => {
    const seg = SEGMENTOS[id];
    const t = seg.tiles;
    const itens = id === "leste" || id === "norteL"
      ? ["bebedouro", "impressora", null, null, null, "sofa", "sofa", "planta"]
      : ["planta", "estante", null, null, null, "sofa", "sofa", "bebedouro"];
    itens.forEach((tipo, u) => {
      if (!tipo || !t[u]) return;
      decor.push({ tipo, x: t[u][0], y: t[u][1], rot: seg.rot, seg: id, inicio: tipo === "sofa" && itens[u - 1] !== "sofa" });
      bloq.add(chave(t[u][0], t[u][1]));
    });
    decor.push({ tipo: id === "oeste" || id === "norteO" ? "mural" : "quadroBranco", seg: id, u: 3 });
  };
  for (const d of decor.filter((d) => d.tipo === "areaComum")) comum(d.seg);

  // Vasos altos ladeando o elevador; plantas baixas nos cantos do sul.
  for (const [x, y, tipo] of [[CX - 1, 1, "plantaAlta"], [CX + 2, 1, "plantaAlta"], [1, MH - 2, "planta"], [MW - 2, MH - 2, "planta"]]) {
    decor.push({ tipo, x, y, rot: 0 });
    bloq.add(chave(x, y));
  }

  // Ilha do gabinete: aparador atrás da mesa.
  if (zonas[0]?.ilha) {
    decor.push({ tipo: "aparador", x: CX, y: ILHA_Y - 1, rot: 0 });
    bloq.add(chave(CX, ILHA_Y - 1));
    bloq.add(chave(CX + 1, ILHA_Y - 1));
  }

  // Jardineiras baixas junto à mureta (deixam livre o meio e as laterais).
  for (const x0 of [4, MW - 7]) {
    decor.push({ tipo: "jardineira", x: x0 + 1, y: MH - 2, rot: 0 });
    for (let x = x0; x < x0 + 3; x++) bloq.add(chave(x, MH - 2));
  }

  // Térreo: balcão de recepção à direita da entrada, de frente para quem
  // chega, e sofá de espera à esquerda. Nos outros andares, mesa de reunião
  // no meio da parte sul.
  if (andar.recepcao) {
    decor.push({ tipo: "recepcao", x: CX + 3, y: MH - 5, rot: 0 });
    for (const x of [CX + 2, CX + 3, CX + 4]) bloq.add(chave(x, MH - 5));
    decor.push({ tipo: "sofaEspera", x: CX - 2, y: MH - 4, rot: Math.PI / 2 });
    for (const y of [MH - 5, MH - 4, MH - 3]) bloq.add(chave(CX - 2, y));
  } else {
    decor.push({ tipo: "reuniao", x: CX, y: MH - 4, rot: 0 });
    for (const x of [CX - 1, CX, CX + 1, CX + 2]) for (const y of [MH - 4, MH - 3]) bloq.add(chave(x, y));
  }

  // ---- Tema do andar (predio/temas/<id>.js): reserva tiles e troca peças --
  // genéricas pelas que caracterizam o setor. Tiles protegidos (chegada,
  // entrada, frente das estações) nunca são reservados; no fim, confere que
  // todo mundo continua alcançável a partir do elevador.
  const infos = []; // { id, tiles, titulo, texto } — "objetos que ensinam"
  const protegidos = new Set([chave(CHEGADA.x, CHEGADA.y), chave(ENTRADA_RUA.x, ENTRADA_RUA.y)]);
  for (const e of estacoes) for (const [x, y] of e.ver) protegidos.add(chave(x, y));
  const dentro = (x, y) => x >= 1 && y >= 1 && x <= MW - 2 && y <= MH - 2;
  const plano = { estacoes, zonas, decor, bloq, infos };
  const tema = TEMAS[andar.id];
  if (tema?.planejar) {
    tema.planejar({
      andar,
      plano,
      MW,
      MH,
      CX,
      ILHA_Y,
      SEGMENTOS,
      tileToWorld,
      livre: (x, y) => dentro(x, y) && !bloq.has(chave(x, y)) && !protegidos.has(chave(x, y)),
      reservar(x, y) {
        if (!dentro(x, y) || protegidos.has(chave(x, y))) throw new Error(`Tema ${andar.id}: tile (${x},${y}) protegido`);
        bloq.add(chave(x, y));
      },
      // Tira peças genéricas (ex.: a área comum) e libera os tiles delas.
      removerDecor(pred) {
        for (let i = decor.length - 1; i >= 0; i--) {
          const d = decor[i];
          if (!pred(d)) continue;
          decor.splice(i, 1);
          if (d.x !== undefined) bloq.delete(chave(d.x, d.y));
        }
      },
      // Objeto que ensina: Espaço de frente para um destes tiles abre o texto.
      info(id, tiles, titulo, texto) {
        infos.push({ id, tiles, titulo, texto });
      },
      alcancavel: () => verificarAlcance(plano),
    });
    const falhas = verificarAlcance(plano);
    if (falhas.length) console.warn(`Andar ${andar.id}: inalcançável`, falhas);
  }
  return plano;
}

// Tiles que precisam ser alcançáveis do elevador (BFS nos livres): frente de
// cada estação, a entrada da rua e um vizinho livre de cada objeto que ensina.
// Devolve a lista do que ficou de fora (vazia = tudo certo).
export function verificarAlcance(plano) {
  const livre = (x, y) => x >= 1 && y >= 1 && x <= MW - 2 && y <= MH - 2 && !plano.bloq.has(chave(x, y));
  const visto = new Set([chave(CHEGADA.x, CHEGADA.y)]);
  const fila = [[CHEGADA.x, CHEGADA.y]];
  while (fila.length) {
    const [x, y] = fila.shift();
    for (const [dx, dy] of Object.values(DIRS)) {
      const k = chave(x + dx, y + dy);
      if (!visto.has(k) && livre(x + dx, y + dy)) {
        visto.add(k);
        fila.push([x + dx, y + dy]);
      }
    }
  }
  const falhas = [];
  for (const e of plano.estacoes) if (!e.ver.some(([x, y]) => visto.has(chave(x, y)))) falhas.push(`estação ${e.pessoa.id}`);
  for (const i of plano.infos ?? []) {
    const ok = i.tiles.some(([x, y]) => Object.values(DIRS).some(([dx, dy]) => visto.has(chave(x + dx, y + dy))));
    if (!ok) falhas.push(`info ${i.id}`);
  }
  return falhas;
}

// ---- Utilitários de geometria ------------------------------------------------

function caixa(x0, x1, y0, y1, z0, z1) {
  return new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}

// Lotes: geometrias estáticas juntadas para economizar draw calls. Peças de
// cor lisa (material sem textura e opaco) viram UM mesh com cor por vértice
// (dois, separando o que projeta sombra); as demais vão um mesh por material.
function criarLotes() {
  const porMat = new Map();
  const add = (mat, geo, { cast = true, receive = true } = {}) => {
    const liso = !mat.map && !mat.transparent;
    const k = liso ? `liso:${cast}` : mat;
    let lote = porMat.get(k);
    if (!lote) {
      lote = { mat: liso ? null : mat, geos: [], cast, receive };
      porMat.set(k, lote);
    }
    if (liso) geo.userData.cor = mat.color;
    lote.geos.push(geo);
    return geo;
  };
  const fechar = (parent, track, lite) => {
    const matLiso = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.05 }));
    for (const { mat, geos, cast, receive } of porMat.values()) {
      const lista = geos.map((g) => {
        const n = g.index ? g.toNonIndexed() : g;
        // Normaliza atributos (algumas geometrias não têm uv).
        if (!n.attributes.uv) n.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
        if (!mat) {
          const c = g.userData.cor;
          const cores = new Float32Array(n.attributes.position.count * 3);
          for (let i = 0; i < cores.length; i += 3) cores.set([c.r, c.g, c.b], i);
          n.setAttribute("color", new THREE.BufferAttribute(cores, 3));
        }
        return n;
      });
      const merged = track(mergeGeometries(lista, false));
      for (const g of new Set([...geos, ...lista])) g.dispose();
      const mesh = new THREE.Mesh(merged, mat ?? matLiso);
      mesh.castShadow = cast && !lite;
      mesh.receiveShadow = receive && !lite;
      parent.add(mesh);
    }
    porMat.clear();
  };
  return { add, fechar };
}

// Estações (mobilia.js) no nível do andar: a parte fixa (`userData.fixo`) de
// todas vira lotes; materiais lisos com o mesmo acabamento (rugosidade,
// metal, flat) viram UM mesh com cor por vértice, os com textura um mesh por
// material. As cadeiras (`userData.cadeira`) viram InstancedMesh (uma por
// peça) que seguem o pivô de cada estação. Devolve `atualizar()`, a chamar
// depois do update das estações. Mantém o visual: só junta draw calls.
function fundirEstacoes(lista, parent, track, lite) {
  const inv = new THREE.Matrix4().copy(parent.matrixWorld).invert();
  const rel = new THREE.Matrix4();
  const lotes = new Map();
  const cadeiras = new Map(); // geo+mat → { geo, mat, cast, receive, pecas: [{ pivo, local }] }
  const remover = [];
  parent.updateMatrixWorld(true);
  for (const e of lista) {
    e.grupo.traverse((m) => {
      if (!m.isMesh) return;
      if (m.userData.cadeira) {
        const k = `${m.geometry.uuid}:${m.material.uuid}`;
        let c = cadeiras.get(k);
        if (!c) cadeiras.set(k, (c = { geo: m.geometry, mat: m.material, cast: m.castShadow, receive: m.receiveShadow, pecas: [] }));
        c.pecas.push({ pivo: m.parent, local: m.matrix.clone() });
        remover.push(m);
        return;
      }
      if (!m.userData.fixo || Array.isArray(m.material)) return;
      const mat = m.material;
      const liso = !mat.map && !mat.transparent && !mat.emissiveMap && mat.emissive?.getHex() === 0 && !mat.vertexColors;
      const k = liso
        ? `liso:${mat.roughness}:${mat.metalness}:${mat.flatShading}:${m.castShadow}:${m.receiveShadow}`
        : `${mat.uuid}:${m.castShadow}:${m.receiveShadow}`;
      let lote = lotes.get(k);
      if (!lote) {
        lote = { liso, mat, geos: [], cast: m.castShadow, receive: m.receiveShadow };
        lotes.set(k, lote);
      }
      rel.multiplyMatrices(inv, m.matrixWorld);
      const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(rel);
      for (const nome of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(nome)) g.deleteAttribute(nome);
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (liso) {
        const c = mat.color;
        const cores = new Float32Array(g.attributes.position.count * 3);
        for (let i = 0; i < cores.length; i += 3) cores.set([c.r, c.g, c.b], i);
        g.setAttribute("color", new THREE.BufferAttribute(cores, 3));
      }
      lote.geos.push(g);
      remover.push(m);
    });
  }
  for (const m of remover) m.removeFromParent();
  for (const { liso, mat, geos, cast, receive } of lotes.values()) {
    const merged = track(mergeGeometries(geos, false));
    geos.forEach((g) => g.dispose());
    const material = liso
      ? track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: mat.roughness, metalness: mat.metalness, flatShading: mat.flatShading }))
      : mat;
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = "estacoes-fixo";
    mesh.castShadow = cast && !lite;
    mesh.receiveShadow = receive && !lite;
    parent.add(mesh);
  }
  const inst = [];
  for (const c of cadeiras.values()) {
    const im = new THREE.InstancedMesh(c.geo, c.mat, c.pecas.length);
    im.name = "estacoes-cadeiras";
    im.castShadow = c.cast;
    im.receiveShadow = c.receive;
    // A cadeira anda pouco (afasta-se no close): sem recorte por frustum.
    im.frustumCulled = false;
    parent.add(im);
    inst.push({ im, pecas: c.pecas });
  }
  const m4 = new THREE.Matrix4();
  // Copia a pose dos pivôs que se mexeram (todos, na primeira vez).
  const atualizar = (forcar = false) => {
    let algum = false;
    for (const e of lista) {
      if (forcar || e.cadeira?.userData.mudou) {
        algum = true;
        break;
      }
    }
    if (!algum) return;
    parent.updateWorldMatrix(true, false);
    inv.copy(parent.matrixWorld).invert();
    for (const { im, pecas } of inst) {
      let mudou = false;
      pecas.forEach(({ pivo, local }, i) => {
        if (!forcar && !pivo.userData.mudou) return;
        pivo.updateWorldMatrix(true, false);
        im.setMatrixAt(i, m4.multiplyMatrices(inv, pivo.matrixWorld).multiply(local));
        mudou = true;
      });
      if (mudou) im.instanceMatrix.needsUpdate = true;
    }
    for (const e of lista) if (e.cadeira) e.cadeira.userData.mudou = false;
  };
  atualizar(true);
  return { atualizar };
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
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

// Reduz a fonte até o texto caber na largura.
function caberFonte(g, texto, peso, max, min, largura, font) {
  let size = max;
  g.font = `${peso} ${size}px ${font}`;
  while (g.measureText(texto).width > largura && size > min) {
    size -= 2;
    g.font = `${peso} ${size}px ${font}`;
  }
  return size;
}

// ---- Texturas -------------------------------------------------------------

// Carpete em placas de 0,5 (4 × 4 por repetição de 2 × 2), com o sentido da
// trama alternado, como em escritório de verdade.
function makeCarpeteTexture(pal) {
  const S = 512;
  const c = makeCanvas(S, S);
  const g = c.getContext("2d");
  const { pv, mix } = pal;
  const base = mix(pv("gray-100"), pv("gray-200"), 0.55);
  const fio = mix(base, pv("gray-400"), 0.35);
  const rand = seeded(1406);
  const P = S / 4;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      g.fillStyle = mix(base, pv("white"), rand() * 0.18).getStyle();
      g.fillRect(i * P, j * P, P, P);
      g.fillStyle = fio.getStyle();
      g.globalAlpha = 0.18;
      const horiz = (i + j) % 2 === 0;
      for (let k = 6; k < P; k += 7) {
        if (horiz) g.fillRect(i * P + 3, j * P + k, P - 6, 1.5);
        else g.fillRect(i * P + k, j * P + 3, 1.5, P - 6);
      }
      g.globalAlpha = 0.5;
      g.fillRect(i * P, j * P, P, 1.5);
      g.fillRect(i * P, j * P, 1.5, P);
      g.globalAlpha = 1;
    }
  }
  return canvasTexture(c, true);
}

// Vista da cidade pela janela: céu, morros e prédios baixos de Porto Velho ao
// longe, copas de árvore embaixo. Panorama que se repete a cada 8 unidades.
function makeCidadeTexture(pal) {
  const W = 1024;
  const Hh = 128;
  const c = makeCanvas(W, Hh);
  const g = c.getContext("2d");
  const { pv, mix } = pal;
  const ceu = g.createLinearGradient(0, 0, 0, Hh);
  ceu.addColorStop(0, mix(pv("blue-300"), pv("blue-200"), 0.5).getStyle());
  ceu.addColorStop(0.75, mix(pv("blue-100"), pv("white"), 0.4).getStyle());
  g.fillStyle = ceu;
  g.fillRect(0, 0, W, Hh);
  const rand = seeded(69);
  // Nuvens.
  g.fillStyle = pv("white").getStyle();
  g.globalAlpha = 0.8;
  for (let i = 0; i < 7; i++) {
    const x = rand() * W;
    const y = 12 + rand() * 30;
    for (let k = 0; k < 4; k++) {
      g.beginPath();
      g.ellipse(x + k * 14, y + (k % 2) * 4, 18, 8, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.globalAlpha = 1;
  // Prédios ao longe (dois planos), sem emenda na borda.
  const predios = (cor, alt0, alt1, jan) => {
    let x = -20;
    while (x < W) {
      const w = 26 + rand() * 50;
      const h = alt0 + rand() * (alt1 - alt0);
      for (const ox of [0, W]) {
        g.fillStyle = cor.getStyle();
        g.fillRect(x + ox, Hh - h, w, h);
        if (jan) {
          g.fillStyle = jan.getStyle();
          for (let yy = Hh - h + 6; yy < Hh - 10; yy += 9) {
            for (let xx = x + ox + 5; xx < x + ox + w - 6; xx += 9) g.fillRect(xx, yy, 4, 4);
          }
        }
      }
      x += w + 4 + rand() * 20;
    }
  };
  predios(mix(pv("blue-200"), pv("gray-300"), 0.5), 24, 50, null);
  predios(mix(pv("gray-300"), pv("gray-400"), 0.4), 16, 40, mix(pv("blue-200"), pv("white"), 0.3));
  // Copas de árvores na frente.
  for (let x = 0; x < W; x += 12 + rand() * 18) {
    const r = 10 + rand() * 12;
    g.fillStyle = (rand() < 0.5 ? pv("green-700") : mix(pv("green-600"), pv("yellow-500"), 0.2)).getStyle();
    for (const ox of [0, W]) {
      g.beginPath();
      g.arc(x + ox, Hh - 4, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  return canvasTexture(c, true);
}

// Letreiro do andar ("3º ANDAR · ORÇAMENTO"): faixa na cor do andar.
function makeLetreiroTexture(pal, texto, cor, aspect) {
  const Hh = 128;
  const W = Math.round(Hh * aspect);
  const c = makeCanvas(W, Hh);
  const g = c.getContext("2d");
  const { pv, mix } = pal;
  g.fillStyle = cor.getStyle();
  g.fillRect(0, 0, W, Hh);
  g.fillStyle = mix(cor, pv("black"), 0.25).getStyle();
  g.fillRect(0, Hh - 12, W, 12);
  g.fillStyle = pv("white").getStyle();
  g.textAlign = "center";
  g.textBaseline = "middle";
  caberFonte(g, texto, 700, 70, 30, W - 60, pal.font);
  g.fillText(texto, W / 2, Hh / 2 - 2);
  return canvasTexture(c, false);
}

// Aviso de zona sem chefia (plaquinha branca na parede).
function makeAvisoTexture(pal) {
  const c = makeCanvas(512, 96);
  const g = c.getContext("2d");
  const { pv } = pal;
  g.fillStyle = pv("white").getStyle();
  g.fillRect(0, 0, 512, 96);
  g.strokeStyle = pv("gray-400").getStyle();
  g.lineWidth = 4;
  g.strokeRect(4, 4, 504, 88);
  g.fillStyle = pv("gray-700").getStyle();
  g.textAlign = "center";
  g.textBaseline = "middle";
  caberFonte(g, "Atualmente sem chefia", "italic 600", 44, 20, 470, pal.font);
  g.fillText("Atualmente sem chefia", 256, 50);
  return canvasTexture(c, false);
}

// Quadro branco com rabiscos de reunião (caixas, setas e um gráfico).
function makeQuadroBrancoTexture(pal, cor) {
  const c = makeCanvas(256, 160);
  const g = c.getContext("2d");
  const { pv } = pal;
  g.fillStyle = pv("white").getStyle();
  g.fillRect(0, 0, 256, 160);
  g.lineWidth = 3;
  g.strokeStyle = cor.getStyle();
  g.strokeRect(20, 22, 60, 32);
  g.strokeRect(20, 92, 60, 32);
  g.beginPath();
  g.moveTo(80, 38);
  g.lineTo(118, 70);
  g.moveTo(80, 108);
  g.lineTo(118, 78);
  g.stroke();
  g.strokeStyle = pv("red-600").getStyle();
  g.beginPath();
  g.moveTo(130, 130);
  g.lineTo(160, 100);
  g.lineTo(185, 112);
  g.lineTo(230, 40);
  g.stroke();
  g.strokeStyle = pv("gray-700").getStyle();
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(130, 30);
  g.lineTo(130, 135);
  g.lineTo(240, 135);
  g.stroke();
  return canvasTexture(c, false);
}

// ---- Construtor ---------------------------------------------------------------

export function createEscritorio({ andar, pal, track: trackExterno, lite = false, reducedMotion = false }) {
  // Tudo passa pelo `track` do motor (quem descarta no fim). A mobília guarda
  // um cache compartilhado por `track`, então aqui NÃO se descarta nada: o
  // dispose só tira o andar da cena. Sem `track` (uso avulso), guarda-se aqui.
  const proprios = [];
  const track = trackExterno ?? ((x) => {
    proprios.push(x);
    return x;
  });
  const { pv, mix } = pal;
  const white = pv("white");
  const cor = pal.pv(andar.cor);
  const scene = new THREE.Scene();
  scene.background = mix(pv("blue-950"), pv("gray-900"), 0.55);
  const root = new THREE.Group();
  root.name = `escritorio-${andar.id}`;
  scene.add(root);
  const lotes = criarLotes();
  const rad = lite ? 6 : 10;
  const plano = planejar(andar);

  // ---- Materiais ----------------------------------------------------------------
  const M = {
    parede: track(std(mix(pal.wall, pv("gray-100"), 0.4), { roughness: 0.95 })),
    corte: track(std(mix(pv("gray-400"), pv("gray-300"), 0.5), { roughness: 1 })),
    base: track(std(mix(pv("gray-200"), pv("gray-300"), 0.4), { roughness: 1 })),
    rodape: track(std(pv("gray-700"), { roughness: 0.7 })),
    friso: track(std(white, { roughness: 0.7 })),
    acento: track(std(cor, { roughness: 0.7 })),
    tapeteA: track(std(mix(cor, white, 0.8), { roughness: 1 })),
    tapeteB: track(std(mix(cor, white, 0.7), { roughness: 1 })),
    tapeteChefe: track(std(mix(cor, white, 0.5), { roughness: 1 })),
    passadeira: track(std(mix(cor, pv("gray-700"), 0.35), { roughness: 1 })),
    caixilho: track(std(pv("gray-700"), { roughness: 0.5, metalness: 0.3 })),
    madeira: track(std(mix(pal.woodLight, pv("yellow-800"), 0.3), { roughness: 0.7 })),
    madeiraClara: track(std(mix(pal.woodLight, white, 0.35), { roughness: 0.7 })),
    metal: track(std(mix(pv("gray-300"), pv("gray-400"), 0.4), { roughness: 0.45, metalness: 0.35 })),
    escuro: track(std(pv("gray-800"), { roughness: 0.5 })),
    vaso: track(std(mix(pv("gray-50"), pv("gray-200"), 0.5), { roughness: 0.5 })),
    terra: track(std(mix(pv("yellow-800"), pv("gray-900"), 0.55), { roughness: 1 })),
    folha: track(std(pv("green-700"), { roughness: 0.8, flatShading: true })),
    folhaClara: track(std(mix(pv("green-600"), pv("yellow-400"), 0.25), { roughness: 0.8, flatShading: true })),
    estofado: track(std(mix(cor, pv("gray-700"), 0.45), { roughness: 0.9 })),
    agua: track(std(mix(pv("blue-300"), white, 0.3), { roughness: 0.15, transparent: true, opacity: 0.75 })),
    livros: [pv("blue-700"), pv("red-600"), pv("yellow-500"), pv("green-600")].map((c) => track(std(c, { roughness: 0.8 }))),
    capacho: track(std(mix(pv("gray-700"), pv("gray-600"), 0.5), { roughness: 1 })),
    marmore: track(std(mix(pv("gray-50"), pv("gray-100"), 0.5), { roughness: 0.45 })),
  };
  const vidroMat = track(new THREE.MeshStandardMaterial({
    color: pal.glass,
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide,
  }));

  const { norte: ZN, sul: ZS, oeste: XO, leste: XL } = FACE;
  const semSombra = { cast: false };

  // Coloca uma geometria local (frente +z, origem no chão) no tile (x, y).
  const m4 = new THREE.Matrix4();
  const colocar = (geo, x, z, rot = 0) => geo.applyMatrix4(m4.makeRotationY(rot).setPosition(x, 0, z));

  // ---- Base e piso --------------------------------------------------------------
  lotes.add(M.base, caixa(XO - T - 0.25, XL + T + 0.25, -0.3, -0.002, ZN - T - 0.25, ZS + T + 1.1), semSombra);
  const carpete = track(makeCarpeteTexture(pal));
  carpete.repeat.set((XL - XO) / 2, (ZS - ZN) / 2);
  const piso = new THREE.Mesh(track(new THREE.PlaneGeometry(XL - XO, ZS - ZN)), track(std(white, { map: carpete, roughness: 0.95 })));
  piso.rotation.x = -Math.PI / 2;
  piso.position.set((XO + XL) / 2, 0, (ZN + ZS) / 2);
  piso.receiveShadow = !lite;
  root.add(piso);

  // ---- Paredes ------------------------------------------------------------------
  // Vão do elevador na parede norte (a cabine fica atrás da face).
  const VAO = { x: 0.56, h: 1.76 };
  const parede = { cast: false };
  lotes.add(M.parede, caixa(XO - T, -VAO.x, 0, H, ZN - T, ZN), parede);
  lotes.add(M.parede, caixa(VAO.x, XL + T, 0, H, ZN - T, ZN), parede);
  lotes.add(M.parede, caixa(-VAO.x, VAO.x, VAO.h, H, ZN - T, ZN), parede);
  lotes.add(M.parede, caixa(XO - T, XO, 0, H, ZN, ZS + T), parede);
  lotes.add(M.parede, caixa(XL, XL + T, 0, H, ZN, ZS + T), parede);
  const temRua = Boolean(andar.recepcao);
  const PX0 = temRua ? -1 : 0;
  const PX1 = temRua ? 1 : 0;
  if (temRua) {
    lotes.add(M.parede, caixa(XO, PX0, 0, HS, ZS, ZS + T), parede);
    lotes.add(M.parede, caixa(PX1, XL, 0, HS, ZS, ZS + T), parede);
  } else {
    lotes.add(M.parede, caixa(XO, XL, 0, HS, ZS, ZS + T), parede);
  }
  // Tampa cinza do corte no topo das paredes.
  const C = 0.012;
  lotes.add(M.corte, caixa(XO - T, XL + T, H, H + C, ZN - T, ZN), parede);
  lotes.add(M.corte, caixa(XO - T, XO, H, H + C, ZN, ZS + T), parede);
  lotes.add(M.corte, caixa(XL, XL + T, H, H + C, ZN, ZS + T), parede);
  for (const [a, b] of temRua ? [[XO, PX0], [PX1, XL]] : [[XO, XL]]) {
    lotes.add(M.corte, caixa(a, b, HS, HS + C, ZS, ZS + T), parede);
    lotes.add(M.friso, caixa(a + (a === XO ? 0.03 : 0), b - (b === XL ? 0.03 : 0), HS - 0.04, HS, ZS - 0.03, ZS), parede);
  }
  // Rodapé (também na mureta) e faixa na cor do andar nas paredes altas.
  const faixa = (mat, y0, y1, e, comMureta) => {
    lotes.add(mat, caixa(XO, -VAO.x - 0.45, y0, y1, ZN, ZN + e), parede);
    lotes.add(mat, caixa(VAO.x + 0.45, XL, y0, y1, ZN, ZN + e), parede);
    lotes.add(mat, caixa(XO, XO + e, y0, y1, ZN + e, ZS), parede);
    lotes.add(mat, caixa(XL - e, XL, y0, y1, ZN + e, ZS), parede);
    if (comMureta) {
      for (const [a, b] of temRua ? [[XO + e, PX0], [PX1, XL - e]] : [[XO + e, XL - e]]) lotes.add(mat, caixa(a, b, y0, y1, ZS - e, ZS), parede);
    }
  };
  faixa(M.rodape, 0, 0.12, 0.03, true);
  faixa(M.acento, 1.4, 1.47, 0.015, false);
  faixa(M.friso, H - 0.08, H, 0.06, false);

  // ---- Janelas com a vista da cidade -----------------------------------------
  // Faixa alta (acima das placas) nas paredes altas; no meio da parede norte
  // fica o letreiro do andar.
  const JAN = { y0: 2.2, y1: 2.82 };
  const cidadeTex = track(makeCidadeTexture(pal));
  const cidadeMat = track(new THREE.MeshBasicMaterial({ map: cidadeTex, color: mix(white, pv("gray-200"), 0.15) }));
  const vidros = [];
  const LET_MEIA = 3.4;
  // `janela(parede, a0, a1)`: trecho ao longo da parede (x no norte, z nas laterais).
  const janela = (lado, a0, a1) => {
    const comp = a1 - a0;
    const g = new THREE.PlaneGeometry(comp, JAN.y1 - JAN.y0);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, (a0 + uv.getX(i) * comp) / 8);
    const meio = (a0 + a1) / 2;
    const yc = (JAN.y0 + JAN.y1) / 2;
    if (lado === "norte") g.translate(meio, yc, ZN + 0.008);
    else if (lado === "oeste") g.rotateY(Math.PI / 2).translate(XO + 0.008, yc, meio);
    else g.rotateY(-Math.PI / 2).translate(XL - 0.008, yc, meio);
    vidros.push(g);
    // Caixilho: peitoril, verga e montantes a cada ~1 unidade.
    const box = (u0, u1, y0, y1, d) => {
      if (lado === "norte") return caixa(u0, u1, y0, y1, ZN, ZN + d);
      if (lado === "oeste") return caixa(XO, XO + d, y0, y1, u0, u1);
      return caixa(XL - d, XL, y0, y1, u0, u1);
    };
    lotes.add(M.friso, box(a0 - 0.04, a1 + 0.04, JAN.y0 - 0.06, JAN.y0, 0.07), semSombra);
    lotes.add(M.caixilho, box(a0 - 0.03, a1 + 0.03, JAN.y1, JAN.y1 + 0.04, 0.03), semSombra);
    const n = Math.max(1, Math.round(comp / 1.1));
    for (let i = 0; i <= n; i++) {
      const u = a0 + (comp * i) / n;
      lotes.add(M.caixilho, box(u - 0.025, u + 0.025, JAN.y0, JAN.y1, 0.03), semSombra);
    }
  };
  janela("norte", XO + 0.35, -LET_MEIA - 0.3);
  janela("norte", LET_MEIA + 0.3, XL - 0.35);
  janela("oeste", ZN + 0.35, ZS - 0.5);
  janela("leste", ZN + 0.35, ZS - 0.5);
  {
    const g = mergeGeometries(vidros, false);
    vidros.forEach((v) => v.dispose());
    root.add(new THREE.Mesh(track(g), cidadeMat));
  }

  // ---- Letreiro do andar --------------------------------------------------------
  const ELEV_ALTO = 2.3;
  {
    const texto = `${andar.rotulo} · ${andar.nome}`.toUpperCase();
    const letH = 0.44;
    const letW = LET_MEIA * 2 - 0.2;
    const letY = (ELEV_ALTO + H - 0.08) / 2;
    lotes.add(M.escuro, caixa(-letW / 2 - 0.03, letW / 2 + 0.03, letY - letH / 2 - 0.03, letY + letH / 2 + 0.03, ZN, ZN + 0.03), parede);
    const tex = track(makeLetreiroTexture(pal, texto, cor, letW / letH));
    const letreiro = new THREE.Mesh(
      track(new THREE.PlaneGeometry(letW, letH)),
      track(new THREE.MeshStandardMaterial({ map: tex, emissive: white, emissiveMap: tex, emissiveIntensity: lite ? 0.35 : 0.22, roughness: 0.6 })),
    );
    letreiro.position.set(0, letY, ZN + 0.032);
    root.add(letreiro);
    document.fonts?.ready.then(() => {
      const novo = makeLetreiroTexture(pal, texto, cor, letW / letH);
      tex.image = novo.image;
      tex.needsUpdate = true;
      novo.dispose();
    });
  }

  // ---- Elevador -------------------------------------------------------------------
  const elevador = criarElevador({ pal, track, lite, reducedMotion, rotulo: andar.rotulo, cor });
  elevador.grupo.position.set(0, 0, ZN);
  root.add(elevador.grupo);

  // ---- Porta da rua (térreo) ------------------------------------------------------
  // Porta dupla de vidro cortada na altura da mureta, como no museu.
  let folhas = [];
  if (temRua) {
    const PH = HS + 0.17;
    const BAT = 0.08;
    lotes.add(M.caixilho, caixa(PX0, PX0 + BAT, 0, PH, ZS - 0.02, ZS + T + 0.02));
    lotes.add(M.caixilho, caixa(PX1 - BAT, PX1, 0, PH, ZS - 0.02, ZS + T + 0.02));
    lotes.add(M.caixilho, caixa(PX0 - 0.03, PX1 + 0.03, PH, PH + 0.07, ZS - 0.02, ZS + T + 0.02));
    lotes.add(M.marmore, caixa(PX0 + BAT, PX1 - BAT, 0, 0.015, ZS, ZS + T), semSombra);
    lotes.add(M.capacho, caixa(PX0 + 0.1, PX1 - 0.1, 0, 0.02, ZS + T + 0.06, ZS + T + 0.8), semSombra);
    const folhaW = (PX1 - PX0 - BAT * 2) / 2;
    const folhaH = PH - 0.06;
    const s = 0.05;
    const partes = [
      caixa(0, s, 0, folhaH, -0.02, 0.02),
      caixa(folhaW - s, folhaW, 0, folhaH, -0.02, 0.02),
      caixa(s, folhaW - s, folhaH - s, folhaH, -0.02, 0.02),
      caixa(s, folhaW - s, 0, 0.14, -0.02, 0.02),
    ];
    const folhaGeo = track(mergeGeometries(partes, false));
    partes.forEach((p) => p.dispose());
    const vidroGeo = track(new THREE.PlaneGeometry(folhaW - 0.1, folhaH - 0.19));
    folhas = [1, -1].map((lado) => {
      const pivo = new THREE.Group();
      pivo.position.set(lado > 0 ? PX0 + BAT : PX1 - BAT, 0.02, ZS + T / 2);
      const corpo = new THREE.Group();
      corpo.scale.x = lado;
      const quadro = new THREE.Mesh(folhaGeo, M.caixilho);
      quadro.castShadow = !lite;
      const vidro = new THREE.Mesh(vidroGeo, vidroMat);
      vidro.position.set(folhaW / 2, 0.14 + (folhaH - 0.19) / 2, 0);
      corpo.add(quadro, vidro);
      pivo.add(corpo);
      pivo.userData.lado = lado;
      root.add(pivo);
      return pivo;
    });
  }
  function abrirPorta(k) {
    const a = THREE.MathUtils.clamp(k ?? 0, 0, 1) * THREE.MathUtils.degToRad(100);
    for (const f of folhas) f.rotation.y = -a * f.userData.lado;
  }
  abrirPorta(0);

  // ---- Passadeiras (elevador → gabinete; no térreo, porta → gabinete) -------------
  const temIlha = Boolean(plano.zonas[0]?.ilha);
  const zIlha = tileToWorld(CX, ILHA_Y).z;
  lotes.add(M.passadeira, caixa(-0.95, 0.95, 0, 0.012, ZN + 0.05, temIlha ? zIlha - 1.5 : zIlha + 1.5), semSombra);
  if (temRua) lotes.add(M.passadeira, caixa(-0.95, 0.95, 0, 0.012, zIlha + 1.5, ZS - 0.05), semSombra);

  // ---- Zonas: tapetes, divisórias, placas ---------------------------------------
  const placas = [];
  const PLACA_Y = 1.82;
  const avisoTex = plano.zonas.some((z) => !z.zona.pessoas.length) ? track(makeAvisoTexture(pal)) : null;
  const avisoMat = avisoTex ? track(new THREE.MeshStandardMaterial({ map: avisoTex, roughness: 0.6 })) : null;
  // Divisória de vidro perpendicular à parede, da face até 1,05 para dentro.
  const divisoria = (lado, u) => {
    const prof = 1.05;
    const alt = 1.1;
    const pecas = [];
    const vid = [];
    if (lado === "norte") {
      pecas.push(caixa(u - 0.03, u + 0.03, 0, alt, ZN, ZN + prof), null);
      vid.push(new THREE.PlaneGeometry(prof - 0.06, alt - 0.2).rotateY(Math.PI / 2).translate(u, 0.1 + (alt - 0.2) / 2, ZN + prof / 2));
    } else {
      const x = lado === "oeste" ? XO : XL;
      const s = lado === "oeste" ? 1 : -1;
      vid.push(new THREE.PlaneGeometry(prof - 0.06, alt - 0.2).translate(x + (s * prof) / 2, 0.1 + (alt - 0.2) / 2, u));
    }
    // Quadro do painel: base, topo e montante da ponta.
    const box = (d0, d1, y0, y1, e) => {
      if (lado === "norte") return caixa(u - e, u + e, y0, y1, ZN + d0, ZN + d1);
      if (lado === "oeste") return caixa(XO + d0, XO + d1, y0, y1, u - e, u + e);
      return caixa(XL - d1, XL - d0, y0, y1, u - e, u + e);
    };
    lotes.add(M.acento, box(0, prof, 0, 0.1, 0.03));
    lotes.add(M.caixilho, box(0, prof, alt - 0.04, alt, 0.025), semSombra);
    lotes.add(M.caixilho, box(prof - 0.05, prof, 0, alt, 0.025), semSombra);
    for (const g of vid) lotes.add(vidroMat, g, { cast: false, receive: false });
  };
  // Borda (coordenada ao longo da parede) entre os tiles u-1 e u de um segmento.
  const borda = (seg, u) => {
    const t = seg.tiles[Math.min(u, seg.tiles.length - 1)];
    const p = tileToWorld(t[0], t[1]);
    const meio = seg.parede === "norte" ? p.x : p.z;
    return u >= seg.tiles.length ? meio + 0.5 : meio - 0.5;
  };
  const bordasFeitas = new Set();
  for (const zd of plano.zonas) {
    if (zd.ilha) continue;
    const seg = SEGMENTOS[zd.seg];
    const a0 = borda(seg, zd.u0);
    const a1 = borda(seg, zd.u0 + zd.len);
    const mat = zd.i % 2 ? M.tapeteB : M.tapeteA;
    const prof = seg.parede === "norte" ? 2 : 2.4;
    const ins = 0.06;
    if (seg.parede === "norte") lotes.add(mat, caixa(a0 + ins, a1 - ins, 0, 0.01, ZN + 0.05, ZN + prof), semSombra);
    else if (seg.parede === "oeste") lotes.add(mat, caixa(XO + 0.05, XO + prof, 0, 0.01, a0 + ins, a1 - ins), semSombra);
    else lotes.add(mat, caixa(XL - prof, XL - 0.05, 0, 0.01, a0 + ins, a1 - ins), semSombra);
    // Divisórias nas bordas da zona (menos onde encosta numa parede).
    for (const a of [a0, a1]) {
      const k = `${seg.parede}:${a.toFixed(2)}`;
      const naParede = seg.parede === "norte" ? a <= XO + 0.01 || a >= XL - 0.01 : false;
      if (naParede || bordasFeitas.has(k)) continue;
      bordasFeitas.add(k);
      divisoria(seg.parede, a);
    }
    // Placa da zona no meio da zona. No norte, na parede (de frente para a
    // câmera, que vem do sul). No oeste/leste a parede fica de lado para a
    // câmera: a placa vira BANDEIRA, perpendicular à parede, com o nome nas
    // duas faces, pendurada num braço acima da cabeça (sobre a estação e o
    // começo do corredor; não tapa caminho nem o jogador). Fica na entrada
    // norte da zona: vista do sul, cobre a divisória, não as fotos da zona.
    const meio = (a0 + a1) / 2;
    const lateral = seg.parede !== "norte";
    const BAND = { max: 1.5, y: 2.02, afasta: 0.12 };
    const placa = criarPlacaZona({ pal, track, lite, nome: zd.zona.nome, cor, bandeira: lateral, max: lateral ? BAND.max : undefined });
    if (!lateral) {
      const largura = a1 - a0 - 0.2;
      if (placa.largura > largura) placa.grupo.scale.setScalar(largura / placa.largura);
      placa.grupo.position.set(meio, PLACA_Y, ZN + 0.03);
      placa.grupo.rotation.y = seg.rot;
    } else {
      const s = seg.parede === "oeste" ? 1 : -1;
      const x0 = seg.parede === "oeste" ? XO : XL;
      const topo = BAND.y + placa.altura / 2;
      const zb = a0 + 0.1;
      placa.grupo.position.set(x0 + s * (BAND.afasta + placa.largura / 2), BAND.y, zb);
      // Braço preso na parede (com mão-francesa) e dois tirantes.
      const ponta = BAND.afasta + placa.largura + 0.04;
      const braco = (d0, d1, y0, y1, e) => caixa(Math.min(x0 + s * d0, x0 + s * d1), Math.max(x0 + s * d0, x0 + s * d1), y0, y1, zb - e, zb + e);
      lotes.add(M.caixilho, braco(0, ponta, topo + 0.1, topo + 0.14, 0.02), semSombra);
      lotes.add(M.caixilho, braco(0, 0.04, topo - 0.05, topo + 0.2, 0.04), semSombra);
      for (const d of [BAND.afasta + 0.12, BAND.afasta + placa.largura - 0.12]) lotes.add(M.caixilho, braco(d - 0.006, d + 0.006, topo, topo + 0.1, 0.006), semSombra);
    }
    root.add(placa.grupo);
    placas.push(placa);
    if (!zd.zona.pessoas.length && avisoMat) {
      const aviso = new THREE.Mesh(track(new THREE.PlaneGeometry(1.1, 0.2)), avisoMat);
      if (!lateral) {
        aviso.position.copy(placa.grupo.position);
        aviso.position.y = 1.2;
        aviso.rotation.y = seg.rot;
        aviso.translateZ(0.01);
      } else {
        // Pendurado logo abaixo da bandeira, virado para o sul.
        aviso.position.set(placa.grupo.position.x, BAND.y - placa.altura / 2 - 0.14, placa.grupo.position.z + 0.03);
        const cabo = (x) => lotes.add(M.caixilho, caixa(x - 0.005, x + 0.005, BAND.y - placa.altura / 2 - 0.04, BAND.y - placa.altura / 2, aviso.position.z - 0.005, aviso.position.z + 0.005), semSombra);
        cabo(aviso.position.x - 0.45);
        cabo(aviso.position.x + 0.45);
      }
      root.add(aviso);
    }
  }

  // ---- Estações ------------------------------------------------------------------
  const estacoes = new Map(); // id → { e, plano }
  const hitQuadros = [];
  const porTile = new Map();
  const vistaDe = new Map();
  for (const ep of plano.estacoes) {
    const e = criarEstacao({ pal, track, lite, reducedMotion, pessoa: ep.pessoa, corAndar: cor });
    e.grupo.position.set(ep.x, 0, ep.z);
    e.grupo.rotation.y = ep.rot;
    root.add(e.grupo);
    const id = ep.pessoa.id;
    e.hit.userData.quadroId = id;
    hitQuadros.push(e.hit);
    estacoes.set(id, { e, plano: ep });
    for (const [x, y] of ep.tiles) porTile.set(chave(x, y), id);
    ep.ver.forEach(([x, y]) => vistaDe.set(`${chave(x, y)}:${ep.dir}`, id));
    // Chefia de departamento: tapetinho mais forte sob a estação e a frente.
    if (ep.chefe && !ep.ilha) {
      const [fx, fz] = [Math.sin(ep.rot), Math.cos(ep.rot)];
      const cx = ep.x + fx * 0.5;
      const cz = ep.z + fz * 0.5;
      const w = Math.abs(fx) > 0.5 ? 1.9 : 0.9;
      const d = Math.abs(fx) > 0.5 ? 0.9 : 1.9;
      lotes.add(M.tapeteChefe, caixa(cx - w / 2, cx + w / 2, 0.01, 0.018, cz - d / 2, cz + d / 2), semSombra);
    }
  }
  // Parte fixa de todas as estações em lotes; cadeiras instanciadas.
  const fusao = fundirEstacoes([...estacoes.values()].map((s) => s.e), root, track, lite);

  // ---- Ilha do gabinete (chefia do andar) ----------------------------------------
  if (temIlha) {
    const zd = plano.zonas[0];
    const ep = plano.estacoes.find((s) => s.ilha);
    const cxI = ep.x;
    const czI = ep.z;
    // Tapete do gabinete com borda na cor do andar.
    lotes.add(M.passadeira, caixa(cxI - 1.95, cxI + 1.95, 0, 0.012, czI - 1.5, czI + 1.5), semSombra);
    lotes.add(M.tapeteChefe, caixa(cxI - 1.8, cxI + 1.8, 0.012, 0.02, czI - 1.38, czI + 1.38), semSombra);
    // Gaveteiros ladeando a mesa, com um vaso pequeno em cima.
    for (const s of [-1, 1]) {
      const x = cxI + s * 0.78;
      lotes.add(M.madeira, caixa(x - 0.2, x + 0.2, 0, 0.55, czI - 0.42, czI + 0.02));
      lotes.add(M.escuro, caixa(x - 0.16, x + 0.16, 0.36, 0.37, czI + 0.02, czI + 0.03), semSombra);
      lotes.add(M.escuro, caixa(x - 0.16, x + 0.16, 0.18, 0.19, czI + 0.02, czI + 0.03), semSombra);
    }
    // Placa suspensa sobre a mesa (presa por cabos ao "teto" da maquete).
    const placa = criarPlacaZona({ pal, track, lite, nome: zd.zona.nome, cor });
    const larg = 2.6;
    if (placa.largura > larg) placa.grupo.scale.setScalar(larg / placa.largura);
    placa.grupo.position.set(cxI, 2.3, czI - 0.6);
    root.add(placa.grupo);
    placas.push(placa);
    const lw = Math.min(placa.largura, larg) / 2 - 0.15;
    for (const s of [-1, 1]) lotes.add(M.caixilho, caixa(cxI + s * lw - 0.006, cxI + s * lw + 0.006, 2.3, H, czI - 0.606, czI - 0.594), semSombra);
  }

  // ---- Decoração -------------------------------------------------------------------
  const rand = seeded(hashStr(andar.id));
  // `y0`: altura do apoio (0 = chão; ex.: em cima de um móvel).
  const planta = (x, z, alta, y0 = 0) => {
    const vh = alta ? 0.42 : 0.32;
    const vr = alta ? 0.2 : 0.17;
    lotes.add(M.vaso, new THREE.CylinderGeometry(vr, vr * 0.75, vh, rad).translate(x, y0 + vh / 2, z));
    // Terra 6 mm acima da boca: no mesmo y da tampa do vaso as duas faces
    // brigavam no depth buffer e a terra piscava com a câmera em movimento.
    lotes.add(M.terra, new THREE.CylinderGeometry(vr * 0.9, vr * 0.9, 0.016, rad).translate(x, y0 + vh - 0.002, z), semSombra);
    const n = alta ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const r = (alta ? 0.24 : 0.2) - i * 0.02;
      const a = rand() * Math.PI * 2;
      const yy = y0 + vh + 0.15 + i * (alta ? 0.2 : 0.14);
      lotes.add(i % 2 ? M.folhaClara : M.folha, new THREE.IcosahedronGeometry(r, 0).translate(x + Math.cos(a) * 0.06, yy, z + Math.sin(a) * 0.06));
    }
  };
  // Peças em coordenadas locais (frente +z, encostadas em z = -0,5).
  const arquivo = () => {
    const g = [caixa(-0.24, 0.24, 0, 0.72, -0.48, -0.06)];
    const linhas = [0.24, 0.48].map((y) => caixa(-0.2, 0.2, y - 0.006, y + 0.006, -0.06, -0.05));
    const puxadores = [0.14, 0.38, 0.62].map((y) => caixa(-0.06, 0.06, y - 0.012, y + 0.012, -0.06, -0.035));
    return { metal: g, escuro: [...linhas, ...puxadores] };
  };
  const estante = () => {
    const w = 0.42;
    const alt = 1.45;
    const mad = [
      caixa(-w, -w + 0.04, 0, alt, -0.5, -0.16),
      caixa(w - 0.04, w, 0, alt, -0.5, -0.16),
      caixa(-w, w, 0, 0.06, -0.5, -0.16),
      caixa(-w, w, alt - 0.04, alt, -0.5, -0.16),
      caixa(-w, w, 0, alt, -0.5, -0.47),
    ];
    const livros = [[], [], [], []];
    for (const y of [0.06, 0.5, 0.94]) {
      mad.push(caixa(-w, w, y + 0.4, y + 0.43, -0.5, -0.16));
      let x = -w + 0.06;
      while (x < w - 0.12) {
        const lw = 0.05 + rand() * 0.05;
        const lh = 0.24 + rand() * 0.12;
        livros[Math.floor(rand() * 4)].push(caixa(x, x + lw, y, y + lh, -0.44, -0.2));
        x += lw + 0.01;
      }
    }
    return { madeira: mad, livros };
  };
  const sofa = (len) => ({
    estofado: [
      caixa(-len / 2, len / 2, 0.12, 0.4, -0.42, 0.22),
      caixa(-len / 2, len / 2, 0.4, 0.78, -0.42, -0.24),
      caixa(-len / 2 - 0.1, -len / 2, 0.12, 0.58, -0.42, 0.22),
      caixa(len / 2, len / 2 + 0.1, 0.12, 0.58, -0.42, 0.22),
    ],
    escuro: [caixa(-len / 2, len / 2, 0, 0.12, -0.38, 0.18)],
  });
  const bebedouro = () => ({
    friso: [caixa(-0.17, 0.17, 0, 0.95, -0.46, -0.12)],
    escuro: [caixa(-0.1, 0.1, 0.72, 0.8, -0.12, -0.08)],
    agua: [new THREE.CylinderGeometry(0.13, 0.13, 0.36, rad).translate(0, 1.15, -0.29)],
  });
  const impressora = () => ({
    metal: [caixa(-0.3, 0.3, 0, 0.62, -0.48, -0.06)],
    friso: [caixa(-0.27, 0.27, 0.62, 0.92, -0.45, -0.1)],
    escuro: [caixa(-0.22, 0.22, 0.92, 0.94, -0.42, -0.14), caixa(-0.16, 0.16, 0.74, 0.76, -0.1, 0.02)],
  });
  const aparador = () => ({
    madeira: [caixa(-0.95, 0.95, 0.06, 0.66, -0.2, 0.22)],
    escuro: [caixa(-0.9, 0.9, 0, 0.06, -0.16, 0.18), caixa(-0.002, 0.002, 0.12, 0.6, 0.22, 0.225)],
  });
  const jardineira = () => ({
    madeira: [caixa(-1.45, 1.45, 0, 0.36, -0.3, 0.3)],
    terra: [caixa(-1.4, 1.4, 0.36, 0.37, -0.26, 0.26)],
  });

  const matDe = { metal: M.metal, escuro: M.escuro, madeira: M.madeira, estofado: M.estofado, friso: M.friso, agua: M.agua, terra: M.terra };
  const por = (pecas, x, z, rot) => {
    for (const [k, lista] of Object.entries(pecas)) {
      if (k === "livros") lista.forEach((l, i) => l.forEach((g) => lotes.add(M.livros[i], colocar(g, x, z, rot))));
      else for (const g of lista) lotes.add(matDe[k], colocar(g, x, z, rot), k === "agua" ? semSombra : undefined);
    }
  };
  const recepcoes = [];
  for (const d of plano.decor) {
    if (d.tipo === "areaComum") continue;
    if (d.tipo === "quadroBranco" || d.tipo === "mural") {
      // Na parede da faixa, centrado nos tiles livres do meio.
      const seg = SEGMENTOS[d.seg];
      const t = seg.tiles[d.u];
      const t2 = seg.tiles[d.u + 1] ?? t;
      const p = tileToWorld(t[0], t[1]).add(tileToWorld(t2[0], t2[1])).multiplyScalar(0.5);
      const w = 1.5;
      const hq = 0.9;
      const y = 1.45;
      const mesh = new THREE.Mesh(
        track(new THREE.PlaneGeometry(w, hq)),
        track(d.tipo === "quadroBranco"
          ? new THREE.MeshStandardMaterial({ map: track(makeQuadroBrancoTexture(pal, cor)), roughness: 0.35 })
          : std(mix(pv("yellow-800"), pal.woodLight, 0.5), { roughness: 1 })),
      );
      const n = seg.parede === "oeste" ? [1, 0] : seg.parede === "leste" ? [-1, 0] : [0, 1];
      const base = seg.parede === "oeste" ? new THREE.Vector3(XO, 0, p.z) : seg.parede === "leste" ? new THREE.Vector3(XL, 0, p.z) : new THREE.Vector3(p.x, 0, ZN);
      mesh.position.set(base.x + n[0] * 0.035, y, base.z + n[1] * 0.035);
      mesh.rotation.y = seg.rot;
      root.add(mesh);
      // Moldura e calha.
      const fr = new THREE.Group();
      const e = 0.03;
      const pecas = [
        caixa(-w / 2 - e, w / 2 + e, hq / 2, hq / 2 + e, 0, 0.03),
        caixa(-w / 2 - e, w / 2 + e, -hq / 2 - e, -hq / 2, 0, 0.03),
        caixa(-w / 2 - e, -w / 2, -hq / 2, hq / 2, 0, 0.03),
        caixa(w / 2, w / 2 + e, -hq / 2, hq / 2, 0, 0.03),
        caixa(-w / 3, w / 3, -hq / 2 - e - 0.03, -hq / 2 - e, 0, 0.08),
      ];
      fr.position.set(base.x, y, base.z);
      fr.rotation.y = seg.rot;
      fr.updateMatrix();
      for (const g of pecas) lotes.add(M.caixilho, g.applyMatrix4(fr.matrix), semSombra);
      // Papéis presos no mural.
      if (d.tipo === "mural") {
        for (let i = 0; i < 5; i++) {
          const g = caixa(-0.1, 0.1, -0.13, 0.13, 0.002, 0.006).translate(-0.55 + i * 0.27, (i % 2 ? -0.12 : 0.14), 0);
          lotes.add(i % 2 ? M.friso : M.tapeteChefe, g.applyMatrix4(fr.matrix), semSombra);
        }
      }
      continue;
    }
    const p = tileToWorld(d.x, d.y);
    if (d.tipo === "planta" || d.tipo === "plantaAlta") planta(p.x, p.z, d.tipo === "plantaAlta");
    else if (d.tipo === "arquivo") {
      por(arquivo(), p.x, p.z, d.rot);
      if (rand() < 0.5) {
        const v = new THREE.Vector3(0, 0, -0.27).applyAxisAngle(new THREE.Vector3(0, 1, 0), d.rot).add(p);
        lotes.add(M.vaso, new THREE.CylinderGeometry(0.07, 0.055, 0.12, rad).translate(v.x, 0.78, v.z));
        lotes.add(M.folha, new THREE.IcosahedronGeometry(0.1, 0).translate(v.x, 0.9, v.z));
      }
    } else if (d.tipo === "estante") por(estante(), p.x, p.z, d.rot);
    else if (d.tipo === "bebedouro") por(bebedouro(), p.x, p.z, d.rot);
    else if (d.tipo === "impressora") por(impressora(), p.x, p.z, d.rot);
    else if (d.tipo === "sofa" && d.inicio) {
      // Sofá de 2 tiles: centro entre este tile e o próximo da faixa.
      const seg = SEGMENTOS[d.seg];
      const passo = seg.parede === "norte" ? [1, 0] : [0, 1];
      por(sofa(1.6), p.x + passo[0] * 0.5, p.z + passo[1] * 0.5, d.rot);
    } else if (d.tipo === "sofaEspera") {
      por(sofa(1.7), p.x - 0.05, p.z + 0.5, d.rot);
      planta(p.x, p.z - 1, false);
    } else if (d.tipo === "aparador") {
      por(aparador(), p.x + 0.5, p.z, 0);
      // Plantas em cima do tampo (antes ficavam enterradas no móvel).
      planta(p.x + 0.5 - 0.7, p.z, false, 0.66);
      planta(p.x + 0.5 + 0.7, p.z, false, 0.66);
    } else if (d.tipo === "jardineira") {
      por(jardineira(), p.x, p.z + 0.1, 0);
      for (let i = 0; i < 6; i++) {
        lotes.add(i % 2 ? M.folhaClara : M.folha, new THREE.IcosahedronGeometry(0.2 + rand() * 0.06, 0).translate(p.x - 1.2 + i * 0.48, 0.48, p.z + 0.1 + (rand() - 0.5) * 0.12));
      }
    } else if (d.tipo === "reuniao") {
      // Mesa de reunião (4 × 2 tiles, centro na junção) com seis cadeiras.
      const cx = p.x + 0.5;
      const cz = p.z + 0.5;
      lotes.add(M.madeiraClara, caixa(cx - 1.25, cx + 1.25, 0.68, 0.73, cz - 0.55, cz + 0.55));
      lotes.add(M.escuro, caixa(cx - 0.9, cx + 0.9, 0, 0.68, cz - 0.08, cz + 0.08));
      lotes.add(M.escuro, caixa(cx - 1.0, cx + 1.0, 0, 0.03, cz - 0.4, cz + 0.4), semSombra);
      for (const sx of [-0.8, 0, 0.8]) {
        for (const sz of [-1, 1]) {
          const z = cz + sz * 0.78;
          lotes.add(M.estofado, caixa(cx + sx - 0.2, cx + sx + 0.2, 0.36, 0.44, z - 0.18, z + 0.18));
          lotes.add(M.estofado, caixa(cx + sx - 0.2, cx + sx + 0.2, 0.44, 0.82, z + sz * 0.15, z + sz * 0.2));
          lotes.add(M.escuro, new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6).translate(cx + sx, 0.18, z));
          lotes.add(M.escuro, new THREE.CylinderGeometry(0.17, 0.17, 0.03, rad).translate(cx + sx, 0.015, z));
        }
      }
      // Notebook e papéis na mesa.
      lotes.add(M.escuro, caixa(cx - 0.55, cx - 0.2, 0.73, 0.75, cz - 0.15, cz + 0.1));
      lotes.add(M.friso, caixa(cx + 0.2, cx + 0.5, 0.73, 0.735, cz - 0.1, cz + 0.15));
    } else if (d.tipo === "recepcao") {
      const r = criarRecepcao({ pal, track, lite });
      r.grupo.position.set(p.x, 0, p.z + 0.05);
      r.grupo.rotation.y = d.rot;
      root.add(r.grupo);
      recepcoes.push(r);
    }
  }

  // ---- Tema do andar: peças que caracterizam o setor (predio/temas/) ----------
  // Somam-se aos mesmos lotes por material (lotes.add) para não pesar.
  const temaVivo = TEMAS[andar.id]?.construir?.({
    root,
    lotes,
    M,
    vidroMat,
    pal,
    track,
    lite,
    reducedMotion,
    andar,
    cor,
    plano,
    MW,
    MH,
    CX,
    H,
    HS,
    FACE,
    SEGMENTOS,
    tileToWorld,
    caixa,
    colocar,
    rand,
    std,
    makeCanvas,
    canvasTexture,
    caberFonte,
    criarPlacaZona,
  }) ?? null;

  // ---- Luzes ----------------------------------------------------------------------
  const luzQuente = mix(white, pv("yellow-400"), 0.12);
  const hemi = new THREE.HemisphereLight(mix(white, pv("blue-100"), 0.2), mix(pv("gray-200"), white, 0.3), lite ? 2.2 : 1.55);
  root.add(hemi);
  // Luz do dia entrando pelas janelas: direcional alta vinda do sul-oeste.
  const sol = new THREE.DirectionalLight(luzQuente, lite ? 1.3 : 1.35);
  sol.position.set(-3, 13, 8);
  sol.target.position.set(0, 0, -0.5);
  if (!lite) {
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    const sc = sol.shadow.camera;
    sc.left = -13;
    sc.right = 13;
    sc.top = 9;
    sc.bottom = -9;
    sc.near = 1;
    sc.far = 32;
    sol.shadow.bias = -0.0004;
    sol.shadow.normalBias = 0.03;
    sol.shadow.radius = 3;
  }
  root.add(sol, sol.target);
  // Luminárias (fora do lite): duas pontuais quentes sobre as faixas norte.
  if (!lite) {
    for (const x of [-5.5, 5.5]) {
      const l = new THREE.PointLight(pal.lamp, 5, 9, 1.6);
      l.position.set(x, 2.7, ZN + 2);
      root.add(l);
    }
  }

  lotes.fechar(root, track, lite);

  // ---- Interface do interior (mesma do museu) -------------------------------------
  const saidas = new Map(ELEVADOR.map(([x, y]) => [chave(x, y), "elevador"]));
  if (temRua) for (const [x, y] of PORTA_RUA) saidas.set(chave(x, y), "rua");
  const inBounds = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  const passable = (x, y) => x >= 1 && y >= 1 && x <= MW - 2 && y <= MH - 2 && !plano.bloq.has(chave(x, y));
  const saidaEm = (x, y) => saidas.get(chave(x, y)) ?? null;
  const infoPorTile = new Map();
  for (const i of plano.infos) for (const [x, y] of i.tiles) infoPorTile.set(chave(x, y), i);
  const q = new THREE.Quaternion();
  let destaque = null;
  let perto = null;

  return {
    scene,
    MW,
    MH,
    tileToWorld,
    chegada: CHEGADA,
    entradaRua: temRua ? ENTRADA_RUA : null,
    porta: temRua ? { tile: PORTA_RUA[0] } : null,
    passable,
    inBounds,
    saidaEm,
    ehPorta: (x, y) => saidaEm(x, y) !== null,
    // Estação que ocupa o tile (x, y) (clique ou Espaço de frente).
    quadroNaParede: (x, y) => porTile.get(chave(x, y)) ?? null,
    // Estação vista de (x, y) olhando `dir` (só pela frente dela).
    quadroVisto(x, y, dir) {
      const d = DIRS[dir];
      if (!d) return null;
      const id = porTile.get(chave(x + d[0], y + d[1]));
      return id && vistaDe.get(`${chave(x, y)}:${dir}`) === id ? id : null;
    },
    pontoDeVista(id) {
      const s = estacoes.get(id);
      if (!s) return null;
      const [x, y] = s.plano.ver[0];
      return { x, y, dir: s.plano.dir };
    },
    pessoaEm: () => null,
    // Objeto que ensina no tile (x, y): { id, titulo, texto } ou null.
    infoEm: (x, y) => infoPorTile.get(chave(x, y)) ?? null,
    hitPessoas: [],
    ids: plano.estacoes.map((s) => s.pessoa.id),
    pose(id) {
      const s = estacoes.get(id);
      if (!s) return null;
      const { grupo, foto } = s.e;
      grupo.updateWorldMatrix(true, false);
      return {
        centro: grupo.localToWorld(foto.centro.clone()),
        normal: foto.normal.clone().applyQuaternion(grupo.getWorldQuaternion(q)).normalize(),
        largura: foto.largura,
        altura: foto.altura,
        // A plaquinha com o nome (mobilia.js) fica logo abaixo do porta-
        // retrato: entra no close da câmera.
        abaixo: 0.35,
      };
    },
    hitQuadros,
    setDestaque(id) {
      if (destaque === id) return;
      estacoes.get(destaque)?.e.setDestaque(false);
      destaque = estacoes.has(id) ? id : null;
      estacoes.get(destaque)?.e.setDestaque(true);
    },
    setPerto(id) {
      if (perto === id) return;
      estacoes.get(perto)?.e.setPerto(false);
      perto = estacoes.has(id) ? id : null;
      estacoes.get(perto)?.e.setPerto(true);
    },
    falar() {},
    abrirPorta,
    abrirElevador: (k) => elevador.abrir(k),
    update(t, dt) {
      for (const { e } of estacoes.values()) e.update(t, dt);
      fusao.atualizar();
      elevador.update(t, dt);
      temaVivo?.update?.(t, dt);
    },
    dispose() {
      for (const { e } of estacoes.values()) e.dispose?.();
      temaVivo?.dispose?.();
      root.removeFromParent();
      for (const d of proprios) d.dispose?.();
      proprios.length = 0;
    },
  };
}

function hashStr(s) {
  return [...String(s)].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
}
