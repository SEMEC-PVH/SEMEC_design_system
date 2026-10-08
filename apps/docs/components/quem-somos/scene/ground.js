// Chão da Vila SEMEC: terreno contínuo, calçadas e lago.
//
// - Terreno: uma única malha (grade subdividida) com cor por vértice vinda de
//   ruído suave — sem o xadrez de tiles. Escurece sob árvores e no mato alto,
//   clareia em manchas de sol, vira areia na margem do lago e afunda dentro
//   dele (leito com talude orgânico). Fora do mapa desce para o nível do anel
//   de árvores decorativas (y = -0,3).
// - Calçadas: pedra quente em placas 2x2 na parte antiga (oeste) e piso
//   linear de concreto no bairro de tecnologia (leste), com rejunte, meio-fio
//   onde encontra a grama e peças de canto nas esquinas côncavas.
// - Lago: espelho d'água low-poly (flatShading) que ondula pelo vértice,
//   cor por profundidade, pedras na margem, vitórias-régias e reflexos.
//
// Tudo instanciado ou mesclado: poucos draw calls. Cores só de tokens --pv-*.

import * as THREE from "three";
import { std } from "../buildings/shared";

// ---- Ruído determinístico -----------------------------------------------------
function hash2(ix, iy) {
  let h = Math.imul(ix | 0, 374761393) + Math.imul(iy | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, oct = 3) {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  for (let o = 0; o < oct; o++) {
    sum += vnoise(x, y) * amp;
    norm += amp;
    x = x * 2.03 + 17.1;
    y = y * 2.03 + 9.7;
    amp *= 0.5;
  }
  return sum / norm;
}

const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Caixa com topo chanfrado (base em y = 0): placas e meio-fio com quina suave.
function bevelSlab(w, h, d, b) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) {
      pos.setX(i, pos.getX(i) - Math.sign(pos.getX(i)) * b);
      pos.setZ(i, pos.getZ(i) - Math.sign(pos.getZ(i)) * b);
    }
  }
  geo.translate(0, h / 2, 0);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Monta o chão da vila.
 * @returns {{ update(t: number): void }} — update só é chamado sem
 *   prefers-reduced-motion (ondulação da água e reflexos).
 */
export function buildGround({ scene, map, pal, track, W, H, tiles, unitBox }) {
  const { PATH, WATER, TALL, FLOWER, TREE, BUILDING } = tiles;
  const { pv, mix } = pal;
  const white = pv("white");

  // Paleta derivada (somente tokens).
  const c = {
    // Grama um pouco mais terrosa que o green-500 puro: o limão saturado
    // brigava com os prédios e a vegetação (ajuste de coesão do integrador).
    grass: mix(mix(pv("green-500"), pv("green-600"), 0.5), pv("yellow-800"), 0.14),
    grassCool: mix(mix(pv("green-600"), pv("green-700"), 0.15), pv("yellow-800"), 0.06),
    grassSun: mix(mix(pv("green-500"), pv("yellow-400"), 0.24), pv("yellow-800"), 0.1),
    grassDeep: mix(pv("green-600"), pv("green-700"), 0.55),
    shade: mix(pv("green-700"), pv("green-800"), 0.45),
    outer: mix(pv("green-700"), pv("green-800"), 0.5),
    sand: mix(mix(pv("yellow-400"), pv("gray-300"), 0.4), white, 0.3),
    sandWet: mix(pv("yellow-600"), pv("gray-500"), 0.45),
    bedDeep: mix(pv("blue-800"), pv("green-800"), 0.35),
    waterShallow: mix(mix(pv("blue-300"), pv("green-500"), 0.22), white, 0.2),
    waterMid: mix(mix(pv("blue-400"), pv("green-500"), 0.1), pv("blue-300"), 0.35),
    waterDeep: mix(pv("blue-600"), pv("blue-500"), 0.55),
    foam: mix(white, pv("blue-100"), 0.25),
    warm: [
      mix(pv("yellow-400"), white, 0.6),
      mix(pv("yellow-400"), white, 0.47),
      mix(mix(pv("yellow-400"), pv("gray-300"), 0.45), white, 0.4),
    ],
    warmGrout: mix(mix(pv("yellow-600"), pv("gray-500"), 0.5), white, 0.38),
    warmCurb: mix(mix(pv("gray-200"), pv("yellow-400"), 0.2), white, 0.15),
    urban: [mix(pv("gray-200"), white, 0.5), mix(pv("gray-200"), pv("blue-50"), 0.5), mix(pv("gray-200"), pv("gray-300"), 0.2)],
    urbanAccent: mix(pv("gray-300"), pv("gray-400"), 0.3),
    urbanGrout: mix(pv("gray-400"), pv("gray-300"), 0.35),
    urbanCurb: mix(pv("gray-300"), pv("gray-400"), 0.55),
    stone: [mix(pv("gray-300"), pv("yellow-400"), 0.12), pv("gray-400"), mix(pv("gray-300"), pv("gray-500"), 0.5), mix(pv("gray-200"), pv("gray-300"), 0.5)],
    lily: mix(pv("green-600"), pv("green-700"), 0.4),
    glint: mix(white, pv("blue-50"), 0.3),
  };

  const tileAt = (x, y) => (x >= 0 && x < W && y >= 0 && y < H ? map[y][x] : -1);
  const isPath = (x, y) => tileAt(x, y) === PATH;
  const isWater = (x, y) => tileAt(x, y) === WATER;

  // Retângulo de influência do lago (com folga).
  let lx0 = W;
  let ly0 = H;
  let lx1 = -1;
  let ly1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (map[y][x] === WATER) {
        lx0 = Math.min(lx0, x);
        ly0 = Math.min(ly0, y);
        lx1 = Math.max(lx1, x);
        ly1 = Math.max(ly1, y);
      }
  const hasLake = lx1 >= 0;
  const nearLake = (tx, ty, pad) => hasLake && tx > lx0 - pad && tx < lx1 + 1 + pad && ty > ly0 - pad && ty < ly1 + 1 + pad;

  // Distância (em tiles) de um ponto ao tile mais próximo que satisfaz pred.
  const distTo = (tx, ty, pred, r = 3) => {
    const cx = Math.floor(tx);
    const cy = Math.floor(ty);
    let best = r + 1;
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++) {
        if (!pred(x, y)) continue;
        const dx = Math.max(x - tx, 0, tx - (x + 1));
        const dy = Math.max(y - ty, 0, ty - (y + 1));
        const d = Math.hypot(dx, dy);
        if (d < best) best = d;
      }
    return best;
  };
  const notWater = (x, y) => !isWater(x, y);

  // Campo de distância do lago, pré-calculado numa grade fina e suavizado
  // (desfoque em caixa, 2 passadas): arredonda os degraus da grade de tiles.
  // raw = distância assinada exata (positiva dentro d'água); soft = desfocada.
  const LS = 6; // amostras por tile
  const LPAD = 3;
  const gx0 = lx0 - LPAD;
  const gy0 = ly0 - LPAD;
  const gw = hasLake ? (lx1 + 1 - lx0 + LPAD * 2) * LS + 1 : 1;
  const gh = hasLake ? (ly1 + 1 - ly0 + LPAD * 2) * LS + 1 : 1;
  const rawF = new Float32Array(gw * gh);
  const softF = new Float32Array(gw * gh);
  if (hasLake) {
    for (let j = 0; j < gh; j++)
      for (let i = 0; i < gw; i++) {
        const tx = gx0 + i / LS;
        const ty = gy0 + j / LS;
        const d = distTo(tx, ty, notWater, 3);
        rawF[j * gw + i] = d > 0 ? d : -distTo(tx, ty, isWater, 3);
      }
    softF.set(rawF);
    const R = LS; // raio de 1 tile
    const buf = new Float32Array(Math.max(gw, gh));
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 0; j < gh; j++) {
        for (let i = 0; i < gw; i++) buf[i] = softF[j * gw + i];
        for (let i = 0; i < gw; i++) {
          let sum = 0;
          for (let k = -R; k <= R; k++) sum += buf[Math.min(gw - 1, Math.max(0, i + k))];
          softF[j * gw + i] = sum / (R * 2 + 1);
        }
      }
      for (let i = 0; i < gw; i++) {
        for (let j = 0; j < gh; j++) buf[j] = softF[j * gw + i];
        for (let j = 0; j < gh; j++) {
          let sum = 0;
          for (let k = -R; k <= R; k++) sum += buf[Math.min(gh - 1, Math.max(0, j + k))];
          softF[j * gw + i] = sum / (R * 2 + 1);
        }
      }
    }
  }
  const sampleF = (f, tx, ty) => {
    const fx = (tx - gx0) * LS;
    const fy = (ty - gy0) * LS;
    if (fx < 0 || fy < 0 || fx > gw - 1 || fy > gh - 1) return -LPAD;
    const i = Math.min(gw - 2, Math.floor(fx));
    const j = Math.min(gh - 2, Math.floor(fy));
    const u = fx - i;
    const w = fy - j;
    const a = f[j * gw + i];
    const b = f[j * gw + i + 1];
    const c2 = f[(j + 1) * gw + i];
    const d2 = f[(j + 1) * gw + i + 1];
    return a + (b - a) * u + (c2 - a) * w + (a - b - c2 + d2) * u * w;
  };
  const shoreNoise = (tx, ty) => fbm(tx * 0.9 + 7, ty * 0.9 - 3, 3) * 0.55 + fbm(tx * 3.1, ty * 3.1, 2) * 0.12;

  // Distância assinada até a margem (positiva dentro d'água). min(soft, raw)
  // garante que a água nunca passa do contorno real dos tiles de lago (nunca
  // invade tile andável); o ruído só ENCOLHE, quebrando as bordas retas.
  const shore = (tx, ty) => Math.min(sampleF(softF, tx, ty), sampleF(rawF, tx, ty)) - shoreNoise(tx, ty) * 0.75;
  // Versão só suavizada, para a praia de areia acompanhar a margem sem degraus.
  const shoreSoft = (tx, ty) => sampleF(softF, tx, ty) - shoreNoise(tx, ty) * 0.75;
  // Altura do leito do lago (0 fora d'água; até ~-0,34 no meio).
  const bedHeight = (tx, ty) => {
    if (!nearLake(tx, ty, 0.01)) return 0;
    const sd = shore(tx, ty);
    return sd > 0 ? -0.34 * smooth(0, 0.7, sd) : 0;
  };

  // ---- Terreno ------------------------------------------------------------------
  const EXT = 8; // tiles além da borda do mapa
  const SUB = 5; // subdivisões por tile
  const cols = (W + EXT * 2) * SUB;
  const rows = (H + EXT * 2) * SUB;
  const terrainGeo = track(new THREE.PlaneGeometry(W + EXT * 2, H + EXT * 2, cols, rows));
  terrainGeo.rotateX(-Math.PI / 2);
  const tPos = terrainGeo.attributes.position;
  const tCol = new Float32Array(tPos.count * 3);
  const col = new THREE.Color();
  const tmp = new THREE.Color();
  for (let i = 0; i < tPos.count; i++) {
    const wx = tPos.getX(i);
    const wz = tPos.getZ(i);
    const tx = wx + W / 2; // coordenada em tiles (bordas inteiras)
    const ty = wz + H / 2;

    // Base: grama com manchas grandes de tom + manchas de sol + grão fino.
    const n1 = fbm(tx * 0.13, ty * 0.13, 3);
    const n2 = fbm(tx * 0.31 + 40, ty * 0.31 - 12, 2);
    col.copy(c.grass).lerp(c.grassCool, smooth(0.35, 0.75, n1));
    col.lerp(c.grassSun, smooth(0.58, 0.82, n2) * 0.75);
    // Manchas bem largas de grama mais densa: quebram a cor chapada à distância.
    const n3 = fbm(tx * 0.07 - 21, ty * 0.07 + 5, 2);
    col.lerp(c.grassDeep, smooth(0.5, 0.78, n3) * 0.32);
    col.offsetHSL(0, 0, (hash2(Math.round(tx * SUB), Math.round(ty * SUB) + 991) - 0.5) * 0.025);

    // Influência dos tiles vizinhos (amostras em volta do vértice).
    let tall = 0;
    let tree = 0;
    let flower = 0;
    for (const [ox, oy] of [[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]]) {
      const k = tileAt(Math.floor(tx + ox), Math.floor(ty + oy));
      if (k === TALL) tall += 0.25;
      else if (k === TREE) tree += 0.25;
      else if (k === FLOWER) flower += 0.25;
    }
    col.lerp(c.grassDeep, tall * 0.55);
    col.lerp(c.grassSun, flower * 0.25);
    // Sombra de contato sob as copas (oclusão suave).
    const dTree = tree > 0 ? 0 : distTo(tx, ty, (x, y) => tileAt(x, y) === TREE, 1);
    col.lerp(c.shade, (1 - smooth(0, 0.6, dTree)) * 0.35);
    // Contato com as fachadas.
    const dB = distTo(tx, ty, (x, y) => tileAt(x, y) === BUILDING, 1);
    col.lerp(c.shade, (1 - smooth(0, 0.35, dB)) * 0.22);

    // Fora do mapa: desce até o nível do anel de árvores e escurece.
    const dOut = Math.hypot(Math.max(-tx, 0, tx - W), Math.max(-ty, 0, ty - H));
    let y = -0.3 * smooth(0, 0.55, dOut);
    col.lerp(c.outer, smooth(0, 2.5, dOut) * 0.85);

    // Lago: areia na margem, leito afundando para o azul profundo.
    if (nearLake(tx, ty, 1.2)) {
      const h = bedHeight(tx, ty);
      if (h < 0) {
        y = h;
        const depth = -h;
        tmp.copy(c.sand).lerp(c.sandWet, smooth(0.06, 0.16, depth));
        tmp.lerp(c.bedDeep, smooth(0.14, 0.34, depth));
        col.copy(tmp);
      } else {
        // Praia acompanhando a margem orgânica (não o contorno dos tiles).
        const sd = -shoreSoft(tx, ty);
        const edge = 0.12 + fbm(tx * 1.3 + 7, ty * 1.3 - 3, 3) * 0.4;
        // Transição larga (> 2 células da malha): evita o serrilhado dos triângulos.
        col.lerp(c.sand, (1 - smooth(edge - 0.28, edge + 0.14, sd)) * 0.92);
      }
    }

    tPos.setY(i, y);
    tCol[i * 3] = col.r;
    tCol[i * 3 + 1] = col.g;
    tCol[i * 3 + 2] = col.b;
  }
  terrainGeo.setAttribute("color", new THREE.BufferAttribute(tCol, 3));
  terrainGeo.computeVertexNormals();
  const terrain = new THREE.Mesh(
    terrainGeo,
    track(std(white, { vertexColors: true, roughness: 0.95 }))
  );
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Plano distante (além do terreno detalhado), some na névoa.
  const outer = new THREE.Mesh(track(new THREE.PlaneGeometry(W + 80, H + 80)), track(std(c.outer)));
  outer.rotation.x = -Math.PI / 2;
  outer.position.y = -0.31;
  outer.receiveShadow = true;
  scene.add(outer);

  // ---- Calçadas -------------------------------------------------------------------
  const pathTiles = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (map[y][x] === PATH) pathTiles.push([x, y]);
  // Bairro de tecnologia: metade leste e a rua principal sul.
  const isUrban = (x, y) => x >= 12 || y === 16;
  const curbBlocks = (x, y) => {
    const k = tileAt(x, y);
    return k !== PATH && k !== BUILDING && k !== -1;
  };

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();
  const tileX = (x) => x - W / 2; // borda oeste do tile em coordenadas de mundo
  const tileZ = (y) => y - H / 2; // borda norte

  // Contagem prévia.
  let warmN = 0;
  let urbanN = 0;
  for (const [x, y] of pathTiles) {
    if (isUrban(x, y)) urbanN += 2;
    else warmN += 4;
  }

  // Rejunte (base de cada tile de calçada).
  const grout = new THREE.InstancedMesh(unitBox, track(std(white, { roughness: 0.95 })), Math.max(pathTiles.length, 1));
  grout.receiveShadow = true;

  const warmGeo = track(bevelSlab(0.462, 0.026, 0.462, 0.012));
  const warmPavers = new THREE.InstancedMesh(warmGeo, track(std(white, { roughness: 0.9 })), Math.max(warmN, 1));
  warmPavers.receiveShadow = true;
  const urbanGeo = track(bevelSlab(0.472, 0.028, 0.975, 0.008));
  const urbanPavers = new THREE.InstancedMesh(urbanGeo, track(std(white, { roughness: 0.7 })), Math.max(urbanN, 1));
  urbanPavers.receiveShadow = true;

  const CURB_W = 0.075;
  const curbGeo = track(bevelSlab(1, 0.052, CURB_W, 0.01));
  const curbList = [];

  let wi = 0;
  let ui = 0;
  pathTiles.forEach(([x, y], i) => {
    const x0 = tileX(x);
    const z0 = tileZ(y);
    const urban = isUrban(x, y);
    m4.compose(v.set(x0 + 0.5, 0.004, z0 + 0.5), q.identity(), s.set(1, 0.008, 1));
    grout.setMatrixAt(i, m4);
    grout.setColorAt(i, urban ? c.urbanGrout : c.warmGrout);

    if (urban) {
      // Placas grandes de concreto (2 por tile), cruzando a direção de caminhada.
      const horiz = (isPath(x - 1, y) || isPath(x + 1, y)) && !(isPath(x, y - 1) && isPath(x, y + 1));
      for (let k = 0; k < 2; k++) {
        const off = -0.25 + k * 0.5;
        const jitter = (hash2(x * 4 + k, y * 7) - 0.5) * 0.003;
        if (horiz) v.set(x0 + 0.5 + off, 0.005 + jitter, z0 + 0.5);
        else v.set(x0 + 0.5, 0.005 + jitter, z0 + 0.5 + off);
        q.setFromEuler(e.set(0, horiz ? 0 : Math.PI / 2, 0));
        m4.compose(v, q, s.set(1, 1, 1));
        urbanPavers.setMatrixAt(ui, m4);
        // Ritmo discreto: placa de granito a cada 3 tiles ao longo da rua.
        const along = horiz ? x : y;
        const tone = k === 0 && along % 3 === 0 ? c.urbanAccent : c.urban[Math.floor(hash2(x * 13 + k, y * 5) * 3)];
        urbanPavers.setColorAt(ui++, tone);
      }
    } else {
      // Pedra quente 2x2 com variação de tom, altura e giro.
      for (let k = 0; k < 4; k++) {
        const ox = (k % 2) * 0.5 + 0.25;
        const oz = Math.floor(k / 2) * 0.5 + 0.25;
        const r1 = hash2(x * 2 + (k % 2), y * 2 + (k >> 1));
        const r2 = hash2(x * 5 + k, y * 3 + 11);
        v.set(x0 + ox, 0.005 + (r1 - 0.5) * 0.004, z0 + oz);
        q.setFromEuler(e.set(0, (r2 - 0.5) * 0.05, 0));
        m4.compose(v, q, s.set(1, 1, 1));
        warmPavers.setMatrixAt(wi, m4);
        tmp.copy(c.warm[Math.floor(r1 * 3)]).offsetHSL(0, 0, (r2 - 0.5) * 0.03);
        warmPavers.setColorAt(wi++, tmp);
      }
    }

    // Meio-fio nas bordas que encostam na grama (dentro do tile de calçada).
    const half = 0.5 - CURB_W / 2;
    const curbTone = urban ? c.urbanCurb : c.warmCurb;
    if (curbBlocks(x, y - 1)) curbList.push([x0 + 0.5, z0 + 0.5 - half, 0, 1, curbTone, 1]);
    if (curbBlocks(x, y + 1)) curbList.push([x0 + 0.5, z0 + 0.5 + half, 0, 1, curbTone, 1]);
    if (curbBlocks(x - 1, y)) curbList.push([x0 + 0.5 - half, z0 + 0.5, Math.PI / 2, 1, curbTone, 1]);
    if (curbBlocks(x + 1, y)) curbList.push([x0 + 0.5 + half, z0 + 0.5, Math.PI / 2, 1, curbTone, 1]);
    // Esquinas côncavas: os dois vizinhos são calçada, a diagonal não.
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      if (isPath(x + dx, y) && isPath(x, y + dy) && curbBlocks(x + dx, y + dy)) {
        curbList.push([x0 + 0.5 + dx * half, z0 + 0.5 + dy * half, 0, CURB_W, curbTone, 1]);
      }
    }
    // Soleira de granito onde a pedra quente encontra o concreto do bairro:
    // faixa baixa (quase rente ao piso) que marca a transição.
    if (!urban) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!isPath(x + dx, y + dy) || !isUrban(x + dx, y + dy)) continue;
        curbList.push([x0 + 0.5 + dx * half, z0 + 0.5 + dy * half, dx !== 0 ? Math.PI / 2 : 0, 1, c.urbanAccent, 0.68]);
      }
    }
  });
  warmPavers.count = wi;
  urbanPavers.count = ui;

  const curbs = new THREE.InstancedMesh(curbGeo, track(std(white, { roughness: 0.8 })), Math.max(curbList.length, 1));
  curbList.forEach(([cx, cz, rot, len, tone, sy], i) => {
    q.setFromEuler(e.set(0, rot, 0));
    m4.compose(v.set(cx, 0.003, cz), q, s.set(len, sy, 1));
    curbs.setMatrixAt(i, m4);
    curbs.setColorAt(i, tone);
  });
  curbs.count = curbList.length;
  curbs.castShadow = true;
  curbs.receiveShadow = true;
  scene.add(grout, warmPavers, urbanPavers, curbs);

  // ---- Lago -----------------------------------------------------------------------
  const WATER_Y = -0.1;
  const fx = { update() {} };
  if (!hasLake) return fx;

  const lakeW = lx1 + 1 - lx0;
  const lakeH = ly1 + 1 - ly0;
  const WSUB = 6;
  const waterGeo = track(new THREE.PlaneGeometry(lakeW, lakeH, lakeW * WSUB, lakeH * WSUB));
  waterGeo.rotateX(-Math.PI / 2);
  waterGeo.translate(tileX(lx0) + lakeW / 2, WATER_Y, tileZ(ly0) + lakeH / 2);
  const wPos = waterGeo.attributes.position;
  const wCol = new Float32Array(wPos.count * 3);
  const baseX = new Float32Array(wPos.count);
  const baseZ = new Float32Array(wPos.count);
  const ampK = new Float32Array(wPos.count);
  for (let i = 0; i < wPos.count; i++) {
    const wx = wPos.getX(i);
    const wz = wPos.getZ(i);
    baseX[i] = wx;
    baseZ[i] = wz;
    // Profundidade = superfície da água menos o leito (negativa sob a margem).
    const d = WATER_Y - bedHeight(wx + W / 2, wz + H / 2);
    // Raso turquesa claro -> médio -> fundo; espuma fina rente à margem.
    col.copy(c.waterShallow).lerp(c.waterMid, smooth(0.02, 0.12, d)).lerp(c.waterDeep, smooth(0.12, 0.24, d));
    col.lerp(c.foam, (1 - smooth(-0.01, 0.035, d)) * 0.75);
    wCol[i * 3] = col.r;
    wCol[i * 3 + 1] = col.g;
    wCol[i * 3 + 2] = col.b;
    // Ondulação mais suave junto à margem.
    ampK[i] = 0.35 + 0.65 * smooth(0, 0.18, d);
  }
  waterGeo.setAttribute("color", new THREE.BufferAttribute(wCol, 3));
  const waterMat = track(
    std(white, {
      vertexColors: true,
      roughness: 0.18,
      metalness: 0.05,
      flatShading: true,
      transparent: true,
      opacity: 0.8,
    })
  );
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.receiveShadow = true;
  water.userData.noShadow = true;
  scene.add(water);

  const ripple = (x, z, t) =>
    (Math.sin(t * 1.15 + x * 2.3 + z * 1.4) + Math.sin(t * 1.7 - x * 1.3 + z * 2.7) * 0.6 + Math.sin(t * 0.8 + x * 4.1 - z * 3.3) * 0.3) * 0.014;
  // Estado inicial já ondulado (também é o quadro estático com movimento reduzido).
  for (let i = 0; i < wPos.count; i++) wPos.setY(i, WATER_Y + ripple(baseX[i], baseZ[i], 0) * ampK[i]);

  // Pedras na margem: amostradas ao longo das bordas água/terra.
  const stoneSpots = [];
  for (let y = ly0; y <= ly1; y++)
    for (let x = lx0; x <= lx1; x++) {
      if (!isWater(x, y)) continue;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        if (isWater(x + dx, y + dy)) continue;
        const n = 2 + Math.floor(hash2(x * 3 + dx, y * 3 + dy) * 2);
        for (let k = 0; k < n; k++) {
          const r = hash2(x * 31 + k + dx * 7, y * 17 + dy * 5);
          const along = 0.12 + r * 0.76;
          // Caminha da borda para dentro até a linha d'água (margem com ruído).
          let inset = 0.02;
          const at = (ins) => [dx === 0 ? x + along : dx < 0 ? x + ins : x + 1 - ins, dy === 0 ? y + along : dy < 0 ? y + ins : y + 1 - ins];
          while (inset < 1.6 && bedHeight(...at(inset)) > -0.09) inset += 0.03;
          inset += (hash2(x + k * 9, y - k * 3) - 0.6) * 0.14;
          const [px, pz] = at(Math.max(0.02, inset));
          stoneSpots.push([px, pz, r]);
        }
      }
    }
  const stoneGeo = track(new THREE.IcosahedronGeometry(1, 0));
  const stones = new THREE.InstancedMesh(stoneGeo, track(std(white, { flatShading: true, roughness: 0.9 })), Math.max(stoneSpots.length, 1));
  stoneSpots.forEach(([px, pz, r], i) => {
    const sc = 0.055 + hash2(i, 77) * 0.075;
    q.setFromEuler(e.set(hash2(i, 3) * 0.6, r * Math.PI * 2, hash2(i, 5) * 0.6));
    const by = bedHeight(px, pz);
    m4.compose(v.set(tileX(0) + px, by + sc * 0.25, tileZ(0) + pz), q, s.set(sc * (1 + r * 0.5), sc * 0.62, sc));
    stones.setMatrixAt(i, m4);
    stones.setColorAt(i, tmp.copy(c.stone[Math.floor(hash2(i, 13) * c.stone.length)]).offsetHSL(0, 0, (r - 0.5) * 0.04));
  });
  stones.castShadow = true;
  stones.receiveShadow = true;
  scene.add(stones);

  // Vitórias-régias (disco com recorte) em águas mais fundas, perto da margem.
  const lilySpots = [];
  for (let k = 0; k < 400 && lilySpots.length < 9; k++) {
    const px = lx0 + hash2(k, 401) * lakeW;
    const pz = ly0 + hash2(k, 409) * lakeH;
    const d = -bedHeight(px, pz);
    if (d < 0.26 || d > 0.335) continue;
    if (lilySpots.some(([ax, az]) => Math.hypot(ax - px, az - pz) < 0.45)) continue;
    lilySpots.push([px, pz, hash2(k, 419)]);
  }
  const lilyGeo = track(new THREE.CylinderGeometry(1, 1, 0.012, 14, 1, false, 0.35, Math.PI * 2 - 0.7));
  const lilies = new THREE.InstancedMesh(lilyGeo, track(std(white, { flatShading: true, roughness: 0.6 })), Math.max(lilySpots.length, 1));
  const lilyBase = lilySpots.map(([px, pz, r], i) => {
    const sc = 0.09 + r * 0.07;
    const rot = r * Math.PI * 2;
    lilies.setColorAt(i, tmp.copy(c.lily).offsetHSL(0, 0, (r - 0.5) * 0.06));
    return { x: tileX(0) + px, z: tileZ(0) + pz, sc, rot };
  });
  lilies.count = lilySpots.length;
  lilies.receiveShadow = true;
  scene.add(lilies);

  // Reflexos: traços claros que acendem e apagam na superfície.
  const GLINTS = 16;
  const glintSpots = [];
  for (let k = 0; k < 600 && glintSpots.length < GLINTS; k++) {
    const px = lx0 + hash2(k, 503) * lakeW;
    const pz = ly0 + hash2(k, 509) * lakeH;
    if (-bedHeight(px, pz) < 0.3) continue;
    glintSpots.push({ x: tileX(0) + px, z: tileZ(0) + pz, phase: hash2(k, 521) * Math.PI * 2, len: 0.7 + hash2(k, 523) * 0.8 });
  }
  const glintGeo = track(new THREE.PlaneGeometry(0.26, 0.035));
  glintGeo.rotateX(-Math.PI / 2);
  const glints = new THREE.InstancedMesh(
    glintGeo,
    track(new THREE.MeshBasicMaterial({ color: c.glint, transparent: true, opacity: 0.55, depthWrite: false })),
    Math.max(glintSpots.length, 1)
  );
  glints.count = glintSpots.length;
  glints.userData.noShadow = true;
  scene.add(glints);

  // Laços simples (sem closures nem alocação): roda a cada quadro.
  const placeDynamic = (t) => {
    for (let i = 0; i < lilyBase.length; i++) {
      const l = lilyBase[i];
      const y = WATER_Y + 0.004 + ripple(l.x, l.z, t) * 0.8;
      q.setFromEuler(e.set(0, l.rot + Math.sin(t * 0.3 + l.rot) * 0.08, 0));
      m4.compose(v.set(l.x, y, l.z), q, s.set(l.sc, 1, l.sc));
      lilies.setMatrixAt(i, m4);
    }
    lilies.instanceMatrix.needsUpdate = true;
    q.identity();
    for (let i = 0; i < glintSpots.length; i++) {
      const g = glintSpots[i];
      const k = Math.max(0, Math.sin(t * 0.9 + g.phase));
      const sc = k * k;
      m4.compose(v.set(g.x + Math.sin(t * 0.25 + g.phase) * 0.12, WATER_Y + 0.02, g.z), q, s.set(g.len * sc + 0.0001, 1, sc + 0.0001));
      glints.setMatrixAt(i, m4);
    }
    glints.instanceMatrix.needsUpdate = true;
  };
  placeDynamic(1.3);

  fx.update = (t) => {
    for (let i = 0; i < wPos.count; i++) wPos.setY(i, WATER_Y + ripple(baseX[i], baseZ[i], t) * ampK[i]);
    wPos.needsUpdate = true;
    placeDynamic(t);
  };
  return fx;
}
