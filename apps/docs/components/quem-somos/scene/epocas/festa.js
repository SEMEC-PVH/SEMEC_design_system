// Época "festa" (futuro): a Vila constrói um monumento ao Design System na
// praça, em frente à SEMEC, e comemora com bandeirinhas, balões e fogos de
// artifício. O motor junta o time em volta da estátua.
//
// Contrato de toda época (ver scene/epocas.js):
//   createX({ scene, pal, track, tileToWorld, buildings, makeLabel, reducedMotion })
//     -> { setProgress(k), update(t, dt, k) }
//   setProgress(k): 0 = a Vila de hoje (nada desta época visível e os prédios
//     exatamente como eram), 1 = época completa. Determinístico: o mesmo k
//     dá sempre a mesma cena (a volta ao presente roda k de 1 para 0).
//   update(t, dt, k): animação contínua (só quando k > 0).
//
// A obra acontece de verdade, em ~5,5 s (linha do tempo em k):
//   grua      0,00–0,10 sobe (mastro e lança) · 0,68–0,78 é desmontada
//   carga     0,03–0,12 os blocos da coluna chegam numa pilha ao lado
//   fundação  0,02–0,08 laje · pedestal 0,08–0,30 (3 degraus de lajes que
//             caem e assentam, com poeira)
//   andaime   0,16–0,32 monta · 0,68–0,80 desmonta
//   coluna    0,30–0,68 a grua içar cada bloco da pilha e o desce no lugar
//             (gira, desce o gancho, ergue, gira, assenta com brilho)
//   gema      0,74–0,84 desce do céu num feixe de luz e encaixa (clarão)
//   anéis     0,84–0,92 · placa 0,88–0,92
//   varais    0,70–0,92 o fio corre poste a poste e as bandeirinhas abrem
//   balões    0,80–0,90 inflam nos postes · 0,84–1 soltos sobem da praça
//   fogos     a partir de 0,97
import * as THREE from "three";
import { assentar, createKit, trecho } from "./comum";
import { LAMP_SOUTH_OFFSET } from "../props";

const ESTATUA = [7, 10];
const POSTES = [[5, 9], [10, 9]];
const FW_LIFE = 1.7;
const FW_COUNT = 56;
const FW_K = 0.97;

const FUNDACAO = [0.02, 0.08];
const CARGA = [0.03, 0.12];
const GRUA_IN = [0.0, 0.1];
const GRUA_OUT = [0.68, 0.78];
const PEDESTAL = [0.08, 0.3];
const ANDAIME_IN = [0.16, 0.32];
const ANDAIME_OUT = [0.68, 0.8];
const ICAR = [0.3, 0.68];
const GEMA = [0.74, 0.84];
const FIO = [0.7, 0.8];
const BANDEIRAS = [0.74, 0.92];
const BALOES = [0.8, 0.9];
const SOLTOS = [0.84, 1];

// Início da peça i de n espalhadas no trecho [a, b], cada uma durando d.
const escalonar = (i, n, [a, b], d) => a + (n > 1 ? (i * (b - a - d)) / (n - 1) : 0);
const suave = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, x) => a + (b - a) * x;

export function createFesta({ scene, pal, track, tileToWorld, makeLabel, reducedMotion = false }) {
  const { pv, mix, white } = pal;
  const { box, mat, glow, part } = createKit({ pal, track });
  // Barras com origem numa ponta (crescem ao longo de +x, -x, +y ou -y).
  const barraX = track(new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0, 0));
  const barraXneg = track(new THREE.BoxGeometry(1, 1, 1).translate(-0.5, 0, 0));
  const barraY = track(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
  const barraYneg = track(new THREE.BoxGeometry(1, 1, 1).translate(0, -0.5, 0));
  const UP = new THREE.Vector3(0, 1, 0);
  const brilhoMat = (color, opacity = 1) =>
    track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));

  const festa = new THREE.Group();
  festa.visible = false;
  scene.add(festa);

  // Peça na linha do tempo. modo: "cair" (desce de `h` e assenta com quique),
  // "crescer" (escala no `eixo` a partir da origem) ou "inflar" (escala
  // uniforme). `sai` = [início, duração]: a peça é retirada (sobe e encolhe).
  const pecas = [];
  function peca(mesh, { a, d, modo = "cair", h = 0.5, sai = null, eixo = "y" }) {
    mesh.visible = false;
    pecas.push({ mesh, a, d, modo, h, sai, eixo, pos: mesh.position.clone(), esc: mesh.scale.clone() });
  }
  function aplicarPeca(p, k) {
    const xi = trecho(k, p.a, p.a + p.d);
    const xo = p.sai ? trecho(k, p.sai[0], p.sai[0] + p.sai[1]) : 0;
    const m = p.mesh;
    m.visible = xi > 0 && xo < 1;
    if (!m.visible) return;
    const e = assentar(xi);
    m.position.copy(p.pos);
    m.scale.copy(p.esc);
    if (p.modo === "cair") m.position.y += (1 - e) * p.h;
    else if (p.modo === "crescer") m.scale[p.eixo] = p.esc[p.eixo] * Math.max(0.001, e);
    else m.scale.multiplyScalar(Math.max(0.001, e));
    if (xo > 0) {
      m.position.y += xo * 0.7;
      m.scale.multiplyScalar(Math.max(0.001, 1 - xo * xo));
    }
  }

  // Nuvem de poeira (ou de faíscas) quando uma peça assenta: cubinhos que
  // se espalham e somem. Determinística em k; sem partículas com
  // reducedMotion.
  const nuvens = [];
  const poeira = mat(mix(pv("gray-200"), pv("yellow-400"), 0.15), { roughness: 1 });
  const faisca = glow(mix(pv("yellow-400"), white, 0.45));
  function nuvem(parent, [x, y, z], t0, { material = poeira, n = 7, r0 = 0, raio = 0.5, sobe = 0.15, tam = 0.07, dur = 0.05 } = {}) {
    if (reducedMotion) return;
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.visible = false;
    parent.add(g);
    const cubos = [];
    for (let j = 0; j < n; j++) {
      const ang = (j / n) * Math.PI * 2 + (t0 * 97) % 1;
      const c = new THREE.Mesh(box, material);
      c.castShadow = false;
      c.rotation.set(0.6, ang, 0.4);
      g.add(c);
      cubos.push({ c, dx: Math.cos(ang), dz: Math.sin(ang), v: 0.7 + ((j * 37) % 5) / 10 });
    }
    nuvens.push({ g, cubos, t0, dur, r0, raio, sobe, tam });
  }
  function aplicarNuvem(nv, k) {
    const x = trecho(k, nv.t0, nv.t0 + nv.dur);
    nv.g.visible = x > 0 && x < 1;
    if (!nv.g.visible) return;
    const e = 1 - (1 - x) ** 2;
    const s = nv.tam * Math.max(0.001, 1 - x);
    for (const { c, dx, dz, v } of nv.cubos) {
      const r = nv.r0 + nv.raio * e * v;
      c.position.set(dx * r, nv.sobe * e * v, dz * r);
      c.scale.setScalar(s);
    }
  }

  // ---- Monumento: fundação, pedestal em degraus e coluna -------------------
  const estatua = new THREE.Group();
  estatua.position.copy(tileToWorld(...ESTATUA));
  festa.add(estatua);
  const pedraA = mat(pv("gray-200"));
  const pedraB = mat(mix(pv("gray-200"), pv("gray-400"), 0.4));
  const concreto = mat(pv("gray-500"), { roughness: 0.95 });

  const fundacao = part(box, concreto, [1.24, 0.04, 1.24], [0, 0.02, 0]);
  fundacao.castShadow = false;
  estatua.add(fundacao);
  peca(fundacao, { a: FUNDACAO[0], d: FUNDACAO[1] - FUNDACAO[0], modo: "inflar" });

  // Pedestal: 3 degraus, cada um de 4 lajes (quadrantes) que caem e assentam.
  const DEGRAUS = [
    { w: 1.16, h: 0.16 },
    { w: 0.94, h: 0.15 },
    { w: 0.74, h: 0.14 },
  ];
  const lajes = [];
  let yd = 0.04;
  DEGRAUS.forEach(({ w, h }, f) => {
    for (let j = 0; j < 4; j++) {
      const sx = j % 2 ? 1 : -1;
      const sz = j < 2 ? -1 : 1;
      const m = (j + f) % 2 ? pedraB : pedraA;
      lajes.push({ m: part(box, m, [w / 2 - 0.01, h - 0.006, w / 2 - 0.01], [(sx * w) / 4, yd + h / 2, (sz * w) / 4]), y: yd, w });
    }
    yd += h;
  });
  const TOPO_PEDESTAL = yd; // 0,49
  lajes.forEach(({ m, y, w }, i) => {
    estatua.add(m);
    const a = escalonar(i, lajes.length, PEDESTAL, 0.045);
    peca(m, { a, d: 0.045, h: 0.75 });
    // Poeira a cada degrau completo.
    if (i % 4 === 3) nuvem(estatua, [0, y, 0], a + 0.025, { r0: w * 0.6, raio: 0.5, sobe: 0.25, tam: 0.13, n: 10 });
  });

  // Placa no degrau do meio.
  const placa = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.8, 0.13)),
    track(new THREE.MeshBasicMaterial({ map: track(makeLabel("DESIGN SYSTEM", pv("blue-900"), white)) }))
  );
  placa.position.set(0, 0.04 + 0.16 + 0.075, 0.471);
  estatua.add(placa);
  peca(placa, { a: 0.88, d: 0.04, modo: "crescer", eixo: "x" });

  // Coluna: blocos de pedra com friso azul e um capitel dourado no topo. Ficam
  // numa pilha ao lado da obra até a grua içar cada um.
  const ouro = mat(pv("yellow-500"), { emissive: pv("yellow-500"), emissiveIntensity: 0.35, metalness: 0.5, roughness: 0.3, flatShading: true });
  const friso = mat(pv("blue-700"));
  const BLOCO = { w: 0.52, h: 0.3 };
  const CAPITEL = { w: 0.68, h: 0.1 };
  const cargas = [];
  let yc = TOPO_PEDESTAL;
  for (let i = 0; i < 4; i++) {
    const capitel = i === 3;
    const { w, h } = capitel ? CAPITEL : BLOCO;
    const g = new THREE.Group();
    g.add(part(box, capitel ? ouro : i % 2 ? pedraB : pedraA, [w, h - 0.004, w], [0, h / 2, 0]));
    if (!capitel) g.add(part(box, friso, [w + 0.012, 0.035, w + 0.012], [0, h * 0.5, 0]));
    g.visible = false;
    estatua.add(g);
    cargas.push({ g, h, w, slot: yc });
    yc += h;
  }
  const TOPO_COLUNA = yc; // 1,49
  // Pilha: o primeiro a ser içado fica em cima.
  const PILHA = new THREE.Vector3(1.1, 0, 0.6);
  {
    let yp = 0;
    for (let i = cargas.length - 1; i >= 0; i--) {
      cargas[i].pilha = yp;
      yp += cargas[i].h;
    }
  }

  // Gema dourada (o "componente" do Design System) com dois anéis em volta.
  const GEMA_Y = TOPO_COLUNA + 0.52;
  const gema = part(track(new THREE.OctahedronGeometry(0.4, 0)), ouro, [1, 1.3, 1], [0, GEMA_Y, 0]);
  gema.visible = false;
  estatua.add(gema);
  const aneis = [0, 1].map((i) => {
    const r = new THREE.Mesh(track(new THREE.TorusGeometry(0.6 + i * 0.12, 0.035, 8, 40)), ouro);
    r.position.y = GEMA_Y;
    r.rotation.set(Math.PI / 2 + (i ? 0.5 : -0.5), 0, 0);
    estatua.add(r);
    peca(r, { a: 0.84 + i * 0.04, d: 0.06, modo: "inflar" });
    return r;
  });
  // Feixe de luz por onde a gema desce e clarão quando ela encaixa.
  const feixeMat = brilhoMat(mix(pv("yellow-400"), white, 0.5), 0);
  const feixe = new THREE.Mesh(track(new THREE.CylinderGeometry(0.2, 0.32, 5, 16, 1, true)), feixeMat);
  feixe.position.y = GEMA_Y + 2.3;
  estatua.add(feixe);
  const claraoMat = brilhoMat(mix(pv("yellow-400"), white, 0.3), 0);
  const clarao = new THREE.Mesh(track(new THREE.TorusGeometry(0.5, 0.06, 8, 40)), claraoMat);
  clarao.rotation.x = Math.PI / 2;
  clarao.position.y = GEMA_Y;
  estatua.add(clarao);
  if (!reducedMotion) nuvem(estatua, [0, GEMA_Y, 0], GEMA[1] - 0.005, { material: faisca, n: 12, r0: 0.4, raio: 0.8, sobe: 0.4, tam: 0.1, dur: 0.07 });

  // ---- Andaime: tubos e tábuas, montado no começo e desmontado no fim -------
  const tubo = mat(pv("gray-600"), { metalness: 0.4, roughness: 0.5 });
  const tabua = mat(mix(pv("yellow-800"), pv("yellow-400"), 0.35));
  const andaime = [];
  const L = 0.7; // meia largura
  const ALT = 1.6;
  for (const [x, z] of [[-L, -L], [L, -L], [-L, L], [L, L]]) andaime.push({ m: part(barraY, tubo, [0.04, ALT, 0.04], [x, 0, z]), modo: "crescer" });
  for (const y of [0.6, 1.2])
    for (const [x, z, lado] of [[0, -L, 0], [-L, 0, 1], [L, 0, 1]])
      andaime.push({ m: part(box, tubo, [lado ? 0.035 : 2 * L, 0.035, lado ? 2 * L : 0.035], [x, y, z]) });
  // Diagonais nas laterais (contraventamento).
  for (const x of [-L, L]) {
    const m = part(box, tubo, [0.03, Math.hypot(2 * L, 1.2), 0.03], [x, 0.6, 0]);
    m.rotation.x = Math.atan2(2 * L, 1.2) * (x < 0 ? 1 : -1);
    andaime.push({ m });
  }
  // Tábuas nas laterais e no fundo (a frente fica livre para a câmera).
  for (const y of [0.63, 1.23])
    for (const [x, z, sx, sz] of [[-L, 0, 0.24, 2 * L], [L, 0, 0.24, 2 * L], [0, -L, 2 * L, 0.24]])
      andaime.push({ m: part(box, tabua, [sx, 0.04, sz], [x, y, z]) });
  andaime.forEach(({ m, modo = "cair" }, i) => {
    estatua.add(m);
    const n = andaime.length;
    // Desmonta na ordem inversa: tábuas primeiro, postes por último.
    const sai = [escalonar(n - 1 - i, n, ANDAIME_OUT, 0.035), 0.035];
    peca(m, { a: escalonar(i, n, ANDAIME_IN, 0.035), d: 0.035, modo, h: 0.4, sai });
  });

  // ---- Grua: mastro treliçado, lança giratória, carrinho, cabo e gancho ----
  const amarelo = mat(pv("yellow-400"), { roughness: 0.55 });
  const escuro = mat(pv("gray-800"));
  const MASTRO = new THREE.Vector3(1.15, 0, -0.55);
  const ALTURA = 2.8;
  const LANCA = 1.55;
  const grua = new THREE.Group();
  grua.position.copy(MASTRO);
  grua.visible = false;
  estatua.add(grua);
  grua.add(part(box, concreto, [0.34, 0.08, 0.34], [0, 0.04, 0]));
  const mastro = new THREE.Group();
  grua.add(mastro);
  const M = 0.09;
  for (const [x, z] of [[-M, -M], [M, -M], [-M, M], [M, M]]) mastro.add(part(barraY, amarelo, [0.04, ALTURA, 0.04], [x, 0, z]));
  for (let y = 0.25; y < ALTURA; y += 0.3) {
    mastro.add(part(box, amarelo, [2 * M, 0.022, 0.022], [0, y, M]));
    mastro.add(part(box, amarelo, [0.022, 0.022, 2 * M], [M, y, 0]));
    mastro.add(part(box, amarelo, [2 * M, 0.022, 0.022], [0, y, -M]));
    mastro.add(part(box, amarelo, [0.022, 0.022, 2 * M], [-M, y, 0]));
  }
  // Topo giratório: a lança aponta para -x local.
  const giro = new THREE.Group();
  giro.position.y = ALTURA;
  grua.add(giro);
  const lanca = new THREE.Group();
  giro.add(lanca);
  lanca.add(part(barraXneg, amarelo, [LANCA, 0.1, 0.1], [0, 0.05, 0]));
  lanca.add(part(barraXneg, amarelo, [LANCA, 0.025, 0.025], [0, 0.14, 0]));
  for (let x = -0.15; x > -LANCA; x -= 0.2) lanca.add(part(box, amarelo, [0.02, 0.1, 0.02], [x, 0.1, 0]));
  lanca.add(part(barraX, amarelo, [0.5, 0.07, 0.07], [0, 0.04, 0]));
  lanca.add(part(box, escuro, [0.16, 0.16, 0.14], [0.42, -0.02, 0]));
  giro.add(part(box, mat(pv("blue-300"), { roughness: 0.3 }), [0.14, 0.12, 0.14], [0.02, -0.08, 0.1]));
  const carrinho = part(box, escuro, [0.08, 0.05, 0.1], [0, -0.01, 0]);
  lanca.add(carrinho);
  const cabo = part(barraYneg, escuro, [0.012, 1, 0.012], [0, -0.03, 0]);
  cabo.castShadow = false;
  lanca.add(cabo);
  const gancho = part(box, mat(mix(pv("red-500"), pv("yellow-400"), 0.3)), [0.08, 0.06, 0.08], [0, 0, 0]);
  lanca.add(gancho);

  // Ângulo e raio da lança para o carrinho ficar sobre (x, z) local.
  const mira = (x, z) => {
    const dx = x - MASTRO.x;
    const dz = z - MASTRO.z;
    return { ang: Math.atan2(dz, -dx), r: Math.hypot(dx, dz) };
  };
  const MIRA_OBRA = mira(0, 0);
  const MIRA_PILHA = mira(PILHA.x, PILHA.z);
  const ALTO = TOPO_COLUNA + 0.35; // altura de voo da carga (base)
  cargas.forEach((c, i) => {
    c.a = escalonar(i, cargas.length, ICAR, 0.095);
    c.d = 0.095;
    nuvem(estatua, [0, c.slot, 0], c.a + 0.085, { material: faisca, n: 10, r0: 0.34, raio: 0.4, sobe: 0.35, tam: 0.1, dur: 0.05 });
  });

  // Estado da grua em k: { mira, gancho (altura da base da carga), carga }.
  function estadoGrua(k) {
    for (let i = 0; i < cargas.length; i++) {
      const c = cargas[i];
      const u = trecho(k, c.a, c.a + c.d);
      if (u <= 0 || u >= 1) continue;
      const ida = suave(trecho(u, 0, 0.15));
      const baixa = suave(trecho(u, 0.15, 0.28));
      const ergue = suave(trecho(u, 0.3, 0.45));
      const volta = suave(trecho(u, 0.45, 0.68));
      const desce = assentar(trecho(u, 0.68, 0.92));
      const sobe = suave(trecho(u, 0.92, 1));
      if (u < 0.3) {
        const y = lerp(ALTO, c.pilha, baixa);
        return { ang: lerp(MIRA_OBRA.ang, MIRA_PILHA.ang, ida), r: lerp(MIRA_OBRA.r, MIRA_PILHA.r, ida), y: y + c.h, carga: null };
      }
      if (u < 0.92) {
        const ang = lerp(MIRA_PILHA.ang, MIRA_OBRA.ang, volta);
        const r = lerp(MIRA_PILHA.r, MIRA_OBRA.r, volta);
        const y = u < 0.68 ? lerp(c.pilha, ALTO, ergue) : lerp(ALTO, c.slot, desce);
        return { ang, r, y: y + c.h, carga: c, yCarga: y };
      }
      return { ang: MIRA_OBRA.ang, r: MIRA_OBRA.r, y: lerp(c.slot + c.h, ALTO + 0.2, sobe), carga: null };
    }
    return { ang: MIRA_OBRA.ang, r: MIRA_OBRA.r, y: ALTO + 0.2, carga: null };
  }

  function aplicarGrua(k) {
    const sobe = trecho(k, GRUA_IN[0], GRUA_IN[1]);
    const sai = trecho(k, GRUA_OUT[0], GRUA_OUT[1]);
    grua.visible = sobe > 0 && sai < 1;
    // Cargas: na pilha antes de serem içadas, no lugar depois.
    const est = estadoGrua(k);
    cargas.forEach((c, i) => {
      const chegou = trecho(k, CARGA[0] + i * 0.015, CARGA[0] + i * 0.015 + 0.05);
      c.g.visible = chegou > 0;
      if (!c.g.visible) return;
      if (est.carga === c) {
        const ox = MASTRO.x - Math.cos(est.ang) * est.r;
        const oz = MASTRO.z + Math.sin(est.ang) * est.r;
        c.g.position.set(ox, est.yCarga, oz);
        c.g.rotation.y = est.ang - MIRA_OBRA.ang;
      } else if (k >= c.a + c.d) {
        c.g.position.set(0, c.slot, 0);
        c.g.rotation.y = 0;
      } else {
        c.g.position.set(PILHA.x, c.pilha + (1 - assentar(chegou)) * 0.9, PILHA.z);
        c.g.rotation.y = 0.3;
      }
    });
    if (!grua.visible) return;
    // Sobe: mastro cresce, depois a lança abre. Sai: ao contrário.
    const mIn = suave(trecho(sobe, 0, 0.6));
    const lIn = suave(trecho(sobe, 0.5, 1));
    const lOut = suave(trecho(sai, 0, 0.5));
    const mOut = suave(trecho(sai, 0.4, 1));
    const sm = Math.max(0.001, mIn * (1 - mOut));
    const sl = Math.max(0.001, lIn * (1 - lOut));
    mastro.scale.y = sm;
    giro.position.y = ALTURA * sm;
    lanca.scale.set(sl, 1, 1);
    giro.rotation.y = est.ang;
    // O carrinho, o cabo e o gancho ficam dentro da lança (escala em x):
    // compensa a escala para não deformarem.
    const montada = lIn >= 1 && lOut <= 0;
    carrinho.visible = cabo.visible = gancho.visible = montada;
    if (!montada) return;
    carrinho.position.x = -est.r;
    // Cabo do carrinho (y local -0,03) até o topo do gancho, que pousa na carga.
    const comp = Math.max(0.05, ALTURA - 0.09 - est.y);
    cabo.position.x = -est.r;
    cabo.scale.y = comp;
    gancho.position.set(-est.r, est.y + 0.03 - ALTURA, 0);
  }

  // ---- Varal de bandeirinhas: o fio corre de um poste ao outro --------------
  const [p0, p1] = POSTES.map(([x, y]) => {
    const w = tileToWorld(x, y);
    w.z += LAMP_SOUTH_OFFSET;
    w.y = 0.94;
    return w;
  });
  const fioMat = mat(pv("gray-700"));
  const triangulo = track(new THREE.BufferGeometry());
  triangulo.setAttribute("position", new THREE.Float32BufferAttribute([-0.12, 0, 0, 0.12, 0, 0, 0, -0.24, 0], 3));
  triangulo.computeVertexNormals();
  const coresFesta = ["red-400", "yellow-400", "blue-300", "green-500"];
  const corBand = coresFesta.map((c) => mat(pv(c), { side: THREE.DoubleSide, emissive: pv(c), emissiveIntensity: 0.25 }));
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const dir = new THREE.Vector3();
  function varal(pA, pB, flecha, [f0, f1], [b0, b1], nb) {
    const ponto = (u, alvo) => alvo.lerpVectors(pA, pB, u).setY(lerp(pA.y, pB.y, u) - 4 * flecha * u * (1 - u));
    const SEG = 12;
    for (let i = 0; i < SEG; i++) {
      ponto(i / SEG, a);
      ponto((i + 1) / SEG, b);
      dir.subVectors(b, a);
      const s = part(barraX, fioMat, [dir.length(), 0.016, 0.016], [a.x, a.y, a.z]);
      s.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());
      s.castShadow = false;
      festa.add(s);
      peca(s, { a: escalonar(i, SEG, [f0, f1], 0.012), d: 0.012, modo: "crescer", eixo: "x" });
    }
    const yaw = Math.atan2(-(pB.z - pA.z), pB.x - pA.x);
    for (let i = 0; i < nb; i++) {
      ponto((i + 0.75) / (nb + 0.5), a);
      const f = part(triangulo, corBand[i % corBand.length], [1, 1, 1], [a.x, a.y, a.z]);
      f.castShadow = false;
      f.rotation.set(i % 2 ? 0.12 : -0.12, yaw, 0, "YXZ");
      festa.add(f);
      peca(f, { a: escalonar(i, nb, [b0, b1], 0.03), d: 0.03, modo: "inflar" });
    }
  }
  varal(p0, p1, 0.2, FIO, BANDEIRAS, 18);

  // ---- Balões: presos no topo dos postes e soltos subindo da praça ----------
  const esfera = track(new THREE.SphereGeometry(0.14, 16, 12));
  const cordao = mat(white);
  const corBalao = ["red-400", "blue-500", "yellow-400", "green-500"].map((c) => mat(pv(c), { roughness: 0.35, emissive: pv(c), emissiveIntensity: 0.12 }));
  const balaoGrupos = [];
  let nb = 0;
  for (const p of [p0, p1]) {
    const g = new THREE.Group();
    g.position.set(p.x, 1.19, p.z);
    festa.add(g);
    balaoGrupos.push(g);
    for (const [dx, dy, dz] of [[-0.16, 0.42, 0.02], [0.15, 0.48, -0.03], [0, 0.64, 0.05]]) {
      const bl = part(esfera, corBalao[nb % corBalao.length], [1, 1.18, 1], [dx, dy, dz]);
      g.add(bl);
      const fim = new THREE.Vector3(dx, dy - 0.15, dz);
      const c = part(barraY, cordao, [0.006, fim.length(), 0.006], [0, 0, 0]);
      c.quaternion.setFromUnitVectors(UP, fim.normalize());
      c.castShadow = false;
      g.add(c);
      const t0 = escalonar(nb, 6, BALOES, 0.05);
      peca(c, { a: t0, d: 0.02, modo: "crescer" });
      peca(bl, { a: t0 + 0.01, d: 0.04, modo: "inflar" });
      nb++;
    }
  }
  // Soltos: saem da praça em volta da estátua e sobem até o alto do quadro.
  const soltos = [
    [-1.4, 0.6, 2.6], [1.5, 0.4, 3.0], [-0.7, 1.2, 3.3], [0.9, 1.1, 2.8], [-2.0, -0.2, 3.1], [2.2, 0.0, 2.7],
  ].map(([dx, dz, alt], i) => {
    const g = new THREE.Group();
    g.add(part(esfera, corBalao[(i + 1) % corBalao.length], [1, 1.18, 1], [0, 0.15, 0]));
    const c = part(barraYneg, cordao, [0.006, 0.3, 0.006], [0, 0, 0]);
    c.castShadow = false;
    g.add(c);
    g.visible = false;
    festa.add(g);
    const base = estatua.position.clone().add(new THREE.Vector3(dx, 0.3, dz));
    return { g, base, alt, a: escalonar(i, 6, SOLTOS, 0.11), deriva: (i % 2 ? 1 : -1) * 0.35, fase: i * 1.7 };
  });
  function aplicarSoltos(k) {
    for (const s of soltos) {
      const x = trecho(k, s.a, s.a + 0.11);
      s.g.visible = x > 0;
      if (!s.g.visible) continue;
      const infla = Math.max(0.001, suave(trecho(x, 0, 0.25)));
      const e = suave(trecho(x, 0.2, 1));
      s.g.scale.setScalar(infla);
      s.g.position.copy(s.base);
      s.g.position.y += e * s.alt;
      s.g.position.x += e * s.deriva;
    }
  }

  // ---- Fogos de artifício (só com a festa pronta) --------------------------
  const fwColors = ["yellow-400", "red-400", "blue-300", "green-500", "white"].map((c) => (c === "white" ? white : pv(c)));
  const fwCenter = tileToWorld(7, 9).setY(2.6);
  const bursts = [];
  let nextBurst = 0;
  function spawnBurst() {
    const pos = new Float32Array(FW_COUNT * 3);
    const vel = new Float32Array(FW_COUNT * 3);
    const o = fwCenter.clone().add(new THREE.Vector3((Math.random() - 0.5) * 7, Math.random() * 1.0, (Math.random() - 0.5) * 1.5));
    for (let i = 0; i < FW_COUNT; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const s = 1.8 + Math.random() * 0.6;
      vel.set([r * Math.cos(th) * s, u * s, r * Math.sin(th) * s], i * 3);
      pos.set([o.x, o.y, o.z], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({
      color: fwColors[Math.floor(Math.random() * fwColors.length)],
      size: 0.2,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const pts = new THREE.Points(geo, m);
    festa.add(pts);
    bursts.push({ pts, vel, t: 0 });
  }
  function updateFogos(dt) {
    nextBurst -= dt;
    if (nextBurst <= 0) {
      spawnBurst();
      nextBurst = 0.35 + Math.random() * 0.45;
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i];
      b.t += dt;
      const p = b.pts.geometry.attributes.position.array;
      for (let j = 0; j < p.length; j += 3) {
        b.vel[j + 1] -= 1.6 * dt;
        b.vel[j] *= 0.985;
        b.vel[j + 1] *= 0.985;
        b.vel[j + 2] *= 0.985;
        p[j] += b.vel[j] * dt;
        p[j + 1] += b.vel[j + 1] * dt;
        p[j + 2] += b.vel[j + 2] * dt;
      }
      b.pts.geometry.attributes.position.needsUpdate = true;
      b.pts.material.opacity = Math.max(0, 1 - b.t / FW_LIFE);
      if (b.t >= FW_LIFE) {
        festa.remove(b.pts);
        b.pts.geometry.dispose();
        b.pts.material.dispose();
        bursts.splice(i, 1);
      }
    }
  }
  function limparFogos() {
    for (const b of bursts) {
      festa.remove(b.pts);
      b.pts.geometry.dispose();
      b.pts.material.dispose();
    }
    bursts.length = 0;
  }

  function aplicarGema(k) {
    const x = trecho(k, GEMA[0], GEMA[1]);
    gema.visible = x > 0;
    // Feixe acende antes da gema e apaga depois do encaixe.
    const f = trecho(k, GEMA[0] - 0.03, GEMA[1] + 0.06);
    feixeMat.opacity = 0.32 * Math.sin(Math.PI * f);
    feixe.visible = f > 0 && f < 1;
    const c = trecho(k, GEMA[1], GEMA[1] + 0.08);
    clarao.visible = c > 0 && c < 1;
    claraoMat.opacity = 0.9 * (1 - c);
    clarao.scale.setScalar(0.9 + 2.4 * suave(c));
    ouro.emissiveIntensity = 0.35 + 0.9 * (c > 0 && c < 1 ? 1 - c : 0);
    if (!gema.visible) return;
    gema.position.y = GEMA_Y + (1 - assentar(x)) * 3.2;
  }

  function setProgress(k) {
    festa.visible = k > 0;
    if (k < FW_K) limparFogos();
    if (!festa.visible) return;
    for (const p of pecas) aplicarPeca(p, k);
    for (const nv of nuvens) aplicarNuvem(nv, k);
    aplicarGrua(k);
    aplicarGema(k);
    aplicarSoltos(k);
  }
  function update(t, dt, k) {
    if (reducedMotion) return;
    gema.rotation.y = t * 1.2;
    aneis[0].rotation.z = t * 0.8;
    aneis[1].rotation.z = -t * 0.6;
    // Balões balançando (grupos e rotação que setProgress não mexe).
    balaoGrupos.forEach((g, i) => (g.rotation.z = Math.sin(t * 1.3 + i * 2) * 0.06));
    for (const s of soltos) s.g.rotation.z = Math.sin(t * 1.6 + s.fase) * 0.12;
    if (k >= FW_K) updateFogos(dt);
  }
  return { setProgress, update };
}
