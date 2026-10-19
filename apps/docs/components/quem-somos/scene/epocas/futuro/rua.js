// Vila 2030 — módulo "rua": o chão da cidade cyberpunk (ver futuro/index.js).
//
// O que acontece no chão enquanto a época é construída (janela k 0,08–0,55):
//   0,08–0,30  a chuva deixa poças: espelhos escuros com o neon refletido
//              em riscos coloridos (crescem uma a uma)
//   0,12–0,36  as faixas de LED do meio-fio são "desenhadas" a partir do
//              cruzamento da rua principal (x14–15, y8), ciano de um lado e
//              magenta do outro, com uma faísca branca na ponta; as setas do
//              chão acendem quando a faixa passa por elas
//   0,16–0,34  máquina de guaraná e quiosque de tacacá sobem do subsolo
//   0,24–0,47  postes cyber: tubo neon sobe pelo poste, pisca e firma; halo
//              no chão; o banco ao lado liga a fita de LED junto
//   0,30–0,40  grades de ventilação acendem por baixo e começam a soltar vapor
//   0,38–0,52  cabos com lampadinhas esticados entre os postes
//   0,40–0,50  telas da máquina e do quiosque dão boot
//   0,44–0,55  faixas de pedestre holográficas nos dois cruzamentos
//
// Tudo é só visual (nada colide) e sem luz real: brilho = MeshBasicMaterial
// sem tone mapping + planos aditivos. Posições lidas do mapa de vila-engine.js.
import * as THREE from "three";
import { trecho, assentar } from "../comum";
import { LAMP_SOUTH_OFFSET } from "../../props";

const suave = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;
// Ruído fixo por índice (mesmo k = mesma cena).
const ruido = (n) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// ---- Mapa (cópia só de leitura de buildMap em vila-engine.js) ----------------
const CAMINHOS = [
  [3, 8, 26, 8],
  [6, 7, 6, 7],
  [14, 8, 15, 21],
  [11, 16, 26, 16],
  [17, 15, 17, 15],
  [23, 15, 23, 15],
  [12, 6, 13, 7],
  [10, 16, 10, 16], // portão do jardim
];
const PREDIOS = [
  [3, 3, 8, 6],
  [16, 11, 20, 14],
  [22, 11, 26, 14],
  [11, 2, 14, 5],
  [16, 3, 19, 5], // laboratório de ML
];
const POSTES = [
  [5, 9], [10, 9], [17, 7], [24, 7], [13, 13], [13, 17], [16, 17], [21, 17], [27, 17],
];
const BANCOS = [
  { x: 13, y: 11, rot: Math.PI / 2 },
  { x: 16, y: 18, rot: -Math.PI / 2 },
  { x: 25, y: 17, rot: 0 },
];
// Cabos entre postes (índices em POSTES), do que liga primeiro ao outro.
const CABOS = [
  [1, 0], [2, 3], [4, 5], [5, 6], [6, 7], [7, 8],
];
// Grades de ventilação (sobre a calçada, rentes ao piso).
const GRADES = [[8, 8], [20, 8], [15, 13], [22, 16], [14, 19]];
// Setas no chão: [x, z do centro em tiles (pode ser meio tile), dx, dz].
const SETAS = [
  [5, 8, -1, 0], [9, 8, -1, 0], [18, 8, 1, 0], [23, 8, 1, 0],
  [15, 11, 0, 1], [15, 14.6, 0, 1], [15, 19.6, 0, 1],
  [12, 16, -1, 0], [18.5, 16, 1, 0], [25, 16, 1, 0],
];
const ORIGEM = [[14, 8], [15, 8]];

export function createRua({ scene, pal, track, tileToWorld, reducedMotion = false, cores, kit }) {
  const { pv, mix } = pal;
  const { box, mat } = kit;
  const grupo = new THREE.Group();
  grupo.visible = false;
  scene.add(grupo);

  // ---- Utilitários --------------------------------------------------------------
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const eu = new THREE.Euler();
  const vp = new THREE.Vector3();
  const vs = new THREE.Vector3();
  const cor = new THREE.Color();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function poe(mesh, i, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) {
    q.setFromEuler(eu.set(rx, ry, rz));
    m4.compose(vp.set(x, y, z), q, vs.set(Math.max(sx, 1e-4), Math.max(sy, 1e-4), Math.max(sz, 1e-4)));
    mesh.setMatrixAt(i, m4);
  }
  const esconde = (mesh, i) => mesh.setMatrixAt(i, ZERO);
  function inst(geo, material, n, pai = grupo) {
    const m = track(new THREE.InstancedMesh(geo, material, Math.max(n, 1)));
    m.frustumCulled = false;
    m.castShadow = false;
    m.receiveShadow = false;
    for (let i = 0; i < n; i++) {
      esconde(m, i);
      m.setColorAt(i, cor.setRGB(1, 1, 1));
    }
    pai.add(m);
    return m;
  }
  const sujo = (...ms) => {
    for (const m of ms) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  };
  // Mancha radial (alfa e cor caem do centro): halos e reflexos.
  function textura(n, fn) {
    const d = new Uint8Array(n * n * 4);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const u = ((x + 0.5) / n) * 2 - 1;
        const v = ((y + 0.5) / n) * 2 - 1;
        const a = Math.round(255 * Math.min(1, Math.max(0, fn(u, v))));
        const i = (y * n + x) * 4;
        d[i] = d[i + 1] = d[i + 2] = d[i + 3] = a;
      }
    const t = track(new THREE.DataTexture(d, n, n));
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  }
  const texHalo = textura(64, (u, v) => (1 - Math.hypot(u, v)) ** 2);
  // Risco de reflexo: estreito no x, comprido e mais forte perto da fonte.
  const texRisco = textura(64, (u, v) => (1 - Math.min(1, Math.abs(u))) ** 2.2 * (1 - Math.abs(v)) ** 0.8);
  // Poça: borda irregular (alfa duro com leve degradê).
  const texPoca = textura(96, (u, v) => {
    const r = Math.hypot(u, v);
    const th = Math.atan2(v, u);
    const borda = 0.78 + 0.1 * Math.sin(3 * th + 0.7) + 0.06 * Math.sin(5 * th + 2.1) + 0.03 * Math.sin(9 * th);
    return (borda - r) / 0.08;
  });
  const aditivo = (map, opacity = 1) =>
    track(
      new THREE.MeshBasicMaterial({
        map,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      })
    );
  const brilho = () => track(new THREE.MeshBasicMaterial({ toneMapped: false }));
  const plano = track(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  const PISO = 0.034; // topo das placas de calçada (scene/ground.js)
  const MEIO_FIO = 0.057; // topo do meio-fio

  const ciano = cores.ciano;
  const magenta = cores.magenta;
  const violeta = cores.violeta;
  const ambar = cores.ambar;
  const branco = cores.branco;
  const NEONS = [ciano, magenta, violeta, ambar];
  const roxoCeu = mix(cores.roxo, ciano, 0.25);

  // ---- Distância de cada tile de calçada até o cruzamento (BFS) ------------------
  const chave = (x, y) => `${x},${y}`;
  const ehCaminho = new Set();
  for (const [x0, y0, x1, y1] of CAMINHOS) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) ehCaminho.add(chave(x, y));
  const ehPredio = (x, y) => PREDIOS.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
  const dist = new Map();
  const fila = [];
  for (const [x, y] of ORIGEM) {
    dist.set(chave(x, y), 0);
    fila.push([x, y]);
  }
  while (fila.length) {
    const [x, y] = fila.shift();
    const d = dist.get(chave(x, y));
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const k = chave(x + dx, y + dy);
      if (ehCaminho.has(k) && !dist.has(k)) {
        dist.set(k, d + 1);
        fila.push([x + dx, y + dy]);
      }
    }
  }
  const dDe = (x, y) => dist.get(chave(x, y));
  const D_MAX = Math.max(...dist.values()) + 1;
  // A frente de luz percorre as calçadas: distância (em tiles) acesa em k.
  const frente = (k) => trecho(k, 0.12, 0.36) * D_MAX;
  const wx = (x) => x - 15; // borda oeste do tile x
  const wz = (y) => y - 12; // borda norte do tile y

  // ---- Faixas de LED no meio-fio --------------------------------------------------
  // Cada borda de calçada que encosta em grama/mato vira um trecho de LED de
  // 1 tile; cresce a partir da ponta mais perto do cruzamento.
  const bordas = [];
  for (const k of ehCaminho) {
    const [x, y] = k.split(",").map(Number);
    const d = dDe(x, y);
    const lados = [
      [0, -1, true],
      [0, 1, true],
      [-1, 0, false],
      [1, 0, false],
    ];
    for (const [dx, dy, horiz] of lados) {
      const nx = x + dx;
      const ny = y + dy;
      if (ehCaminho.has(chave(nx, ny)) || ehPredio(nx, ny)) continue;
      const IN = 0.0375;
      // Pontos A (oeste/norte) e B (leste/sul) da borda, em mundo.
      let ax, az, bx, bz;
      if (horiz) {
        const z = dy < 0 ? wz(y) + IN : wz(y + 1) - IN;
        ax = wx(x) + 0.02;
        bx = wx(x + 1) - 0.02;
        az = bz = z;
      } else {
        const xx = dx < 0 ? wx(x) + IN : wx(x + 1) - IN;
        az = wz(y) + 0.02;
        bz = wz(y + 1) - 0.02;
        ax = bx = xx;
      }
      // De onde cresce: do vizinho (ao longo da borda) mais perto da origem.
      const dA = horiz ? dDe(x - 1, y) : dDe(x, y - 1);
      const dB = horiz ? dDe(x + 1, y) : dDe(x, y + 1);
      const modo = dA !== undefined && dA < d ? "a" : dB !== undefined && dB < d ? "b" : "meio";
      // Lado "frio" (norte/oeste) ciano, "quente" (sul/leste) magenta.
      const c = dx < 0 || dy < 0 ? ciano : magenta;
      bordas.push({ ax, az, bx, bz, horiz, d0: d - 0.5, modo, c });
    }
  }
  const NB = bordas.length;
  const fita = inst(box, brilho(), NB);
  const fitaHalo = inst(plano, aditivo(texHalo, 0.5), NB);
  const pincel = inst(box, brilho(), NB);
  bordas.forEach((b, i) => {
    fita.setColorAt(i, b.c);
    fitaHalo.setColorAt(i, b.c);
  });

  // ---- Setas no chão ------------------------------------------------------------
  const setaMat = aditivo(null, 0.9);
  const setaGeo = track(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  const setas = inst(setaGeo, setaMat, SETAS.length * 6);
  const SETA_L = 0.2;
  const SETA_A = 0.8;
  const setasD = SETAS.map(([x, y]) => (dDe(Math.round(x), Math.round(y)) ?? 4) + 0.3);

  // ---- Poças --------------------------------------------------------------------
  // Água parada "espelha" o céu roxo: tom fixo (sem luz), mais escuro que a
  // calçada iluminada; os riscos aditivos por cima fazem o neon refletido.
  const poMat = track(
    new THREE.MeshBasicMaterial({
      color: mix(cores.noite, cores.asfalto, 0.5).multiplyScalar(0.7),
      transparent: true,
      opacity: 0.82,
      alphaMap: texPoca,
      depthWrite: false,
      toneMapped: false,
    })
  );
  const pocas = [];
  [...ehCaminho]
    .map((k) => k.split(",").map(Number))
    .filter(([x, y]) => x >= 3 && x <= 26 && y <= 20)
    .forEach(([x, y], i) => {
      const r = ruido(x * 31 + y * 17);
      if (r > 0.3) return;
      if (GRADES.some(([gx, gy]) => gx === x && gy === y)) return;
      if ((x === 14 || x === 15) && (y === 8 || y === 16)) return; // faixas de pedestre
      if (SETAS.some(([sx, sy]) => Math.floor(sx) === x && Math.floor(sy) === y)) return;
      const w = 0.42 + ruido(i + 3) * 0.4;
      const h = 0.3 + ruido(i + 9) * 0.25;
      pocas.push({
        x: wx(x) + 0.5 + (ruido(i + 5) - 0.5) * 0.3,
        z: wz(y) + 0.5 + (ruido(i + 7) - 0.5) * 0.3,
        w,
        h,
        ry: (ruido(i + 11) - 0.5) * 1.2,
        a: 0.08 + ruido(i + 13) * 0.17,
        // Reflexos: 2 riscos de neon por poça.
        riscos: [0, 1].map((j) => ({
          ox: (ruido(i * 3 + j) - 0.5) * w * 0.55,
          oz: (ruido(i * 5 + j) - 0.5) * h * 0.2,
          c: j ? NEONS[Math.floor(ruido(i * 7 + j * 3) * NEONS.length)] : (x + y) % 2 ? ciano : magenta,
          l: h * (0.75 + ruido(i + j * 13) * 0.2),
          e: 0.07 + ruido(i * 11 + j) * 0.08,
          f: 0.75 + ruido(i * 13 + j) * 0.25,
        })),
      });
    });
  const poca = inst(plano, poMat, pocas.length);
  const pocaBrilho = inst(plano, aditivo(texHalo, 0.5), pocas.length);
  const reflexoMat = aditivo(texRisco, 1);
  const reflexo = inst(plano, reflexoMat, pocas.length * 2);

  // ---- Postes cyber ---------------------------------------------------------------
  const postes = POSTES.map(([x, y], i) => {
    const p = tileToWorld(x, y);
    p.z += LAMP_SOUTH_OFFSET;
    const d = Math.abs(x - 14.5) + Math.abs(y - 8);
    return { p, d, i };
  });
  [...postes].sort((a, b) => a.d - b.d).forEach((po, n) => {
    po.a = 0.24 + n * 0.022;
    po.c = n % 2 ? magenta : ciano;
    po.c2 = n % 2 ? ciano : magenta;
  });
  const cil = track(new THREE.CylinderGeometry(1, 1, 1, 8));
  const tuboMat = brilho();
  const tubo = inst(cil, tuboMat, postes.length);
  const tuboHalo = inst(cil, aditivo(null, 0.22), postes.length);
  const suporte = inst(box, mat(mix(pv("gray-800"), pv("gray-900"), 0.4), { roughness: 0.4, metalness: 0.5 }), postes.length * 3);
  const anel = inst(track(new THREE.TorusGeometry(1, 0.14, 6, 24)), brilho(), postes.length * 2);
  const haloChao = inst(plano, aditivo(texHalo, 0.6), postes.length);
  postes.forEach((po, i) => {
    tubo.setColorAt(i, po.c);
    tuboHalo.setColorAt(i, po.c);
    haloChao.setColorAt(i, po.c);
    anel.setColorAt(i * 2, po.c2);
    anel.setColorAt(i * 2 + 1, po.c);
  });
  const TUBO_Y0 = 0.2;
  const TUBO_Y1 = 0.9;
  const TUBO_X = 0.055;
  // Liga com tremida: 0 apagado, 1 firme. Determinístico em k.
  function ligado(k, a, semente) {
    const sobe = trecho(k, a, a + 0.025);
    if (sobe < 1) return { sobe, luz: 0 };
    const pisca = trecho(k, a + 0.025, a + 0.055);
    if (pisca >= 1 || reducedMotion) return { sobe, luz: 1 };
    const on = ruido(Math.floor(k * 420) + semente * 37) > 0.4 + pisca * 0.3;
    return { sobe, luz: on ? 0.55 + pisca * 0.45 : 0.08 };
  }

  // ---- Bancos com LED -------------------------------------------------------------
  const bancos = BANCOS.map((b) => {
    const p = tileToWorld(b.x, b.y);
    let melhor = postes[0];
    for (const po of postes) if (po.p.distanceTo(p) < melhor.p.distanceTo(p)) melhor = po;
    return { ...b, p, poste: melhor };
  });
  const bancoLed = inst(box, brilho(), bancos.length * 2);
  const bancoHalo = inst(plano, aditivo(texHalo, 0.5), bancos.length);
  bancos.forEach((b, i) => {
    bancoLed.setColorAt(i * 2, b.poste.c);
    bancoLed.setColorAt(i * 2 + 1, b.poste.c);
    bancoHalo.setColorAt(i, b.poste.c);
  });
  const local = new THREE.Vector3();
  // Ponto local do banco (x ao longo do assento, z para a frente) em mundo.
  const noBanco = (b, lx, lz) => {
    const c = Math.cos(b.rot);
    const s = Math.sin(b.rot);
    return local.set(b.p.x + lx * c + lz * s, 0, b.p.z - lx * s + lz * c);
  };

  // ---- Cabos com lampadinhas --------------------------------------------------------
  const caboMat = mat(mix(pv("gray-900"), cores.noite, 0.4), { roughness: 0.6 });
  const RAD = 4;
  const SEG = 28;
  const lampadinhaGeo = track(new THREE.IcosahedronGeometry(1, 0));
  const cabos = CABOS.map(([ia, ib]) => {
    const A = postes[ia].p.clone().setY(1.12);
    const B = postes[ib].p.clone().setY(1.12);
    const len = A.distanceTo(B);
    const flecha = 0.14 + len * 0.025;
    const pts = [];
    for (let n = 0; n <= 12; n++) {
      const u = n / 12;
      pts.push(new THREE.Vector3(lerp(A.x, B.x, u), 1.12 - flecha * 4 * u * (1 - u), lerp(A.z, B.z, u)));
    }
    const curva = new THREE.CatmullRomCurve3(pts);
    const geo = track(new THREE.TubeGeometry(curva, SEG, 0.009, RAD, false));
    const m = new THREE.Mesh(geo, caboMat);
    m.castShadow = false;
    grupo.add(m);
    const a = Math.max(postes[ia].a, postes[ib].a) + 0.06;
    return { m, geo, curva, n: Math.max(4, Math.round(len * 2.4)), a: Math.min(a, 0.47) };
  });
  const NL = cabos.reduce((s, c) => s + c.n, 0);
  const lampadinha = inst(lampadinhaGeo, brilho(), NL);
  const lampCor = [];
  {
    let i = 0;
    cabos.forEach((cb, ci) => {
      cb.i0 = i;
      for (let n = 0; n < cb.n; n++, i++) lampCor.push(NEONS[(n + ci) % NEONS.length]);
    });
  }
  const pCurva = new THREE.Vector3();

  // ---- Grades de ventilação com vapor -------------------------------------------------
  const grades = GRADES.map(([x, y], i) => {
    const p = tileToWorld(x, y);
    // Rua de mão única (horizontal) ou coluna (vertical): grade atravessada.
    const horiz = !ehCaminho.has(chave(x, y - 1)) || !ehCaminho.has(chave(x, y + 1));
    return { p, ry: horiz ? 0 : Math.PI / 2, a: 0.3 + i * 0.02, c: i % 2 ? magenta : ambar, d: dDe(x, y) };
  });
  const GRADE_RIPAS = 6;
  const gradeMetal = inst(box, mat(mix(pv("gray-800"), pv("gray-900"), 0.5), { roughness: 0.45, metalness: 0.6 }), grades.length * (GRADE_RIPAS + 4));
  const gradeFundo = inst(plano, aditivo(texHalo, 0.85), grades.length);
  const gradeChao = inst(plano, aditivo(texHalo, 0.35), grades.length);
  grades.forEach((g, i) => {
    gradeFundo.setColorAt(i, g.c);
    gradeChao.setColorAt(i, g.c);
  });
  const NV = 14;
  const vaporMat = track(
    new THREE.MeshBasicMaterial({ color: mix(violeta, branco, 0.65), transparent: true, opacity: 0.07, depthWrite: false })
  );
  const vapor = inst(track(new THREE.IcosahedronGeometry(1, 1)), vaporMat, reducedMotion ? 0 : grades.length * NV);
  vapor.visible = !reducedMotion;
  let vaporForca = 0;

  // ---- Máquina de guaraná e quiosque de tacacá ---------------------------------------
  const fonte = pal.font || "sans-serif";
  function tela(w, h, desenha) {
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    desenha(cv.getContext("2d"), w, h);
    const t = track(new THREE.CanvasTexture(cv));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  const css = (c, l = 0) => c.clone().offsetHSL(0, 0, l).getStyle();
  const fundoTela = cores.noite.clone().offsetHSL(0, 0, -0.03);
  // Frente da máquina: letreiro, vitrine 3×4 de latas e o leitor de pagamento.
  const texMaquina = tela(256, 512, (g, w, h) => {
    g.fillStyle = css(fundoTela);
    g.fillRect(0, 0, w, h);
    g.fillStyle = css(magenta, -0.1);
    g.fillRect(14, 14, w - 28, 74);
    g.fillStyle = css(branco);
    g.font = `700 40px ${fonte}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("GUARANÁ", w / 2, 53);
    // Vitrine.
    g.fillStyle = css(cores.asfalto, 0.04);
    g.fillRect(14, 104, w - 28, 268);
    const latas = [ciano, magenta, ambar, cores.verde];
    for (let r = 0; r < 4; r++) {
      g.fillStyle = css(ciano, -0.25);
      g.fillRect(20, 160 + r * 64, w - 40, 4);
      for (let c = 0; c < 3; c++) {
        g.fillStyle = css(latas[(r + c) % latas.length]);
        g.fillRect(34 + c * 66, 116 + r * 64, 38, 44);
        g.fillStyle = css(branco);
        g.fillRect(34 + c * 66, 122 + r * 64, 38, 5);
      }
    }
    // Teclado e preço.
    g.fillStyle = css(ciano, -0.05);
    g.font = `700 30px ${fonte}`;
    g.fillText("R$ 2,30", w / 2 - 30, 404);
    g.fillStyle = css(cores.asfalto, 0.1);
    g.fillRect(170, 386, 64, 36);
    g.fillStyle = css(cores.verde);
    g.fillRect(180, 396, 44, 6);
    g.fillStyle = css(cores.asfalto, 0.08);
    g.fillRect(40, 440, w - 80, 46);
    g.fillStyle = css(ambar, -0.2);
    g.fillRect(48, 448, w - 96, 8);
  });
  // Cardápio do quiosque.
  const texQuiosque = tela(512, 192, (g, w, h) => {
    g.fillStyle = css(fundoTela);
    g.fillRect(0, 0, w, h);
    g.strokeStyle = css(ciano);
    g.lineWidth = 6;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = css(ambar);
    g.font = `700 64px ${fonte}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("TACACÁ", w / 2, 70);
    g.fillStyle = css(ciano);
    g.font = `600 34px ${fonte}`;
    g.fillText("24H · DESDE 1992", w / 2, 140);
  });
  const corpoMat = mat(mix(cores.asfalto, pv("gray-700"), 0.25), { roughness: 0.35, metalness: 0.55 });
  const corpoClaro = mat(mix(pv("gray-600"), cores.asfalto, 0.4), { roughness: 0.4, metalness: 0.5 });
  const telaMaquinaMat = track(new THREE.MeshBasicMaterial({ map: texMaquina, toneMapped: false, color: cor.setRGB(0, 0, 0).clone() }));
  const telaQuiosqueMat = track(new THREE.MeshBasicMaterial({ map: texQuiosque, toneMapped: false, color: cor.setRGB(0, 0, 0).clone(), side: THREE.DoubleSide }));
  const telaGeo = track(new THREE.PlaneGeometry(1, 1));
  const peca = (geo, material, [sx, sy, sz], [x, y, z], pai, sombra = true) => {
    const m = new THREE.Mesh(geo, material);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    m.castShadow = sombra;
    m.receiveShadow = sombra;
    pai.add(m);
    return m;
  };
  const neonMagenta = track(new THREE.MeshBasicMaterial({ color: magenta.clone(), toneMapped: false }));
  const neonCiano = track(new THREE.MeshBasicMaterial({ color: ciano.clone(), toneMapped: false }));
  const neonAmbar = track(new THREE.MeshBasicMaterial({ color: ambar.clone(), toneMapped: false }));
  const neonsMoveis = [neonMagenta, neonCiano, neonAmbar];
  const corNeon = new Map(neonsMoveis.map((m) => [m, m.color.clone()]));

  // Máquina (tile 25,7, na beira do rio — de frente para a rua principal).
  const maquina = new THREE.Group();
  maquina.position.copy(tileToWorld(25, 7)).add(new THREE.Vector3(0, 0, 0.12));
  grupo.add(maquina);
  const maqCorpo = new THREE.Group();
  maquina.add(maqCorpo);
  peca(box, corpoMat, [0.5, 0.9, 0.36], [0, 0.45, 0], maqCorpo);
  peca(box, corpoClaro, [0.54, 0.05, 0.4], [0, 0.925, 0], maqCorpo);
  peca(box, corpoClaro, [0.52, 0.05, 0.38], [0, 0.025, 0], maqCorpo);
  peca(telaGeo, telaMaquinaMat, [0.42, 0.82, 1], [0, 0.47, 0.181], maqCorpo, false);
  peca(box, neonMagenta, [0.018, 0.86, 0.018], [-0.245, 0.46, 0.18], maqCorpo, false);
  peca(box, neonMagenta, [0.018, 0.86, 0.018], [0.245, 0.46, 0.18], maqCorpo, false);
  peca(box, neonCiano, [0.5, 0.018, 0.018], [0, 0.905, 0.19], maqCorpo, false);
  // Quiosque (tile 23,7): balcão, toldo inclinado com neon e cardápio no alto.
  const quiosque = new THREE.Group();
  quiosque.position.copy(tileToWorld(23, 7)).add(new THREE.Vector3(0, 0, 0.05));
  grupo.add(quiosque);
  const qCorpo = new THREE.Group();
  quiosque.add(qCorpo);
  peca(box, corpoMat, [0.86, 0.5, 0.42], [0, 0.25, -0.02], qCorpo);
  peca(box, corpoClaro, [0.92, 0.04, 0.5], [0, 0.52, 0.02], qCorpo);
  peca(box, neonAmbar, [0.9, 0.02, 0.02], [0, 0.5, 0.27], qCorpo, false);
  peca(box, corpoMat, [0.05, 0.5, 0.05], [-0.4, 0.78, -0.18], qCorpo);
  peca(box, corpoMat, [0.05, 0.5, 0.05], [0.4, 0.78, -0.18], qCorpo);
  const toldo = peca(box, corpoClaro, [0.98, 0.035, 0.52], [0, 1.04, 0.0], qCorpo);
  toldo.rotation.x = 0.28;
  const toldoNeon = peca(box, neonMagenta, [0.98, 0.02, 0.02], [0, 0.965, 0.255], qCorpo, false);
  toldoNeon.rotation.x = 0.28;
  peca(telaGeo, telaQuiosqueMat, [0.8, 0.3, 1], [0, 1.27, -0.12], qCorpo, false).rotation.x = -0.12;
  // Panelas fumegando no balcão (cúpulas) e banquinhos.
  const panela = track(new THREE.CylinderGeometry(1, 1, 1, 12));
  peca(panela, corpoClaro, [0.08, 0.07, 0.08], [-0.2, 0.575, 0.05], qCorpo);
  peca(panela, corpoClaro, [0.08, 0.07, 0.08], [0.02, 0.575, 0.05], qCorpo);
  for (const sx of [-0.25, 0.25]) {
    peca(panela, corpoMat, [0.07, 0.26, 0.07], [sx, 0.13, 0.36], qCorpo);
    peca(panela, neonCiano, [0.085, 0.015, 0.085], [sx, 0.265, 0.36], qCorpo, false);
  }
  // Halos no chão na frente dos dois.
  const moveisHalo = inst(plano, aditivo(texHalo, 0.5), 2);
  moveisHalo.setColorAt(0, magenta);
  moveisHalo.setColorAt(1, ambar);

  // ---- Faixas de pedestre holográficas --------------------------------------------------
  // Nos dois cruzamentos da coluna central (x14–15) com as ruas (y8 e y16).
  const FAIXAS = [8, 16];
  const BARRAS = 7;
  const faixa = inst(plano, aditivo(null, 0.55), FAIXAS.length * BARRAS);
  const faixaBorda = inst(box, brilho(), FAIXAS.length * 2);
  let faixaLuz = 0;

  // ---- Progresso ------------------------------------------------------------------------
  let kAtual = 0;
  function setProgress(k) {
    kAtual = k;
    grupo.visible = k > 0;
    if (!grupo.visible) return;
    const F = frente(k);

    // Faixas de LED.
    bordas.forEach((b, i) => {
      const f = Math.min(1, Math.max(0, F - b.d0));
      if (f <= 0) {
        esconde(fita, i);
        esconde(fitaHalo, i);
        esconde(pincel, i);
        return;
      }
      let u0 = 0;
      let u1 = f;
      if (b.modo === "b") [u0, u1] = [1 - f, 1];
      else if (b.modo === "meio") [u0, u1] = [0.5 - f / 2, 0.5 + f / 2];
      const x0 = lerp(b.ax, b.bx, u0);
      const x1 = lerp(b.ax, b.bx, u1);
      const z0 = lerp(b.az, b.bz, u0);
      const z1 = lerp(b.az, b.bz, u1);
      const len = Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0));
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      if (b.horiz) {
        poe(fita, i, cx, MEIO_FIO + 0.008, cz, len, 0.016, 0.034);
        poe(fitaHalo, i, cx, PISO + 0.004, cz, len + 0.12, 1, 0.34);
      } else {
        poe(fita, i, cx, MEIO_FIO + 0.008, cz, 0.034, 0.016, len);
        poe(fitaHalo, i, cx, PISO + 0.004, cz, 0.34, 1, len + 0.12);
      }
      if (f < 1) {
        // Faísca na ponta que está "desenhando".
        const px = b.modo === "b" ? x0 : x1;
        const pz = b.modo === "b" ? z0 : z1;
        poe(pincel, i, px, MEIO_FIO + 0.02, pz, 0.05, 0.05, 0.05);
        if (b.modo === "meio") poe(pincel, i, (x0 + x1) / 2, MEIO_FIO + 0.02, (z0 + z1) / 2, 0.04, 0.04, 0.04);
      } else esconde(pincel, i);
    });
    sujo(fita, fitaHalo, pincel);

    // Setas: chevron triplo (">>>") que acende traço a traço quando a frente passa.
    SETAS.forEach(([x, y, dx, dz], i) => {
      const e = suave(trecho(F, setasD[i], setasD[i] + 1.4));
      const cx = wx(x) + 0.5;
      const cz = wz(y) + 0.5;
      const ry = Math.atan2(-dz, dx); // +x local = sentido da seta
      const cr = Math.cos(ry);
      const sr = Math.sin(ry);
      for (let j = 0; j < 3; j++) {
        const ej = trecho(e, j * 0.25, j * 0.25 + 0.5);
        for (const lado of [1, -1]) {
          const n = (i * 3 + j) * 2 + (lado > 0 ? 0 : 1);
          if (ej <= 0) {
            esconde(setas, n);
            continue;
          }
          // Braço do "V": ponta em (off, 0), abre para trás num ângulo SETA_A.
          const off = (j - 1) * 0.15 + 0.06;
          const lx = off - (SETA_L * Math.cos(SETA_A)) / 2;
          const lz = (lado * SETA_L * Math.sin(SETA_A)) / 2;
          poe(setas, n, cx + lx * cr + lz * sr, PISO + 0.006 + j * 0.0005, cz - lx * sr + lz * cr, SETA_L * ej, 1, 0.04, ry + lado * SETA_A);
          setas.setColorAt(n, cor.copy(j === 2 ? ciano : violeta).multiplyScalar(0.3 + 0.25 * j));
        }
      }
    });
    sujo(setas);

    // Poças: crescem uma a uma; reflexos acendem junto com a frente de neon.
    pocas.forEach((p, i) => {
      const e = suave(trecho(k, p.a, p.a + 0.07));
      if (e <= 0) {
        esconde(poca, i);
        esconde(pocaBrilho, i);
        esconde(reflexo, i * 2);
        esconde(reflexo, i * 2 + 1);
        return;
      }
      poe(poca, i, p.x, PISO + 0.002, p.z, p.w * e, 1, p.h * e, p.ry);
      const luz = 0.25 + 0.75 * trecho(k, 0.2, 0.45);
      poe(pocaBrilho, i, p.x, PISO + 0.003, p.z, p.w * e * 0.8, 1, p.h * e * 0.7, p.ry);
      pocaBrilho.setColorAt(i, cor.copy(roxoCeu).multiplyScalar(0.3 * e));
      p.riscos.forEach((r, j) => {
        const n = i * 2 + j;
        poe(reflexo, n, p.x + r.ox * e, PISO + 0.004, p.z + r.oz, r.e * e, 1, r.l * e, 0);
        reflexo.setColorAt(n, cor.copy(r.c).multiplyScalar(r.f * luz * e));
      });
    });
    sujo(poca, pocaBrilho, reflexo);

    // Postes.
    postes.forEach((po, i) => {
      const { sobe, luz } = ligado(k, po.a, i);
      const { x, z } = po.p;
      if (sobe <= 0) {
        esconde(tubo, i);
        esconde(tuboHalo, i);
        esconde(haloChao, i);
        esconde(anel, i * 2);
        esconde(anel, i * 2 + 1);
        for (let j = 0; j < 3; j++) esconde(suporte, i * 3 + j);
        po.luz = 0;
        return;
      }
      const s = assentar(sobe);
      const alt = (TUBO_Y1 - TUBO_Y0) * Math.min(1, s);
      poe(tubo, i, x + TUBO_X, TUBO_Y0 + alt / 2, z, 0.014, alt, 0.014);
      poe(tuboHalo, i, x + TUBO_X, TUBO_Y0 + alt / 2, z, 0.045 * (0.3 + luz * 0.7), alt + 0.06, 0.045 * (0.3 + luz * 0.7));
      tubo.setColorAt(i, cor.copy(po.c).multiplyScalar(0.18 + luz * 0.82));
      tuboHalo.setColorAt(i, cor.copy(po.c).multiplyScalar(luz));
      // Abraçadeiras ligando o tubo ao poste.
      [0.26, 0.55, 0.84].forEach((hy, j) => {
        if (hy <= TUBO_Y0 + alt) poe(suporte, i * 3 + j, x + TUBO_X / 2, hy, z, TUBO_X, 0.018, 0.022);
        else esconde(suporte, i * 3 + j);
      });
      // Anéis em volta da luminária antiga e na base.
      const ea = trecho(k, po.a + 0.02, po.a + 0.05);
      poe(anel, i * 2, x, 1.0, z, 0.105 * ea, 0.105 * ea, 0.105 * ea, 0, Math.PI / 2);
      poe(anel, i * 2 + 1, x, 0.13, z, 0.075 * ea, 0.075 * ea, 0.075 * ea, 0, Math.PI / 2);
      anel.setColorAt(i * 2, cor.copy(po.c2).multiplyScalar(0.2 + luz * 0.8));
      anel.setColorAt(i * 2 + 1, cor.copy(po.c).multiplyScalar(0.2 + luz * 0.8));
      poe(haloChao, i, x + 0.03, 0.045, z + 0.06, 1.0, 1, 1.0);
      haloChao.setColorAt(i, cor.copy(po.c).multiplyScalar(luz * 0.5));
      po.luz = luz;
    });
    sujo(tubo, tuboHalo, suporte, anel, haloChao);

    // Bancos acendem com o poste mais próximo.
    bancos.forEach((b, i) => {
      const luz = b.poste.luz || 0;
      const e = trecho(k, b.poste.a + 0.03, b.poste.a + 0.06);
      if (e <= 0) {
        esconde(bancoLed, i * 2);
        esconde(bancoLed, i * 2 + 1);
        esconde(bancoHalo, i);
        return;
      }
      let p = noBanco(b, 0, 0.19);
      poe(bancoLed, i * 2, p.x, 0.39, p.z, 0.82 * e, 0.016, 0.016, b.rot);
      p = noBanco(b, 0, -0.205);
      poe(bancoLed, i * 2 + 1, p.x, 0.7, p.z, 0.82 * e, 0.016, 0.016, b.rot);
      p = noBanco(b, 0, 0.12);
      poe(bancoHalo, i, p.x, 0.05, p.z, 1.15, 1, 0.75, b.rot);
      bancoLed.setColorAt(i * 2, cor.copy(b.poste.c).multiplyScalar(0.3 + 0.7 * luz));
      bancoLed.setColorAt(i * 2 + 1, cor.copy(b.poste.c).multiplyScalar(0.3 + 0.7 * luz));
      bancoHalo.setColorAt(i, cor.copy(b.poste.c).multiplyScalar(luz * e * 0.8));
    });
    sujo(bancoLed, bancoHalo);

    // Cabos: esticados do primeiro poste ao segundo; lampadinhas acendem atrás.
    cabos.forEach((cb) => {
      const e = suave(trecho(k, cb.a, cb.a + 0.05));
      cb.m.visible = e > 0;
      cb.geo.setDrawRange(0, Math.ceil(e * SEG) * RAD * 6);
      for (let n = 0; n < cb.n; n++) {
        const i = cb.i0 + n;
        const u = (n + 0.5) / cb.n;
        const el = trecho(e, u, u + 0.08);
        if (el <= 0) {
          esconde(lampadinha, i);
          continue;
        }
        cb.curva.getPointAt(u, pCurva);
        poe(lampadinha, i, pCurva.x, pCurva.y - 0.035, pCurva.z, 0.022 * el, 0.028 * el, 0.022 * el);
        lampadinha.setColorAt(i, cor.copy(lampCor[i]).multiplyScalar(el));
      }
    });
    sujo(lampadinha);

    // Grades.
    grades.forEach((g, i) => {
      const e = suave(trecho(k, g.a, g.a + 0.06));
      const base = i * (GRADE_RIPAS + 4);
      const vis = trecho(F, g.d - 0.5, g.d + 0.5) > 0 || e > 0;
      const c = Math.cos(g.ry);
      const s = Math.sin(g.ry);
      const P = (lx, lz) => [g.p.x + lx * c + lz * s, g.p.z - lx * s + lz * c];
      for (let j = 0; j < GRADE_RIPAS + 4; j++) {
        if (!vis) {
          esconde(gradeMetal, base + j);
          continue;
        }
        if (j < GRADE_RIPAS) {
          const [x, z] = P(-0.2 + (j * 0.4) / (GRADE_RIPAS - 1), 0);
          poe(gradeMetal, base + j, x, PISO + 0.008, z, 0.026, 0.012, 0.3, g.ry);
        } else {
          const lado = j - GRADE_RIPAS;
          const [x, z] = lado < 2 ? P(lado ? 0.235 : -0.235, 0) : P(0, lado === 2 ? 0.16 : -0.16);
          if (lado < 2) poe(gradeMetal, base + j, x, PISO + 0.009, z, 0.03, 0.016, 0.35, g.ry);
          else poe(gradeMetal, base + j, x, PISO + 0.009, z, 0.5, 0.016, 0.03, g.ry);
        }
      }
      if (e <= 0) {
        esconde(gradeFundo, i);
        esconde(gradeChao, i);
      } else {
        poe(gradeFundo, i, g.p.x, PISO + 0.004, g.p.z, 0.46, 1, 0.34, g.ry);
        gradeFundo.setColorAt(i, cor.copy(g.c).multiplyScalar(e));
        poe(gradeChao, i, g.p.x, PISO + 0.005, g.p.z, 1.1, 1, 0.9, g.ry);
        gradeChao.setColorAt(i, cor.copy(g.c).multiplyScalar(e * 0.6));
      }
    });
    sujo(gradeMetal, gradeFundo, gradeChao);
    vaporForca = trecho(k, 0.34, 0.44);
    if (!reducedMotion) posicionarVapor();

    // Máquina e quiosque: sobem do subsolo e "assentam"; neon e tela ligam depois.
    const sm = assentar(trecho(k, 0.16, 0.26));
    const sq = assentar(trecho(k, 0.22, 0.32));
    maqCorpo.visible = sm > 0;
    qCorpo.visible = sq > 0;
    maqCorpo.position.y = (sm - 1) * 1.05;
    qCorpo.position.y = (sq - 1) * 1.4;
    const ln = ligado(k, 0.3, 91).luz;
    for (const m of neonsMoveis) m.color.copy(corNeon.get(m)).multiplyScalar(0.12 + 0.88 * ln);
    telaMaquinaMat.color.setScalar(boot(k, 0.4, 7));
    telaQuiosqueMat.color.setScalar(boot(k, 0.44, 13));
    const hm = trecho(k, 0.3, 0.36) * ln;
    if (hm > 0) {
      const pm = maquina.position;
      const pq = quiosque.position;
      poe(moveisHalo, 0, pm.x, 0.045, pm.z + 0.45, 1.0, 1, 0.8);
      poe(moveisHalo, 1, pq.x, 0.045, pq.z + 0.5, 1.5, 1, 0.9);
      moveisHalo.setColorAt(0, cor.copy(magenta).multiplyScalar(hm * 0.8));
      moveisHalo.setColorAt(1, cor.copy(ambar).multiplyScalar(hm * 0.7));
    } else {
      esconde(moveisHalo, 0);
      esconde(moveisHalo, 1);
    }
    sujo(moveisHalo);

    // Faixas de pedestre: barras acendem de uma borda à outra.
    faixaLuz = trecho(k, 0.44, 0.55);
    FAIXAS.forEach((y, fi) => {
      const z = wz(y) + 0.5;
      const x0 = wx(14) + 0.12;
      const larg = 2 - 0.24;
      for (let j = 0; j < BARRAS; j++) {
        const n = fi * BARRAS + j;
        const e = suave(trecho(faixaLuz, j / BARRAS * 0.7, j / BARRAS * 0.7 + 0.3));
        if (e <= 0) {
          esconde(faixa, n);
          continue;
        }
        const x = x0 + (larg / BARRAS) * (j + 0.5);
        poe(faixa, n, x, PISO + 0.007, z, 0.13, 1, 0.72 * e);
        faixa.setColorAt(n, cor.copy(j % 2 ? ciano : branco).multiplyScalar(0.35 + 0.25 * e));
      }
      // Linhas de borda da faixa (antes e depois).
      for (const lado of [0, 1]) {
        const n = fi * 2 + lado;
        if (faixaLuz <= 0) {
          esconde(faixaBorda, n);
          continue;
        }
        const e = suave(trecho(faixaLuz, 0, 0.4));
        poe(faixaBorda, n, wx(14) + 1, PISO + 0.005, z + (lado ? 0.42 : -0.42), larg * e, 0.006, 0.018);
        faixaBorda.setColorAt(n, magenta);
      }
    });
    sujo(faixa, faixaBorda);
  }

  // Tela ligando: apagada → flash → linhas → acesa (brilho 0..1).
  function boot(k, a, semente) {
    const e = trecho(k, a, a + 0.06);
    if (e <= 0) return 0;
    if (e >= 1 || reducedMotion) return e >= 1 ? 1 : e;
    if (e < 0.15) return 1.4 * (e / 0.15);
    return ruido(Math.floor(k * 300) + semente) > 0.3 ? 0.5 + e * 0.5 : 0.15;
  }

  // ---- Vapor ---------------------------------------------------------------------------
  let tempo = 0;
  function posicionarVapor() {
    grades.forEach((g, gi) => {
      for (let j = 0; j < NV; j++) {
        const n = gi * NV + j;
        if (vaporForca <= 0) {
          esconde(vapor, n);
          continue;
        }
        const p = (tempo * 0.28 + j / NV + gi * 0.13) % 1;
        const r = ruido(j * 7 + gi * 3);
        const giro = Math.sin(tempo * 0.9 + j * 1.7) * 0.06 + (r - 0.5) * 0.1;
        const sc = (0.03 + p * 0.11) * Math.sin(Math.PI * Math.min(1, p * 1.25)) * vaporForca;
        poe(vapor, n, g.p.x + giro + p * 0.12, PISO + 0.03 + p * 1.05, g.p.z + (r - 0.5) * 0.15, sc, sc * 0.8, sc);
      }
    });
    sujo(vapor);
  }

  // ---- Movimento contínuo ---------------------------------------------------------------
  const opReflexo = reflexoMat.opacity;
  const opTubo = tuboHalo.material.opacity;
  const opFaixa = faixa.material.opacity;
  function update(t, dt, k) {
    tempo = t;
    if (reducedMotion) return;
    // Chuva batendo nas poças: reflexo tremula de leve.
    reflexoMat.opacity = opReflexo * (0.85 + 0.15 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1));
    // Zumbido do neon.
    tuboHalo.material.opacity = opTubo * (0.9 + 0.1 * Math.sin(t * 31));
    // Varredura na faixa de pedestre holográfica.
    if (faixaLuz >= 1) faixa.material.opacity = opFaixa * (0.75 + 0.25 * Math.sin(t * 2.4));
    // Lampadinhas: corrida suave de brilho ao longo dos cabos.
    if (k >= 0.52) {
      for (let i = 0; i < NL; i++) {
        const b = 0.55 + 0.45 * Math.max(0, Math.sin(t * 2.2 - i * 0.7));
        lampadinha.setColorAt(i, cor.copy(lampCor[i]).multiplyScalar(b));
      }
      sujo(lampadinha);
    }
    if (vaporForca > 0) posicionarVapor();
  }

  return { setProgress, update };
}
