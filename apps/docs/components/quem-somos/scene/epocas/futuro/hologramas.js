// Vila 2030 — módulo "hologramas" (contrato em futuro/index.js; janela de k
// 0,55–0,92). Tudo é luz desenhada: MeshBasic aditivo, sem luzes reais.
//
//   0,55–0,82  HOLOGRAMA-HERÓI na praça: o projetor sobe do chão, o anel de HUD
//              acende, o feixe sobe e os componentes do Design System (card,
//              botão, toggle e o "S") são traçados em wireframe camada a camada
//   0,60–0,86  placas verticais estreitas nas calçadas acendem letra a letra
//   0,62–0,90  outdoors flutuantes ligam (linha que abre + tremulação)
//   0,82–0,92  letreiro "VILA SEMEC · 2030" na entrada sul (emissores, feixes)
import * as THREE from "three";
import { trecho, assentar } from "../comum";
import { criarPintor } from "./hologramas-tex";

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// "Ligando": pisca forte no começo e firma no fim. Determinístico em u.
const ligando = (u, seed = 0) => {
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  return hash(Math.floor(u * 18) + seed * 31) < 0.3 + 0.7 * u ? 0.55 + 0.45 * u : 0.06;
};
const sobe = (x) => 1 - (1 - x) ** 3;

export function createHologramas({ scene, pal, track, tileToWorld, reducedMotion = false, cores }) {
  const { ciano, magenta, violeta, ambar, verde, roxo } = cores;
  const pinta = criarPintor({ pal, track });
  const raiz = new THREE.Group();
  raiz.visible = false;
  scene.add(raiz);

  const aditivo = (color, extra = {}) =>
    track(
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
        ...extra,
      })
    );
  const linhaMat = (color) =>
    track(new THREE.LineBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const metal = track(new THREE.MeshStandardMaterial({ color: pal.mix(pal.pv("gray-900"), roxo, 0.2), roughness: 0.4, metalness: 0.65 }));
  const caixa = track(new THREE.BoxGeometry(1, 1, 1));
  const plano = track(new THREE.PlaneGeometry(1, 1));
  const scan = pinta.scanlines();
  scan.repeat.set(1, 22);
  const halo = pinta.radial();

  // Brilhos com opacidade-base (setProgress) que o update faz tremular.
  const brilhos = [];
  function brilho(m, tremor = 0.08, seed = brilhos.length) {
    const b = { m, base: 0, tremor, seed };
    brilhos.push(b);
    return b;
  }
  const acende = (b, v) => {
    b.base = v;
    b.m.opacity = v;
  };

  // ---- HOLOGRAMA-HERÓI na praça (tile ~10,11) --------------------------------
  const heroi = new THREE.Group();
  heroi.position.copy(tileToWorld(10, 11)).add(new THREE.Vector3(0.4, 0, 0.35));
  raiz.add(heroi);

  const projetor = new THREE.Group();
  heroi.add(projetor);
  heroi.scale.setScalar(1.15);
  const pedestal = new THREE.Mesh(track(new THREE.CylinderGeometry(0.36, 0.46, 0.16, 28)), metal);
  pedestal.position.y = 0.08;
  pedestal.castShadow = pedestal.receiveShadow = true;
  const colar = new THREE.Mesh(track(new THREE.CylinderGeometry(0.26, 0.3, 0.07, 28)), metal);
  colar.position.y = 0.19;
  const lenteMat = aditivo(ciano, { side: THREE.FrontSide });
  const lente = new THREE.Mesh(track(new THREE.CylinderGeometry(0.15, 0.15, 0.025, 24)), lenteMat);
  lente.position.y = 0.235;
  const aroMat = aditivo(ciano);
  const aro = new THREE.Mesh(track(new THREE.TorusGeometry(0.4, 0.016, 6, 48)), aroMat);
  aro.rotation.x = Math.PI / 2;
  aro.position.y = 0.14;
  projetor.add(pedestal, colar, lente, aro);
  const bLente = brilho(lenteMat, 0.15);
  const bAro = brilho(aroMat, 0.1);

  // Anel de HUD e halo no chão.
  const hudMat = aditivo(ciano, { map: pinta.hudChao(), opacity: 0 });
  const hud = new THREE.Mesh(plano, hudMat);
  hud.rotation.x = -Math.PI / 2;
  hud.position.y = 0.025;
  const haloChaoMat = aditivo(ciano, { map: halo, opacity: 0 });
  const haloChao = new THREE.Mesh(plano, haloChaoMat);
  haloChao.rotation.x = -Math.PI / 2;
  haloChao.position.y = 0.02;
  haloChao.scale.setScalar(2.6);
  heroi.add(haloChao, hud);
  const bHud = brilho(hudMat, 0.1);
  const bHaloChao = brilho(haloChaoMat, 0.12);

  // Feixe: cone aberto (estreito no projetor, largo sob o holograma).
  const H_BASE = 1.05;
  const feixeMat = aditivo(ciano, { map: pinta.feixe(), opacity: 0 });
  const feixeGeo = track(new THREE.CylinderGeometry(0.98, 0.12, 1, 40, 1, true));
  feixeGeo.translate(0, 0.5, 0);
  const feixe = new THREE.Mesh(feixeGeo, feixeMat);
  feixe.position.y = 0.24;
  heroi.add(feixe);
  const bFeixe = brilho(feixeMat, 0.18);

  // Pilha do Design System: camadas horizontais com wireframe e face tingida.
  const holo = new THREE.Group();
  holo.position.y = H_BASE;
  heroi.add(holo);
  function retArred(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // Camada: face (ShapeGeometry com UV 0..1) + arestas em LineSegments
  // (contorno de cima, montantes, contorno de baixo — nessa ordem, para o
  // drawRange "traçar" a peça).
  const camadas = [];
  function camada({ w, h, r, y, mapa, cor, esp = 0.05 }) {
    const forma = retArred(w, h, r);
    const geo = track(new THREE.ShapeGeometry(forma, 6));
    const p = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
    const pts = forma.getPoints(6);
    if (pts[0].distanceTo(pts[pts.length - 1]) < 1e-4) pts.pop();
    const seg = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) seg.push(pts[i].x, pts[i].y, 0, pts[(i + 1) % n].x, pts[(i + 1) % n].y, 0);
    const cantos = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4)];
    for (const i of cantos) seg.push(pts[i].x, pts[i].y, 0, pts[i].x, pts[i].y, -esp);
    for (let i = 0; i < n; i++) seg.push(pts[i].x, pts[i].y, -esp, pts[(i + 1) % n].x, pts[(i + 1) % n].y, -esp);
    const lg = track(new THREE.BufferGeometry());
    lg.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
    const g = new THREE.Group();
    g.rotation.x = -Math.PI / 2;
    g.position.y = y;
    const faceMat = aditivo(cor, { map: mapa, alphaMap: scan, opacity: 0 });
    const face = new THREE.Mesh(geo, faceMat);
    const lm = linhaMat(cor);
    const linhas = new THREE.LineSegments(lg, lm);
    g.add(face, linhas);
    holo.add(g);
    const c = { g, face, linhas, nv: seg.length / 3, bFace: brilho(faceMat, 0.12), bLinha: brilho(lm, 0.08), y };
    camadas.push(c);
    return c;
  }
  const cCard = camada({ w: 1.3, h: 0.9, r: 0.09, y: 0, mapa: pinta.card(), cor: ciano });
  const cBotao = camada({ w: 0.92, h: 0.3, r: 0.15, y: 0.5, mapa: pinta.botao("ACESSAR"), cor: ciano });
  const cToggle = camada({ w: 0.62, h: 0.29, r: 0.145, y: 0.92, mapa: pinta.trilho(), cor: ciano });
  const cLogo = camada({ w: 0.42, h: 0.42, r: 0.08, y: 1.34, mapa: pinta.logo(), cor: ciano });
  cBotao.g.position.z = 0.12;
  cToggle.g.position.x = -0.1;
  // Botão do toggle: disco que desliza e troca de cor (magenta ↔ verde).
  const botaoMat = aditivo(magenta.clone(), { opacity: 0 });
  const knob = new THREE.Mesh(track(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 24)), botaoMat);
  knob.rotation.x = Math.PI / 2;
  knob.position.z = 0.01;
  cToggle.g.add(knob);
  const bKnob = brilho(botaoMat, 0.1);

  // Guias tracejadas de "vista explodida" ligando os cantos das camadas.
  const guiaPts = [];
  for (const [x, z] of [[-0.6, -0.4], [0.6, -0.4], [0.6, 0.4], [-0.6, 0.4]]) guiaPts.push(x, 0, z, x * 0.3, 1.34, z * 0.4);
  const guiaGeo = track(new THREE.BufferGeometry());
  guiaGeo.setAttribute("position", new THREE.Float32BufferAttribute(guiaPts, 3));
  const guiaMat = track(
    new THREE.LineDashedMaterial({ color: ciano, dashSize: 0.05, gapSize: 0.05, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  );
  const guias = new THREE.LineSegments(guiaGeo, guiaMat);
  guias.computeLineDistances();
  holo.add(guias);
  const bGuias = brilho(guiaMat, 0.2);

  // Anéis orbitais magenta e a "varredura" que sobe pela pilha.
  const orbitas = [];
  for (const [r, inc, arco] of [[1.0, 0.3, Math.PI * 1.45], [0.86, -0.45, Math.PI * 0.8]]) {
    const m = aditivo(magenta, { opacity: 0 });
    const o = new THREE.Mesh(track(new THREE.TorusGeometry(r, 0.006, 4, 96, arco)), m);
    const piv = new THREE.Group();
    piv.rotation.z = inc;
    piv.position.y = 0.5;
    o.rotation.x = Math.PI / 2;
    piv.add(o);
    heroi.add(piv);
    orbitas.push({ piv, b: brilho(m, 0.1) });
  }
  // Ponto que corre em cada órbita.
  const satMat = aditivo(pal.white.clone(), { map: halo, opacity: 0 });
  const sats = orbitas.map(({ piv }) => {
    const s = new THREE.Mesh(plano, satMat);
    s.scale.setScalar(0.16);
    piv.add(s);
    return s;
  });
  const bSat = brilho(satMat, 0.2);
  orbitas.forEach((o) => (o.piv.position.y = H_BASE + 0.7));

  const varrMat = aditivo(ciano, { map: halo, opacity: 0 });
  const varredura = new THREE.Mesh(plano, varrMat);
  varredura.rotation.x = -Math.PI / 2;
  varredura.scale.setScalar(1.9);
  holo.add(varredura);
  const bVarr = brilho(varrMat, 0);

  // Partículas subindo no feixe.
  const NP = 36;
  const partPos = new Float32Array(NP * 3);
  const partGeo = track(new THREE.BufferGeometry());
  partGeo.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
  const partMat = track(
    new THREE.PointsMaterial({ color: ciano, map: halo, size: 0.07, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
  );
  const particulas = new THREE.Points(partGeo, partMat);
  particulas.frustumCulled = false;
  heroi.add(particulas);
  const bPart = brilho(partMat, 0);
  function posicionarParticulas(t) {
    for (let i = 0; i < NP; i++) {
      const f = (hash(i) + t * (0.18 + hash(i + 50) * 0.2)) % 1;
      const a = hash(i + 9) * Math.PI * 2 + t * 0.6;
      const r = (0.1 + 0.8 * f) * (0.35 + 0.65 * hash(i + 3));
      partPos[i * 3] = Math.cos(a) * r;
      partPos[i * 3 + 1] = 0.25 + f * 2.1;
      partPos[i * 3 + 2] = Math.sin(a) * r;
    }
    partGeo.attributes.position.needsUpdate = true;
  }
  posicionarParticulas(0);
  // Sem movimento: nada de partículas nem varredura correndo.
  particulas.visible = varredura.visible = !reducedMotion;

  // ---- Outdoors holográficos flutuantes -------------------------------------
  // Pods (pequenos drones-projetores) seguram cada outdoor pelos cantos de cima.
  const OUTDOORS = [
    { tx: 21, ty: 10.8, y: 3.3, w: 2.2, titulo: "ACESSÍVEL", sub: "PARA TODAS AS PESSOAS", cor: magenta, cor2: ciano, ry: 0 },
    { tx: 5.7, ty: 12.4, y: 2.3, w: 1.6, titulo: "2030", sub: "VILA SEMEC", cor: ambar, cor2: magenta, ry: 0.25 },
    { tx: 24.4, ty: 4.6, y: 2.2, w: 1.9, titulo: "TOKENS", sub: "pv-* · CORES · ESPAÇOS", cor: ciano, cor2: violeta, ry: -0.2 },
    { tx: 6.6, ty: 17.6, y: 2.5, w: 1.9, titulo: "WCAG AA", sub: "CONTRASTE 4,5:1", cor: verde, cor2: ciano, ry: 0.12 },
    { tx: 24.2, ty: 18.4, y: 2.4, w: 2.0, titulo: "FOCO VISÍVEL", sub: "NAVEGUE PELO TECLADO", cor: violeta, cor2: ambar, ry: -0.18 },
    { tx: 9.6, ty: 4.3, y: 2.7, w: 1.5, titulo: "SEMEC", sub: "DESIGN SYSTEM", cor: ciano, cor2: magenta, ry: 0.05 },
  ];
  const podMesh = track(new THREE.InstancedMesh(caixa, metal, OUTDOORS.length * 2));
  podMesh.frustumCulled = false;
  raiz.add(podMesh);
  const podLuzMat = aditivo(pal.white.clone(), { map: halo, opacity: 0 });
  const podLuz = track(new THREE.InstancedMesh(plano, podLuzMat, OUTDOORS.length * 2));
  podLuz.frustumCulled = false;
  raiz.add(podLuz);
  const bPodLuz = brilho(podLuzMat, 0.3);
  const m4 = new THREE.Matrix4();
  const qq = new THREE.Quaternion();
  const ee = new THREE.Euler();
  const vp = new THREE.Vector3();
  const vs = new THREE.Vector3();
  const outdoors = OUTDOORS.map((o, i) => {
    const h = o.w * (208 / 512);
    const { normal, defeito } = pinta.outdoor({ titulo: o.titulo, sub: o.sub, cor: o.cor, cor2: o.cor2 });
    const g = new THREE.Group();
    g.position.copy(tileToWorld(o.tx, o.ty)).setY(o.y);
    g.rotation.set(-0.38, o.ry, 0, "YXZ");
    raiz.add(g);
    const mat = aditivo(pal.white.clone(), { map: normal, alphaMap: scan, opacity: 0 });
    const tela = new THREE.Mesh(plano, mat);
    tela.scale.set(o.w, h, 1);
    const linhaMatO = aditivo(o.cor, { opacity: 0 });
    const linha = new THREE.Mesh(plano, linhaMatO);
    linha.scale.set(o.w, 0.025, 1);
    linha.position.z = 0.01;
    // Halo de cor atrás (falso bloom).
    const fundoMat = aditivo(o.cor, { map: halo, opacity: 0 });
    const fundo = new THREE.Mesh(plano, fundoMat);
    fundo.scale.set(o.w * 1.5, h * 2.2, 1);
    fundo.position.z = -0.04;
    g.add(fundo, tela, linha);
    const a = 0.62 + i * 0.045;
    return { o, g, tela, linha, h, normal, defeito, a, b: a + 0.09, bTela: brilho(mat, 0.1, i * 7), bLinha: brilho(linhaMatO, 0), bFundo: brilho(fundoMat, 0.15, i * 3) };
  });
  function posicionarPods(t) {
    let n = 0;
    for (const od of outdoors) {
      const v = od.g.visible ? trecho(od.k ?? 0, 0, 0.35) : 0;
      for (const lado of [-1, 1]) {
        vp.set(lado * (od.o.w / 2 - 0.05), od.h / 2 + 0.09 + Math.sin(t * 2.2 + lado + n) * 0.012, 0).applyEuler(od.g.rotation).add(od.g.position);
        qq.setFromEuler(ee.set(0, od.o.ry, 0));
        m4.compose(vp, qq, vs.set(0.16 * v, 0.07 * v, 0.12 * v));
        podMesh.setMatrixAt(n, m4);
        vp.y -= 0.05;
        m4.compose(vp, qq, vs.setScalar(0.14 * v));
        podLuz.setMatrixAt(n, m4);
        n++;
      }
    }
    podMesh.instanceMatrix.needsUpdate = true;
    podLuz.instanceMatrix.needsUpdate = true;
  }

  // ---- Placas verticais estreitas (estilo Blade Runner, em PT-BR) ----------
  // Poste escuro, braço sobre a calçada e a placa pendurada por dois cabos.
  const PLACAS = [
    { tx: 13, ty: 12, dx: 1, texto: "CAFÉ", rodape: "24H", cor: magenta },
    { tx: 13, ty: 14.4, dx: 1, texto: "PIXEL", rodape: "LOJA", cor: ciano },
    { tx: 10.2, ty: 7, dx: 0.7, texto: "ABERTO", rodape: "", cor: verde },
    { tx: 21, ty: 7, dx: -0.7, texto: "CÓDIGO", rodape: "CURSO", cor: ambar },
    { tx: 11, ty: 17.2, dx: 1, texto: "WI-FI", rodape: "GRÁTIS", cor: violeta },
  ];
  const PW = 0.26;
  const PH = 1.22;
  const P_TOPO = 3.0;
  const placaGeo = track(new THREE.PlaneGeometry(PW, PH));
  placaGeo.translate(0, -PH / 2, 0);
  const estrutura = track(new THREE.InstancedMesh(caixa, metal, PLACAS.length * 5));
  estrutura.castShadow = true;
  estrutura.frustumCulled = false;
  raiz.add(estrutura);
  const placas = PLACAS.map((p, i) => {
    const { tex, passo, topo } = pinta.placa(p);
    tex.repeat.set(1, 1);
    const g = new THREE.Group();
    const base = tileToWorld(p.tx, p.ty);
    g.position.set(base.x + p.dx * 0.6, P_TOPO - 0.16, base.z);
    raiz.add(g);
    const mat = track(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true, opacity: 1 }));
    const face = new THREE.Mesh(placaGeo, mat);
    face.position.z = 0.032;
    const hMat = aditivo(p.cor, { map: halo, opacity: 0 });
    const hal = new THREE.Mesh(plano, hMat);
    hal.scale.set(PW * 4, PH * 1.6, 1);
    hal.position.set(0, -PH / 2, 0.05);
    g.add(face, hal);
    const a = 0.6 + i * 0.045;
    return { p, g, face, tex, passo, topo, base, a, b: a + 0.12, bHal: brilho(hMat, 0.2, i * 5), mat };
  });
  function estruturaPlacas(k) {
    let n = 0;
    const put = (x, y, z, sx, sy, sz) => {
      m4.compose(vp.set(x, y, z), qq.identity(), vs.set(sx, sy, sz));
      estrutura.setMatrixAt(n++, m4);
    };
    for (const pl of placas) {
      const u = trecho(k, pl.a - 0.04, pl.a + 0.03);
      const s = Math.max(u, 0.0001);
      const { x, z } = pl.base;
      const dx = pl.p.dx;
      const alt = P_TOPO * sobe(u);
      put(x, alt / 2, z, 0.07, Math.max(alt, 0.001), 0.07);
      put(x + dx * 0.35, alt - 0.03, z, Math.abs(dx) * 0.7 * s + 0.001, 0.05 * s, 0.05 * s);
      // Cabos.
      const cx = x + dx * 0.6;
      for (const l of [-1, 1]) put(cx + l * PW * 0.38, alt - 0.1, z, 0.012 * s, 0.13 * s, 0.012 * s);
      // Caixa da placa (moldura escura).
      put(cx, alt - 0.16 - PH / 2, z, (PW + 0.07) * s, (PH + 0.07) * s, 0.06 * s);
    }
    estrutura.instanceMatrix.needsUpdate = true;
  }

  // ---- Letreiro "VILA SEMEC · 2030" na entrada sul --------------------------
  const portal = new THREE.Group();
  portal.position.copy(tileToWorld(14.5, 19.5));
  raiz.add(portal);
  const P_LARG = 2.1;
  const L_LARG = 3.0; // o letreiro passa um pouco dos emissores
  const P_ALT = 2.25;
  const emissores = [];
  const feixesP = [];
  const feixePMat = aditivo(ciano, { map: pinta.feixe(), opacity: 0 });
  const bFeixeP = brilho(feixePMat, 0.15);
  const emLuzMat = aditivo(magenta, { opacity: 0 });
  const bEmLuz = brilho(emLuzMat, 0.15);
  for (const lado of [-1, 1]) {
    const em = new THREE.Mesh(track(new THREE.CylinderGeometry(0.09, 0.13, 0.3, 12)), metal);
    em.position.set(lado * (P_LARG / 2 + 0.05), 0.15, 0);
    em.castShadow = true;
    const ponta = new THREE.Mesh(track(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12)), emLuzMat);
    ponta.position.y = 0.16;
    em.add(ponta);
    portal.add(em);
    emissores.push(em);
    const f = new THREE.Mesh(track(new THREE.CylinderGeometry(0.035, 0.06, 1, 10, 1, true)), feixePMat);
    portal.add(f);
    feixesP.push({ f, lado });
  }
  const letMat = aditivo(pal.white.clone(), { map: pinta.letreiro("VILA SEMEC · 2030", ciano, magenta), alphaMap: scan, opacity: 0 });
  const letreiro = new THREE.Mesh(plano, letMat);
  letreiro.position.y = P_ALT;
  letreiro.rotation.x = -0.32;
  portal.add(letreiro);
  const bLet = brilho(letMat, 0.08, 99);
  const letFundoMat = aditivo(ciano, { map: halo, opacity: 0 });
  const letFundo = new THREE.Mesh(plano, letFundoMat);
  letFundo.position.set(0, P_ALT, -0.05);
  letFundo.rotation.x = -0.32;
  letFundo.scale.set(L_LARG * 1.3, 1.2, 1);
  portal.add(letFundo);
  const bLetFundo = brilho(letFundoMat, 0.15, 98);

  // ---- Progresso -------------------------------------------------------------
  let kAtual = 0;
  function setProgress(k) {
    kAtual = k;
    raiz.visible = k > 0;
    if (!raiz.visible) return;

    // Herói: projetor sobe do chão.
    const pj = trecho(k, 0.55, 0.6);
    projetor.visible = pj > 0;
    projetor.position.y = -0.25 * (1 - assentar(pj));
    acende(bAro, ligando(trecho(k, 0.58, 0.62), 1));
    acende(bLente, ligando(trecho(k, 0.59, 0.63), 2));
    const hudU = trecho(k, 0.6, 0.66);
    acende(bHud, 0.85 * ligando(hudU, 3));
    hud.scale.setScalar(1.7 * (0.3 + 0.7 * sobe(hudU)) + 0.001);
    acende(bHaloChao, 0.55 * hudU);
    // Feixe sobe.
    const fU = trecho(k, 0.62, 0.68);
    feixe.visible = fU > 0;
    feixe.scale.set(0.2 + 0.8 * sobe(fU), Math.max(fU, 0.001) * (H_BASE - 0.24), 0.2 + 0.8 * sobe(fU));
    acende(bFeixe, ligando(fU, 4));
    // Camadas: arestas traçadas, depois a face acende com tremulação.
    camadas.forEach((c, i) => {
      const a = 0.65 + i * 0.035;
      const tr = trecho(k, a, a + 0.04);
      c.g.visible = tr > 0;
      c.linhas.geometry.setDrawRange(0, Math.floor((c.nv * tr) / 2) * 2);
      acende(c.bLinha, tr > 0 ? 1 : 0);
      acende(c.bFace, 0.95 * ligando(trecho(k, a + 0.03, a + 0.07), 10 + i));
      c.g.position.y = c.y + 0.25 * (1 - sobe(tr));
    });
    acende(bKnob, ligando(trecho(k, 0.75, 0.79), 20));
    acende(bGuias, 0.6 * trecho(k, 0.76, 0.8));
    const orb = trecho(k, 0.76, 0.82);
    orbitas.forEach((o, i) => {
      o.piv.visible = orb > 0;
      o.piv.scale.setScalar(0.4 + 0.6 * sobe(orb));
      acende(o.b, 0.45 * ligando(orb, 30 + i));
    });
    acende(bSat, orb);
    acende(bPart, 0.8 * trecho(k, 0.68, 0.75));
    acende(bVarr, 0.35 * trecho(k, 0.7, 0.76));

    // Outdoors: linha horizontal que abre, depois o quadro, com tremulação.
    for (const od of outdoors) {
      const u = trecho(k, od.a, od.b);
      od.k = u;
      od.g.visible = u > 0;
      if (!od.g.visible) continue;
      const lx = sobe(trecho(u, 0, 0.35));
      const ly = sobe(trecho(u, 0.35, 0.7));
      od.tela.scale.set(od.o.w * Math.max(lx, 0.001), od.h * Math.max(ly, 0.02), 1);
      od.linha.scale.x = od.o.w * Math.max(lx, 0.001);
      od.linha.position.y = (od.h / 2) * ly;
      acende(od.bLinha, u < 1 ? 1 - trecho(u, 0.6, 1) : 0);
      acende(od.bTela, (ly > 0 ? 1 : 0.4) * ligando(trecho(u, 0.2, 1), od.a * 100));
      acende(od.bFundo, 0.35 * ly);
      od.tela.material.map = od.normal;
    }
    acende(bPodLuz, outdoors.some((od) => od.g.visible) ? 1 : 0);
    posicionarPods(0);

    // Placas: poste sobe, braço estende e as letras acendem de cima para baixo.
    estruturaPlacas(k);
    for (const pl of placas) {
      const u = trecho(k, pl.a + 0.03, pl.b);
      pl.g.visible = trecho(k, pl.a - 0.04, pl.a + 0.03) >= 1;
      const nl = [...pl.p.texto].length;
      const letras = Math.min(nl, Math.floor(u * (nl + 1.5)));
      // Fração visível: topo + letras acesas (o rodapé entra no fim).
      const s = u >= 1 ? 1 : Math.max(0.001, pl.topo + letras * pl.passo);
      pl.face.scale.y = s;
      pl.tex.repeat.y = s;
      pl.tex.offset.y = 1 - s;
      pl.face.visible = u > 0;
      pl.mat.opacity = u > 0 ? (u >= 1 ? 1 : 0.6 + 0.4 * ligando(u, pl.a * 50)) : 0;
      acende(pl.bHal, 0.4 * trecho(u, 0.3, 1));
    }

    // Portal: emissores sobem, feixes disparam, letreiro abre do centro.
    const e = trecho(k, 0.82, 0.85);
    portal.visible = e > 0;
    for (const em of emissores) em.position.y = 0.15 - 0.32 * (1 - assentar(e));
    acende(bEmLuz, ligando(trecho(k, 0.84, 0.86), 40));
    const fp = trecho(k, 0.84, 0.88);
    for (const { f, lado } of feixesP) {
      const alt = Math.max(fp, 0.001) * (P_ALT - 0.32);
      f.scale.y = alt;
      f.position.set(lado * (P_LARG / 2 + 0.05), 0.32 + alt / 2, 0);
      f.visible = fp > 0;
    }
    acende(bFeixeP, 0.8 * fp);
    const lt = trecho(k, 0.87, 0.92);
    letreiro.visible = lt > 0;
    letreiro.scale.set(L_LARG * Math.max(sobe(trecho(lt, 0, 0.5)), 0.001), ((L_LARG * 192) / 1024) * Math.max(trecho(lt, 0.4, 0.8), 0.03), 1);
    acende(bLet, ligando(lt, 41));
    acende(bLetFundo, 0.3 * lt);
  }

  // ---- Movimento contínuo ----------------------------------------------------
  const TOGGLE_X = 0.62 / 2 - 0.145;
  function update(t) {
    if (reducedMotion) {
      // Estado parado bonito: pilha num ângulo de 3/4, toggle ligado.
      holo.rotation.y = 0.55;
      knob.position.x = TOGGLE_X;
      botaoMat.color.copy(verde);
      orbitas.forEach((o, i) => (o.piv.rotation.y = i * 1.3));
      sats.forEach((s, i) => s.position.set(Math.cos(i * 2) * (i ? 0.86 : 1.0), 0, Math.sin(i * 2) * (i ? 0.86 : 1.0)));
      varredura.position.y = 0.5;
      posicionarPods(0);
      return;
    }
    // Tremulação geral e um "engasgo" de vez em quando.
    const engasgo = hash(Math.floor(t * 7)) > 0.93;
    for (const b of brilhos) {
      if (b.base <= 0) continue;
      const f = 1 - b.tremor * (0.5 + 0.5 * Math.sin(t * 43 + b.seed * 2.1)) * (0.6 + 0.4 * Math.sin(t * 7.3 + b.seed));
      b.m.opacity = b.base * f;
    }
    // Herói.
    holo.rotation.y = t * 0.45;
    holo.position.x = engasgo ? (hash(t) - 0.5) * 0.06 : 0;
    holo.position.y = H_BASE + Math.sin(t * 1.3) * 0.04;
    if (engasgo) for (const c of camadas) c.face.material.opacity *= 0.45;
    cLogo.g.rotation.z = -t * 1.1; // gira ao contrário da pilha
    hud.rotation.z = t * 0.25;
    // Toggle liga e desliga a cada ~2,4 s, com deslize suave.
    const ciclo = (t % 4.8) / 4.8;
    const on = sobe(trecho(ciclo, 0.1, 0.2)) - sobe(trecho(ciclo, 0.6, 0.7));
    knob.position.x = TOGGLE_X * (on * 2 - 1);
    botaoMat.color.copy(magenta).lerp(verde, on);
    orbitas.forEach((o, i) => (o.piv.rotation.y = t * (i ? -0.8 : 0.55)));
    sats.forEach((s, i) => {
      const r = i ? 0.86 : 1.0;
      const a = t * (i ? 1.7 : 1.2);
      s.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      s.quaternion.copy(s.parent.getWorldQuaternion(qq).invert());
    });
    varredura.position.y = ((t * 0.55) % 1.8) - 0.15;
    posicionarParticulas(t);
    // Outdoors: flutuam e, de vez em quando, dão defeito (RGB + faixas).
    for (const od of outdoors) {
      if (!od.g.visible) continue;
      const seed = od.a * 100;
      const def = (od.k ?? 0) >= 1 && hash(Math.floor(t * 5) + seed) > 0.92;
      od.tela.material.map = def ? od.defeito : od.normal;
      od.tela.position.x = def ? (hash(t + seed) - 0.5) * 0.08 : 0;
      od.g.position.y = od.o.y + Math.sin(t * 1.1 + seed) * 0.05;
    }
    posicionarPods(t);
    // Placas: uma letra "queimada" pisca de vez em quando.
    for (const pl of placas) {
      if (!pl.face.visible || kAtual < pl.b) continue;
      pl.mat.opacity = hash(Math.floor(t * 9) + pl.a * 50) > 0.95 ? 0.55 : 1;
    }
    scan.offset.y = (-t * 0.9) % 1;
  }
  return { setProgress, update };
}
