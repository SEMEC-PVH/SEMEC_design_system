// Vila 2030 — módulo "trafego": o céu da cidade ganha vida. Ver futuro/index.js
// para o contrato. Janela de k: 0,72–1,00.
//
//   0,72–0,92  carros voadores entram nas 3 faixas aéreas (cada um chega pela
//              borda de onde vem, freando até a velocidade da faixa)
//   0,74–0,90  o enxame decola do heliponto da megatorre e se espalha
//   0,78–0,88  drones de entrega e patrulhas (holofote varrendo o chão) saem
//   0,80–0,90  o ônibus escolar voador e o dirigível com telão chegam
//   0,88–1,00  o enxame se junta e desenha "2030" no céu
//
// Depois (update): tráfego contínuo nos dois sentidos, entregas indo e
// voltando da megatorre, LEDs piscando, e o enxame alterna formações
// ("2030", coração, estrela) com voo livre. Com reducedMotion tudo fica
// parado na pose final (formação "2030" montada).
//
// Tudo é instanciado (partes iguais de todos os drones e carros dividem uma
// malha) e o brilho é falso: MeshBasic sem tone mapping + planos aditivos.
import * as THREE from "three";
import { trecho } from "../comum";

const suave = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;
// Ruído fixo por índice (o mesmo veículo é sempre igual).
const ruido = (n) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const PI = Math.PI;
// Inclinação dos planos que encaram a câmera (CAM_OFFSET 0, 10,5, 9).
const ENCARA = -Math.atan2(10.5, 9);
// Pose usada com reducedMotion (e antes do primeiro update).
const T_PARADO = 4.2;

// Fonte 3x5 para a formação "2030".
const DIGITOS = {
  2: ["111", "001", "111", "100", "111"],
  0: ["111", "101", "101", "101", "111"],
  3: ["111", "001", "111", "001", "111"],
};

export function createTrafego({ scene, pal, track, tileToWorld, buildings, makeLabel, reducedMotion = false, cores, kit }) {
  const { pv, mix, white } = pal;
  const { box } = kit;
  const grupo = new THREE.Group();
  grupo.name = "futuro-trafego";
  grupo.visible = false;
  scene.add(grupo);

  // ---- Texturas de brilho (geradas, sem imagem) ------------------------------
  function textura(w, h, f) {
    const d = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = Math.round(255 * Math.min(1, Math.max(0, f((x + 0.5) / w, (y + 0.5) / h))));
        const i = (y * w + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = v;
        d[i + 3] = 255;
      }
    }
    const t = track(new THREE.DataTexture(d, w, h));
    t.magFilter = t.minFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  }
  // Radial (halo), rampa ao longo de u (rastro/feixe) e ao longo de v (cone).
  const texRadial = textura(48, 48, (u, v) => {
    const r = Math.hypot(u - 0.5, v - 0.5) * 2;
    return (1 - r) ** 2.2 * 1.1;
  });
  const texRampaU = textura(64, 8, (u, v) => u ** 1.6 * (1 - Math.abs(v - 0.5) * 2) ** 0.6);
  const texRampaV = textura(4, 64, (u, v) => 0.12 + 0.88 * v ** 1.8);
  const aditivo = (map, color = white) =>
    track(
      new THREE.MeshBasicMaterial({
        color,
        map,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      })
    );
  const matHalo = aditivo(texRadial);
  const matRampa = aditivo(texRampaU);
  const matCone = aditivo(texRampaV);
  const matLuz = kit.glow(white); // cor por instância
  const matMetal = kit.mat(mix(pv("gray-800"), cores.roxo, 0.25), { roughness: 0.35, metalness: 0.6 });
  const matRotor = track(
    new THREE.MeshBasicMaterial({ color: mix(pv("gray-500"), cores.ciano, 0.25), transparent: true, opacity: 0.22, depthWrite: false })
  );
  const matCarro = kit.mat(white, { roughness: 0.38, metalness: 0.12 }); // cor por instância
  const matCabine = kit.mat(mix(cores.noite, cores.ciano, 0.3), {
    roughness: 0.08,
    metalness: 0.4,
    emissive: cores.ciano,
    emissiveIntensity: 0.22,
  });
  const matCaixa = kit.mat(mix(pv("yellow-700"), pv("yellow-400"), 0.35), { roughness: 0.85 });

  // ---- Geometrias -------------------------------------------------------------
  const geoHaloFrente = track(new THREE.PlaneGeometry(1, 1).rotateX(ENCARA));
  const geoHaloChao = track(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2));
  // Rastro: plano deitado de x=-1 (apagado) a x=0 (aceso).
  const geoRastro = track(new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2).translate(-0.5, 0, 0));
  // Cone do holofote: vértice na origem, abre para -y até y=-1.
  const geoCone = track(new THREE.ConeGeometry(1, 1, 20, 1, true).translate(0, -0.5, 0));
  const geoRotor = track(new THREE.CylinderGeometry(1, 1, 1, 14));
  const geoPod = track(new THREE.CylinderGeometry(1, 0.85, 1, 10).rotateZ(PI / 2));
  function perfil(pts, prof, bevel) {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: prof,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 2,
      curveSegments: 4,
    });
    g.translate(0, 0, -prof / 2);
    return track(g);
  }
  // Carro visto de lado (frente em +x): bico baixo, traseira alta em cunha.
  const geoCorpo = perfil(
    [[-0.6, 0.02], [0.52, 0.02], [0.66, 0.08], [0.6, 0.15], [0.12, 0.19], [-0.48, 0.22], [-0.64, 0.16]],
    0.44,
    0.035
  );
  const geoCabine = perfil([[-0.36, 0.18], [0.2, 0.18], [0.04, 0.34], [-0.28, 0.34]], 0.32, 0.03);

  // ---- Instâncias ---------------------------------------------------------------
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function inst(geo, material, n, sombra = false) {
    const m = track(new THREE.InstancedMesh(geo, material, n));
    m.frustumCulled = false;
    m.castShadow = sombra;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < n; i++) {
      m.setMatrixAt(i, ZERO);
      m.setColorAt(i, white);
    }
    grupo.add(m);
    return m;
  }
  const _m = new THREE.Matrix4();
  const _b = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _e = new THREE.Euler();
  const _p = new THREE.Vector3();
  const _s = new THREE.Vector3();
  const _c = new THREE.Color();
  const _v = new THREE.Vector3();
  const _w = new THREE.Vector3();
  const local = (x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) =>
    new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(sx, sy, sz)
    );
  // Matriz de base de um veículo (posição, giro em y, inclinações, escala).
  function base(x, y, z, ry, rx, rz, esc) {
    _e.set(rx, ry, rz, "YXZ");
    _q.setFromEuler(_e);
    return _b.compose(_p.set(x, y, z), _q, _s.set(esc, esc, esc));
  }
  const por = (mesh, i, L) => mesh.setMatrixAt(i, _m.multiplyMatrices(_b, L));
  // Halo que encara a câmera numa posição do mundo.
  function halo(mesh, i, x, y, z, tam, cor, forca) {
    mesh.setMatrixAt(i, _m.compose(_p.set(x, y, z), _q.identity(), _s.set(tam, tam, tam)));
    mesh.setColorAt(i, _c.copy(cor).multiplyScalar(forca));
  }
  const esconder = (mesh, i) => mesh.setMatrixAt(i, ZERO);

  // ---- Lugares --------------------------------------------------------------
  // Heliponto da megatorre (na ilha do lago, tiles ~x23,5–26,5 y3–5,6): deque
  // da coroa a 4,72 de altura. Se a megatorre publicar um objeto
  // "futuro-heliponto", usamos a altura dele.
  const HELI = tileToWorld(24, 4).add(new THREE.Vector3(0.5, 4.72, -0.5));
  // Baias de drone da coroa (espaço local, coroa girada 0,2 rad).
  const ROT_COROA = 0.2;
  const BAIAS = [[-0.5, -0.18], [0.48, 0.22]].map(([x, z]) => [
    x * Math.cos(ROT_COROA) + z * Math.sin(ROT_COROA),
    -x * Math.sin(ROT_COROA) + z * Math.cos(ROT_COROA),
  ]);
  let heliObj = null;
  let heliTentativas = 0;
  function acharHeliponto() {
    if (heliObj || heliTentativas > 40) return;
    heliTentativas++;
    heliObj = scene.getObjectByName("futuro-heliponto") || null;
  }
  function heliY() {
    if (!heliObj) return HELI.y;
    heliObj.getWorldPosition(_w);
    return _w.y > 1 ? _w.y + 0.15 : HELI.y;
  }
  // Prédios: centro e topo (alvo das entregas e centro das órbitas do enxame).
  const predios = [];
  for (const [id, g] of buildings) {
    const bb = new THREE.Box3().setFromObject(g);
    if (bb.isEmpty()) continue;
    const c = bb.getCenter(new THREE.Vector3());
    predios.push({ id, c, topo: bb.max.y });
  }
  const praca = tileToWorld(15, 9);

  // ---- Drones (enxame + entrega + patrulha dividem as malhas) -----------------
  const NS = 72; // enxame (as sobras de cada formação seguem em voo livre)
  const NE = 6; // entrega
  const NP = 3; // patrulha
  const ND = NS + NE + NP;
  const dCorpo = inst(box, matMetal, ND, true);
  const dTopo = inst(box, matLuz, ND); // faixa de luz no dorso
  const dBraco = inst(box, matMetal, ND * 2);
  const dRotor = inst(geoRotor, matRotor, ND * 4);
  const dLed = inst(box, matLuz, ND);
  const dHalo = inst(geoHaloFrente, matHalo, ND);
  const caixas = inst(box, matCaixa, NE, true);
  const fitas = inst(box, matLuz, NE);
  const cones = inst(geoCone, matCone, NP);
  const focos = inst(geoHaloChao, matHalo, NP * 2);
  const L_CORPO = local(0, 0, 0, 0.24, 0.08, 0.24);
  const L_TOPO = local(0, 0.045, 0, 0.12, 0.015, 0.12);
  const L_BRACO = [local(0, 0.01, 0, 0.5, 0.03, 0.045, 0, PI / 4), local(0, 0.01, 0, 0.5, 0.03, 0.045, 0, -PI / 4)];
  const ROT = [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([x, z]) => local(x * 0.177, 0.045, z * 0.177, 0.1, 0.008, 0.1));
  const L_LED = local(0, -0.055, 0, 0.07, 0.04, 0.07);
  const L_CAIXA = local(0, -0.26, 0, 0.26, 0.2, 0.26);
  const L_FITA = local(0, -0.26, 0, 0.27, 0.04, 0.27);

  const swarm = [];
  // Centros das órbitas livres: praça e ruas, onde a câmera olha.
  const HUBS = [praca, tileToWorld(10, 11), tileToWorld(21, 10), tileToWorld(15, 13), tileToWorld(7, 8), tileToWorld(24, 13)];
  for (let i = 0; i < NS; i++) {
    // Órbitas: metade em volta da megatorre, o resto pelos prédios e praça.
    const h = i % 5 === 0 ? HELI : HUBS[i % HUBS.length];
    const torre = h === HELI;
    swarm.push({
      hub: h,
      r: (torre ? 1.7 : 1.6) + ruido(i) * 2.2,
      h: (torre ? 4.1 : 2.5) + ruido(i + 50) * 1.9,
      w: (0.28 + ruido(i + 9) * 0.35) * (ruido(i + 3) > 0.45 ? 1 : -1),
      ph: ruido(i + 21) * PI * 2,
      a: 0.74 + (i / NS) * 0.11,
      cor: i % 3 === 2 ? cores.violeta : i % 2 ? cores.magenta : cores.ciano,
      pisca: 1.5 + ruido(i + 7) * 2.5,
    });
  }

  // Formações (pontos num plano que encara a câmera, centro F).
  const F = tileToWorld(14, 9).add(new THREE.Vector3(0.5, 6.6, 0.5));
  const ESP = 0.3;
  function formacao2030() {
    const pts = [];
    "2030".split("").forEach((d, n) => {
      DIGITOS[d].forEach((linha, r) => {
        for (let c = 0; c < 3; c++) {
          if (linha[c] === "1") pts.push([(n * 4 + c - 7) * ESP, (2 - r) * ESP]);
        }
      });
    });
    return pts;
  }
  function contorno(f, n) {
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(f(i / n));
    return pts;
  }
  const coracao = contorno((u) => {
    const t = u * PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [x * 0.105, y * 0.105 + 0.2];
  }, NS);
  const estrela = contorno((u) => {
    // 10 vértices (pontas e vales), pontos repartidos ao longo das arestas.
    const s = u * 10;
    const i = Math.floor(s);
    const f = s - i;
    const v = (j) => {
      const r = j % 2 ? 0.85 : 2.1;
      const a = PI / 2 + (j * PI) / 5;
      return [Math.cos(a) * r, Math.sin(a) * r];
    };
    const [x0, y0] = v(i);
    const [x1, y1] = v(i + 1);
    return [lerp(x0, x1, f), lerp(y0, y1, f)];
  }, NS);
  const FORMAS = [
    { pts: formacao2030(), cor: [mix(cores.ciano, white, 0.35), mix(cores.ciano, white, 0.35)] },
    { pts: coracao, cor: [cores.magenta, cores.magenta] },
    { pts: estrela, cor: [cores.ambar, cores.ciano] },
  ];
  // Posição do drone i na forma (só para i < pts.length).
  function pontoForma(forma, i, out) {
    const [x, y] = forma.pts[i];
    return out.set(F.x + x, F.y + y * Math.cos(ENCARA), F.z - y * Math.sin(-ENCARA));
  }
  // Ciclo das formações (tf corre a partir do fim da obra; começa já com "2030").
  // Cada forma: 0–2 junta · 2–8 fica · 8–10 desfaz · 10–16 voo livre.
  function cicloForma(tf) {
    const n = Math.floor(tf / 16);
    const u = tf - n * 16;
    const w = u < 2 ? suave(u / 2) : u < 8 ? 1 : u < 10 ? 1 - suave((u - 8) / 2) : 0;
    return { forma: FORMAS[n % FORMAS.length], w };
  }

  const entregas = [];
  const ALVOS = [
    ...predios.map((p) => new THREE.Vector3(p.c.x, p.topo + 0.45, p.c.z)),
    // Escolas fora do mapa: os drones saem pelas bordas.
    new THREE.Vector3(-19, 3.2, -1),
    new THREE.Vector3(19, 3.4, 3),
    new THREE.Vector3(-18, 3.6, 8),
    new THREE.Vector3(18, 3.0, -9),
  ];
  for (let i = 0; i < NE; i++) {
    entregas.push({
      pad: BAIAS[i % 2],
      per: 11 + ruido(i + 30) * 4,
      fase: i / NE + ruido(i + 31) * 0.1,
      a: 0.78 + i * 0.015,
      cor: i % 2 ? cores.verde : cores.ambar,
    });
  }
  const patrulhas = [
    { c: tileToWorld(10, 10), rx: 3.2, rz: 1.6, h: 3.4, w: 0.22, ph: 0 },
    { c: tileToWorld(21, 9), rx: 2.6, rz: 2.2, h: 3.8, w: -0.18, ph: 2 },
    { c: tileToWorld(15, 14), rx: 3.8, rz: 1.2, h: 3.0, w: 0.15, ph: 4 },
  ].map((p, i) => ({ ...p, a: 0.8 + i * 0.03 }));

  // ---- Carros voadores ---------------------------------------------------------
  // Faixas: altura e z (tiles). Cada faixa tem dois sentidos (sul vai p/ leste).
  const FAIXAS = [
    { z: tileToWorld(0, 9).z, y: 2.3, v: 3.4 },
    // Sobre Front-End/Back-End: alta o bastante para não tapar outdoor e letreiro.
    { z: tileToWorld(0, 14).z, y: 3.9, v: 2.8 },
    { z: tileToWorld(0, 6).z + 0.3, y: 4.5, v: 4.2 },
  ];
  const POR_SENTIDO = 4;
  const NC = FAIXAS.length * 2 * POR_SENTIDO;
  const LOOP = 19;
  const CORES_CARRO = [
    mix(pv("gray-300"), cores.violeta, 0.35),
    pv("gray-100"),
    cores.ambar.clone(), // táxi
    mix(pv("blue-500"), cores.ciano, 0.4),
    mix(pv("red-500"), cores.magenta, 0.5),
    mix(pv("gray-400"), pv("blue-300"), 0.4),
  ];
  const carros = [];
  for (let f = 0; f < FAIXAS.length; f++) {
    for (const dir of [1, -1]) {
      for (let j = 0; j < POR_SENTIDO; j++) {
        const i = carros.length;
        const cor = CORES_CARRO[(i * 5 + f) % CORES_CARRO.length];
        const taxi = cor === CORES_CARRO[2];
        carros.push({
          f,
          dir,
          z: FAIXAS[f].z + dir * 0.38,
          x0: -LOOP + ((j + ruido(i) * 0.6) / POR_SENTIDO) * 2 * LOOP,
          v: FAIXAS[f].v * (0.85 + ruido(i + 40) * 0.3),
          cor,
          neon: taxi ? cores.ambar : (i + f) % 2 ? cores.magenta : cores.ciano,
          a: 0.72 + ruido(i + 60) * 0.18,
          ph: ruido(i + 70) * 6,
        });
      }
    }
  }
  const cCorpo = inst(geoCorpo, matCarro, NC, true);
  const cCabine = inst(geoCabine, matCabine, NC);
  const cPod = inst(geoPod, matMetal, NC * 2);
  const cLuz = inst(box, matLuz, NC * 9); // faróis, lanterna, motores, faixa de baixo
  const cHalo = inst(geoHaloChao, matHalo, NC);
  const cRastro = inst(geoRastro, matRampa, NC * 3); // 2 rastros + feixe dos faróis
  for (let i = 0; i < NC; i++) cCorpo.setColorAt(i, carros[i].cor);
  const L_CARRO = local(0, 0, 0, 1, 1, 1);
  const L_POD = [1, -1].map((s) => local(-0.08, 0.07, s * 0.3, 0.62, 0.075, 0.075));
  const L_LUZES = [
    [local(0.67, 0.095, 0.14, 0.03, 0.035, 0.1), "farol"],
    [local(0.67, 0.095, -0.14, 0.03, 0.035, 0.1), "farol"],
    [local(-0.66, 0.17, 0, 0.03, 0.035, 0.44), "lanterna"],
    [local(-0.4, 0.07, 0.3, 0.02, 0.12, 0.12), "motor"],
    [local(-0.4, 0.07, -0.3, 0.02, 0.12, 0.12), "motor"],
    [local(0, -0.025, 0, 0.95, 0.018, 0.28), "neon"],
    [local(0.15, 0.2, 0, 0.42, 0.012, 0.012), "neon"], // friso do capô
    [local(-0.02, 0.05, 0.25, 1.1, 0.022, 0.012), "neon"], // saias laterais
    [local(-0.02, 0.05, -0.25, 1.1, 0.022, 0.012), "neon"],
  ];
  const NL = L_LUZES.length;
  const L_HALO_C = local(0, -0.12, 0, 1.9, 1, 1.1);
  const L_RASTROS = [
    local(-0.4, 0.07, 0.3, 2.8, 1, 0.13),
    local(-0.4, 0.07, -0.3, 2.8, 1, 0.13),
    local(0.68, 0.06, 0, 1.6, 1, 0.55, 0, PI), // feixe à frente
  ];
  const corLanterna = mix(pv("red-500"), cores.magenta, 0.25);
  const corFarol = mix(white, pv("yellow-100"), 0.35);
  const corFeixe = mix(pv("yellow-100"), white, 0.5);

  // ---- Ônibus escolar voador ------------------------------------------------------
  const onibus = new THREE.Group();
  grupo.add(onibus);
  const bCorpo = new THREE.Mesh(box, kit.mat(mix(pv("yellow-500"), cores.ambar, 0.4), { roughness: 0.35, metalness: 0.3 }));
  bCorpo.scale.set(2.6, 0.46, 0.72);
  bCorpo.position.y = 0.23;
  bCorpo.castShadow = true;
  const bTeto = new THREE.Mesh(box, kit.mat(pv("gray-100"), { roughness: 0.4 }));
  bTeto.scale.set(2.4, 0.08, 0.64);
  bTeto.position.y = 0.5;
  const bJanelas = new THREE.Mesh(box, kit.glow(mix(cores.ambar, white, 0.55)));
  bJanelas.scale.set(2.1, 0.15, 0.74);
  bJanelas.position.set(-0.1, 0.33, 0);
  const bVidro = new THREE.Mesh(box, kit.glow(mix(cores.ciano, cores.noite, 0.35)));
  bVidro.scale.set(0.04, 0.2, 0.62);
  bVidro.position.set(1.3, 0.33, 0);
  const bFrisos = inst(box, matMetal, 16);
  const bLuz = inst(box, matLuz, 6);
  const bRastro = inst(geoRastro, matRampa, 3);
  const bHalo = new THREE.Mesh(geoHaloChao, aditivo(texRadial, cores.ciano));
  bHalo.scale.set(3.6, 1, 1.6);
  bHalo.position.y = -0.08;
  const placa = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.9, 0.48).rotateX(-PI / 2)),
    track(new THREE.MeshBasicMaterial({ map: track(makeLabel("ESCOLA 2030", pv("blue-950"), cores.ambar)), toneMapped: false }))
  );
  placa.position.y = 0.55;
  onibus.add(bCorpo, bTeto, bJanelas, bVidro, bHalo, placa);
  const BUS = { z: FAIXAS[1].z - 0.05, y: FAIXAS[1].y + 0.35, v: 2.2, x0: -6, a: 0.8 };
  const B_FRISOS = [];
  for (let n = 0; n < 8; n++) {
    for (const s of [1, -1]) B_FRISOS.push(local(-1.05 + n * 0.27, 0.33, s * 0.375, 0.04, 0.16, 0.012));
  }
  const B_LUZES = [
    [local(1.31, 0.12, 0.24, 0.03, 0.06, 0.14), corFarol],
    [local(1.31, 0.12, -0.24, 0.03, 0.06, 0.14), corFarol],
    [local(-1.31, 0.14, 0, 0.03, 0.05, 0.6), corLanterna],
    [local(0, 0.01, 0, 2.4, 0.02, 0.5), cores.ciano],
    [local(-1.31, 0.36, 0.3, 0.03, 0.1, 0.06), cores.magenta],
    [local(-1.31, 0.36, -0.3, 0.03, 0.1, 0.06), cores.magenta],
  ];
  const B_RASTROS = [
    local(-1.3, 0.14, 0.22, 3.6, 1, 0.16),
    local(-1.3, 0.14, -0.22, 3.6, 1, 0.16),
    local(1.32, 0.1, 0, 2.2, 1, 0.8, 0, PI),
  ];
  onibus.visible = false;

  // ---- Dirigível com telão ------------------------------------------------------
  const dirigivel = new THREE.Group();
  grupo.add(dirigivel);
  const envelope = new THREE.Mesh(
    track(new THREE.SphereGeometry(1, 24, 14)),
    kit.mat(mix(cores.roxo, pv("gray-700"), 0.45), { roughness: 0.5, emissive: cores.roxo, emissiveIntensity: 0.25 })
  );
  envelope.scale.set(2.3, 0.72, 0.72);
  envelope.castShadow = true;
  dirigivel.add(envelope);
  const eLeme = new THREE.Mesh(box, matMetal);
  eLeme.scale.set(0.6, 1.2, 0.05);
  eLeme.position.set(-2.05, 0, 0);
  const eAsa = new THREE.Mesh(box, matMetal);
  eAsa.scale.set(0.6, 0.05, 1.2);
  eAsa.position.set(-2.05, 0, 0);
  const gondola = new THREE.Mesh(box, matMetal);
  gondola.scale.set(0.8, 0.2, 0.32);
  gondola.position.set(0.2, -0.78, 0);
  const gJanelas = new THREE.Mesh(box, kit.glow(mix(cores.ciano, white, 0.4)));
  gJanelas.scale.set(0.62, 0.06, 0.34);
  gJanelas.position.set(0.2, -0.76, 0);
  const cinta = new THREE.Mesh(track(new THREE.TorusGeometry(1, 0.035, 6, 48)), kit.glow(cores.magenta));
  cinta.scale.set(2.31, 0.73, 1);
  cinta.rotation.x = 0;
  dirigivel.add(eLeme, eAsa, gondola, gJanelas, cinta);
  // Telão pendurado no lado sul, inclinado para a câmera.
  const telao = new THREE.Group();
  telao.position.set(0, -0.1, 0.78);
  telao.rotation.x = ENCARA + PI / 2;
  const TEXTOS = ["VILA SEMEC · 2030", "EDUCAÇÃO CONECTADA", "PORTO VELHO · 2030"].map((t) =>
    track(makeLabel(t, cores.noite, cores.ciano))
  );
  const telaMat = track(new THREE.MeshBasicMaterial({ map: TEXTOS[0], toneMapped: false }));
  const tela = new THREE.Mesh(track(new THREE.PlaneGeometry(2.4, 0.6)), telaMat);
  const moldura = new THREE.Mesh(box, kit.glow(cores.magenta));
  moldura.scale.set(2.52, 0.7, 0.02);
  moldura.position.z = -0.02;
  const telaHalo = new THREE.Mesh(geoHaloFrente, aditivo(texRadial, mix(cores.ciano, cores.noite, 0.4)));
  telaHalo.scale.set(4.2, 1.8, 1);
  telaHalo.rotation.x = -ENCARA;
  telaHalo.position.z = -0.05;
  telao.add(moldura, tela);
  dirigivel.add(telao, telaHalo);
  const navVerde = new THREE.Mesh(box, kit.glow(cores.verde));
  navVerde.scale.setScalar(0.09);
  navVerde.position.set(0.3, 0, 0.75);
  const navVermelho = new THREE.Mesh(box, kit.glow(pv("red-400")));
  navVermelho.scale.setScalar(0.09);
  navVermelho.position.set(0.3, 0, -0.75);
  dirigivel.add(navVerde, navVermelho);
  const DIR = { x0: -8, z: tileToWorld(0, 6.5).z, y: 5.3, a: 0.82 };
  dirigivel.visible = false;

  // ---- Posicionamento ----------------------------------------------------------
  let kAtual = 0;
  let tempo = T_PARADO;
  let tf = 2; // relógio das formações (2 = "2030" montado)
  const livre = new THREE.Vector3();
  const alvo = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const quad = (a, b, c, d, t) => {
    const u = 1 - t;
    return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
  };
  const wrap = (x) => ((((x + LOOP) % (2 * LOOP)) + 2 * LOOP) % (2 * LOOP)) - LOOP;

  // Um drone completo: base já montada em _b; idx = índice global.
  function montarDrone(idx, cor, brilho, giro) {
    por(dCorpo, idx, L_CORPO);
    por(dTopo, idx, L_TOPO);
    dTopo.setColorAt(idx, cor);
    por(dBraco, idx * 2, L_BRACO[0]);
    por(dBraco, idx * 2 + 1, L_BRACO[1]);
    for (let r = 0; r < 4; r++) por(dRotor, idx * 4 + r, ROT[r]);
    por(dLed, idx, L_LED);
    dLed.setColorAt(idx, _c.copy(cor).multiplyScalar(0.35 + 0.65 * brilho));
    _w.set(0, -0.055, 0).applyMatrix4(_b);
    halo(dHalo, idx, _w.x, _w.y, _w.z, giro, cor, 0.25 + 0.75 * brilho);
  }
  function esconderDrone(idx) {
    for (const m of [dCorpo, dTopo, dLed, dHalo]) esconder(m, idx);
    esconder(dBraco, idx * 2);
    esconder(dBraco, idx * 2 + 1);
    for (let r = 0; r < 4; r++) esconder(dRotor, idx * 4 + r);
  }
  const piscar = (t, f, ph) => (reducedMotion ? 1 : Math.sin(t * f + ph) > 0.2 ? 1 : 0.15);

  function posicionar() {
    const k = kAtual;
    const t = tempo;
    const hy = heliY();

    // Enxame: decola do heliponto, voa livre e se junta nas formações.
    const fc = k < 1 ? { forma: FORMAS[0], w: suave(trecho(k, 0.88, 1)) } : cicloForma(tf);
    for (let i = 0; i < NS; i++) {
      const d = swarm[i];
      const e = suave(trecho(k, d.a, d.a + 0.07));
      if (e <= 0) {
        esconderDrone(i);
        continue;
      }
      const ang = d.ph + t * d.w;
      livre.set(
        d.hub.x + Math.cos(ang) * d.r,
        d.h + Math.sin(t * 1.3 + d.ph) * 0.18,
        d.hub.z + Math.sin(ang) * d.r * 0.75
      );
      // Decolagem: sai do heliponto subindo em arco.
      pos.set(HELI.x + Math.cos(d.ph) * 0.4, hy + 0.1, HELI.z + Math.sin(d.ph) * 0.4).lerp(livre, e);
      pos.y += Math.sin(e * PI) * 1.2;
      let cor = d.cor;
      const naForma = fc.w > 0 && i < fc.forma.pts.length;
      if (naForma) {
        pontoForma(fc.forma, i, alvo);
        // Pequeno tremor de pairar mesmo em formação.
        alvo.y += Math.sin(t * 2.1 + i) * 0.025;
        pos.lerp(alvo, fc.w);
        if (fc.w > 0.5) cor = fc.forma.cor[i % 2];
      }
      const w = naForma ? fc.w : 0;
      const yaw = w > 0.5 ? 0 : -ang;
      base(pos.x, pos.y, pos.z, yaw, Math.sin(t * 1.7 + d.ph) * 0.12 * (1 - w), 0, lerp(0.95, 0.4, w));
      const b = w > 0.5 ? 1 : piscar(t, d.pisca * 3, d.ph);
      montarDrone(i, cor, b, lerp(0.5, 0.6, w));
    }

    // Entregas: heliponto -> escola/prédio (com a caixa) -> volta vazio.
    for (let n = 0; n < NE; n++) {
      const idx = NS + n;
      const d = entregas[n];
      const e = suave(trecho(k, d.a, d.a + 0.08));
      if (e <= 0) {
        esconderDrone(idx);
        esconder(caixas, n);
        esconder(fitas, n);
        continue;
      }
      const padX = HELI.x + d.pad[0];
      const padZ = HELI.z + d.pad[1];
      const ciclo = t / d.per + d.fase;
      const volta = Math.floor(ciclo);
      const u = ciclo - volta;
      const A = ALVOS[(n * 3 + volta) % ALVOS.length];
      let s; // 0 = no heliponto, 1 = no alvo
      let baixa = 0;
      let comCaixa = true;
      if (u < 0.08) s = 0;
      else if (u < 0.45) s = suave((u - 0.08) / 0.37);
      else if (u < 0.55) {
        s = 1;
        baixa = Math.sin(((u - 0.45) / 0.1) * PI) * 0.35;
        comCaixa = u < 0.5;
      } else if (u < 0.92) {
        s = 1 - suave((u - 0.55) / 0.37);
        comCaixa = false;
      } else {
        s = 0;
        comCaixa = u > 0.96;
      }
      const cruzeiro = Math.max(hy, A.y) + 1.3;
      // Sobe antes de sair de lado (o pináculo da torre fica ao lado das baias).
      const hs = s * s;
      pos.set(
        lerp(padX, A.x, hs),
        quad(hy + 0.25, cruzeiro, cruzeiro, A.y, s) - baixa,
        lerp(padZ, A.z, hs)
      );
      // Entrada: sobe do heliponto para o ciclo.
      if (e < 1) pos.set(lerp(padX, pos.x, e), lerp(hy + 0.25, pos.y, e), lerp(padZ, pos.z, e));
      const indo = u < 0.5;
      const yaw = Math.atan2(-(A.z - padZ), A.x - padX) + (indo ? 0 : PI);
      const emVoo = s > 0.02 && s < 0.98 ? 0.18 : 0;
      base(pos.x, pos.y, pos.z, yaw, 0, -emVoo, 1.6);
      montarDrone(idx, d.cor, piscar(t, 6, n), 0.55);
      if (comCaixa) {
        por(caixas, n, L_CAIXA);
        por(fitas, n, L_FITA);
        fitas.setColorAt(n, n % 2 ? cores.ciano : cores.magenta);
      } else {
        esconder(caixas, n);
        esconder(fitas, n);
      }
    }

    // Patrulhas com holofote varrendo o chão.
    for (let n = 0; n < NP; n++) {
      const idx = NS + NE + n;
      const p = patrulhas[n];
      const e = suave(trecho(k, p.a, p.a + 0.08));
      if (e <= 0) {
        esconderDrone(idx);
        esconder(cones, n);
        esconder(focos, n * 2);
        esconder(focos, n * 2 + 1);
        continue;
      }
      const ang = p.ph + t * p.w;
      pos.set(p.c.x + Math.cos(ang) * p.rx, p.h + (1 - e) * 2.5, p.c.z + Math.sin(ang) * p.rz);
      base(pos.x, pos.y, pos.z, -ang, 0, 0, 2.2);
      // Strobo vermelho/branco das patrulhas.
      const strobo = reducedMotion ? 1 : (t * 1.6 + n * 0.3) % 1 < 0.12 ? 1 : 0.3;
      montarDrone(idx, strobo > 0.5 && !reducedMotion ? white : cores.ciano, strobo, 0.8);
      // Ponto do chão iluminado: varre ao redor da projeção do drone.
      alvo.set(
        pos.x + Math.sin(t * 0.9 + p.ph) * 1.5,
        0.03,
        pos.z + 0.6 + Math.cos(t * 0.55 + p.ph * 1.3) * 1.1
      );
      _v.subVectors(alvo, pos);
      const len = _v.length();
      _v.divideScalar(len);
      _q.setFromUnitVectors(_w.set(0, -1, 0), _v);
      const r = len * 0.2;
      cones.setMatrixAt(n, _m.compose(_s.copy(pos).addScaledVector(_v, 0.12), _q, _p.set(r, len, r)));
      cones.setColorAt(n, _c.copy(mix(cores.ciano, white, 0.4)).multiplyScalar(0.32 * e));
      const tam = r * 2.6;
      focos.setMatrixAt(n * 2, _m.compose(_p.copy(alvo), _q.identity(), _s.set(tam, 1, tam * 0.8)));
      focos.setColorAt(n * 2, _c.copy(mix(cores.ciano, white, 0.55)).multiplyScalar(0.75 * e));
      focos.setMatrixAt(n * 2 + 1, _m.compose(_p.copy(alvo).setY(0.035), _q.identity(), _s.set(tam * 0.45, 1, tam * 0.36)));
      focos.setColorAt(n * 2 + 1, _c.copy(white).multiplyScalar(0.6 * e));
    }

    // Carros: chegam pela borda de onde vêm e entram na faixa.
    for (let i = 0; i < NC; i++) {
      const c = carros[i];
      const e = suave(trecho(k, c.a, c.a + 0.1));
      if (e <= 0) {
        esconderCarro(i);
        continue;
      }
      const fx = FAIXAS[c.f];
      let x = wrap(c.x0 + c.dir * c.v * t);
      x -= c.dir * (1 - e) ** 2 * 14;
      const y = fx.y + (1 - e) * 1.4 + Math.sin(t * 1.6 + c.ph) * 0.05;
      base(x, y, c.z, c.dir > 0 ? 0 : PI, Math.sin(t * 1.1 + c.ph) * 0.04 + (1 - e) * 0.25 * c.dir, (1 - e) * -0.15, 1.15);
      montarCarro(i, c, e);
    }

    // Ônibus escolar (faixa do meio, sentido leste).
    const eb = suave(trecho(k, BUS.a, BUS.a + 0.1));
    onibus.visible = eb > 0;
    if (onibus.visible) {
      const x = wrap(BUS.x0 + BUS.v * t) - (1 - eb) ** 2 * 14;
      onibus.position.set(x, BUS.y + (1 - eb) * 1.5 + Math.sin(t * 1.2) * 0.04, BUS.z);
      onibus.rotation.z = Math.sin(t * 0.9) * 0.015;
      onibus.updateMatrix();
      _b.copy(onibus.matrix);
      B_FRISOS.forEach((L, n) => por(bFrisos, n, L));
      B_LUZES.forEach(([L, cor], n) => {
        por(bLuz, n, L);
        bLuz.setColorAt(n, cor);
      });
      B_RASTROS.forEach((L, n) => {
        por(bRastro, n, L);
        bRastro.setColorAt(n, _c.copy(n === 2 ? corFeixe : cores.ambar).multiplyScalar((n === 2 ? 0.35 : 0.8) * eb));
      });
    }

    // Dirigível: chega devagar pelo oeste e cruza o céu do norte.
    const ed = suave(trecho(k, DIR.a, DIR.a + 0.16));
    dirigivel.visible = ed > 0;
    if (dirigivel.visible) {
      const vaivem = reducedMotion ? 0 : Math.sin(t * 0.045) * 4;
      dirigivel.position.set(DIR.x0 + vaivem - (1 - ed) * 9, DIR.y + Math.sin(t * 0.5) * 0.08, DIR.z);
      dirigivel.rotation.y = reducedMotion ? 0 : Math.cos(t * 0.045) * 0.05;
      const n = reducedMotion ? 0 : Math.floor(t / 4) % TEXTOS.length;
      if (telaMat.map !== TEXTOS[n]) telaMat.map = TEXTOS[n];
      navVermelho.visible = navVerde.visible = reducedMotion || Math.sin(t * 3) > 0;
    }

    for (const m of [dCorpo, dTopo, dBraco, dRotor, dLed, dHalo, caixas, fitas, cones, focos, cCorpo, cCabine, cPod, cLuz, cHalo, cRastro, bFrisos, bLuz, bRastro]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }

  function montarCarro(i, c, e) {
    por(cCorpo, i, L_CARRO);
    por(cCabine, i, L_CARRO);
    por(cPod, i * 2, L_POD[0]);
    por(cPod, i * 2 + 1, L_POD[1]);
    L_LUZES.forEach(([L, tipo], n) => {
      por(cLuz, i * NL + n, L);
      const cor = tipo === "farol" ? corFarol : tipo === "lanterna" ? corLanterna : c.neon;
      cLuz.setColorAt(i * NL + n, cor);
    });
    por(cHalo, i, L_HALO_C);
    cHalo.setColorAt(i, _c.copy(c.neon).multiplyScalar(0.95 * e));
    L_RASTROS.forEach((L, n) => {
      por(cRastro, i * 3 + n, L);
      cRastro.setColorAt(i * 3 + n, _c.copy(n === 2 ? corFeixe : c.neon).multiplyScalar((n === 2 ? 0.3 : 0.85) * e));
    });
  }
  function esconderCarro(i) {
    esconder(cCorpo, i);
    esconder(cCabine, i);
    esconder(cPod, i * 2);
    esconder(cPod, i * 2 + 1);
    for (let n = 0; n < NL; n++) esconder(cLuz, i * NL + n);
    esconder(cHalo, i);
    for (let n = 0; n < 3; n++) esconder(cRastro, i * 3 + n);
  }

  function setProgress(k) {
    kAtual = k;
    grupo.visible = k > 0;
    if (k <= 0) return;
    if (k < 1) tf = 2;
    acharHeliponto();
    posicionar();
  }

  function update(t, dt, k) {
    if (reducedMotion) return;
    tempo = t;
    kAtual = k;
    if (k >= 1) tf += dt;
    else tf = 2;
    posicionar();
  }

  return { setProgress, update };
}
