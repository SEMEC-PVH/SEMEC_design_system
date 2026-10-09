// Época "futuro": Vila 2030 — uma torre de vidro com estação de drones é
// erguida andar por andar (com guindaste), o neon é "desenhado" no contorno
// dos prédios, o painel "2030" é montado e só então entram drones e carros
// voadores.
//
// Contrato de toda época (ver scene/epocas.js):
//   createX({ scene, pal, track, tileToWorld, buildings, makeLabel, reducedMotion })
//     -> { setProgress(k), update(t, dt, k) }
//   setProgress(k): 0 = a Vila de hoje (nada desta época visível e os prédios
//     exatamente como eram), 1 = época completa. Determinístico: o mesmo k
//     dá sempre a mesma cena (a volta ao presente roda k de 1 para 0).
//   update(t, dt, k): animação contínua (só quando k > 0).
//
// Linha do tempo de k:
//   0,00–0,12  guindaste sobe e a fundação aparece
//   0,12–0,60  andares (e a plataforma de pouso no topo) descem e assentam
//   0,60–0,70  guindaste recolhe; luzes da plataforma acendem
//   0,30–0,80  neon desenhado prédio a prédio (topo e depois as quinas)
//   0,75–0,90  painel: moldura, depois a tela liga
//   0,83–1,00  drones decolam da torre e carros entram pelas bordas
import * as THREE from "three";
import { createKit, trecho, assentar } from "./comum";

const suave = (x) => x * x * (3 - 2 * x);

export function createFuturo({ scene, pal, track, tileToWorld, buildings, makeLabel, reducedMotion = false }) {
  const { pv, mix, white } = pal;
  const { box, mat, glow, part } = createKit({ pal, track });
  const futuro = new THREE.Group();
  futuro.visible = false;
  scene.add(futuro);
  const neonA = glow(pv("blue-300"));
  const neonB = glow(mix(pv("red-400"), pv("blue-500"), 0.35));
  const verde = glow(pv("green-400"));

  // ---- Torre de vidro + estação de drones -----------------------------------
  // Grama a leste do Banco de Dados (tiles x 16–18, y 3–6).
  const base = tileToWorld(17, 4).add(new THREE.Vector3(0.1, 0, 0.6));
  const torre = new THREE.Group();
  torre.position.copy(base);
  futuro.add(torre);
  const ANDARES = 6;
  const ALT = 0.52; // altura de cada andar
  const PE = 0.16; // fundação
  const QUEDA = 2.2; // de quanto acima cada peça desce
  const vidro = mat(mix(pv("blue-400"), pv("blue-900"), 0.35), { roughness: 0.12, metalness: 0.55 });
  const laje = mat(mix(pv("gray-100"), pv("gray-300"), 0.5), { roughness: 0.5 });
  const fundacao = part(box, mat(pv("gray-500"), { roughness: 0.9 }), [2, PE, 2], [0, PE / 2, 0]);
  torre.add(fundacao);
  // Cada peça: { g, y (assento), rot, a, b }. Andares giram um pouco (torre torcida).
  const pecas = [];
  for (let i = 0; i < ANDARES; i++) {
    const g = new THREE.Group();
    const w = 1.62 - i * 0.07;
    g.add(part(box, vidro, [w, ALT - 0.08, w], [0, (ALT - 0.08) / 2 + 0.08, 0]));
    g.add(part(box, laje, [w + 0.14, 0.08, w + 0.14], [0, 0.04, 0]));
    // Faixa de neon no meio do andar e montantes nas quinas.
    g.add(part(box, i % 2 ? neonB : neonA, [w + 0.03, 0.05, w + 0.03], [0, ALT * 0.55, 0]));
    for (const [x, z] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      g.add(part(box, laje, [0.07, ALT - 0.08, 0.07], [(x * w) / 2, (ALT - 0.08) / 2 + 0.08, (z * w) / 2]));
    }
    pecas.push({ g, y: PE + i * ALT, rot: 0.6 + i * 0.12 });
  }
  // Topo: plataforma de pouso com anel verde, "H" e antena.
  const topoY = PE + ANDARES * ALT;
  const plataforma = new THREE.Group();
  const disco = track(new THREE.CylinderGeometry(1, 1, 1, 32));
  plataforma.add(part(box, laje, [1.3, 0.1, 1.3], [0, 0.05, 0]));
  plataforma.add(part(disco, mat(pv("gray-800"), { roughness: 0.6 }), [0.95, 0.08, 0.95], [0, 0.14, 0]));
  const luzes = new THREE.Group();
  const anel = new THREE.Mesh(track(new THREE.TorusGeometry(0.82, 0.04, 6, 40)), verde);
  anel.rotation.x = Math.PI / 2;
  anel.position.y = 0.19;
  luzes.add(anel);
  const marca = glow(white);
  luzes.add(part(box, marca, [0.07, 0.02, 0.5], [-0.17, 0.19, 0]));
  luzes.add(part(box, marca, [0.07, 0.02, 0.5], [0.17, 0.19, 0]));
  luzes.add(part(box, marca, [0.34, 0.02, 0.07], [0, 0.19, 0]));
  luzes.add(part(box, glow(pv("red-400")), [0.1, 0.1, 0.1], [0.62, 1.22, -0.62]));
  plataforma.add(luzes);
  plataforma.add(part(box, laje, [0.05, 1.05, 0.05], [0.62, 0.68, -0.62]));
  pecas.push({ g: plataforma, y: topoY, rot: 0.6 + ANDARES * 0.12 });
  pecas.forEach((p, i) => {
    p.a = 0.12 + i * 0.065;
    p.b = p.a + 0.09;
    p.g.visible = false;
    torre.add(p.g);
  });

  // Guindaste: mastro amarelo ao lado da torre com a lança apontando para ela.
  const guindaste = new THREE.Group();
  const gPos = tileToWorld(18, 6).add(new THREE.Vector3(0.25, 0, 0.1));
  guindaste.position.copy(gPos);
  futuro.add(guindaste);
  const amarelo = mat(pv("yellow-500"), { roughness: 0.55 });
  const escuro = mat(pv("gray-700"), { roughness: 0.6 });
  const MASTRO = 6.2;
  guindaste.add(part(box, escuro, [0.5, 0.12, 0.5], [0, 0.06, 0]));
  guindaste.add(part(box, amarelo, [0.2, MASTRO, 0.2], [0, MASTRO / 2, 0]));
  // Treliça: travessas escuras ao longo do mastro (legível de longe).
  for (let y = 0.5; y < MASTRO - 0.3; y += 0.55) guindaste.add(part(box, escuro, [0.23, 0.05, 0.23], [0, y, 0]));
  const dx = base.x - gPos.x;
  const dz = base.z - gPos.z;
  const alcance = Math.hypot(dx, dz);
  const lanca = new THREE.Group();
  lanca.position.y = MASTRO;
  lanca.rotation.y = Math.atan2(-dz, dx);
  guindaste.add(lanca);
  lanca.add(part(box, amarelo, [alcance + 1.4, 0.14, 0.16], [(alcance + 1.4) / 2 - 0.9, 0, 0]));
  lanca.add(part(box, escuro, [0.45, 0.32, 0.36], [-0.75, -0.05, 0]));
  lanca.add(part(box, mat(mix(pv("blue-200"), white, 0.3), { roughness: 0.2 }), [0.3, 0.26, 0.3], [0.15, -0.24, 0]));
  const cabo = part(box, escuro, [0.025, 1, 0.025], [alcance, 0, 0]);
  const gancho = part(box, escuro, [0.14, 0.1, 0.14], [alcance, 0, 0]);
  lanca.add(cabo, gancho);

  // ---- Neon "desenhado" nos prédios atuais ------------------------------------
  // Cada filete cresce ao longo do comprimento: { m, eixo, ini, sinal, len, a, b }.
  const filetes = [];
  const NEON0 = 0.3;
  const porPredio = 0.5 / buildings.size;
  let ordem = 0;
  for (const [id, group] of buildings) {
    const bb = new THREE.Box3().setFromObject(group);
    const s = bb.getSize(new THREE.Vector3());
    const top = bb.max.y + 0.03;
    const n = id === "semec" || id === "backend" ? neonA : neonB;
    const w = 0.06;
    const a0 = NEON0 + ordem * porPredio;
    const passo = porPredio / 6;
    // Contorno do topo, uma aresta depois da outra, partindo de cada quina.
    const topo = [
      ["x", bb.min.x, 1, s.x, [bb.min.z]],
      ["z", bb.min.z, 1, s.z, [bb.max.x]],
      ["x", bb.max.x, -1, s.x, [bb.max.z]],
      ["z", bb.max.z, -1, s.z, [bb.min.x]],
    ];
    topo.forEach(([eixo, ini, sinal, len, [outro]], i) => {
      const m = part(box, n, [w, w, w], [0, top, 0]);
      if (eixo === "x") m.position.z = outro;
      else m.position.x = outro;
      filetes.push({ m, eixo, ini, sinal, len, a: a0 + i * passo, b: a0 + (i + 1) * passo });
    });
    // Quinas da frente: descem do topo até o chão, juntas.
    for (const x of [bb.min.x, bb.max.x]) {
      const m = part(box, n, [w, w, w], [x, 0, bb.max.z]);
      filetes.push({ m, eixo: "y", ini: top, sinal: -1, len: s.y, a: a0 + 4 * passo, b: a0 + 6 * passo });
    }
    ordem++;
  }
  for (const f of filetes) futuro.add(f.m);

  // ---- Painel flutuante "2030" na praça -------------------------------------
  const painel = new THREE.Group();
  const tela = new THREE.Mesh(
    track(new THREE.PlaneGeometry(2.2, 0.55)),
    track(new THREE.MeshBasicMaterial({ map: track(makeLabel("VILA SEMEC · 2030", pv("blue-950"), pv("blue-300"))), toneMapped: false }))
  );
  painel.add(tela);
  const moldura = [
    part(box, neonA, [2.3, 0.04, 0.04], [0, 0.3, -0.01]),
    part(box, neonA, [2.3, 0.04, 0.04], [0, -0.3, -0.01]),
    part(box, neonA, [0.04, 0.64, 0.04], [-1.13, 0, -0.01]),
    part(box, neonA, [0.04, 0.64, 0.04], [1.13, 0, -0.01]),
  ];
  painel.add(...moldura);
  const fundoTela = part(box, mat(pv("gray-900"), { roughness: 0.4 }), [2.22, 0.58, 0.03], [0, 0, -0.03]);
  painel.add(fundoTela);
  const PAINEL_Y = 2.2;
  painel.position.copy(tileToWorld(9, 10)).setY(PAINEL_Y);
  painel.rotation.x = -0.45;
  futuro.add(painel);

  // ---- Carros voadores ---------------------------------------------------------
  const carros = [];
  const corCarro = [pv("blue-600"), pv("gray-100"), pv("yellow-500"), pv("red-500")];
  const farol = glow(pv("red-400"));
  const vidroCarro = mat(mix(pv("blue-200"), white, 0.3), { roughness: 0.15, metalness: 0.2 });
  const capsula = track(new THREE.CapsuleGeometry(0.16, 0.42, 6, 12));
  const corpos = corCarro.map((c) => mat(c, { roughness: 0.35, metalness: 0.3 }));
  for (let i = 0; i < 6; i++) {
    const car = new THREE.Group();
    const corpo = new THREE.Mesh(capsula, corpos[i % corpos.length]);
    corpo.rotation.z = Math.PI / 2;
    corpo.scale.set(1, 1, 0.8);
    car.add(corpo);
    car.add(part(box, vidroCarro, [0.3, 0.12, 0.24], [0.05, 0.14, 0]));
    car.add(part(box, farol, [0.04, 0.06, 0.2], [-0.37, 0, 0]));
    const faixa = i % 2;
    const dir = faixa ? -1 : 1;
    car.userData = {
      dir,
      x: -14 + ((i * 9.7) % 28),
      y: 2.1 + (i % 3) * 0.35,
      z: tileToWorld(0, faixa ? 16 : 8).z,
      v: 3 + (i % 3) * 0.7,
      borda: -17 * dir, // entra pela borda de onde vem
      a: 0.85 + i * 0.02,
    };
    car.rotation.y = faixa ? Math.PI : 0;
    car.visible = false;
    futuro.add(car);
    carros.push(car);
  }

  // ---- Drones: pousados na plataforma, decolam e rodeiam os prédios --------
  const drones = [];
  const helice = glow(pv("gray-200"));
  const corpoDrone = mat(pv("gray-800"), { roughness: 0.4, metalness: 0.4 });
  const centros = [...buildings.values()].map((g) => new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()));
  const pousoY = base.y + topoY + 0.26;
  centros.forEach((c, i) => {
    const d = new THREE.Group();
    d.add(part(box, corpoDrone, [0.22, 0.07, 0.22], [0, 0, 0]));
    for (const [x, z] of [[0.15, 0.15], [-0.15, 0.15], [0.15, -0.15], [-0.15, -0.15]]) {
      d.add(part(box, helice, [0.16, 0.01, 0.03], [x, 0.06, z]));
    }
    d.add(part(box, verde, [0.05, 0.03, 0.05], [0, -0.05, 0.11]));
    const ang = (i / centros.length) * Math.PI * 2 + 0.4;
    d.userData = {
      c,
      r: 2 + (i % 2) * 0.6,
      h: 3.4 + (i % 3) * 0.4,
      w: 0.7 + i * 0.15,
      ph: i * 1.7,
      pouso: new THREE.Vector3(base.x + Math.cos(ang) * 0.45, pousoY, base.z + Math.sin(ang) * 0.45),
      a: 0.83 + i * 0.03,
    };
    d.visible = false;
    futuro.add(d);
    drones.push(d);
  });

  // ---- Posicionamento (sem alocar por quadro) -----------------------------------
  const orb = new THREE.Vector3();
  let kAtual = 0;
  let tempo = 0;

  function posicionarVeiculos() {
    const t = tempo;
    for (const car of carros) {
      const u = car.userData;
      const e = trecho(kAtual, u.a, u.a + 0.05);
      car.visible = e > 0;
      if (!car.visible) continue;
      const s = suave(e);
      car.position.set(u.borda + (u.x - u.borda) * s, u.y + Math.sin(t * 2 + u.x) * 0.05 + (1 - s) * 0.8, u.z);
    }
    for (const d of drones) {
      const u = d.userData;
      // Pousados assim que a plataforma acende; decolam no fim.
      d.visible = kAtual >= 0.62;
      if (!d.visible) continue;
      const e = suave(trecho(kAtual, u.a, u.a + 0.08));
      const ang = t * u.w + u.ph;
      orb.set(u.c.x + Math.cos(ang) * u.r, u.h + Math.sin(t * 3 + u.ph) * 0.12, u.c.z + Math.sin(ang) * u.r);
      d.position.lerpVectors(u.pouso, orb, e);
      // Sobe primeiro, depois segue para a órbita.
      d.position.y += Math.sin(e * Math.PI) * 1.1;
      d.rotation.y = -ang * e;
    }
  }

  function setProgress(k) {
    kAtual = k;
    futuro.visible = k > 0;
    if (k <= 0) return;

    // Guindaste: sobe no começo e recolhe ao fim da obra.
    const g = Math.min(trecho(k, 0, 0.12), 1 - trecho(k, 0.6, 0.7));
    guindaste.visible = g > 0;
    guindaste.scale.set(1, Math.max(g, 0.001), 1);
    fundacao.scale.y = Math.max(trecho(k, 0.04, 0.12), 0.001);
    fundacao.position.y = (PE * fundacao.scale.y) / 2;

    // Andares descendo do alto e assentando com quique; o cabo acompanha.
    let ganchoY = topoY + QUEDA + 0.9;
    for (const p of pecas) {
      const u = trecho(k, p.a, p.b);
      p.g.visible = u > 0;
      if (!p.g.visible) continue;
      const e = assentar(u);
      p.g.position.y = p.y + (1 - e) * QUEDA;
      p.g.rotation.y = p.rot * (1 - e) + p.rot * 0.4 * e - 0.24;
      if (u < 1) ganchoY = p.g.position.y + ALT + 0.05;
    }
    const topoCabo = MASTRO - 0.1;
    const yLocal = Math.min(ganchoY - base.y, topoCabo - 0.2);
    cabo.scale.y = topoCabo - yLocal;
    cabo.position.y = -(topoCabo - yLocal) / 2 - 0.05;
    gancho.position.y = yLocal - MASTRO;
    luzes.visible = k >= 0.6;

    // Neon crescendo ao longo de cada aresta.
    for (const f of filetes) {
      const u = trecho(k, f.a, f.b);
      f.m.visible = u > 0;
      if (!f.m.visible) continue;
      f.m.scale[f.eixo] = f.len * u;
      f.m.position[f.eixo] = f.ini + (f.sinal * f.len * u) / 2;
    }

    // Painel: moldura abre do centro, depois a tela liga (linha → quadro).
    const m = trecho(k, 0.75, 0.82);
    painel.visible = m > 0;
    if (painel.visible) {
      moldura[0].scale.x = moldura[1].scale.x = 2.3 * m;
      moldura[2].scale.y = moldura[3].scale.y = 0.64 * m;
      moldura[2].visible = moldura[3].visible = m > 0.5;
      fundoTela.visible = m >= 1;
      const l = trecho(k, 0.82, 0.9);
      tela.visible = l > 0;
      tela.scale.set(Math.max(trecho(l, 0, 0.4), 0.001), Math.max(trecho(l, 0.4, 1), 0.04), 1);
    }

    posicionarVeiculos();
  }

  function update(t, dt) {
    if (reducedMotion) return;
    tempo = t;
    for (const car of carros) {
      const u = car.userData;
      u.x += u.dir * u.v * dt;
      if (u.x > 15) u.x = -15;
      if (u.x < -15) u.x = 15;
    }
    posicionarVeiculos();
    painel.position.y = PAINEL_Y + Math.sin(t * 1.5) * 0.06;
  }
  return { setProgress, update };
}
