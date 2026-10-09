// Época "festa" (futuro): estátua do Design System na praça e fogos de
// artifício sobre a SEMEC. O motor junta o time em volta da estátua.
//
// Contrato de toda época (ver scene/epocas.js):
//   createX({ scene, pal, track, tileToWorld, buildings, makeLabel, reducedMotion })
//     -> { setProgress(k), update(t, dt, k) }
//   setProgress(k): 0 = a Vila de hoje (nada desta época visível e os prédios
//     exatamente como eram), 1 = época completa. Determinístico: o mesmo k
//     dá sempre a mesma cena (a volta ao presente roda k de 1 para 0).
//   update(t, dt, k): animação contínua (só quando k > 0).
//
// A festa é construída aos poucos (linha do tempo em k):
//   andaime   0,05–0,30 monta · 0,80–0,95 desmonta
//   tijolos   0,15–0,60 (pedestal e coluna, de baixo para cima)
//   gema      0,60–0,75 (desce do alto e encaixa)
//   anéis     0,70–0,85 · placa 0,85–0,90
//   varal     0,30–0,40 fio · 0,40–0,85 bandeirinhas · balões 0,60–0,80
//   fogos     a partir de 0,97
import * as THREE from "three";
import { assentar, createKit, trecho } from "./comum";
import { LAMP_SOUTH_OFFSET } from "../props";

const ESTATUA = [7, 10];
const POSTES = [[5, 9], [10, 9]];
const FW_LIFE = 1.7;
const FW_COUNT = 56;
const FW_K = 0.97;

const TIJOLOS = [0.15, 0.6];
const ANDAIME_IN = [0.05, 0.3];
const ANDAIME_OUT = [0.8, 0.95];
const FIO = [0.3, 0.4];
const BANDEIRAS = [0.4, 0.85];
const BALOES = [0.6, 0.8];

// Início da peça i de n espalhadas no trecho [a, b], cada uma durando d.
const escalonar = (i, n, [a, b], d) => a + (n > 1 ? (i * (b - a - d)) / (n - 1) : 0);

export function createFesta({ scene, pal, track, tileToWorld, makeLabel, reducedMotion = false }) {
  const { pv, mix, white } = pal;
  const { box, mat, part } = createKit({ pal, track });
  // Barras com origem numa ponta (crescem ao longo de +x / +y).
  const barraX = track(new THREE.BoxGeometry(1, 1, 1).translate(0.5, 0, 0));
  const barraY = track(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
  const UP = new THREE.Vector3(0, 1, 0);

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

  // ---- Estátua: pedestal e coluna de blocos assentados um a um --------------
  const estatua = new THREE.Group();
  estatua.position.copy(tileToWorld(...ESTATUA));
  festa.add(estatua);
  const pedraA = mat(pv("gray-300"));
  const pedraB = mat(mix(pv("gray-300"), pv("gray-400"), 0.45));
  const colunaA = mat(pv("gray-400"));
  const colunaB = mat(mix(pv("gray-400"), pv("gray-300"), 0.4));
  const blocos = [];
  // Pedestal: 2 fiadas de 3x3 (0,9 x 0,25 x 0,9).
  for (let f = 0; f < 2; f++)
    for (let j = 0; j < 9; j++) {
      const bx = (j % 3) - 1;
      const bz = Math.floor(j / 3) - 1;
      const m = (bx + bz + f + 4) % 2 ? pedraB : pedraA;
      blocos.push(part(box, m, [0.29, 0.122, 0.29], [bx * 0.3, 0.0625 + f * 0.125, bz * 0.3]));
    }
  // Coluna: 4 fiadas de 2x2 (0,62 x 0,55 x 0,62).
  for (let f = 0; f < 4; f++)
    for (let j = 0; j < 4; j++) {
      const bx = j % 2 ? 0.155 : -0.155;
      const bz = j < 2 ? -0.155 : 0.155;
      const m = (j + f) % 2 ? colunaB : colunaA;
      blocos.push(part(box, m, [0.3, 0.134, 0.3], [bx, 0.25 + 0.06875 + f * 0.1375, bz]));
    }
  blocos.forEach((b, i) => {
    estatua.add(b);
    peca(b, { a: escalonar(i, blocos.length, TIJOLOS, 0.05), d: 0.05, h: 0.55 });
  });

  // Gema dourada (o "componente" do Design System) com dois anéis em volta.
  const ouro = mat(pv("yellow-500"), { emissive: pv("yellow-500"), emissiveIntensity: 0.35, metalness: 0.5, roughness: 0.3, flatShading: true });
  const gema = part(track(new THREE.OctahedronGeometry(0.3, 0)), ouro, [1, 1.35, 1], [0, 1.25, 0]);
  estatua.add(gema);
  peca(gema, { a: 0.6, d: 0.15, h: 2.4 });
  const aneis = [0, 1].map((i) => {
    const r = new THREE.Mesh(track(new THREE.TorusGeometry(0.42 + i * 0.1, 0.025, 8, 40)), ouro);
    r.position.y = 1.25;
    r.rotation.set(Math.PI / 2 + (i ? 0.5 : -0.5), 0, 0);
    estatua.add(r);
    peca(r, { a: 0.7 + i * 0.05, d: 0.1, modo: "inflar" });
    return r;
  });
  const placa = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.58, 0.145)),
    track(new THREE.MeshBasicMaterial({ map: track(makeLabel("DESIGN SYSTEM", pv("blue-900"), white)) }))
  );
  placa.position.set(0, 0.52, 0.312);
  estatua.add(placa);
  peca(placa, { a: 0.85, d: 0.05, modo: "crescer", eixo: "x" });

  // ---- Andaime: tubos e tábuas, montado no começo e desmontado no fim -------
  const tubo = mat(pv("gray-600"), { metalness: 0.4, roughness: 0.5 });
  const tabua = mat(mix(pv("yellow-800"), pv("yellow-400"), 0.35));
  const andaime = [];
  const L = 0.6; // meia largura
  for (const [x, z] of [[-L, -L], [L, -L], [-L, L], [L, L]]) andaime.push({ m: part(barraY, tubo, [0.035, 1.75, 0.035], [x, 0, z]), modo: "crescer" });
  for (const y of [0.6, 1.2])
    for (const [x, z, lado] of [[0, -L, 0], [0, L, 0], [-L, 0, 1], [L, 0, 1]])
      andaime.push({ m: part(box, tubo, [lado ? 0.03 : 2 * L, 0.03, lado ? 2 * L : 0.03], [x, y, z]) });
  // Diagonais nas laterais (contraventamento).
  for (const x of [-L, L]) {
    const m = part(box, tubo, [0.025, Math.hypot(2 * L, 1.2), 0.025], [x, 0.6, 0]);
    m.rotation.x = Math.atan2(2 * L, 1.2) * (x < 0 ? 1 : -1);
    andaime.push({ m });
  }
  // Tábuas nas laterais e no fundo (a frente fica livre para a câmera).
  for (const y of [0.63, 1.23])
    for (const [x, z, sx, sz] of [[-L, 0, 0.22, 2 * L], [L, 0, 0.22, 2 * L], [0, -L, 2 * L, 0.22]])
      andaime.push({ m: part(box, tabua, [sx, 0.035, sz], [x, y, z]) });
  andaime.forEach(({ m, modo = "cair" }, i) => {
    estatua.add(m);
    const n = andaime.length;
    // Desmonta na ordem inversa: tábuas primeiro, postes por último.
    const sai = [escalonar(n - 1 - i, n, ANDAIME_OUT, 0.04), 0.04];
    peca(m, { a: escalonar(i, n, ANDAIME_IN, 0.04), d: 0.04, modo, h: 0.4, sai });
  });

  // ---- Varal de bandeirinhas entre os postes da praça ----------------------
  const [p0, p1] = POSTES.map(([x, y]) => {
    const w = tileToWorld(x, y);
    w.z += LAMP_SOUTH_OFFSET;
    return w;
  });
  const FIO_Y = 0.94;
  const FLECHA = 0.2;
  const ponto = (u, alvo) => alvo.lerpVectors(p0, p1, u).setY(FIO_Y - 4 * FLECHA * u * (1 - u));
  const fioMat = mat(pv("gray-700"));
  const SEG = 16;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  // O fio vai sendo esticado de um poste ao outro.
  for (let i = 0; i < SEG; i++) {
    ponto(i / SEG, a);
    ponto((i + 1) / SEG, b);
    const s = part(barraX, fioMat, [a.distanceTo(b), 0.014, 0.014], [a.x, a.y, a.z]);
    s.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
    s.castShadow = false;
    festa.add(s);
    peca(s, { a: escalonar(i, SEG, FIO, 0.02), d: 0.02, modo: "crescer", eixo: "x" });
  }
  const triangulo = track(new THREE.BufferGeometry());
  triangulo.setAttribute("position", new THREE.Float32BufferAttribute([-0.11, 0, 0, 0.11, 0, 0, 0, -0.22, 0], 3));
  triangulo.computeVertexNormals();
  const coresFesta = ["red-400", "yellow-400", "blue-300", "green-400"];
  const corBand = coresFesta.map((c) => mat(pv(c), { side: THREE.DoubleSide, emissive: pv(c), emissiveIntensity: 0.2 }));
  const NB = 16;
  for (let i = 0; i < NB; i++) {
    ponto((i + 0.75) / (NB + 0.5), a);
    const f = part(triangulo, corBand[i % corBand.length], [1, 1, 1], [a.x, a.y, a.z]);
    f.castShadow = false;
    f.rotation.x = i % 2 ? 0.12 : -0.12;
    festa.add(f);
    peca(f, { a: escalonar(i, NB, BANDEIRAS, 0.04), d: 0.04, modo: "inflar" });
  }

  // ---- Balões presos no topo dos postes ------------------------------------
  const esfera = track(new THREE.SphereGeometry(0.13, 16, 12));
  const cordao = mat(white);
  const corBalao = ["red-400", "blue-500", "yellow-400", "green-400"].map((c) => mat(pv(c), { roughness: 0.35, emissive: pv(c), emissiveIntensity: 0.1 }));
  const balaoGrupos = [];
  let nb = 0;
  for (const p of [p0, p1]) {
    const g = new THREE.Group();
    g.position.set(p.x, 1.19, p.z);
    festa.add(g);
    balaoGrupos.push(g);
    for (const [dx, dy, dz] of [[-0.15, 0.4, 0.02], [0.14, 0.46, -0.03], [0, 0.6, 0.05]]) {
      const bl = part(esfera, corBalao[nb % corBalao.length], [1, 1.18, 1], [dx, dy, dz]);
      g.add(bl);
      const fim = new THREE.Vector3(dx, dy - 0.14, dz);
      const c = part(barraY, cordao, [0.006, fim.length(), 0.006], [0, 0, 0]);
      c.quaternion.setFromUnitVectors(UP, fim.normalize());
      c.castShadow = false;
      g.add(c);
      const t0 = escalonar(nb, 6, BALOES, 0.06);
      peca(c, { a: t0, d: 0.02, modo: "crescer" });
      peca(bl, { a: t0 + 0.01, d: 0.05, modo: "inflar" });
      nb++;
    }
  }

  // ---- Fogos de artifício (só com a festa pronta) --------------------------
  const fwColors = ["yellow-400", "red-400", "blue-300", "green-400", "white"].map((c) => (c === "white" ? white : pv(c)));
  const fwCenter = tileToWorld(7, 8).setY(2.5);
  const bursts = [];
  let nextBurst = 0;
  function spawnBurst() {
    const pos = new Float32Array(FW_COUNT * 3);
    const vel = new Float32Array(FW_COUNT * 3);
    const o = fwCenter.clone().add(new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 1.2, (Math.random() - 0.5) * 1.5));
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

  function setProgress(k) {
    festa.visible = k > 0;
    if (k < FW_K) limparFogos();
    if (!festa.visible) return;
    for (const p of pecas) aplicarPeca(p, k);
  }
  function update(t, dt, k) {
    if (reducedMotion) return;
    gema.rotation.y = t * 1.2;
    aneis[0].rotation.z = t * 0.8;
    aneis[1].rotation.z = -t * 0.6;
    // Balões balançando (grupo à parte: setProgress não mexe nele).
    balaoGrupos.forEach((g, i) => (g.rotation.z = Math.sin(t * 1.3 + i * 2) * 0.06));
    if (k >= FW_K) updateFogos(dt);
  }
  return { setProgress, update };
}
