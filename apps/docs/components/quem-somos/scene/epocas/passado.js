// Época "passado": antes da tecnologia. A construção dos prédios Front-End,
// Back-End e Banco de Dados roda de trás para frente: as peças sobem e somem
// do topo para a base, o andaime volta a envolver o prédio e no fim resta a
// obra (terra, fundação, andaime, caixotes, fita). O tom sépia é CSS
// (VilaSemec.jsx).
//
// Contrato de toda época (ver scene/epocas.js):
//   createX({ scene, pal, track, tileToWorld, buildings, makeLabel, reducedMotion })
//     -> { setProgress(k), update(t, dt, k) }
//   setProgress(k): 0 = a Vila de hoje (nada desta época visível e os prédios
//     exatamente como eram), 1 = época completa. Determinístico: o mesmo k
//     dá sempre a mesma cena (a volta ao presente roda k de 1 para 0).
//   update(t, dt, k): animação contínua (só quando k > 0).
//
// Linha do tempo (k):
//   0,00–0,75  desmontagem (cada prédio com um pequeno atraso)
//   0,08–0,40  guindaste se ergue
//   0,20–0,80  andaime sobe de baixo para cima
//   0,60–1,00  terra, fundação, caixotes e fita
import * as THREE from "three";
import { createKit, trecho, assentar } from "./comum";

const TECH = ["frontend", "backend", "database"];
// Janela de desmontagem de cada prédio.
const JANELA = { frontend: [0, 0.68], backend: [0.04, 0.72], database: [0.07, 0.75] };
const DUR = 0.13; // duração (em k) da saída de cada peça
const SUBIDA = 0.55; // quanto a peça sobe (mundo) ao sair
const ALTA = 0.6; // peças mais altas que isso baixam como andares

export function createPassado({ scene, pal, track, buildings }) {
  const { pv, mix } = pal;
  const { box, mat, part } = createKit({ pal, track });

  // ---- Peças dos prédios: transform original e janela de saída ---------------
  const pecas = [];
  const _bb = new THREE.Box3();
  const _m3 = new THREE.Matrix3();
  const molduras = new Map(); // id → { c, s, topo } da caixa do prédio
  for (const id of TECH) {
    const g = buildings.get(id);
    if (!g) continue;
    g.updateWorldMatrix(true, true);
    const bb = new THREE.Box3().setFromObject(g);
    molduras.set(id, { c: bb.getCenter(new THREE.Vector3()), s: bb.getSize(new THREE.Vector3()), topo: bb.max.y });
    // Peça = objeto renderizável mais alto da árvore (filhos vão junto).
    const lista = [];
    const visitar = (o) => {
      for (const f of o.children) {
        if (f.geometry) lista.push(f);
        else visitar(f);
      }
    };
    visitar(g);
    const _y = new THREE.Vector3();
    const itens = lista.map((o, ordem) => {
      _bb.setFromObject(o);
      const topo = _bb.isEmpty() ? 0 : _bb.max.y;
      const base = _bb.isEmpty() ? 0 : _bb.min.y;
      // 1 unidade "para cima" do mundo no espaço local do pai.
      _m3.setFromMatrix4(o.parent.matrixWorld).invert();
      const cima = new THREE.Vector3(0, 1, 0).applyMatrix3(_m3);
      // Peça alta e em pé (eixo y local = cima do mundo) baixa como andares.
      _y.setFromMatrixColumn(o.matrixWorld, 1).normalize();
      const alta = topo - base > ALTA && _y.y > 0.999;
      const origem = o.getWorldPosition(new THREE.Vector3()).y;
      return { o, topo, base, ordem, alta, rel: base - origem, pos: o.position.clone(), esc: o.scale.clone(), vis: o.visible, cima, a: 0, b: 0 };
    });
    // Topo mais alto primeiro; desempate pela base e pela ordem de criação.
    itens.sort((p, q) => q.topo - p.topo || q.base - p.base || p.ordem - q.ordem);
    const [a0, a1] = JANELA[id];
    const fim = a1 - DUR;
    const teto = Math.max(...itens.map((p) => p.topo), 0.01);
    // Instante em que o "corte" (descendo do teto ao chão) passa pela altura y.
    const quando = (y) => a0 + (fim - a0) * (1 - Math.min(Math.max(y / teto, 0), 1));
    const n = itens.length;
    itens.forEach((p, i) => {
      if (p.alta) {
        p.a = quando(p.topo);
        p.b = Math.max(quando(Math.max(p.base, 0)) + DUR * 0.5, p.a + DUR);
      } else {
        // Metade pela altura, metade pela fila: escalona peças do mesmo nível.
        p.a = (quando(p.topo) + a0 + (fim - a0) * (n > 1 ? i / (n - 1) : 0)) / 2;
        p.b = p.a + DUR;
      }
      pecas.push(p);
    });
  }

  function aplicarPecas(k) {
    for (const p of pecas) {
      const { o } = p;
      const u = k <= 0 ? 0 : trecho(k, p.a, p.b);
      o.position.copy(p.pos);
      o.scale.copy(p.esc);
      o.visible = p.vis && u < 1;
      if (u <= 0 || u >= 1) continue;
      if (p.alta) {
        // Andares descendo: encolhe em y presa à base, com leve tranco.
        const f = Math.max(1 - u, 0.001);
        o.scale.y *= f;
        o.position.addScaledVector(p.cima, p.rel * (1 - f));
      } else {
        // Assentar ao contrário: um tranco, sobe e encolhe até sumir.
        const e = assentar(1 - u);
        o.position.addScaledVector(p.cima, SUBIDA * (1 - e));
        o.scale.multiplyScalar(Math.max(e, 0.001));
      }
    }
  }

  // ---- Obra no lugar de cada prédio ----------------------------------------
  const passado = new THREE.Group();
  passado.visible = false;
  scene.add(passado);
  const terra = mat(mix(pv("yellow-800"), pv("gray-600"), 0.35), { roughness: 1 });
  const madeira = mat(mix(pv("yellow-600"), pv("yellow-800"), 0.55));
  const tubo = mat(pv("gray-400"), { metalness: 0.4, roughness: 0.5 });
  const concreto = mat(pv("gray-300"), { roughness: 0.95 });
  const tijolo = mat(mix(pv("red-700"), pv("yellow-800"), 0.4), { roughness: 0.95 });
  const fita = mat(pv("yellow-400"));
  const guindasteMat = mat(pv("yellow-600"), { roughness: 0.6 });

  // Cada animado guarda { m, x, y, z, sx, sy, sz } finais e o modo de entrar.
  const postes = []; // { m, h, y0 } crescem do chão
  const tabuas = []; // { m, y, nivel, sx } assentam por altura
  const chao = []; // { m, sx, sz, a, b } abrem do centro
  const caem = []; // { m, y, a, b } caem e assentam
  const fitas = []; // { m, sx, a, b }
  const andaimes = []; // { h, a, b } por prédio (altura final)

  TECH.forEach((id, idx) => {
    const mold = molduras.get(id);
    if (!mold) return;
    const { c, s } = mold;
    const w = Math.min(s.x, 5);
    const d = Math.min(s.z, 4);
    const h = Math.min(Math.max(mold.topo * 0.85, 1.2), 2.4);
    const atraso = idx * 0.03;
    andaimes.push({ h, a: 0.2 + atraso, b: 0.74 + atraso });
    const ia = andaimes.length - 1;

    const push = (lista, m, extra) => {
      passado.add(m);
      lista.push({ m, x: m.position.x, y: m.position.y, z: m.position.z, sx: m.scale.x, sy: m.scale.y, sz: m.scale.z, ...extra });
    };

    // Terra e fundação.
    push(chao, part(box, terra, [w, 0.04, d], [c.x, 0.02, c.z]), { a: 0.6 + atraso, b: 0.78 + atraso });
    push(caem, part(box, concreto, [w - 1.2, 0.3, d - 1.4], [c.x, 0.15, c.z]), { a: 0.68 + atraso, b: 0.86 + atraso, sobe: true });

    // Andaime: postes no perímetro e tábuas a cada nível.
    const xs = [];
    for (let i = 0; i <= 4; i++) xs.push(-w / 2 + 0.3 + ((w - 0.6) * i) / 4);
    const zs = [-d / 2 + 0.3, d / 2 - 0.3];
    for (const x of xs) for (const z of zs) push(postes, part(box, tubo, [0.05, h, 0.05], [c.x + x, h / 2, c.z + z]), { ia });
    for (const x of [xs[0], xs[4]]) push(postes, part(box, tubo, [0.05, h, 0.05], [c.x + x, h / 2, c.z]), { ia });
    const niveis = Math.max(2, Math.round(h / 0.6));
    for (let n = 1; n <= niveis; n++) {
      const y = (h * n) / niveis;
      for (const z of zs) push(tabuas, part(box, madeira, [w - 0.55, 0.05, 0.22], [c.x, y, c.z + z]), { ia, nivel: y });
      for (const x of [xs[0], xs[4]]) push(tabuas, part(box, tubo, [0.04, 0.04, d - 0.6], [c.x + x, y, c.z]), { ia, nivel: y });
    }
    // Travessas em X na frente (uma por vão do meio).
    const diag = Math.hypot(xs[1] - xs[0], h / niveis);
    const ang = Math.atan2(h / niveis, xs[1] - xs[0]);
    for (let n = 0; n < niveis; n++) {
      const y = (h * (n + 0.5)) / niveis;
      for (const [i, sgn] of [[1, 1], [2, -1]]) {
        const m = part(box, tubo, [diag, 0.03, 0.03], [c.x + (xs[i] + xs[i + 1]) / 2, y, c.z + zs[1] + 0.04]);
        m.rotation.z = ang * sgn;
        push(tabuas, m, { ia, nivel: (h * (n + 1)) / niveis });
      }
    }

    // Caixotes, tijolos e fita na frente.
    const fz = c.z + d / 2;
    push(caem, part(box, madeira, [0.4, 0.4, 0.4], [c.x - w / 2 + 0.6, 0.2, fz + 0.35]), { a: 0.76 + atraso, b: 0.9 + atraso });
    push(caem, part(box, madeira, [0.32, 0.32, 0.32], [c.x - w / 2 + 1.05, 0.16, fz + 0.45]), { a: 0.8 + atraso, b: 0.93 + atraso });
    push(caem, part(box, madeira, [0.26, 0.26, 0.26], [c.x - w / 2 + 0.7, 0.53, fz + 0.35]), { a: 0.84 + atraso, b: 0.96 + atraso });
    for (let i = 0; i < 3; i++) {
      push(caem, part(box, tijolo, [0.5, 0.12, 0.26], [c.x + w / 2 - 0.75, 0.06 + i * 0.12, fz + 0.4]), { a: 0.72 + i * 0.05 + atraso, b: 0.84 + i * 0.05 + atraso });
    }
    push(fitas, part(box, fita, [w, 0.06, 0.03], [c.x, 0.5, fz + 0.05]), { a: 0.86, b: 1 });
    for (const x of [-w / 2, w / 2]) push(caem, part(box, madeira, [0.06, 0.55, 0.06], [c.x + x, 0.275, fz + 0.05]), { a: 0.82, b: 0.94, sobe: true });
  });

  // ---- Guindaste entre Front-End e Back-End ---------------------------------
  const fe = molduras.get("frontend");
  const be = molduras.get("backend");
  let guindaste = null;
  if (fe && be) {
    const gx = (fe.c.x + fe.s.x / 2 + be.c.x - be.s.x / 2) / 2;
    const gz = Math.min(fe.c.z - fe.s.z / 2, be.c.z - be.s.z / 2) + 0.35;
    const alto = 3.4;
    const torre = new THREE.Group();
    torre.position.set(gx, 0, gz);
    passado.add(torre);
    torre.add(part(box, concreto, [0.5, 0.12, 0.5], [0, 0.06, 0]));
    torre.add(part(box, guindasteMat, [0.16, alto, 0.16], [0, alto / 2, 0]));
    const lanca = new THREE.Group();
    lanca.position.y = alto;
    torre.add(lanca);
    lanca.add(part(box, guindasteMat, [3, 0.1, 0.12], [0.9, 0.05, 0]));
    lanca.add(part(box, guindasteMat, [0.22, 0.22, 0.22], [0, 0.17, 0]));
    lanca.add(part(box, concreto, [0.3, 0.25, 0.2], [-0.45, -0.07, 0]));
    const cabo = part(box, tubo, [0.015, 1, 0.015], [2, 0, 0]);
    lanca.add(cabo);
    const carga = part(box, madeira, [0.5, 0.08, 0.14], [2, 0, 0]);
    lanca.add(carga);
    guindaste = { torre, lanca, cabo, carga, alto };
  }

  function aplicarObra(k) {
    for (const p of chao) {
      const e = trecho(k, p.a, p.b);
      p.m.visible = e > 0;
      p.m.scale.set(p.sx * Math.max(e, 0.001), p.sy, p.sz * Math.max(e, 0.001));
    }
    for (const p of caem) {
      const e = assentar(trecho(k, p.a, p.b));
      p.m.visible = e > 0;
      if (p.sobe) {
        // Brota do chão.
        const sy = p.sy * Math.max(e, 0.001);
        p.m.scale.set(p.sx, sy, p.sz);
        p.m.position.y = sy / 2 + (p.y - p.sy / 2);
      } else p.m.position.y = p.y + (1 - e) * 1.2;
    }
    for (const p of fitas) {
      const e = trecho(k, p.a, p.b);
      p.m.visible = e > 0;
      p.m.scale.x = p.sx * Math.max(e, 0.001);
    }
    // Andaime: postes crescem do chão; tábuas assentam quando o poste passa.
    const alturas = andaimes.map((a) => a.h * trecho(k, a.a, a.b));
    for (const p of postes) {
      const y = Math.min(alturas[p.ia], p.sy);
      p.m.visible = y > 0;
      p.m.scale.y = Math.max(y, 0.001);
      p.m.position.y = y / 2;
    }
    for (const p of tabuas) {
      const e = assentar(trecho(alturas[p.ia], p.nivel - 0.05, p.nivel + 0.3));
      p.m.visible = e > 0;
      p.m.position.y = p.y + (1 - e) * 0.35;
    }
    if (guindaste) {
      const { torre, lanca, cabo, carga } = guindaste;
      const e = trecho(k, 0.08, 0.4);
      torre.visible = e > 0;
      torre.scale.set(1, Math.max(e, 0.001), 1);
      // A lança gira devolvendo peças; a carga sobe e desce pelo cabo.
      lanca.rotation.y = 0.6 - k * 2.4;
      const desce = 0.6 + 1.6 * Math.abs(Math.sin(k * Math.PI * 3));
      cabo.scale.y = desce;
      cabo.position.y = -desce / 2;
      carga.position.y = -desce - 0.04;
    }
  }

  let ultimo = -1;
  function setProgress(k) {
    if (k === ultimo) return;
    ultimo = k;
    passado.visible = k > 0;
    aplicarPecas(k);
    if (k > 0) aplicarObra(k);
  }

  // Balanço leve da carga do guindaste.
  function update(t) {
    if (guindaste) guindaste.carga.rotation.y = Math.sin(t * 1.3) * 0.25;
  }

  return { setProgress, update };
}
