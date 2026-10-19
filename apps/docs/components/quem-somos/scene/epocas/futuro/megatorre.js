// Vila 2030 — módulo "megatorre": a peça central da obra. No gramado a leste
// do Banco de Dados, um guindaste de torre ergue uma megatorre cyberpunk
// módulo a módulo: cada bloco de vidro escuro sobe do canteiro, gira na lança,
// assenta soltando poeira e faíscas de solda e, ao assentar, as faixas de LED
// acendem andar por andar e as janelas ganham luz. Por cima vem a estação de
// drones (heliponto octogonal); o guindaste recolhe, o pináculo sobe em
// telescópio com a luz vermelha e o letreiro vertical "SEMEC" liga letra a
// letra, com aquele tremido de neon velho.
//
// Contrato: ver futuro/index.js. Janela de k: 0,00–0,65.
//   0,00–0,05  guindaste sobe do chão; pódio cresce no lugar
//   0,05–0,52  5 ciclos do guindaste (4 módulos + coroa/heliponto):
//              içar (0–18%) → girar (18–50%) → descer e assentar (50–80%,
//              poeira e faíscas) → soltar e voltar (80–100%); LEDs acendem
//   0,50–0,56  andaime desmontado de cima para baixo
//   0,53–0,59  guindaste recolhe; pináculo sobe em telescópio
//   0,55–0,65  letreiro vertical: placa sobe, moldura e letras ligam
// Sem luz real: todo brilho é MeshBasicMaterial (toneMapped:false), emissive
// das janelas e halos aditivos (preto = não soma nada).
import * as THREE from "three";
import { trecho, assentar } from "../comum";

const suave = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;
// Ruído fixo por índice (poeira, faíscas e tremidos sempre iguais para o mesmo k).
const ruido = (n) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

// Volumes da torre (unidade = tile). x/z: deslocamento do centro (recuos
// escalonados para o norte, deixando terraços visíveis na frente); rot: giro
// leve dos módulos de cima; fl: andares; balc: varanda (sul/oeste).
const PODIO_H = 0.42;
const DEFS = [
  { w: 1.9, d: 1.74, h: 1.16, fl: 3, x: 0, z: 0, rot: 0 },
  { w: 1.56, d: 1.42, h: 1.16, fl: 3, x: -0.1, z: -0.12, rot: 0, balc: "s" },
  { w: 1.28, d: 1.16, h: 1.04, fl: 3, x: 0.07, z: -0.24, rot: 0.1, balc: "o" },
  { w: 0.98, d: 0.92, h: 0.72, fl: 2, x: -0.02, z: -0.3, rot: 0.2 },
];
const COROA_H = 0.24;
const LETRAS = "SEMEC";

export function createMegatorre({ scene, pal, track, tileToWorld, makeLabel, reducedMotion = false, cores, kit }) {
  const { pv, mix, white } = pal;
  const { box, mat, glow, part } = kit;
  const preto = white.clone().multiplyScalar(0);
  const grupo = new THREE.Group();
  grupo.visible = false;
  scene.add(grupo);

  // ---- Materiais -----------------------------------------------------------------
  const concreto = mat(mix(pv("gray-700"), cores.noite, 0.4), { roughness: 0.85 });
  const laje = mat(mix(pv("gray-500"), pv("gray-700"), 0.55), { roughness: 0.55, metalness: 0.25 });
  const metal = mat(mix(pv("gray-800"), cores.roxo, 0.18), { roughness: 0.38, metalness: 0.65 });
  const amarelo = mat(pv("yellow-500"), { roughness: 0.55 });
  const escuro = mat(pv("gray-700"), { roughness: 0.6 });
  const apagado = mat(mix(pv("gray-800"), pv("gray-600"), 0.3), { roughness: 0.5 });
  const corApagada = mix(pv("gray-800"), pv("gray-600"), 0.35);
  const gMag = glow(cores.magenta);
  const gCiano = glow(mix(cores.ciano, white, 0.15));
  const gVermelho = glow(pv("red-400"));
  const gAmbar = glow(cores.ambar);
  const gBranco = glow(white);
  // LEDs instanciados: cor por instância (apagado, flash branco, aceso).
  const ledMat = track(new THREE.MeshBasicMaterial({ color: white, toneMapped: false }));
  const aditivo = (extra = {}) =>
    track(
      new THREE.MeshBasicMaterial({
        color: white,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        ...extra,
      })
    );

  // ---- Texturas desenhadas no canvas ------------------------------------------------
  // Halo radial branco → preto (no blending aditivo o preto não soma nada).
  const texHalo = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, white.getStyle());
    gr.addColorStop(0.22, mix(white, preto, 0.45).getStyle());
    gr.addColorStop(0.55, mix(white, preto, 0.85).getStyle());
    gr.addColorStop(1, preto.getStyle());
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return track(t);
  })();
  // Janelas (mapa de emissão): salas acesas em âmbar, ciano ou magenta, umas
  // apagadas; o fundo preto não emite (o vidro escuro aparece por baixo).
  function texJanelas(fl, cols, semente) {
    const c = document.createElement("canvas");
    c.width = cols * 16;
    c.height = fl * 32;
    const g = c.getContext("2d");
    g.fillStyle = preto.getStyle();
    g.fillRect(0, 0, c.width, c.height);
    const quente = mix(cores.ambar, white, 0.15).multiplyScalar(0.85);
    const frio = cores.ciano.clone().multiplyScalar(0.7);
    const rosa = cores.magenta.clone().multiplyScalar(0.75);
    for (let f = 0; f < fl; f++) {
      for (let i = 0; i < cols; i++) {
        const r = ruido(semente + f * 17 + i * 3.1);
        if (r < 0.3) continue;
        const cor = r < 0.66 ? quente : r < 0.88 ? frio : rosa;
        g.fillStyle = cor.getStyle();
        g.fillRect(i * 16 + 2, f * 32 + 7, 12, 20);
        // Silhueta de alguém / móvel na sala (meia janela mais escura).
        if (ruido(semente + f * 5 + i) > 0.7) {
          g.fillStyle = cor.clone().multiplyScalar(0.35).getStyle();
          g.fillRect(i * 16 + 6, f * 32 + 15, 5, 12);
        }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return track(t);
  }

  // ---- Utilitários ------------------------------------------------------------------
  const m4 = new THREE.Matrix4();
  const mp = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const UP = new THREE.Vector3(0, 1, 0);
  const vp = new THREE.Vector3();
  const vs = new THREE.Vector3();
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  function inst(mesh, i, x, y, z, sx, sy, sz, ry = 0) {
    q.setFromAxisAngle(UP, ry);
    m4.compose(vp.set(x, y, z), q, vs.set(sx, sy, sz));
    mesh.setMatrixAt(i, m4);
  }
  function instanciado(geo, material, n, pai, sombra = true) {
    const m = track(new THREE.InstancedMesh(geo, material, n));
    m.count = 0;
    m.frustumCulled = false;
    m.castShadow = sombra;
    m.receiveShadow = sombra;
    pai.add(m);
    return m;
  }
  const brilho = (geo, material, s, p) => {
    const m = part(geo, material, s, p);
    m.castShadow = m.receiveShadow = false;
    return m;
  };
  function halo(cor, tam, opacidade) {
    const s = new THREE.Sprite(
      track(
        new THREE.SpriteMaterial({
          map: texHalo,
          color: cor,
          transparent: true,
          opacity: opacidade,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        })
      )
    );
    s.scale.set(tam, tam, 1);
    return s;
  }
  // Haste de espessura `e` ligando os pontos a e b (cabo, eslingas, estais).
  function haste(m, a, b, e) {
    const len = Math.max(a.distanceTo(b), 0.001);
    m.position.addVectors(a, b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(UP, vp.subVectors(b, a).divideScalar(len));
    m.scale.set(e, len, e);
  }
  const angulo = (de, para) => Math.atan2(-(para.z - de.z), para.x - de.x);
  // Estado de um LED que liga em `t0`: 0 apagado, 2 flash (tremendo), 1 aceso.
  const DUR_LIGA = 0.009;
  function estadoLed(k, t0, sal) {
    if (k < t0) return 0;
    if (k >= t0 + DUR_LIGA) return 1;
    return ruido(Math.floor(((k - t0) / DUR_LIGA) * 6) + sal * 7.3) > 0.38 ? 2 : 0;
  }

  // ---- Canteiro: torre ---------------------------------------------------------------
  // Numa ilha artificial na metade leste do Rio Madeira (lago x 20–27, y 2–6):
  // o lote ao lado do Banco de Dados virou o Laboratório de ML. A ilha não
  // ocupa tile andável; uma passarela a liga à margem sul. +z = sul (câmera).
  const T = tileToWorld(24, 4).add(new THREE.Vector3(0.5, 0, -0.2));
  const torre = new THREE.Group();
  torre.position.copy(T);
  grupo.add(torre);

  // Lista global de halos de LED: cada LED registra onde fica JÁ ASSENTADO
  // (matriz no espaço da torre), sua cor e quando liga.
  const ledsHalo = [];
  // Peça com LEDs instanciados: { mesh, lista: [{ m (matriz local), cor, t0 }] }.
  function grupoLeds(pai, lista) {
    const mesh = instanciado(box, ledMat, lista.length, pai, false);
    lista.forEach((l, i) => {
      inst(mesh, i, ...l.p, ...l.s, l.ry || 0);
      mesh.setColorAt(i, corApagada);
    });
    mesh.count = lista.length;
    mesh.instanceMatrix.needsUpdate = true;
    return { mesh, lista };
  }

  // ---- Pódio (construído no lugar) ------------------------------------------------------
  const podio = new THREE.Group();
  torre.add(podio);
  const PW = 2.3;
  const PD = 2.16;
  // Ilha: laje de concreto saindo d'água (o espelho fica em y = -0,1) com
  // filete ciano na linha d'água e a passarela até a margem sul.
  const IW = 2.9;
  const ID = 2.7;
  const ilha = new THREE.Group();
  torre.add(ilha);
  ilha.add(part(box, concreto, [IW, 0.42, ID], [0, -0.15, 0]));
  ilha.add(part(box, laje, [IW + 0.04, 0.04, ID + 0.04], [0, 0.07, 0]));
  const PASSA = 7 - (T.z + 12) - ID / 2 + 0.25; // da borda da ilha até a margem
  ilha.add(part(box, laje, [0.42, 0.05, PASSA], [0.35, 0.02, ID / 2 + PASSA / 2]));
  for (const sx of [-1, 1]) {
    for (let n = 0; n < 3; n++) ilha.add(part(box, metal, [0.05, 0.3, 0.05], [0.35 + sx * 0.18, -0.12, ID / 2 + ((n + 0.5) * PASSA) / 3]));
  }
  const ilhaLeds = [
    { p: [0, -0.06, 0], s: [IW + 0.02, 0.025, ID + 0.02], cor: cores.ciano },
    { p: [0.14, 0.13, ID / 2 + PASSA / 2], s: [0.014, 0.014, PASSA], cor: cores.ciano },
    { p: [0.56, 0.13, ID / 2 + PASSA / 2], s: [0.014, 0.014, PASSA], cor: cores.ciano },
  ];
  podio.add(part(box, concreto, [PW, PODIO_H - 0.05, PD], [0, (PODIO_H - 0.05) / 2, 0]));
  podio.add(part(box, laje, [PW + 0.06, 0.05, PD + 0.06], [0, PODIO_H - 0.025, 0]));
  // Saguão: vão iluminado na fachada sul, com marquise.
  podio.add(brilho(box, gAmbar, [0.7, 0.24, 0.02], [0.35, 0.14, PD / 2 + 0.002]));
  podio.add(part(box, metal, [0.9, 0.035, 0.22], [0.35, 0.3, PD / 2 + 0.1]));
  const ilhaGL = grupoLeds(ilha, ilhaLeds);
  const podioLeds = grupoLeds(podio, [
    { p: [0, PODIO_H - 0.07, 0], s: [PW + 0.025, 0.03, PD + 0.025], cor: cores.magenta },
    { p: [0.35, 0.28, PD / 2 + 0.21], s: [0.9, 0.018, 0.018], cor: cores.ciano },
  ]);

  // ---- Módulos (içados pelo guindaste) ---------------------------------------------------
  const pecas = [];
  let yBase = PODIO_H;
  DEFS.forEach((d, i) => {
    const g = new THREE.Group();
    const fh = (d.h - 0.1) / d.fl;
    const vidro = mat(mix(pv("blue-900"), cores.noite, 0.45), {
      roughness: 0.14,
      metalness: 0.7,
      emissive: white,
      emissiveMap: texJanelas(d.fl, Math.round(d.w * 7), 11 + i * 37),
      emissiveIntensity: 0,
    });
    g.add(part(box, vidro, [d.w - 0.06, d.h - 0.08, d.d - 0.06], [0, d.h / 2, 0]));
    g.add(part(box, laje, [d.w + 0.04, 0.05, d.d + 0.04], [0, 0.025, 0]));
    g.add(part(box, laje, [d.w + 0.08, 0.05, d.d + 0.08], [0, d.h - 0.025, 0]));
    // Pilares de canto, brises verticais nas fachadas sul e leste e máquinas
    // de ar no terraço que o módulo de cima deixa à mostra.
    const est = [];
    const hc = d.h - 0.1;
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) est.push([(sx * d.w) / 2, 0.05 + hc / 2, (sz * d.d) / 2, 0.065, hc, 0.065]);
    const nS = Math.max(2, Math.round(d.w * 3.2));
    for (let n = 1; n < nS; n++) est.push([-d.w / 2 + (n * d.w) / nS, 0.05 + hc / 2, d.d / 2 - 0.005, 0.022, hc, 0.05]);
    const nL = Math.max(2, Math.round(d.d * 2.4));
    for (let n = 1; n < nL; n++) est.push([d.w / 2 - 0.005, 0.05 + hc / 2, -d.d / 2 + (n * d.d) / nL, 0.05, hc, 0.022]);
    const prox = DEFS[i + 1];
    if (prox) {
      const frente = d.z + d.d / 2;
      const frenteProx = prox.z + prox.d / 2;
      const zt = (frente + frenteProx) / 2 - d.z;
      if (frente - frenteProx > 0.16) {
        est.push([d.w / 2 - 0.2, d.h + 0.06, zt, 0.2, 0.12, 0.13]);
        est.push([d.w / 2 - 0.46, d.h + 0.05, zt, 0.16, 0.1, 0.13]);
        est.push([-d.w / 2 + 0.22, d.h + 0.04, zt, 0.09, 0.08, 0.09]);
      }
    }
    const estrutura = instanciado(box, metal, est.length, g);
    est.forEach((e, n) => inst(estrutura, n, ...e));
    estrutura.count = est.length;
    // LEDs: uma faixa por andar envolvendo o módulo (ciano, o último andar
    // magenta) e um filete vertical magenta na quina sudoeste.
    const lista = [];
    for (let f = 0; f < d.fl; f++) {
      lista.push({
        p: [0, 0.05 + (f + 1) * fh - 0.02, 0],
        s: [d.w + 0.03, 0.032, d.d + 0.03],
        cor: f === d.fl - 1 && i % 2 === 1 ? cores.magenta : cores.ciano,
        f,
      });
    }
    lista.push({ p: [-d.w / 2 - 0.02, 0.05 + hc / 2, d.d / 2 + 0.02], s: [0.028, hc, 0.028], cor: cores.magenta, f: d.fl - 1 });
    // Varanda em balanço com guarda-corpo de LED.
    if (d.balc) {
      const yb = 0.05 + fh * 2;
      const sul = d.balc === "s";
      const L = (sul ? d.w : d.d) * 0.58;
      const [bx, bz] = sul ? [-0.12, d.d / 2 + 0.12] : [-d.w / 2 - 0.12, -0.05];
      g.add(part(box, laje, sul ? [L, 0.03, 0.26] : [0.26, 0.03, L], [bx, yb, bz]));
      const [rx, rz] = sul ? [bx, d.d / 2 + 0.24] : [-d.w / 2 - 0.24, bz];
      lista.push({ p: [rx, yb + 0.1, rz], s: sul ? [L, 0.016, 0.016] : [0.016, 0.016, L], cor: cores.magenta, f: 1 });
      lista.push({ p: [rx, yb + 0.05, rz], s: sul ? [L, 0.1, 0.006] : [0.006, 0.1, L], cor: mix(cores.ciano, preto, 0.75), f: 1 });
    }
    const leds = grupoLeds(g, lista);
    pecas.push({ g, h: d.h, wx: d.w, wz: d.d, y: yBase, x: d.x, z: d.z, rot: d.rot, leds, vidro, fl: d.fl });
    yBase += d.h;
  });

  // ---- Coroa: estação de drones / heliponto octogonal ---------------------------------------
  const TOPO = yBase;
  const coroa = new THREE.Group();
  const RC = 0.78; // raio do deque
  coroa.add(part(box, metal, [0.74, 0.14, 0.7], [0, 0.07, 0]));
  // Treliça em balanço sob o deque.
  for (let n = 0; n < 4; n++) {
    const a = Math.PI / 4 + (n * Math.PI) / 2;
    const b = part(box, escuro, [0.05, 0.05, 0.5], [Math.cos(a) * 0.42, 0.1, Math.sin(a) * 0.42]);
    b.rotation.y = -a + Math.PI / 2;
    coroa.add(b);
  }
  const deque = part(track(new THREE.CylinderGeometry(1, 1, 1, 8)), mat(mix(pv("gray-800"), pv("gray-900"), 0.5), { roughness: 0.65 }), [RC, 0.07, RC], [0, 0.175, 0]);
  deque.rotation.y = Math.PI / 8;
  coroa.add(deque);
  // Cabine de controle (base do pináculo).
  const CAB = [0.36, 0.21 + 0.11, -0.3];
  coroa.add(part(box, metal, [0.3, 0.22, 0.26], CAB));
  const listaCoroa = [];
  const lado = 2 * RC * Math.cos(Math.PI / 8) * Math.tan(Math.PI / 8);
  for (let n = 0; n < 8; n++) {
    const a = (n * Math.PI) / 4;
    const ap = RC * Math.cos(Math.PI / 8);
    listaCoroa.push({ p: [Math.cos(a) * ap, 0.215, -Math.sin(a) * ap], s: [0.03, 0.03, lado + 0.02], ry: a, cor: cores.magenta });
  }
  // "H" e duas baias de drone (ciano) no deque; janela da cabine.
  listaCoroa.push({ p: [-0.13, 0.213, 0.05], s: [0.05, 0.008, 0.34], cor: white });
  listaCoroa.push({ p: [0.09, 0.213, 0.05], s: [0.05, 0.008, 0.34], cor: white });
  listaCoroa.push({ p: [-0.02, 0.213, 0.05], s: [0.22, 0.008, 0.05], cor: white });
  listaCoroa.push({ p: [-0.5, 0.213, -0.18], s: [0.18, 0.008, 0.18], cor: cores.ciano });
  listaCoroa.push({ p: [0.48, 0.213, 0.22], s: [0.18, 0.008, 0.18], cor: cores.ciano });
  listaCoroa.push({ p: [CAB[0], CAB[1] + 0.03, CAB[2] + 0.132], s: [0.26, 0.05, 0.006], cor: cores.ciano });
  const coroaLeds = grupoLeds(coroa, listaCoroa);
  const ROT_COROA = DEFS[DEFS.length - 1].rot;
  const ZC = DEFS[DEFS.length - 1].z;
  pecas.push({ g: coroa, h: COROA_H, wx: 0.74, wz: 0.7, y: TOPO, x: 0, z: ZC, rot: ROT_COROA, leds: coroaLeds, fl: 1, coroa: true });

  for (const p of pecas) {
    p.g.visible = false;
    torre.add(p.g);
  }
  const NP = pecas.length;
  const A0 = 0.05; // início do 1º ciclo do guindaste
  const D = 0.094; // duração de cada ciclo
  pecas.forEach((p, i) => {
    p.a = A0 + i * D;
    p.assenta = p.a + 0.8 * D;
    p.carga = p.y + 0.55; // altura de transporte (acima do topo atual)
    // Ordem de acendimento: faixa por andar, de baixo para cima.
    p.leds.lista.forEach((l, n) => {
      l.t0 = p.assenta + 0.012 + (p.coroa ? n * 0.0015 : (l.f ?? 0) * 0.026);
    });
  });
  ilhaGL.lista.forEach((l, n) => (l.t0 = 0.032 + n * 0.006));
  podioLeds.lista[0].t0 = pecas[0].assenta + 0.004;
  podioLeds.lista[1].t0 = pecas[0].assenta + 0.03;

  // Halos dos LEDs: uma caixa aditiva um pouco maior em volta de cada faixa,
  // na posição final (só acende depois que a peça assentou).
  const conjuntos = [{ leds: ilhaGL, x: 0, y: 0, z: 0, rot: 0 }, { leds: podioLeds, x: 0, y: 0, z: 0, rot: 0 }, ...pecas.map((p) => ({ leds: p.leds, x: p.x, y: p.y, z: p.z, rot: p.rot }))];
  for (const c of conjuntos) {
    mp.makeRotationY(c.rot).setPosition(c.x, c.y, c.z);
    for (const l of c.leds.lista) {
      q.setFromAxisAngle(UP, l.ry || 0);
      const s = l.s;
      m4.compose(vp.set(...l.p), q, vs.set(s[0] + 0.07, Math.min(s[1] + 0.07, s[1] * 3 + 0.05), s[2] + 0.07));
      ledsHalo.push({ m: mp.clone().multiply(m4), l });
    }
  }
  const halos = instanciado(box, aditivo({ opacity: 0.32 }), ledsHalo.length, torre, false);
  ledsHalo.forEach((h, i) => {
    halos.setMatrixAt(i, h.m);
    halos.setColorAt(i, preto);
  });
  halos.count = ledsHalo.length;

  // ---- Pináculo telescópico, estais e luz de topo ------------------------------------------
  const cabMundo = new THREE.Vector3(CAB[0], 0, CAB[2]).applyAxisAngle(UP, ROT_COROA);
  const PX = cabMundo.x;
  const PZ = ZC + cabMundo.z;
  const PY = TOPO + CAB[1] + 0.11;
  const pinaculo = new THREE.Group();
  pinaculo.position.set(PX, PY, PZ);
  torre.add(pinaculo);
  const cil = track(new THREE.CylinderGeometry(1, 1, 1, 8));
  const SEG = [
    { r: 0.055, h: 0.55 },
    { r: 0.036, h: 0.5 },
    { r: 0.02, h: 0.45 },
  ];
  const segs = SEG.map((s) => {
    const m = part(cil, metal, [s.r, s.h, s.r], [0, s.h / 2, 0]);
    pinaculo.add(m);
    return m;
  });
  const ALT_PIN = SEG.reduce((a, s) => a + s.h, 0) - 0.06;
  const anelPin = brilho(box, apagado, [0.1, 0.02, 0.1], [0, 0, 0]);
  const lampada = brilho(box, gVermelho, [0.07, 0.07, 0.07], [0, 0, 0]);
  const haloLamp = halo(pv("red-400"), 0.75, 0.9);
  pinaculo.add(anelPin, lampada, haloLamp);
  const estais = [0, 1, 2].map(() => {
    const m = part(box, escuro, [1, 1, 1], [0, 0, 0]);
    m.castShadow = false;
    torre.add(m);
    return m;
  });
  const ancoras = [0, 1, 2].map((n) => {
    const a = ROT_COROA + Math.PI * 0.75 + n * ((Math.PI * 2) / 3);
    return new THREE.Vector3(Math.cos(a) * 0.62, TOPO + 0.21, ZC - Math.sin(a) * 0.62);
  });

  // ---- Letreiro vertical "SEMEC" ---------------------------------------------------------
  // Placa em balanço na quina sudoeste, presa às fachadas por consoles.
  const LT = 0.4; // passo das letras
  const PH = LETRAS.length * LT + 0.14;
  const placa = new THREE.Group();
  placa.position.set(-0.6, PODIO_H, DEFS[0].d / 2 + 0.16);
  torre.add(placa);
  placa.add(part(box, metal, [0.48, PH, 0.06], [0, PH / 2, 0]));
  placa.add(part(box, metal, [0.06, 0.06, 0.16], [0, 0.55, -0.1]));
  placa.add(part(box, metal, [0.06, 0.06, 0.42], [0, PH - 0.2, -0.24]));
  const moldura = [
    brilho(box, apagado, [0.03, PH, 0.03], [-0.24, PH / 2, 0.03]),
    brilho(box, apagado, [0.03, PH, 0.03], [0.24, PH / 2, 0.03]),
    brilho(box, apagado, [0.51, 0.03, 0.03], [0, PH, 0.03]),
    brilho(box, apagado, [0.51, 0.03, 0.03], [0, 0, 0.03]),
  ];
  placa.add(...moldura);
  const quadro = track(new THREE.PlaneGeometry(0.38, 0.38));
  const fundoLetra = mix(cores.noite, pv("gray-900"), 0.4);
  const corLetra = mix(cores.ciano, white, 0.55);
  const letras = [...LETRAS].map((ch, i) => {
    const tex = track(makeLabel(ch, fundoLetra, corLetra));
    // makeLabel desenha 512×128 com a letra centrada em (256, 68): recorta um
    // quadrado de 80 px em volta dela (o canvas tem y para baixo).
    tex.repeat.set(80 / 512, 80 / 128);
    tex.offset.set(216 / 512, 1 - 108 / 128);
    const m = new THREE.Mesh(quadro, track(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })));
    m.position.set(0, 0.07 + (LETRAS.length - 1 - i) * LT + LT / 2, 0.032);
    placa.add(m);
    return m;
  });
  const corLetraOff = mix(white, preto, 0.82);
  const corLetraFlash = white.clone().multiplyScalar(1.6);
  const brilhoPlaca = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), aditivo({ map: texHalo, color: cores.magenta, opacity: 0 }));
  brilhoPlaca.scale.set(1.5, PH * 1.5, 1);
  brilhoPlaca.position.set(0, PH / 2, 0.05);
  placa.add(brilhoPlaca);
  const T_PLACA = [0.553, 0.585];
  const T_MOLDURA = 0.588;
  const T_LETRA = (i) => 0.598 + i * 0.0095;

  // ---- Dutos e cabos (fachada leste) ---------------------------------------------------
  const RISER_X = DEFS[0].w / 2 + 0.07;
  const RISER_Z = -0.42;
  const RISER_TOPO = PODIO_H + DEFS[0].h + DEFS[1].h - 0.05;
  const duto = part(cil, metal, [0.075, 1, 0.075], [RISER_X, 0, RISER_Z]);
  const conduite = brilho(box, apagado, [0.02, 1, 0.02], [RISER_X + 0.02, 0, RISER_Z + 0.09]);
  torre.add(duto, conduite);
  // Cabo de força pendurado até a subestação no chão (com LED âmbar).
  const caixaPos = [1.32, 0, 0.92];
  const caixa = new THREE.Group();
  caixa.position.set(...caixaPos);
  caixa.add(part(box, metal, [0.26, 0.3, 0.2], [0, 0.15, 0]));
  caixa.add(brilho(box, gAmbar, [0.05, 0.05, 0.01], [0.06, 0.22, 0.101]));
  caixa.add(brilho(box, gCiano, [0.12, 0.015, 0.01], [-0.04, 0.12, 0.101]));
  torre.add(caixa);
  const cabo = new THREE.Mesh(
    track(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(RISER_X + 0.05, 0.95, RISER_Z + 0.04),
          new THREE.Vector3(1.22, 0.4, 0.15),
          new THREE.Vector3(1.3, 0.2, 0.62),
          new THREE.Vector3(caixaPos[0], 0.25, caixaPos[2] - 0.08),
        ]),
        24,
        0.016,
        5,
        false
      )
    ),
    escuro
  );
  torre.add(cabo);

  // ---- Guindaste de torre --------------------------------------------------------------
  // Mastro entre a torre e o lago; canteiro (onde chegam as peças) ao sul dele.
  // Mastro numa balsa a oeste da ilha; canteiro na margem sudoeste do lago.
  const C = T.clone().add(new THREE.Vector3(-2.4, 0, 0.25));
  const P = tileToWorld(21, 6).add(new THREE.Vector3(-0.05, 0, 0.05));
  const guindaste = new THREE.Group();
  guindaste.position.copy(C);
  grupo.add(guindaste);
  const MASTRO = TOPO + COROA_H + 1.45;
  guindaste.add(part(box, escuro, [0.55, 0.14, 0.55], [0, 0.07, 0]));
  // Balsa (fica na água mesmo com o guindaste recolhido para baixo).
  const balsa = new THREE.Group();
  balsa.position.copy(C);
  balsa.add(part(box, metal, [1.1, 0.16, 1.0], [0, -0.06, 0]));
  balsa.add(brilho(box, gAmbar, [1.12, 0.02, 1.02], [0, -0.075, 0]));
  grupo.add(balsa);
  guindaste.add(part(box, amarelo, [0.22, MASTRO, 0.22], [0, MASTRO / 2, 0]));
  const travessas = instanciado(box, escuro, 32, guindaste);
  {
    let n = 0;
    for (let y = 0.45; y < MASTRO - 0.3 && n < 32; y += 0.42) inst(travessas, n++, 0, y, 0, 0.25, 0.045, 0.25);
    travessas.count = n;
  }
  const rP = Math.hypot(P.x - C.x, P.z - C.z);
  const thP = angulo(C, P);
  // Giro mais curto do canteiro até o assento de cada peça.
  for (const p of pecas) {
    vp.set(T.x + p.x, 0, T.z + p.z);
    p.rT = Math.hypot(vp.x - C.x, vp.z - C.z);
    const d = angulo(C, vp) - thP;
    p.thT = thP + Math.atan2(Math.sin(d), Math.cos(d));
  }
  const JIB = Math.max(rP, ...pecas.map((p) => p.rT)) + 0.4;
  const lanca = new THREE.Group();
  lanca.position.y = MASTRO;
  guindaste.add(lanca);
  lanca.add(part(box, amarelo, [JIB + 1.1, 0.16, 0.18], [(JIB + 1.1) / 2 - 1.1, 0, 0]));
  lanca.add(part(box, amarelo, [0.12, 0.7, 0.12], [0, 0.35, 0]));
  lanca.add(part(box, escuro, [0.45, 0.34, 0.36], [-0.9, -0.08, 0]));
  // Cabine do operador com a luz acesa (é noite).
  lanca.add(part(box, metal, [0.3, 0.26, 0.3], [0.2, -0.24, 0.14]));
  lanca.add(brilho(box, gAmbar, [0.22, 0.1, 0.01], [0.2, -0.2, 0.291]));
  const tirante1 = part(box, escuro, [1, 1, 1], [0, 0, 0]);
  const tirante2 = part(box, escuro, [1, 1, 1], [0, 0, 0]);
  haste(tirante1, va.set(0, 0.7, 0), vb.set(JIB * 0.7, 0.08, 0), 0.03);
  haste(tirante2, va.set(0, 0.7, 0), vb.set(-1.0, 0.08, 0), 0.03);
  lanca.add(tirante1, tirante2);
  // Balizamento: luz vermelha no pico e na ponta da lança.
  const balizas = [
    [0, 0.76, 0],
    [JIB - 0.05, 0.12, 0],
  ].map((pos) => {
    const b = new THREE.Group();
    b.position.set(...pos);
    b.add(brilho(box, gVermelho, [0.07, 0.07, 0.07], [0, 0, 0]), halo(pv("red-400"), 0.55, 0.8));
    lanca.add(b);
    return b;
  });
  const carrinho = part(box, escuro, [0.26, 0.1, 0.22], [rP, -0.12, 0]);
  lanca.add(carrinho);
  // Cabo, moitão, eslingas e o cone do refletor de obra ficam no mundo.
  const caboG = part(box, escuro, [1, 1, 1], [0, 0, 0]);
  const gancho = new THREE.Group();
  gancho.add(part(box, amarelo, [0.2, 0.14, 0.2], [0, 0.07, 0]));
  gancho.add(part(box, escuro, [0.08, 0.1, 0.08], [0, -0.04, 0]));
  gancho.add(brilho(box, gAmbar, [0.05, 0.04, 0.05], [0, 0.16, 0]));
  grupo.add(caboG, gancho);
  const eslingas = [0, 1, 2, 3].map(() => part(box, escuro, [1, 1, 1], [0, 0, 0]));
  grupo.add(...eslingas);
  const coneGeo = track(new THREE.ConeGeometry(1, 1, 14, 1, true));
  coneGeo.translate(0, -0.5, 0); // ápice na origem, abre para baixo
  const cone = new THREE.Mesh(coneGeo, aditivo({ color: mix(cores.ambar, white, 0.4), opacity: 0.075, side: THREE.DoubleSide }));
  grupo.add(cone);

  // ---- Andaime (sobe com os módulos, sobre o pódio) -----------------------------------------
  const HX = 1.03;
  const HZ = 0.95;
  const NIVEL = 0.35;
  const POSTES = [[1, 1], [-1, 1], [1, -1], [-1, -1], [0, 1], [0, -1], [1, 0], [-1, 0]];
  const postes = instanciado(box, mat(pv("gray-400"), { roughness: 0.5, metalness: 0.3 }), POSTES.length, torre);
  const tabuas = instanciado(box, mat(mix(pv("yellow-800"), pv("gray-700"), 0.4), { roughness: 0.8 }), 56, torre);
  // Telas de proteção (laranja escuro) nos dois lados que a câmera vê.
  const telaMat = mat(mix(pv("red-700"), pv("yellow-700"), 0.45), { roughness: 0.9, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const telas = instanciado(box, telaMat, 2, torre, false);

  // ---- Poeira, faíscas e o clarão da solda ------------------------------------------------
  const NPO = 14;
  const NFA = 22;
  const matPoeira = mat(mix(pv("gray-500"), cores.roxo, 0.25), { roughness: 1, transparent: true, depthWrite: false });
  const poeira = instanciado(track(new THREE.IcosahedronGeometry(1, 1)), matPoeira, NPO, torre, false);
  const faiscas = instanciado(box, track(new THREE.MeshBasicMaterial({ toneMapped: false })), NFA, torre, false);
  for (let n = 0; n < NFA; n++) faiscas.setColorAt(n, n % 3 ? cores.ambar : white);
  const clarao = halo(mix(cores.ciano, white, 0.6), 0.9, 1);
  torre.add(clarao);

  // ---- Movimento contínuo (update) ---------------------------------------------------------
  let pinAceso = false;
  let letreiroPronto = false;

  // Coloca a peça (posição no mundo).
  const ganchoPos = new THREE.Vector3();
  function pecaEm(p, x, y, z, rot) {
    p.g.visible = true;
    p.g.position.set(x - T.x, y, z - T.z);
    p.g.rotation.y = rot;
    p.g.scale.setScalar(1);
  }
  // Pinta os LEDs de um conjunto segundo k (e devolve se algum mudou).
  function pintarLeds(leds, k) {
    leds.lista.forEach((l, i) => {
      const e = estadoLed(k, l.t0, i + l.t0 * 100);
      leds.mesh.setColorAt(i, e === 0 ? corApagada : e === 2 ? white : l.cor);
    });
    leds.mesh.instanceColor.needsUpdate = true;
  }

  function setProgress(k) {
    grupo.visible = k > 0;
    if (k <= 0) return;

    // Pódio cresce do chão; guindaste sobe no começo e recolhe ao fim.
    const pd = Math.max(suave(trecho(k, 0.005, 0.045)), 0.001);
    podio.scale.set(1, pd, 1);
    ilha.position.y = -0.55 * (1 - suave(trecho(k, 0, 0.03)));
    balsa.position.y = C.y - 0.4 * (1 - suave(trecho(k, 0, 0.02))) + 0.4 * suave(trecho(k, 0.59, 0.63)) * -1;
    balsa.visible = k < 0.63;
    const g = Math.min(suave(trecho(k, 0, 0.05)), 1 - suave(trecho(k, 0.53, 0.59)));
    guindaste.visible = g > 0;
    guindaste.position.y = C.y - (1 - g) * (MASTRO + 0.8);
    const lancaY = guindaste.position.y + MASTRO;

    // Ciclo atual do guindaste.
    const ci = Math.min(NP - 1, Math.max(0, Math.floor((k - A0) / D)));
    const u = k < A0 ? 0 : trecho(k, pecas[ci].a, pecas[ci].a + D);
    let th = thP;
    let r = rP;
    let hookY = 0.001 + pecas[0].h + 0.42;
    let presa = -1;
    for (let i = 0; i < NP; i++) {
      const p = pecas[i];
      const tx = T.x + p.x;
      const tz = T.z + p.z;
      if (i < ci || (i === ci && u >= 0.8)) {
        pecaEm(p, tx, p.y, tz, p.rot);
        continue;
      }
      if (i === ci && k >= A0) {
        presa = i;
        const giro = p.rot + 0.35;
        if (u < 0.18) {
          pecaEm(p, P.x, p.carga * suave(u / 0.18), P.z, giro);
        } else if (u < 0.5) {
          const f = suave((u - 0.18) / 0.32);
          th = lerp(thP, p.thT, f);
          r = lerp(rP, p.rT, f);
          pecaEm(p, C.x + Math.cos(th) * r, p.carga, C.z - Math.sin(th) * r, giro + Math.sin(f * Math.PI) * 0.25);
        } else {
          const e = (u - 0.5) / 0.3;
          th = p.thT;
          r = p.rT;
          pecaEm(p, tx, lerp(p.carga, p.y, assentar(e)), tz, lerp(giro, p.rot, suave(Math.min(e / 0.7, 1))));
        }
        hookY = p.g.position.y + p.h + 0.42;
        continue;
      }
      // Próxima peça esperando no canteiro.
      const chegada = i === 0 ? trecho(k, 0.01, 0.04) : i === ci + 1 && k >= A0 ? trecho(u, 0.45, 0.6) : 0;
      p.g.visible = chegada > 0;
      if (!p.g.visible) continue;
      pecaEm(p, P.x, 0, P.z, p.rot + 0.35);
      p.g.scale.setScalar(Math.max(suave(chegada), 0.001));
    }

    // Solta a peça e volta ao canteiro (ou sobe, depois da última).
    if (k >= A0 && u >= 0.8) {
      const f = suave((u - 0.8) / 0.2);
      const p = pecas[ci];
      const prox = pecas[ci + 1];
      const de = p.y + p.h + 0.42;
      const ate = prox ? prox.h + 0.42 + 0.001 : MASTRO - 0.7;
      th = prox ? lerp(p.thT, thP, f) : p.thT;
      r = prox ? lerp(p.rT, rP, f) : p.rT;
      hookY = lerp(de, ate, f) + Math.sin(f * Math.PI) * 0.6;
    }
    lanca.rotation.y = th;
    carrinho.position.x = r;
    hookY = Math.min(hookY, lancaY - 0.35);
    ganchoPos.set(C.x + Math.cos(th) * r, hookY, C.z - Math.sin(th) * r);
    gancho.visible = caboG.visible = g > 0.6;
    gancho.position.copy(ganchoPos);
    haste(caboG, va.set(ganchoPos.x, lancaY - 0.16, ganchoPos.z), vb.set(ganchoPos.x, hookY + 0.12, ganchoPos.z), 0.03);
    // Refletor do carrinho: cone de luz até um pouco abaixo do moitão.
    cone.visible = gancho.visible && !reducedMotion;
    if (cone.visible) {
      const len = Math.max(lancaY - 0.2 - (hookY - 0.5), 0.2);
      cone.position.set(ganchoPos.x, lancaY - 0.2, ganchoPos.z);
      cone.scale.set(0.12 + len * 0.16, len, 0.12 + len * 0.16);
    }
    const comCarga = presa >= 0 && gancho.visible;
    for (let n = 0; n < 4; n++) {
      const m = eslingas[n];
      m.visible = comCarga;
      if (!comCarga) continue;
      const p = pecas[presa];
      const cx = ((n & 1 ? 1 : -1) * p.wx * 0.46);
      const cz = ((n & 2 ? 1 : -1) * p.wz * 0.46);
      const ry = p.g.rotation.y;
      vb.set(
        T.x + p.g.position.x + cx * Math.cos(ry) + cz * Math.sin(ry),
        p.g.position.y + p.h,
        T.z + p.g.position.z - cx * Math.sin(ry) + cz * Math.cos(ry)
      );
      haste(m, ganchoPos, vb, 0.018);
    }

    // LEDs e janelas: acendem depois que cada peça assenta.
    pintarLeds(ilhaGL, k);
    pintarLeds(podioLeds, k);
    for (const p of pecas) {
      pintarLeds(p.leds, k);
      if (p.vidro) p.vidro.emissiveIntensity = 0.95 * suave(trecho(k, p.assenta + 0.03, p.assenta + 0.13));
    }
    ledsHalo.forEach((h, i) => {
      const e = estadoLed(k, h.l.t0, i * 0.37);
      halos.setColorAt(i, e === 0 ? preto : e === 2 ? white : h.l.cor);
    });
    halos.instanceColor.needsUpdate = true;

    // Andaime: sobe com os módulos e é desmontado de cima para baixo.
    let hS = 0.3;
    for (let i = 0; i < DEFS.length; i++) hS += DEFS[i].h * trecho(k, pecas[i].a + 0.55 * D, pecas[i].a + 0.85 * D);
    hS = Math.min(hS, DEFS[0].h + DEFS[1].h + DEFS[2].h + 0.2);
    hS *= 1 - trecho(k, 0.5, 0.56);
    hS *= trecho(k, 0.03, 0.07);
    const temAndaime = hS > 0.05;
    postes.visible = tabuas.visible = telas.visible = temAndaime;
    if (temAndaime) {
      POSTES.forEach(([x, z], n) => inst(postes, n, x * HX, PODIO_H + hS / 2, z * HZ, 0.04, hS, 0.04));
      postes.count = POSTES.length;
      let n = 0;
      for (let y = NIVEL; y <= hS - 0.05 && n + 4 <= 56; y += NIVEL) {
        const yy = PODIO_H + y;
        inst(tabuas, n++, 0, yy, HZ, 2 * HX + 0.06, 0.03, 0.11);
        inst(tabuas, n++, 0, yy, -HZ, 2 * HX + 0.06, 0.03, 0.11);
        inst(tabuas, n++, HX, yy, 0, 0.11, 0.03, 2 * HZ + 0.06);
        inst(tabuas, n++, -HX, yy, 0, 0.11, 0.03, 2 * HZ + 0.06);
      }
      tabuas.count = n;
      // Tela cobre a metade de baixo do andaime (sul e leste).
      const ht = Math.max(hS * 0.55, 0.01);
      inst(telas, 0, 0.2, PODIO_H + ht / 2, HZ + 0.06, 2 * HX * 0.62, ht, 0.006);
      inst(telas, 1, HX + 0.06, PODIO_H + ht / 2, -0.1, 0.006, ht, 2 * HZ * 0.7);
      telas.count = 2;
      postes.instanceMatrix.needsUpdate = tabuas.instanceMatrix.needsUpdate = telas.instanceMatrix.needsUpdate = true;
    }

    // Duto e conduíte sobem junto com os dois primeiros módulos.
    const hR = PODIO_H + 0.15 + (RISER_TOPO - PODIO_H - 0.15) * suave(trecho(k, pecas[0].assenta, pecas[1].assenta + 0.01));
    const temDuto = k >= pecas[0].assenta - 0.01;
    duto.visible = conduite.visible = temDuto;
    if (temDuto) {
      duto.scale.y = conduite.scale.y = hR;
      duto.position.y = conduite.position.y = hR / 2;
      conduite.material = estadoLed(k, pecas[1].assenta + 0.04, 3) ? gCiano : apagado;
    }
    cabo.visible = caixa.visible = k >= pecas[0].assenta;

    // Poeira e faíscas quando a peça assenta; clarão branco da solda.
    let burst = -1;
    let s = 0;
    for (let i = 0; i < NP; i++) {
      const v = (k - (pecas[i].a + 0.66 * D)) / (0.62 * D);
      if (v >= 0 && v < 1) {
        burst = i;
        s = v;
      }
    }
    poeira.visible = faiscas.visible = burst >= 0;
    clarao.visible = false;
    if (burst >= 0) {
      const p = pecas[burst];
      const hx = p.wx / 2 + 0.06;
      const hz = p.wz / 2 + 0.06;
      const sobe = 1 - (1 - s) * (1 - s);
      const tam = Math.sin(Math.PI * Math.min(s * 1.25, 1));
      for (let n = 0; n < NPO; n++) {
        const ld = n % 4;
        const t = ((n >> 2) + 0.5) / Math.ceil(NPO / 4) - 0.5;
        const nx = ld === 0 ? 1 : ld === 1 ? -1 : 0;
        const nz = ld === 2 ? 1 : ld === 3 ? -1 : 0;
        const out = 0.05 + (0.45 + ruido(n) * 0.35) * sobe;
        const x = nx ? nx * (hx + out) : t * 2 * hx;
        const z = nz ? nz * (hz + out) : t * 2 * hz;
        const e = (0.16 + ruido(n + 7) * 0.12) * (0.4 + 0.6 * sobe);
        inst(poeira, n, p.x + x, p.y + 0.06 + sobe * (0.25 + ruido(n + 3) * 0.25), p.z + z, e, e * 0.75, e, n);
      }
      poeira.count = NPO;
      matPoeira.opacity = 0.45 * tam;
      for (let n = 0; n < NFA; n++) {
        const qx = n % 2 ? 1 : -1;
        const qz = (n >> 1) % 2 ? 1 : -1;
        const vx = qx * (0.4 + ruido(n + 11) * 0.7);
        const vz = qz * (0.4 + ruido(n + 13) * 0.7);
        const vy = 0.6 + ruido(n + 17) * 0.8;
        const e = 0.06 * (1 - s * s);
        inst(faiscas, n, p.x + qx * hx + vx * s, p.y + vy * s - 1.4 * s * s, p.z + qz * hz + vz * s, e, e, e);
      }
      faiscas.count = NFA;
      faiscas.instanceColor.needsUpdate = true;
      poeira.instanceMatrix.needsUpdate = faiscas.instanceMatrix.needsUpdate = true;
      // Clarão: pisca numa quina da fachada sul enquanto solda.
      clarao.visible = s < 0.7 && ruido(Math.floor(s * 14) + burst * 5) > 0.35;
      clarao.position.set(p.x + hx * (burst % 2 ? 1 : -1) * 0.9, p.y + 0.04, p.z + hz);
      clarao.scale.setScalar(0.5 + ruido(Math.floor(s * 14) + 3) * 0.6);
    }

    // Pináculo: segmentos saem um de dentro do outro; estais e luz no fim.
    const pn = suave(trecho(k, 0.535, 0.585));
    pinaculo.visible = k >= pecas[NP - 1].assenta;
    let yAc = 0;
    SEG.forEach((sg, n) => {
      const ext = n === 0 ? 1 : trecho(pn, (n - 1) / (SEG.length - 1), n / (SEG.length - 1));
      const base = yAc - (n === 0 ? 0 : 0.04);
      const hh = n === 0 ? sg.h * Math.max(trecho(pn, 0, 0.2) * 0.5 + 0.5, 0.5) : sg.h * Math.max(ext, 0.001);
      segs[n].position.y = base + hh / 2;
      segs[n].scale.y = hh;
      segs[n].visible = n === 0 || ext > 0;
      yAc = base + hh;
    });
    lampada.position.y = yAc + 0.04;
    haloLamp.position.y = yAc + 0.04;
    anelPin.position.y = SEG[0].h - 0.02;
    pinAceso = k >= 0.592;
    lampada.visible = haloLamp.visible = pinAceso;
    anelPin.material = k >= 0.59 ? gCiano : apagado;
    const temEstais = pn >= 1;
    for (let n = 0; n < 3; n++) {
      estais[n].visible = temEstais;
      if (temEstais) haste(estais[n], va.set(PX, PY + ALT_PIN * 0.82, PZ), ancoras[n], 0.012);
    }

    // Letreiro: a placa sobe do pódio, a moldura liga e as letras vêm uma a uma.
    const pl = suave(trecho(k, T_PLACA[0], T_PLACA[1]));
    placa.visible = pl > 0;
    placa.scale.y = Math.max(pl, 0.001);
    const mo = estadoLed(k, T_MOLDURA, 9);
    for (const m of moldura) m.material = mo === 0 ? apagado : mo === 2 ? gBranco : gMag;
    let acesas = 0;
    letras.forEach((m, i) => {
      m.visible = pl >= 1;
      const e = estadoLed(k, T_LETRA(i), 20 + i);
      m.material.color.copy(e === 0 ? corLetraOff : e === 2 ? corLetraFlash : white);
      if (e === 1) acesas++;
    });
    brilhoPlaca.material.opacity = 0.12 * (mo === 1 ? 1 : 0) + 0.3 * (acesas / LETRAS.length);
    letreiroPronto = acesas === LETRAS.length;
  }

  function update(t) {
    if (reducedMotion) return;
    // Balizamento do guindaste e da antena piscando.
    const pisca = Math.sin(t * 4.2) > -0.2;
    for (const b of balizas) b.visible = pisca;
    if (pinAceso) lampada.visible = haloLamp.visible = Math.sin(t * 3.1 + 1) > -0.35;
    // Letreiro pronto: de vez em quando a 2ª letra dá aquele tremido.
    if (letreiroPronto) {
      const j = Math.floor(t * 9);
      const falha = ruido(j) > 0.93 || (ruido(Math.floor(t * 0.5)) > 0.8 && ruido(j + 1) > 0.6);
      letras[1].material.color.copy(falha ? corLetraOff : white);
    }
  }
  return { setProgress, update };
}
