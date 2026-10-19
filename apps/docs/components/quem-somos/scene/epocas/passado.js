// Época "passado": antes da tecnologia. A construção dos prédios Front-End,
// Back-End e Banco de Dados roda de trás para frente, como um vídeo de obra
// rebobinado: o guindaste tira as lajes (sobem no gancho, a lança gira e elas
// descem na pilha de vigas), as demais peças saltam em arco até a pilha de
// tijolos, as paredes baixam fiada a fiada do topo para a base e o andaime
// cresce do chão. No fim resta o canteiro: terra, fundação com ferragens,
// andaime, pilhas, cerca, cones e placa. Na volta ao presente (k de 1 a 0)
// tudo isso vira a construção acontecendo. A sede da SEMEC não é tocada. O
// tom sépia é CSS (VilaSemec.jsx).
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
//   0,00–0,10  guindastes se erguem (mastro sobe, lança estica)
//   0,02–0,20  terra, cerca, cones e placa da obra
//   0,08–0,86  desmontagem: um "corte" desce do teto ao chão de cada prédio;
//              cada peça sai quando o corte passa (em cascata da esquerda
//              para a direita) e as lajes saem pelo guindaste, uma viagem
//              por vez
//   0,20–0,84  andaime cresce de baixo para cima
//   ~0,6–0,9   fundação e ferragens aparecem quando o corte chega ao chão
//   pilhas de tijolos e vigas crescem conforme as peças chegam; poeira
//   (InstancedMesh) quando uma laje se solta/assenta e na fundação.
import * as THREE from "three";
import { createKit, trecho, assentar } from "./comum";

const TECH = ["frontend", "backend", "database"];
// Janela do corte (do teto ao chão) de cada prédio.
const JANELA = { frontend: [0.06, 0.82], backend: [0.1, 0.85], database: [0.08, 0.83] };
const VOO = 0.09; // duração (k) do voo de uma peça até a pilha
const ONDA = 0.05; // atraso (k) da cascata da esquerda para a direita
const ALTA = 0.6; // peças mais altas que isso baixam como paredes
const LAJE = 1.1; // área (m²) mínima de uma peça para ir pelo guindaste
const POR_PREDIO = 2; // lajes levadas pelo guindaste em cada prédio
const VIAGEM = 0.11; // duração (k) de uma viagem do guindaste
const PRONTO = 0.1; // guindaste erguido
const ENCOLHE = 0.3; // escala da laje quando chega à pilha de vigas
const PUFF = 0.07; // vida (k) de uma nuvem de poeira
const GRAOS = 7; // partículas por nuvem
const ANDAIME = 1.5; // altura final do andaime

const suave = (x) => x * x * (3 - 2 * x);
const sorte = (i) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export function createPassado({ scene, pal, track, buildings, makeLabel, reducedMotion }) {
  const { pv, mix, white } = pal;
  const { box, mat, part } = createKit({ pal, track });

  const passado = new THREE.Group();
  passado.visible = false;
  scene.add(passado);

  // ---- Materiais ----------------------------------------------------------
  const terra = mat(mix(pv("yellow-800"), pv("gray-600"), 0.35), { roughness: 1 });
  const terraEscura = mat(mix(pv("yellow-800"), pv("gray-800"), 0.45), { roughness: 1 });
  const madeira = mat(mix(pv("yellow-800"), pv("gray-400"), 0.3));
  const tubo = mat(pv("gray-400"), { metalness: 0.5, roughness: 0.45 });
  const concreto = mat(pv("gray-300"), { roughness: 0.95 });
  const ferro = mat(mix(pv("red-900"), pv("gray-700"), 0.5), { roughness: 0.8 });
  const viga = mat(pv("gray-600"), { metalness: 0.4, roughness: 0.55 });
  const tijolo = mat(mix(pv("red-700"), pv("yellow-800"), 0.4), { roughness: 0.95 });
  const tijolo2 = mat(mix(pv("red-800"), pv("yellow-800"), 0.3), { roughness: 0.95 });
  const laranja = mat(mix(pv("red-500"), pv("yellow-500"), 0.45));
  const branco = mat(white);
  const amarelo = mat(mix(pv("yellow-500"), pv("yellow-800"), 0.2), { roughness: 0.6 });
  const cabine = mat(pv("gray-100"));
  const cabo = mat(pv("gray-900"));
  const cone = track(new THREE.ConeGeometry(0.09, 0.26, 8));

  // ---- Peças dos prédios ----------------------------------------------------
  const pecas = [];
  const predios = [];
  const _bb = new THREE.Box3();
  const _v = new THREE.Vector3();
  for (const id of TECH) {
    const g = buildings.get(id);
    if (!g) continue;
    g.updateWorldMatrix(true, true);
    const bb = new THREE.Box3().setFromObject(g);
    const c = bb.getCenter(new THREE.Vector3());
    const s = bb.getSize(new THREE.Vector3());
    const pred = { id, c, s, topo: bb.max.y, w: Math.min(s.x, 5), d: Math.min(s.z, 4), pecas: [] };
    pred.frente = c.z + pred.d / 2;
    predios.push(pred);

    // Peça = objeto renderizável mais alto da árvore (filhos vão junto).
    const lista = [];
    const visitar = (o) => {
      for (const f of o.children) {
        if (f.geometry) lista.push(f);
        else visitar(f);
      }
    };
    visitar(g);
    const m3 = new THREE.Matrix3();
    for (const [ordem, o] of lista.entries()) {
      _bb.setFromObject(o);
      const vazio = _bb.isEmpty();
      const centro = vazio ? o.getWorldPosition(new THREE.Vector3()) : _bb.getCenter(new THREE.Vector3());
      const tam = vazio ? new THREE.Vector3() : _bb.getSize(new THREE.Vector3());
      const topo = vazio ? centro.y : _bb.max.y;
      const base = vazio ? centro.y : _bb.min.y;
      // 1 unidade "para cima" do mundo no espaço local do pai.
      m3.setFromMatrix4(o.parent.matrixWorld).invert();
      const cima = new THREE.Vector3(0, 1, 0).applyMatrix3(m3);
      _v.setFromMatrixColumn(o.matrixWorld, 1).normalize();
      const alta = topo - base > ALTA && _v.y > 0.999;
      const origem = o.getWorldPosition(new THREE.Vector3()).y;
      const p = {
        o,
        pred,
        fiadas: Math.max(1, Math.round((topo - base) / 0.22)),
        ordem,
        centro,
        topo,
        base,
        meia: tam.y / 2,
        area: tam.x * tam.z,
        modo: alta ? "alta" : "voo",
        rel: base - origem,
        cima,
        pos: o.position.clone(),
        esc: o.scale.clone(),
        quat: o.quaternion.clone(),
        vis: o.visible,
        giro: (sorte(ordem + pred.c.x) - 0.5) * 2.4,
        alvo: new THREE.Vector3(),
        a: 0,
        b: 0,
      };
      pred.pecas.push(p);
      pecas.push(p);
    }
    // Lajes: as peças largas e chatas mais altas vão pelo guindaste (o piso
    // térreo fica: vira a fundação). Revestimentos finos colados por cima
    // pegam carona.
    const maior = Math.max(...pred.pecas.map((p) => p.area));
    const lajes = [];
    pred.pecas
      .filter((p) => p.modo === "voo" && p.area >= Math.max(LAJE, maior * 0.4) && p.meia < 0.25 && p.meia >= 0.008 && p.base > 0.3)
      .sort((p, q) => q.topo - p.topo)
      .forEach((p) => {
        if (lajes.length < POR_PREDIO && lajes.every((l) => Math.abs(l.topo - p.topo) > 0.15)) lajes.push(p);
      });
    for (const l of lajes) {
      l.modo = "grua";
      l.caronas = [];
    }
    for (const p of pred.pecas) {
      if (p.modo !== "voo") continue;
      const l = lajes.find(
        (l) => Math.abs(p.base - l.topo) < 0.03 && p.meia < 0.06 && Math.abs(p.centro.x - l.centro.x) < 2.5 && Math.abs(p.centro.z - l.centro.z) < 2
      );
      if (l && p.area > 0.5) {
        p.modo = "carona";
        p.laje = l;
        l.caronas.push(p);
      }
      // Outras peças grandes e chatas (pisos) não voam: baixam como paredes.
      else if (p.area > 2.5) p.modo = "alta";
    }
    // Instante em que o corte (descendo do teto ao chão) passa pela altura y.
    // O teto do corte fica pouco acima da laje mais alta: antenas e máquinas
    // do telhado saem logo no começo, em cascata.
    const [a0, a1] = JANELA[id];
    const fim = a1 - VOO - ONDA;
    const alturaMax = Math.max(...pred.pecas.map((p) => p.topo), 0.01);
    const teto = lajes.length ? Math.min(alturaMax, lajes[0].topo + 0.45) : alturaMax;
    pred.quando = (y) => a0 + (fim - a0) * (1 - Math.min(Math.max(y / teto, 0), 1));
    pred.a0 = a0;
    pred.a1 = a1;
  }

  // ---- Canteiro de cada prédio ---------------------------------------------
  // Cada animado guarda transform final e o jeito de entrar.
  const brotam = []; // { m, sy, y, a, b } crescem do chão (scale y)
  const abrem = []; // { m, sx, sz, a, b } abrem do centro (scale xz)
  const caem = []; // { m (grupo/mesh), y, a, b } caem e assentam
  const postes = []; // { m, h, pred } andaime: crescem com o andaime
  const niveis = []; // { m, y, nivel, pred } andaime: assentam por nível
  const poeira = []; // { k, x, y, z, r } nuvens de poeira

  const add = (m) => (passado.add(m), m);
  const brota = (m, a, b) => brotam.push({ m: add(m), sy: m.scale.y, y: m.position.y - m.scale.y / 2, a, b });
  const abre = (m, a, b) => abrem.push({ m: add(m), sx: m.scale.x, sz: m.scale.z, a, b });
  const cai = (m, a, b, altura = 0.8) => caem.push({ m: add(m), y: m.position.y, a, b, altura });

  predios.forEach((pred, idx) => {
    const { c, w, d, frente } = pred;
    const atraso = idx * 0.02;

    // Terra (abre do centro) e fundação com ferragens (sobe quando o corte
    // chega ao chão).
    abre(part(box, terra, [w + 0.3, 0.03, d + 0.5], [c.x, 0.015, c.z + 0.1]), 0.02 + atraso, 0.12 + atraso);
    const tf = pred.quando(0.35);
    pred.fundacao = tf;
    brota(part(box, concreto, [w - 0.6, 0.16, d - 0.7], [c.x, 0.08, c.z]), tf, tf + 0.06);
    brota(part(box, terraEscura, [w - 0.3, 0.06, d - 0.4], [c.x, 0.03, c.z]), tf - 0.02, tf + 0.03);
    // Fôrma de madeira em volta da laje.
    const fw = w - 0.6;
    const fd = d - 0.7;
    for (const [sx, sz, x, z] of [
      [fw + 0.1, 0.05, c.x, c.z - fd / 2 - 0.025],
      [fw + 0.1, 0.05, c.x, c.z + fd / 2 + 0.025],
      [0.05, fd, c.x - fw / 2 - 0.025, c.z],
      [0.05, fd, c.x + fw / 2 + 0.025, c.z],
    ]) {
      brota(part(box, madeira, [sx, 0.22, sz], [x, 0.11, z]), tf - 0.01, tf + 0.05);
    }
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        const x = c.x + (-0.5 + i / 4) * (w - 1.1);
        const z = c.z + (-0.5 + j / 2) * (d - 1.2);
        brota(part(box, ferro, [0.03, 0.34, 0.03], [x, 0.16 + 0.17, z]), tf + 0.04 + i * 0.006, tf + 0.1 + i * 0.006);
      }
    }
    poeira.push({ k: tf + 0.02, x: c.x, y: 0.1, z: c.z, r: 1.2 });

    // Paletes de tijolos sobre a fundação, no canto da frente à esquerda
    // (chegam depois que o prédio sai).
    pred.paletes = [];
    const lajeZ = c.z + (d - 0.7) / 2;
    for (let i = 0; i < 5; i++) {
      const pal3 = new THREE.Group();
      const col = i % 3;
      const lin = Math.floor(i / 3);
      pal3.position.set(c.x - w / 2 + 0.75 + col * 0.46, 0.16, lajeZ - 0.3 - lin * 0.42 + (col % 2) * 0.04);
      pal3.add(part(box, madeira, [0.4, 0.05, 0.3], [0, 0.025, 0]));
      pal3.add(part(box, tijolo, [0.36, 0.1, 0.26], [0, 0.1, 0]));
      pal3.add(part(box, tijolo2, [0.34, 0.1, 0.24], [0.01, 0.2, -0.005]));
      pal3.rotation.y = (sorte(i + idx * 9) - 0.5) * 0.3;
      pred.paletes.push(pal3);
    }

    // Cerca de obra na frente (com vão no meio), cones e placa.
    const fz = frente - 0.06;
    const trechos = [
      [c.x - w / 2 - 0.1, c.x - 0.55],
      [c.x + 0.55, c.x + w / 2 + 0.1],
    ];
    let n = 0;
    for (const [x0, x1] of trechos) {
      const vaos = Math.max(1, Math.round((x1 - x0) / 0.5));
      for (let i = 0; i <= vaos; i++) {
        const x = x0 + ((x1 - x0) * i) / vaos;
        const t = 0.04 + atraso + n++ * 0.006;
        brota(part(box, branco, [0.05, 0.42, 0.05], [x, 0.21, fz]), t, t + 0.05);
        if (i < vaos) {
          const xm = x + (x1 - x0) / vaos / 2;
          const comp = (x1 - x0) / vaos - 0.05;
          const listra = i % 2 ? branco : laranja;
          cai(part(box, listra, [comp, 0.07, 0.03], [xm, 0.34, fz]), t + 0.03, t + 0.08, 0.4);
          cai(part(box, i % 2 ? laranja : branco, [comp, 0.07, 0.03], [xm, 0.17, fz]), t + 0.04, t + 0.09, 0.4);
        }
      }
    }
    for (const [dx, t] of [
      [-0.35, 0.09],
      [0.35, 0.11],
    ]) {
      const g = new THREE.Group();
      g.position.set(c.x + dx, 0.14, fz + 0.16);
      g.add(part(cone, laranja, [1, 1, 1], [0, 0, 0]));
      g.add(part(box, branco, [0.1, 0.04, 0.1], [0, 0.02, 0]));
      g.add(part(box, laranja, [0.2, 0.02, 0.2], [0, -0.12, 0]));
      cai(g, t + atraso, t + 0.06 + atraso, 0.6);
    }
    // Placa "OBRA" sobre dois postes, no canto direito da cerca.
    const placa = new THREE.Group();
    const px = c.x + w / 2 - 0.55;
    placa.position.set(px, 0, fz + 0.06);
    placa.add(part(box, madeira, [0.05, 0.85, 0.05], [-0.38, 0.425, 0]));
    placa.add(part(box, madeira, [0.05, 0.85, 0.05], [0.38, 0.425, 0]));
    placa.add(part(box, madeira, [0.92, 0.32, 0.03], [0, 0.68, -0.005]));
    if (makeLabel) {
      const nome = { frontend: "OBRA · FRONT-END", backend: "OBRA · BACK-END", database: "OBRA · BANCO" }[pred.id];
      const tex = track(makeLabel(nome, pv("yellow-500"), pv("gray-900")));
      const face = new THREE.Mesh(track(new THREE.PlaneGeometry(0.88, 0.22)), track(new THREE.MeshBasicMaterial({ map: tex })));
      face.position.set(0, 0.68, 0.012);
      placa.add(face);
    }
    placa.rotation.y = -0.12;
    cai(placa, 0.12 + atraso, 0.2 + atraso, 0.9);

    // Andaime: duas fileiras de tubos nos fundos e nas laterais (a frente
    // fica aberta para a câmera ver a fundação), pranchas por nível.
    const x0 = c.x - w / 2 - 0.12;
    const x1 = c.x + w / 2 + 0.12;
    const z0 = c.z - d / 2 - 0.12;
    const z1 = frente - 0.3;
    const lados = [
      // [ax, az, bx, bz, fora (dx, dz)]
      [x0, z0, x1, z0, 0, -1],
      [x0, z0, x0, z1, -1, 0],
      [x1, z0, x1, z1, 1, 0],
    ];
    const P = 0.32; // distância entre as fileiras
    const nv = 2;
    for (const [ax, az, bx, bz, ox, oz] of lados) {
      const comp = Math.hypot(bx - ax, bz - az);
      const vaos = Math.max(1, Math.round(comp / 1.05));
      const aoLongo = ax !== bx;
      for (let i = 0; i <= vaos; i++) {
        const x = ax + ((bx - ax) * i) / vaos;
        const z = az + ((bz - az) * i) / vaos;
        for (const f of [0, P]) {
          const m = part(box, tubo, [0.035, ANDAIME + 0.2, 0.035], [x + ox * f, (ANDAIME + 0.2) / 2, z + oz * f]);
          postes.push({ m: add(m), h: ANDAIME + 0.2, pred });
        }
      }
      for (let l = 1; l <= nv; l++) {
        const y = (ANDAIME * l) / nv;
        const mx = (ax + bx) / 2;
        const mz = (az + bz) / 2;
        for (const f of [0, P]) {
          const s3 = aoLongo ? [comp, 0.03, 0.03] : [0.03, 0.03, comp];
          niveis.push({ m: add(part(box, tubo, s3, [mx + ox * f, y + 0.12, mz + oz * f])), y: y + 0.12, nivel: y, pred });
        }
        const sp = aoLongo ? [comp - 0.1, 0.035, P - 0.04] : [P - 0.04, 0.035, comp - 0.1];
        niveis.push({ m: add(part(box, madeira, sp, [mx + (ox * P) / 2, y, mz + (oz * P) / 2])), y, nivel: y, pred });
        // Diagonal de contraventamento na fileira de fora, vão sim vão não.
        const passo = comp / vaos;
        const alt = ANDAIME / nv;
        const diag = Math.hypot(passo, alt);
        const ang = Math.atan2(alt, passo);
        for (let i = (l + 1) % 2; i < vaos; i += 2) {
          const t0 = (i + 0.5) / vaos;
          const m = part(box, tubo, [diag, 0.025, 0.025], [ax + (bx - ax) * t0 + ox * P, y - alt / 2, az + (bz - az) * t0 + oz * P]);
          if (aoLongo) m.rotation.z = ang * (i % 2 ? 1 : -1);
          else {
            m.rotation.y = Math.PI / 2;
            m.rotation.z = ang * (i % 2 ? 1 : -1);
          }
          niveis.push({ m: add(m), y: m.position.y, nivel: y - 0.05, pred });
        }
      }
    }
    pred.andaime = [pred.a0 + 0.1 + atraso, pred.a1 - 0.02];
  });

  // ---- Guindastes -------------------------------------------------------------
  // Um entre Front-End e Back-End (serve aos dois) e um ao lado do Banco.
  const guindastes = [];
  const porId = new Map(predios.map((p) => [p.id, p]));
  function criarGuindaste({ x, z, servidos, pilha, alto }) {
    const torre = new THREE.Group();
    torre.position.set(x, 0, z);
    passado.add(torre);
    torre.add(part(box, concreto, [0.6, 0.14, 0.6], [0, 0.07, 0]));
    // Mastro treliçado: 4 montantes e diagonais em zigue-zague.
    const mastro = new THREE.Group();
    torre.add(mastro);
    const L = 0.1;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      mastro.add(part(box, amarelo, [0.035, alto, 0.035], [sx * L, alto / 2, sz * L]));
    }
    const seg = 0.34;
    const nseg = Math.floor(alto / seg);
    const dg = Math.hypot(2 * L, seg);
    const ang = Math.atan2(seg, 2 * L);
    for (let i = 0; i < nseg; i++) {
      const y = seg * (i + 0.5);
      const sg = i % 2 ? 1 : -1;
      const fr = part(box, amarelo, [dg, 0.022, 0.022], [0, y, L]);
      fr.rotation.z = ang * sg;
      const lat = part(box, amarelo, [0.022, 0.022, dg], [L, y, 0]);
      lat.rotation.x = -ang * sg;
      const lat2 = part(box, amarelo, [0.022, 0.022, dg], [-L, y, 0]);
      lat2.rotation.x = ang * sg;
      mastro.add(fr, lat, lat2);
    }
    // Lança (gira em y), contralança, torre de topo, tirantes e cabine.
    const R = Math.max(...pilha.alcances, 3) + 0.5;
    const lanca = new THREE.Group();
    lanca.position.y = alto;
    torre.add(lanca);
    lanca.add(part(box, amarelo, [R, 0.06, 0.14], [R / 2, 0.03, 0]));
    lanca.add(part(box, amarelo, [R - 0.2, 0.035, 0.035], [(R - 0.2) / 2, 0.2, 0]));
    const nd = Math.round(R / 0.32);
    const ld = Math.hypot(R / nd, 0.17);
    const ad = Math.atan2(0.17, R / nd);
    for (let i = 0; i < nd - 1; i++) {
      const m = part(box, amarelo, [ld, 0.02, 0.02], [(i + 0.5) * (R / nd), 0.115, 0]);
      m.rotation.z = ad * (i % 2 ? 1 : -1);
      lanca.add(m);
    }
    lanca.add(part(box, amarelo, [1.4, 0.07, 0.16], [-0.7, 0.035, 0]));
    lanca.add(part(box, concreto, [0.32, 0.3, 0.26], [-1.15, -0.08, 0]));
    lanca.add(part(box, amarelo, [0.1, 0.75, 0.1], [0, 0.375, 0]));
    const tirante = (x2, y2) => {
      const dx = x2;
      const dy = y2 - 0.75;
      const m = part(box, cabo, [Math.hypot(dx, dy), 0.012, 0.012], [dx / 2, 0.75 + dy / 2, 0]);
      m.rotation.z = Math.atan2(dy, dx);
      lanca.add(m);
    };
    tirante(R * 0.7, 0.2);
    tirante(-1.3, 0.07);
    lanca.add(part(box, cabine, [0.26, 0.22, 0.22], [0.2, -0.13, 0.17]));
    lanca.add(part(box, cabo, [0.02, 0.12, 0.2], [0.335, -0.11, 0.17]));
    // Carrinho, cabo e gancho.
    const carrinho = part(box, cabo, [0.16, 0.06, 0.18], [1, -0.02, 0]);
    lanca.add(carrinho);
    const fio = part(box, cabo, [0.014, 1, 0.014], [1, 0, 0]);
    lanca.add(fio);
    const gancho = new THREE.Group();
    gancho.add(part(box, amarelo, [0.12, 0.12, 0.1], [0, 0, 0]));
    gancho.add(part(box, cabo, [0.03, 0.09, 0.03], [0, -0.1, 0]));
    gancho.add(part(box, cabo, [0.07, 0.025, 0.03], [0.02, -0.15, 0]));
    lanca.add(gancho);
    const gd = { x, z, alto, R, torre, mastro, lanca, carrinho, fio, gancho, servidos, pilha, viagens: [], quadros: [] };
    guindastes.push(gd);
    return gd;
  }

  // Pose do gancho (ângulo da lança, raio do carrinho, altura no mundo) que
  // alcança o ponto (tx, tz).
  const mira = (gd, tx, tz, y, antes) => {
    let th = Math.atan2(-(tz - gd.z), tx - gd.x);
    if (antes !== undefined) while (th - antes > Math.PI) th -= 2 * Math.PI;
    if (antes !== undefined) while (antes - th > Math.PI) th += 2 * Math.PI;
    const r = Math.min(Math.max(Math.hypot(tx - gd.x, tz - gd.z), 0.5), gd.R - 0.15);
    return { th, r, y };
  };

  const _pose = { th: 0, r: 1, y: 3 };

  const fe = porId.get("frontend");
  const be = porId.get("backend");
  const db = porId.get("database");
  const cfg = [];
  if (fe && be) {
    const x = (fe.c.x + fe.s.x / 2 + be.c.x - be.s.x / 2) / 2;
    const z = Math.min(fe.c.z - fe.s.z / 2, be.c.z - be.s.z / 2) + 0.2;
    const pz = Math.max(fe.frente, be.frente) - 0.55;
    cfg.push({ x, z, servidos: [fe, be], pilha: { x, z: pz }, alto: 3.3 });
  }
  if (db) {
    const x = db.c.x + db.s.x / 2 + 0.5;
    const z = db.c.z - db.s.z / 2 + 0.45;
    cfg.push({ x, z, servidos: [db], pilha: { x: x + 0.15, z: db.frente - 0.35 }, alto: db.topo + 0.65 });
  }

  for (const cf of cfg) {
    // Viagens: lajes dos prédios servidos, na ordem em que o corte as alcança.
    const lajes = [];
    for (const pred of cf.servidos) for (const p of pred.pecas) if (p.modo === "grua") lajes.push(p);
    lajes.sort((p, q) => p.pred.quando(p.topo) - q.pred.quando(q.topo));
    cf.pilha.alcances = [
      ...lajes.map((p) => Math.hypot(p.centro.x - cf.x, p.centro.z - cf.z)),
      ...cf.servidos.map((p) => Math.hypot(p.c.x - cf.x, p.c.z - cf.z) + 0.6),
      Math.hypot(cf.pilha.x - cf.x, cf.pilha.z - cf.z),
    ];
    const gd = criarGuindaste(cf);
    const solto = gd.alto - 0.45; // altura do gancho viajando
    gd.solto = solto;
    let pose = mira(gd, cf.pilha.x, cf.pilha.z, solto);
    const quadros = [{ k: 0, ...pose }];
    // Entre viagens o gancho paira sobre os prédios servidos (as peças
    // pequenas sobem até ele), alternando entre eles.
    let vez = 0;
    const pairar = (t0, t1, ultimo) => {
      let t = t0;
      while (t1 - t > 0.07) {
        const pred = ultimo && t1 - t < 0.16 ? ultimo : cf.servidos[vez++ % cf.servidos.length];
        const lado = (vez % 2 ? -1 : 1) * 0.6;
        pose = mira(gd, pred.c.x + lado, pred.c.z - 0.1, solto, pose.th);
        quadros.push({ k: t + 0.05, ...pose }, { k: Math.min(t + 0.1, t1), ...pose });
        t += 0.1;
      }
    };
    let livre = PRONTO;
    lajes.forEach((p, i) => {
      // O gancho chega à laje quando o corte passa por ela.
      const s = Math.max(p.pred.quando(p.topo) - 0.3 * VIAGEM, livre);
      const J = VIAGEM;
      pairar(livre, s, p.pred);
      const yPega = p.topo + 0.08;
      const alto2 = Math.max(Math.min(solto, p.topo + 1.2), yPega);
      const pilhaTopo = 0.12 + i * 0.1;
      const pegaAlto = mira(gd, p.centro.x, p.centro.z, alto2, pose.th);
      const pega = { ...pegaAlto, y: yPega };
      const larga = mira(gd, cf.pilha.x, cf.pilha.z, solto, pega.th);
      const desce = { ...larga, y: pilhaTopo + p.meia * 2 * ENCOLHE + 0.1 };
      quadros.push({ k: s, ...pose });
      quadros.push({ k: s + 0.12 * J, ...pose, y: Math.max(pose.y, alto2) });
      quadros.push({ k: s + 0.24 * J, ...pegaAlto });
      quadros.push({ k: s + 0.32 * J, ...pega });
      quadros.push({ k: s + 0.55 * J, ...pegaAlto });
      quadros.push({ k: s + 0.82 * J, ...larga });
      quadros.push({ k: s + J, ...desce });
      pose = { ...larga };
      quadros.push({ k: s + J + 0.03, ...pose });
      livre = s + J + 0.03;
      // A laje fica presa ao gancho entre a pega e a chegada à pilha.
      p.a = s + 0.32 * J;
      p.b = s + J;
      p.viagem = { s, J, th0: pega.th, gd };
      for (const c of p.caronas) {
        c.a = p.a;
        c.b = p.b;
      }
      poeira.push({ k: p.a, x: p.centro.x, y: p.base, z: p.centro.z, r: 0.9 });
      poeira.push({ k: p.b, x: cf.pilha.x, y: pilhaTopo, z: cf.pilha.z, r: 0.5 });
      // Vigas da pilha: um par por laje entregue.
      const par = new THREE.Group();
      par.position.set(cf.pilha.x, pilhaTopo - 0.1, cf.pilha.z);
      if (i === 0) {
        par.add(part(box, madeira, [0.5, 0.05, 0.08], [0, 0.025, -0.35]));
        par.add(part(box, madeira, [0.5, 0.05, 0.08], [0, 0.025, 0.35]));
      }
      par.add(part(box, viga, [0.12, 0.08, 1.0], [-0.1, 0.09, 0]));
      par.add(part(box, viga, [0.12, 0.08, 1.0], [0.1, 0.09, 0]));
      par.rotation.y = i % 2 ? 0.08 : -0.06;
      cai(par, p.b - 0.012, p.b + 0.03, 0.15);
    });
    pairar(livre, 0.9);
    // Fim: lança parada sobre o primeiro canteiro, gancho no alto.
    const alvo = cf.servidos[0];
    pose = mira(gd, alvo.c.x - 0.4, alvo.c.z + 0.3, solto - 0.3, pose.th);
    quadros.push({ k: 0.97, ...pose });
    gd.quadros = quadros;
  }

  // Corte com cascata: as peças não-laje saem quando o corte passa por elas,
  // mas nunca antes de a laje que as cobre ser içada.
  for (const pred of predios) {
    const xs = pred.pecas.map((p) => p.centro.x);
    const xmin = Math.min(...xs);
    const xmax = Math.max(...xs, xmin + 0.01);
    const lajes = pred.pecas.filter((p) => p.modo === "grua");
    for (const p of pred.pecas) {
      if (p.modo === "grua" || p.modo === "carona") continue;
      const onda = (ONDA * (p.centro.x - xmin)) / (xmax - xmin);
      let a = pred.quando(p.topo) + onda;
      for (const l of lajes) if (l.base >= p.topo - 0.08) a = Math.max(a, l.a + 0.015 + onda * 0.6);
      if (p.modo === "alta") {
        p.a = a;
        p.b = Math.max(pred.quando(Math.max(p.base, 0)) + onda + VOO * 0.5, a + VOO);
      } else {
        p.a = a;
        p.b = a + VOO;
      }
      const teto = 0.97;
      if (p.b > teto) {
        p.a -= p.b - teto;
        p.b = teto;
      }
      if (p.modo === "voo") {
        // Destino: o gancho do guindaste no instante em que a peça some; se
        // ele estiver longe, a peça sobe e some sobre o próprio prédio.
        const gd = guindastes.find((g) => g.servidos.includes(pred));
        poseEm(gd, p.b, _pose);
        const hx = gd.x + _pose.r * Math.cos(_pose.th);
        const hz = gd.z - _pose.r * Math.sin(_pose.th);
        if (Math.hypot(hx - p.centro.x, hz - p.centro.z) < 3.2) p.alvo.set(hx, _pose.y - 0.2, hz);
        else p.alvo.set(p.centro.x * 0.6 + pred.c.x * 0.4, gd.solto + 0.3, p.centro.z * 0.6 + pred.c.z * 0.4);
      }
    }
    // Poeira a cada fiada que sai dos blocos maiores (de cima a câmera não
    // percebe a altura baixando).
    pred.pecas
      .filter((p) => p.modo === "alta" && p.area > 4 && p.fiadas > 1)
      .sort((p, q) => q.area - p.area)
      .slice(0, 2)
      .forEach((p) => {
        for (let i = p.fiadas - 1; i >= 1; i--) {
          const u = 1 - (i + 0.45) / p.fiadas;
          const y = p.base + ((p.topo - p.base) * i) / p.fiadas;
          poeira.push({ k: p.a + (p.b - p.a) * u, x: p.centro.x, y, z: p.centro.z, r: Math.min(Math.sqrt(p.area) * 0.45, 1.4) });
        }
      });
    // Paletes de tijolos: descem um a um quando o prédio já saiu.
    pred.paletes.forEach((g, i) => {
      const t = Math.min(pred.a1 + 0.01 + i * 0.022, 0.96);
      cai(g, t - 0.035, t, 0.7);
      poeira.push({ k: t, x: g.position.x, y: g.position.y, z: g.position.z, r: 0.35 });
    });
  }

  // ---- Poeira (InstancedMesh) ---------------------------------------------
  for (const e of poeira) e.k = Math.min(e.k, 0.99 - PUFF);
  const grao = track(new THREE.IcosahedronGeometry(1, 0));
  const poMat = track(
    new THREE.MeshLambertMaterial({ color: mix(pv("gray-200"), pv("yellow-400"), 0.25), transparent: true, opacity: 0.65, depthWrite: false })
  );
  const po = new THREE.InstancedMesh(grao, poMat, Math.max(poeira.length * GRAOS, 1));
  po.frustumCulled = false;
  po.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  passado.add(po);
  const _m = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3();
  const _p = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);

  function aplicarPoeira(k) {
    let i = 0;
    for (const [ie, e] of poeira.entries()) {
      const idade = (k - e.k) / PUFF;
      for (let j = 0; j < GRAOS; j++, i++) {
        if (idade <= 0 || idade >= 1) {
          po.setMatrixAt(i, zero);
          continue;
        }
        const h = sorte(ie * 17 + j);
        const ang = (j / GRAOS) * Math.PI * 2 + h;
        const ab = 1 - (1 - idade) ** 2;
        const dist = e.r * (0.35 + 0.65 * h) * ab;
        _p.set(e.x + Math.cos(ang) * dist, e.y + 0.06 + (0.15 + 0.3 * h) * ab, e.z + Math.sin(ang) * dist * 0.8);
        const tam = (0.1 + 0.1 * h) * (0.5 + e.r * 0.4) * Math.sin(Math.PI * Math.min(idade * 1.6, 1)) * (1 - idade * 0.4);
        _s.setScalar(Math.max(tam, 0.0001));
        _m.compose(_p, _q, _s);
        po.setMatrixAt(i, _m);
      }
    }
    po.instanceMatrix.needsUpdate = true;
  }

  // ---- Aplicação ------------------------------------------------------------
  const _inv = new THREE.Matrix3();
  const _d = new THREE.Vector3();
  const _gq = new THREE.Quaternion();
  const _y = new THREE.Vector3(0, 1, 0);

  function poseEm(gd, k, out) {
    const q = gd.quadros;
    let i = 0;
    while (i < q.length - 1 && q[i + 1].k <= k) i++;
    const A = q[i];
    const B = q[Math.min(i + 1, q.length - 1)];
    const t = B === A || B.k <= A.k ? 1 : suave(Math.min(Math.max((k - A.k) / (B.k - A.k), 0), 1));
    out.th = A.th + (B.th - A.th) * t;
    out.r = A.r + (B.r - A.r) * t;
    out.y = A.y + (B.y - A.y) * t;
    return out;
  }

  // Desloca a peça no mundo (dx, dy, dz) a partir da posição original.
  function mover(p, dx, dy, dz) {
    _inv.setFromMatrix4(p.o.parent.matrixWorld).invert();
    _d.set(dx, dy, dz).applyMatrix3(_inv);
    p.o.position.add(_d);
  }

  function aplicarPecas(k) {
    for (const p of pecas) {
      const { o } = p;
      o.position.copy(p.pos);
      o.scale.copy(p.esc);
      o.quaternion.copy(p.quat);
      const u = k <= 0 ? 0 : trecho(k, p.a, p.b);
      o.visible = p.vis && u < 1;
      if (u <= 0 || u >= 1) continue;
      if (p.modo === "alta") {
        // Parede baixando fiada a fiada: encolhe em y presa à base, um
        // degrau por vez (cada fiada sai com um tranco curto).
        const x = (1 - u) * p.fiadas;
        const i = Math.floor(x);
        const f = Math.max((i + suave(Math.min(Math.max((x - i - 0.45) / 0.55, 0), 1))) / p.fiadas, 0.001);
        o.scale.y *= f;
        o.position.addScaledVector(p.cima, p.rel * (1 - f));
      } else if (p.modo === "voo") {
        // Construção (v de 0 a 1): desce pequena do gancho, cresce no ar e
        // pousa devagar; na desmontagem, sobe até o gancho e vai embora.
        const v = 1 - u;
        const s = 1 - (1 - v) ** 3;
        const tx = p.alvo.x - p.centro.x;
        const tz = p.alvo.z - p.centro.z;
        const arco = (0.25 + 0.06 * Math.hypot(tx, tz)) * Math.sin(Math.PI * s);
        const pouso = -0.05 * Math.sin(Math.PI * trecho(v, 0.82, 1));
        mover(p, tx * (1 - s), (p.alvo.y - p.centro.y) * (1 - s) + arco + pouso, tz * (1 - s));
        o.scale.multiplyScalar(Math.max(Math.min(v / 0.12, 1) * (0.3 + 0.7 * s), 0.001));
        _gq.setFromAxisAngle(_y, p.giro * (1 - s));
        o.quaternion.premultiply(_gq);
      } else {
        // Laje no gancho (e o que vai colado nela): segue a pose do guindaste.
        const laje = p.modo === "carona" ? p.laje : p;
        const { s, J, th0, gd } = laje.viagem;
        const pose = poseEm(gd, k, _pose);
        const f = 1 - (1 - ENCOLHE) * suave(trecho(k, s + 0.55 * J, s + 0.82 * J));
        const giro = pose.th - th0;
        const cos = Math.cos(giro);
        const sen = Math.sin(giro);
        const ox = (p.centro.x - laje.centro.x) * f;
        const oy = (p.centro.y - laje.centro.y) * f;
        const oz = (p.centro.z - laje.centro.z) * f;
        const hx = gd.x + pose.r * Math.cos(pose.th) + ox * cos + oz * sen;
        const hz = gd.z - pose.r * Math.sin(pose.th) - ox * sen + oz * cos;
        const cy = pose.y - 0.08 - laje.meia * f + oy;
        o.scale.multiplyScalar(f);
        mover(p, hx - p.centro.x, cy - p.centro.y, hz - p.centro.z);
        _gq.setFromAxisAngle(_y, giro);
        o.quaternion.premultiply(_gq);
      }
    }
  }

  function aplicarObra(k) {
    for (const p of abrem) {
      const e = trecho(k, p.a, p.b);
      p.m.visible = e > 0;
      p.m.scale.set(p.sx * Math.max(suave(e), 0.001), p.m.scale.y, p.sz * Math.max(suave(e), 0.001));
    }
    for (const p of brotam) {
      const e = assentar(trecho(k, p.a, p.b));
      p.m.visible = e > 0;
      const sy = p.sy * Math.max(e, 0.001);
      p.m.scale.y = sy;
      p.m.position.y = p.y + sy / 2;
    }
    for (const p of caem) {
      const e = assentar(trecho(k, p.a, p.b));
      p.m.visible = e > 0;
      p.m.position.y = p.y + (1 - Math.min(e, 1)) * p.altura + Math.max(e - 1, 0) * -0.3;
    }
    // Andaime: postes crescem do chão; tubos e pranchas assentam quando os
    // postes passam do nível.
    for (const p of postes) {
      const h = (ANDAIME + 0.2) * trecho(k, p.pred.andaime[0], p.pred.andaime[1]);
      p.m.visible = h > 0.01;
      p.m.scale.y = Math.max(h, 0.001);
      p.m.position.y = h / 2;
    }
    for (const p of niveis) {
      const h = (ANDAIME + 0.2) * trecho(k, p.pred.andaime[0], p.pred.andaime[1]);
      const e = assentar(trecho(h, p.nivel - 0.02, p.nivel + 0.3));
      p.m.visible = e > 0;
      p.m.position.y = p.y + (1 - Math.min(e, 1)) * 0.3;
    }
    for (const gd of guindastes) {
      const e = trecho(k, 0, PRONTO * 0.6);
      const e2 = suave(trecho(k, PRONTO * 0.45, PRONTO));
      gd.torre.visible = e > 0;
      gd.mastro.scale.y = Math.max(e, 0.001);
      gd.lanca.position.y = gd.alto * Math.max(e, 0.001);
      gd.lanca.scale.set(Math.max(e2, 0.001), 1, 1);
      const pose = poseEm(gd, k, _pose);
      gd.lanca.rotation.y = pose.th;
      const L = Math.max(gd.alto - 0.02 - pose.y, 0.05);
      gd.carrinho.position.x = pose.r;
      gd.fio.position.set(pose.r, -0.02 - L / 2, 0);
      gd.fio.scale.y = L;
      gd.gancho.position.set(pose.r, pose.y - gd.alto, 0);
    }
  }

  let ultimo = -1;
  function setProgress(k) {
    if (k === ultimo) return;
    ultimo = k;
    passado.visible = k > 0;
    aplicarPecas(k);
    if (k > 0) {
      aplicarObra(k);
      aplicarPoeira(k);
    }
  }

  // Balanço leve do gancho.
  function update(t) {
    if (reducedMotion) return;
    for (const gd of guindastes) gd.gancho.rotation.y = Math.sin(t * 1.3) * 0.25;
  }

  return { setProgress, update };
}
