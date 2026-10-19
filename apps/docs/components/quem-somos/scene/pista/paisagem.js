// Pista de bicicleta da Vila SEMEC: a paisagem (dono: zona "paisagem" — o
// retângulo D de zonas.js e tudo que sobra longe da pista: margens do
// mapa, além da cerca e o horizonte).
//
// O que tem (peças em paisagem-moldes.js):
// - Vegetação de Porto Velho: ipês floridos (amarelo, roxo, rosa e branco,
//   com o tapete de pétalas), castanheiras, árvores redondas, buritis,
//   açaizeiros, arbustos (com e sem flor), flores, tufos de capim e pedras.
//   Rala dentro da cerca (é onde a câmera olha; mais rala ainda perto da
//   pista) e densa além dela. Toda árvore respeita zonas.alturaMax (a câmera
//   vem do sul: nada alto logo ao sul do asfalto), zonas.livre, as reservas
//   dos outros módulos (ctx.ocupado) e só fica em naZona("paisagem").
// - Zona D (miolo do "U"): o lago com vitórias-régias, juncos e patos
//   nadando, o igarapé que desce até o rio com a pontezinha de madeira, o
//   deque com o pescador (a vara balança), a canoa, o caminho de terra com
//   bancos e a placa da pista.
// - Norte, dentro da cerca: o trilho da Estrada de Ferro Madeira-Mamoré com
//   a locomotiva (soltando fumaça), o vagão e a estação com a placa SEMEC.
// - Horizonte (a câmera vê o norte sem tapar nada): as Três Caixas d'Água
//   logo além da cerca, o Rio Madeira (barrento, com um barco regional), a
//   mata da outra margem e morros ao longe (a névoa apaga o que é longe).
// - Animação: folhas balançando (shader), nuvens passando, bandos de araras
//   e periquitos, borboletas nas flores, patos e a fumaça da locomotiva.
//   Com reducedMotion tudo fica parado numa pose.
//
// Desempenho: uma geometria só para tudo que é fixo e fica dentro da cerca
// (com sombra; 2 draw calls), outra para o horizonte e o chão (lago, rio,
// caminho, capim; sem sombra; 1 draw call) e três InstancedMesh animados
// (nuvens + fumaça, aves + borboletas, patos). No `lite`: metade da mata e
// do capim, menos nuvens e aves, sem borboletas e sem sombra.
//
// Monta por ÚLTIMO: desvia de tudo que os outros módulos reservaram.
// Contrato em comum.js. Evento: update (animação).

import * as THREE from "three";
import { MH, MW } from "./circuito";
import { GX0, GX1, wx, wz } from "./comum";
import { bx, cil, criarMaterialBalanco, criarMoldes, criarMontador, geoInstancia, ico, molde } from "./paisagem-moldes";

// Cerca do mapa (a mesma de beira.js): x 0,6 .. MW-1,6, y 0,6 .. MH-0,9.
const CERCA = { x0: 0.6, x1: MW - 1.6, y0: 0.6, y1: MH - 0.9 };
// Lago da zona D (tiles): centro e raios.
const LAGO = { x: 44.5, y: 16.5, rx: 3.6, ry: 4.2 };
// Rio Madeira ao norte (faixa de y, tiles) e as margens de areia.
const RIO = { y0: -9.4, y1: -4.6 };
// Ponte sobre o igarapé (y do caminho) e o trilho da Madeira-Mamoré.
const Y_PONTE = 7.2;
// A câmera alta só mostra uns 7 tiles ao norte do jogador (o que fica além
// some acima da borda da tela): os marcos ficam logo ao norte da pista,
// dentro da cerca — o trem e a estação ao norte do grampo, as caixas d'água
// ao norte do "alto".
const TRILHO = { x0: 49.5, x1: 83, y: 6.2 };
const ESTACAO = { x0: 70.5, x1: 75.5, y0: 4.25, y1: 5.15 };
const LOCO = { x: 58.6, y: 6.2 };
const CAIXAS = [[20.6, 2.6], [23.7, 1.95], [26.8, 2.6]];

// Linha do igarapé: do lago (y 13) até o rio, serpenteando.
const xIgarape = (y) => LAGO.x + 0.55 * Math.sin(y * 0.55);

export function montarPaisagem(ctx) {
  const { pv, mix, white, cor, lite, reducedMotion, c, zonas, root, track } = ctx;
  const rand = ctx.semente(20261020);
  const R = (a, b) => a + rand() * (b - a);

  // ---- Cores (todas de tokens) ----------------------------------------------------
  const agua = mix(pv("blue-500"), pv("green-600"), 0.3);
  // Rio Madeira: barrento ("café com leite"), puxando para o verde.
  const rio = mix(mix(pv("yellow-800"), pv("gray-500"), 0.35), pv("green-700"), 0.18);
  const k = {
    tronco: cor.madeira,
    troncoClaro: mix(cor.madeira, pv("gray-400"), 0.4),
    troncoPalm: mix(pv("gray-500"), pv("yellow-800"), 0.4),
    folhaA: cor.folhaA,
    folhaB: cor.folhaB,
    folhaClara: mix(pv("green-600"), pv("yellow-400"), 0.22),
    palha: mix(pv("yellow-800"), pv("gray-400"), 0.3),
    cocoBuriti: mix(pv("red-800"), pv("yellow-800"), 0.5),
    acai: mix(pv("red-900"), pv("blue-950"), 0.5),
    petala: mix(white, cor.gramaA, 0.55),
    caule: mix(pv("green-600"), pv("green-800"), 0.4),
    miolo: pv("yellow-500"),
    taboa: mix(pv("yellow-800"), pv("gray-800"), 0.35),
    vitoria: mix(pv("green-600"), pv("green-500"), 0.4),
    vitoriaBorda: mix(pv("green-700"), pv("red-700"), 0.4),
    agua,
    aguaClara: mix(agua, white, 0.16),
    aguaFunda: mix(pv("blue-700"), pv("green-700"), 0.3),
    rio,
    rioClaro: mix(rio, white, 0.14),
    rioFundo: mix(rio, pv("green-800"), 0.07),
    areia: mix(pv("yellow-400"), pv("gray-200"), 0.55),
    areiaEsc: mix(mix(pv("yellow-400"), pv("gray-200"), 0.55), pv("yellow-800"), 0.25),
    terra: mix(cor.terra, pv("yellow-400"), 0.18),
    brita: mix(pv("gray-400"), cor.terra, 0.35),
    madeira: mix(pv("yellow-800"), pv("yellow-400"), 0.35),
    madeiraEsc: mix(pv("yellow-800"), pv("gray-700"), 0.35),
    metal: pv("gray-600"),
    metalEsc: pv("gray-800"),
    caixa: mix(pv("gray-500"), pv("red-800"), 0.15),
    caixaFaixa: mix(pv("gray-300"), white, 0.3),
    ferrugem: mix(pv("red-800"), pv("yellow-800"), 0.45),
    preto: mix(pv("gray-900"), pv("gray-950"), 0.5),
    vermelho: pv("red-700"),
    latao: mix(pv("yellow-600"), pv("yellow-800"), 0.25),
    creme: mix(pv("yellow-400"), white, 0.6),
    telha: mix(pv("red-700"), pv("yellow-800"), 0.25),
    janela: mix(pv("blue-900"), pv("gray-800"), 0.3),
    pele: cor.pele[1],
    camisa: pv("blue-700"),
    calca: mix(pv("blue-900"), pv("gray-700"), 0.4),
    chapeu: mix(pv("yellow-400"), white, 0.3),
    bico: mix(pv("yellow-500"), pv("red-500"), 0.45),
    asaAzul: pv("blue-700"),
    asaAmarela: pv("yellow-500"),
    barco: mix(white, pv("gray-100"), 0.3),
    morro: [mix(pv("green-700"), pv("blue-700"), 0.22), mix(pv("green-800"), pv("blue-800"), 0.18), mix(pv("green-600"), pv("blue-600"), 0.32)],
  };
  const M = criarMoldes(ctx, k);

  // Material único (balanço no shader); uT anda no update.
  const uT = { value: 0 };
  const mat = track(criarMaterialBalanco(uT));
  const perto = criarMontador(); // dentro da cerca: com sombra
  const fundo = criarMontador(); // horizonte e chão: sem sombra

  // ---- Utilidades -------------------------------------------------------------------
  const _q = new THREE.Quaternion();
  const _e = new THREE.Euler();
  const _p = new THREE.Vector3();
  const _s = new THREE.Vector3();
  // Matriz no tile (x, y), altura h, giro em Y, escala s (sy na vertical).
  const mt = (x, y, h = 0, giro = 0, s = 1, sy = s) => new THREE.Matrix4().compose(_p.set(wx(x), h, wz(y)), _q.setFromEuler(_e.set(0, giro, 0)), _s.set(s, sy, s));
  const dentroMapa = (x, y) => x > -0.5 && x < MW - 0.5 && y > -0.5 && y < MH - 0.5;
  const dentroCerca = (x, y) => x > CERCA.x0 && x < CERCA.x1 && y > CERCA.y0 && y < CERCA.y1;
  // Altura do chão: o gramado do mapa está em 0, o de fora em -0,02.
  const chao = (x, y) => (dentroMapa(x, y) ? 0 : -0.02);
  // Em cima da cerca (mourões e réguas)?
  const naCerca = (x, y, r) => {
    const f = r * 0.7 + 0.25;
    const vx = y > CERCA.y0 - f && y < CERCA.y1 + f;
    const vy = x > CERCA.x0 - f && x < CERCA.x1 + f;
    return (vx && (Math.abs(x - CERCA.x0) < f || Math.abs(x - CERCA.x1) < f)) || (vy && (Math.abs(y - CERCA.y0) < f || Math.abs(y - CERCA.y1) < f));
  };
  const distSeg = (x, y, ax, ay, bx2, by) => {
    const ex = bx2 - ax;
    const ey = by - ay;
    const u = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1)));
    return Math.hypot(x - ax - ex * u, y - ay - ey * u);
  };

  // Área nossa ocupada (lago, igarapé, caminhos, ponte, deque, trilho,
  // estação, caixas d'água, rio, estradinha): nada de árvore em cima.
  const bloqueios = [];
  const bloquearRet = (x0, x1, y0, y1) => bloqueios.push((x, y, r) => x + r > x0 && x - r < x1 && y + r > y0 && y - r < y1);
  const bloquearCirc = (cx, cy, rr) => bloqueios.push((x, y, r) => Math.hypot(x - cx, y - cy) < rr + r);
  const bloquearLinha = (pts, larg) =>
    bloqueios.push((x, y, r) => {
      for (let i = 0; i < pts.length - 1; i++) if (distSeg(x, y, ...pts[i], ...pts[i + 1]) < larg + r) return true;
      return false;
    });
  const bloqueado = (x, y, r) => bloqueios.some((f) => f(x, y, r));

  // Plantados (grade de 2 tiles) para nada nascer em cima do outro.
  const grade = new Map();
  const colide = (x, y, r) => {
    const gx = Math.floor(x / 2);
    const gy = Math.floor(y / 2);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (const o of grade.get(`${gx + dx},${gy + dy}`) ?? []) if (Math.hypot(o.x - x, o.y - y) < (o.r + r) * 0.8) return true;
      }
    }
    return false;
  };
  const marcar = (x, y, r) => {
    const ch = `${Math.floor(x / 2)},${Math.floor(y / 2)}`;
    if (!grade.has(ch)) grade.set(ch, []);
    grade.get(ch).push({ x, y, r });
  };

  // Pode pôr um objeto de raio r e altura h no ponto (x, y)? Dentro do mapa:
  // só na nossa zona (centro e bordas), fora do traçado com folga, longe do
  // que os outros reservaram e sem passar de alturaMax.
  const pode = (x, y, r, h) => {
    if (naCerca(x, y, r) || bloqueado(x, y, r) || colide(x, y, r)) return false;
    if (dentroMapa(x, y)) {
      for (const [dx, dy] of [[0, 0], [r * 0.7, 0], [-r * 0.7, 0], [0, r * 0.7], [0, -r * 0.7]]) {
        const px = x + dx;
        const py = y + dy;
        if (!dentroMapa(px, py)) continue;
        if (!zonas.naZona("paisagem", px, py) || ctx.ocupado(px, py)) return false;
      }
      if (!zonas.livre(x, y, r)) return false;
    }
    return h <= zonas.alturaMax(x, y);
  };

  // ---- Tipos de vegetação -------------------------------------------------------------
  const verde = () => mix(white, rand() < 0.5 ? pv("yellow-400") : pv("blue-200"), rand() * 0.25);
  const corIpe = () => {
    const p = rand();
    if (p < 0.46) return mix(pv("yellow-500"), pv("yellow-400"), rand() * 0.6);
    if (p < 0.8) return mix(mix(pv("red-400"), pv("blue-700"), 0.42), white, 0.1 + rand() * 0.12);
    if (p < 0.92) return mix(pv("red-300"), white, 0.3 + rand() * 0.1);
    return mix(white, pv("yellow-400"), 0.08);
  };
  const CORES_FLOR = [pv("yellow-500"), mix(mix(pv("red-400"), pv("blue-700"), 0.45), white, 0.2), white, mix(pv("red-300"), white, 0.25), mix(pv("yellow-500"), pv("red-500"), 0.35), pv("blue-300"), pv("red-500")];
  const corFlor = () => CORES_FLOR[Math.floor(rand() * CORES_FLOR.length)];
  const TIPOS = {
    ipe: { m: M.ipe, r: 0.8, H: 2.15, tint: corIpe, amp: 0.05 },
    castanheira: { m: M.castanheira, r: 0.95, H: 3.55, tint: verde, amp: 0.04 },
    redonda: { m: M.redonda, r: 0.68, H: 1.75, tint: verde, amp: 0.05 },
    buriti: { m: M.buriti, r: 0.7, H: 2.85, tint: verde, amp: 0.07 },
    acai: { m: M.acai, r: 0.5, H: 2.4, tint: null, amp: 0.08 },
    arbusto: { m: M.arbusto, r: 0.42, H: 0.62, tint: verde, amp: 0.03 },
    arbustoFlor: { m: M.arbustoFlor, r: 0.42, H: 0.62, tint: corFlor, amp: 0.03 },
  };
  const sortear = (pesos) => {
    let tot = 0;
    for (const p of Object.values(pesos)) tot += p;
    let v = rand() * tot;
    for (const [t, p] of Object.entries(pesos)) {
      v -= p;
      if (v <= 0) return t;
    }
    return Object.keys(pesos)[0];
  };
  // Põe o tipo no ponto se couber (tenta escalas menores e, por fim, um
  // arbusto). Dentro da cerca vai para `perto` (com sombra); fora, `fundo`.
  const plantar = (tipo, x, y, { s0 = 0.82, s1 = 1.22, recuo = true } = {}) => {
    let t = TIPOS[tipo];
    let s = R(s0, s1);
    if (!pode(x, y, t.r * s, t.H * s)) {
      s = s0 * 0.85;
      if (!pode(x, y, t.r * s, t.H * s)) {
        if (!recuo) return false;
        t = rand() < 0.4 ? TIPOS.arbustoFlor : TIPOS.arbusto;
        s = R(0.8, 1.1);
        if (!pode(x, y, t.r * s, t.H * s)) return false;
      }
    }
    marcar(x, y, t.r * s);
    const alvo = dentroCerca(x, y) ? perto : fundo;
    alvo.por(t.m, mt(x, y, chao(x, y), rand() * Math.PI * 2, s), { tint: t.tint?.(), amp: t.amp, fase: rand() * 6.28, s });
    return true;
  };
  // Detalhe miúdo de chão (capim, flor, pedra, junco): sempre em `fundo`.
  const miudo = (m, x, y, { s = 1, tint = null, amp = 0.025, r = 0.15 } = {}) => {
    if (!pode(x, y, r, 0.4)) return false;
    fundo.por(m, mt(x, y, chao(x, y), rand() * Math.PI * 2, s), { tint, amp, fase: rand() * 6.28, s });
    return true;
  };

  // ---- Chão: triângulos e fitas ---------------------------------------------------
  const P3 = (x, y, h) => [wx(x), h, wz(y)];
  // Elipse em leque (facetas alternando a cor: água low-poly).
  const elipse = (alvo, cx, cy, rx, ry, h, cr, n = 18, varia = 0) => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      alvo.triChao(P3(cx, cy, h), P3(cx + rx * Math.cos(a0), cy + ry * Math.sin(a0), h), P3(cx + rx * Math.cos(a1), cy + ry * Math.sin(a1), h), varia && i % 2 ? mix(cr, white, varia) : cr);
    }
  };
  // Fita ao longo de uma linha de pontos (caminho, igarapé), com juntas
  // redondas; `h` pode ser função de (x, y).
  const fita = (alvo, pts, larg, h, cr) => {
    const hh = typeof h === "function" ? h : () => h;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx2, by] = pts[i + 1];
      const l = Math.hypot(bx2 - ax, by - ay) || 1;
      const px = (-(by - ay) / l) * (larg / 2);
      const py = ((bx2 - ax) / l) * (larg / 2);
      const ha = hh(ax, ay);
      const hb = hh(bx2, by);
      const a1 = P3(ax + px, ay + py, ha);
      const a2 = P3(ax - px, ay - py, ha);
      const b1 = P3(bx2 + px, by + py, hb);
      const b2 = P3(bx2 - px, by - py, hb);
      alvo.triChao(a1, b1, b2, cr);
      alvo.triChao(a1, b2, a2, cr);
      if (i > 0) elipse(alvo, ax, ay, larg / 2, larg / 2, ha, cr, 6);
    }
  };

  // ---- Zona D: lago, igarapé, ponte, deque, caminho ----------------------------------
  // Lago: margem de areia, água em facetas e o fundo mais escuro.
  elipse(fundo, LAGO.x, LAGO.y, LAGO.rx + 0.5, LAGO.ry + 0.5, 0.008, k.areia, 20, 0.06);
  elipse(fundo, LAGO.x, LAGO.y, LAGO.rx, LAGO.ry, 0.016, k.agua, 20, 0.07);
  elipse(fundo, LAGO.x + 0.2, LAGO.y + 0.2, LAGO.rx * 0.55, LAGO.ry * 0.55, 0.019, k.aguaFunda, 12, 0.05);
  bloqueios.push((x, y, r) => ((x - LAGO.x) / (LAGO.rx + 0.6 + r)) ** 2 + ((y - LAGO.y) / (LAGO.ry + 0.6 + r)) ** 2 < 1);

  // Igarapé: do lago até o rio (passa por baixo da cerca).
  const igarape = [];
  for (let y = LAGO.y - LAGO.ry + 0.6; y > RIO.y1 - 0.7; y -= 0.8) igarape.push([xIgarape(y), y]);
  const hRio = (x, y) => (dentroMapa(x, y) ? 0.016 : -0.006);
  fita(fundo, igarape, 1.5, (x, y) => (dentroMapa(x, y) ? 0.008 : -0.012), k.areia);
  fita(fundo, igarape, 0.85, hRio, k.agua);
  bloquearLinha(igarape, 0.85);

  // Caminho de terra: entra pelo sul da zona D, contorna o lago pelo oeste,
  // cruza o igarapé na ponte e segue para o leste até a estação.
  const xp = xIgarape(Y_PONTE);
  const caminhoOeste = [[44.6, 26.6], [43.4, 23.6], [40.6, 21.7], [39.7, 17.2], [40.0, 12.8], [41.5, 9.6], [xp - 1.25, Y_PONTE]];
  const caminhoLeste = [[xp + 1.25, Y_PONTE], [48.6, 7.3], [55, 7.35], [62, 7.3], [69.4, 7.15], [70.6, 6.3], [71.1, 5.6]];
  fita(fundo, caminhoOeste, 0.7, 0.012, k.terra);
  fita(fundo, caminhoLeste, 0.7, 0.012, k.terra);
  bloquearLinha(caminhoOeste, 0.45);
  bloquearLinha(caminhoLeste, 0.45);

  // Ponte em arco (tábuas seguindo o arco, corrimão dos dois lados).
  {
    const partes = [];
    const arco = (u) => 0.1 + 0.34 * (1 - u * u); // u em -1..1
    const NT = 7;
    for (let i = 0; i < NT; i++) {
      const u0 = -1 + (2 * i) / NT;
      const u1 = -1 + (2 * (i + 1)) / NT;
      const x0 = u0 * 1.25;
      const x1 = u1 * 1.25;
      const ang = Math.atan2(arco(u1) - arco(u0), x1 - x0);
      partes.push([bx(Math.hypot(x1 - x0, arco(u1) - arco(u0)) + 0.02, 0.06, 0.8, 0, 0, 0).rotateZ(ang).translate((x0 + x1) / 2, (arco(u0) + arco(u1)) / 2, 0), i % 2 ? k.madeira : k.madeiraEsc, 0]);
      for (const z of [-0.37, 0.37]) {
        partes.push([bx(Math.hypot(x1 - x0, arco(u1) - arco(u0)) + 0.02, 0.04, 0.04, 0, 0, 0).rotateZ(ang).translate((x0 + x1) / 2, (arco(u0) + arco(u1)) / 2 + 0.32, z), k.madeiraEsc, 0]);
      }
    }
    for (const u of [-1, -0.33, 0.33, 1]) for (const z of [-0.37, 0.37]) partes.push([bx(0.05, 0.36, 0.05, u * 1.2, arco(Math.max(-1, Math.min(1, u))) + 0.16, z), k.madeiraEsc, 0]);
    perto.por(molde(partes), mt(xp, Y_PONTE, 0));
    bloquearRet(xp - 1.4, xp + 1.4, Y_PONTE - 0.5, Y_PONTE + 0.5);
  }

  // Deque no lado leste do lago, com o pescador sentado na ponta.
  {
    const DX0 = 46.0;
    const DX1 = 48.9;
    const DY = 17.45;
    const partes = [];
    const NP = 6;
    for (let i = 0; i < NP; i++) {
      const x0 = DX0 + ((DX1 - DX0) * i) / NP;
      const x1 = DX0 + ((DX1 - DX0) * (i + 1)) / NP - 0.03;
      partes.push([bx(x1 - x0, 0.06, 0.9, (x0 + x1) / 2 - DX0, 0.17, 0), i % 2 ? k.madeira : mix(k.madeira, k.madeiraEsc, 0.35), 0]);
    }
    for (const x of [0.08, 1.4, 2.8]) for (const z of [-0.4, 0.4]) partes.push([bx(0.08, 0.3, 0.08, x, 0.05, z), k.madeiraEsc, 0]);
    perto.por(molde(partes), mt(DX0, DY, 0));
    bloquearRet(DX0 - 0.2, DX1, DY - 0.5, DY + 0.5);

    // Pescador (de frente para o oeste, pernas para fora do deque): chapéu
    // de palha, camisa azul SEMEC, vara que balança e a boia vermelha.
    const pes = [
      [bx(0.22, 0.08, 0.26, 0, 0.04, 0.05), k.calca, 0],
      [bx(0.2, 0.26, 0.08, 0, -0.1, 0.2), k.calca, 0],
      [bx(0.26, 0.3, 0.15, 0, 0.23, -0.06), k.camisa, 0],
      [bx(0.07, 0.07, 0.22, 0.12, 0.27, 0.06), k.camisa, 0],
      [bx(0.07, 0.07, 0.22, -0.12, 0.27, 0.06), k.camisa, 0],
      [ico(0.1, 0, 0.47, -0.05), k.pele, 0],
      [new THREE.CylinderGeometry(0.18, 0.18, 0.02, 8).translate(0, 0.55, -0.05), k.chapeu, 0],
      [new THREE.CylinderGeometry(0.08, 0.1, 0.09, 8).translate(0, 0.6, -0.05), k.chapeu, 0],
      [new THREE.CylinderGeometry(0.06, 0.05, 0.13, 7).translate(0.3, 0.06, -0.08), pv("gray-400"), 0],
      // Vara (balança pela altura) e linha até a boia.
      [new THREE.CylinderGeometry(0.008, 0.016, 1.3, 4).translate(0, 0.65, 0).rotateX(0.95).translate(0, 0.27, 0.16), k.madeiraEsc, 1],
      [bx(0.006, 1.1, 0.006, 0, 0.42, 1.18), pv("gray-200"), 1],
      [ico(0.035, 0, -0.15, 1.18), k.vermelho, 0],
    ];
    perto.por(molde(pes, 1.0), mt(DX0 + 0.12, DY, 0.2, -Math.PI / 2), { amp: 0.05, fase: 1.3 });
  }

  // Canoa encostada na margem oeste.
  {
    const partes = [
      [bx(0.34, 0.12, 1.1, 0, 0.08, 0), k.ferrugem, 0],
      [new THREE.ConeGeometry(0.17, 0.3, 4).rotateY(Math.PI / 4).scale(1, 1, 0.7).rotateX(Math.PI / 2).translate(0, 0.08, 0.7), k.ferrugem, 0],
      [new THREE.ConeGeometry(0.17, 0.3, 4).rotateY(Math.PI / 4).scale(1, 1, 0.7).rotateX(-Math.PI / 2).translate(0, 0.08, -0.7), k.ferrugem, 0],
      [bx(0.3, 0.03, 0.08, 0, 0.15, 0.15), k.madeira, 0],
      [bx(0.05, 0.03, 0.8, 0.1, 0.17, 0), k.madeiraEsc, 0],
    ];
    perto.por(molde(partes), mt(41.05, 14.6, 0.0, 0.18));
  }

  // Vitórias-régias (algumas com flor) e juncos na beira do lago.
  for (const [x, y, f] of [[42.3, 18.6, 1], [42.9, 19.6, 0], [41.7, 17.3, 0], [43.6, 18.9, 1], [42.3, 16.0, 0], [43.2, 17.5, 0], [41.9, 19.0, 0]]) {
    const s = R(0.8, 1.2);
    fundo.por(M.vitoria, mt(x, y, 0.016, rand() * 6, s));
    if (f) fundo.por(M.florVitoria, mt(x + 0.05, y, 0.016, 0, 1), { tint: mix(pv("red-300"), white, 0.4) });
  }
  for (let i = 0; i < (lite ? 12 : 26); i++) {
    const a = rand() * Math.PI * 2;
    if (Math.sin(a) > 0.1 && Math.cos(a) > 0.3) continue; // perto do deque não
    const q = R(0.92, 1.06);
    const x = LAGO.x + Math.cos(a) * LAGO.rx * q;
    const y = LAGO.y + Math.sin(a) * LAGO.ry * q;
    fundo.por(M.junco, mt(x, y, 0.01, rand() * 6, R(0.8, 1.2)), { amp: 0.04, fase: rand() * 6 });
  }
  // Pedras na margem.
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2;
    const x = LAGO.x + Math.cos(a) * (LAGO.rx + 0.45);
    const y = LAGO.y + Math.sin(a) * (LAGO.ry + 0.45);
    if (Math.sin(a) > 0 && Math.cos(a) > 0.5) continue;
    fundo.por(M.pedra, mt(x, y, 0.005, rand() * 6, R(0.6, 1.2)), { tint: mix(pv("gray-400"), pv("gray-200"), rand()) });
  }

  // Bancos de madeira (pés de ferro) na beira do caminho.
  const banco = (x, y, giro) => {
    const partes = [
      [bx(0.8, 0.05, 0.28, 0, 0.32, 0), k.madeira, 0],
      [bx(0.8, 0.2, 0.04, 0, 0.52, -0.13), k.madeira, 0],
    ];
    for (const dx of [-0.34, 0.34]) partes.push([bx(0.05, 0.32, 0.26, dx, 0.16, 0), k.metalEsc, 0], [bx(0.05, 0.3, 0.04, dx, 0.47, -0.13), k.metalEsc, 0]);
    perto.por(molde(partes), mt(x, y, 0, giro));
    bloquearCirc(x, y, 0.55);
  };
  banco(39.0, 19.2, Math.PI / 2);
  banco(45.8, 21.8, Math.PI);
  banco(53.5, 8.1, 0);

  // Placa da pista na entrada do caminho (atlas compartilhado).
  {
    const x = 46.2;
    const y = 25.3;
    if (zonas.naZona("paisagem", x, y) && zonas.livre(x, y, 0.7)) {
      perto.por(molde([[bx(0.06, 0.95, 0.06, -0.5, 0.47, 0), k.madeiraEsc, 0], [bx(0.06, 0.95, 0.06, 0.5, 0.47, 0), k.madeiraEsc, 0]]), mt(x, y, 0));
      ctx.placa("pista", x, y + 0.04, 0.8, 1.2, 0.3);
      bloquearCirc(x, y, 0.7);
    }
  }

  // ---- Norte: trilho da Madeira-Mamoré, locomotiva e estação ------------------------
  {
    // Leito de brita, dormentes, trilhos e para-choques nas pontas.
    fita(fundo, [[TRILHO.x0 - 0.3, TRILHO.y], [TRILHO.x1 + 0.3, TRILHO.y]], 1.1, 0.01, k.brita);
    const partes = [];
    const comp = TRILHO.x1 - TRILHO.x0;
    for (let x = 0; x <= comp; x += 0.55) partes.push([bx(0.14, 0.04, 0.8, x, 0.03, 0), k.madeiraEsc, 0]);
    for (const z of [-0.27, 0.27]) partes.push([bx(comp, 0.05, 0.05, comp / 2, 0.075, z), k.metal, 0]);
    for (const x of [-0.15, comp + 0.15]) partes.push([bx(0.14, 0.3, 0.8, x, 0.15, 0), k.vermelho, 0], [bx(0.16, 0.08, 0.82, x, 0.25, 0), k.asaAmarela, 0]);
    perto.por(molde(partes), mt(TRILHO.x0, TRILHO.y, 0));
    bloquearRet(TRILHO.x0 - 0.6, TRILHO.x1 + 0.6, TRILHO.y - 0.7, TRILHO.y + 0.7);

    // Locomotiva a vapor (preta e vermelha, chaminé em funil, limpa-trilhos),
    // tênder com lenha e um vagão de castanha.
    const roda = (x, r, z) => [new THREE.CylinderGeometry(r, r, 0.07, 9).rotateX(Math.PI / 2).translate(x, r + 0.1, z), k.preto, 0];
    const cubo = (x, r, z) => [new THREE.CylinderGeometry(r * 0.35, r * 0.35, 0.09, 6).rotateX(Math.PI / 2).translate(x, r + 0.1, z), k.vermelho, 0];
    const lp = [
      [bx(2.4, 0.14, 0.56, 0.1, 0.38, 0), k.vermelho, 0],
      [new THREE.CylinderGeometry(0.3, 0.3, 1.35, 10).rotateZ(Math.PI / 2).translate(0.35, 0.78, 0), k.preto, 0],
      [new THREE.CylinderGeometry(0.31, 0.31, 0.05, 10).rotateZ(Math.PI / 2).translate(0.05, 0.78, 0), k.latao, 0],
      [new THREE.CylinderGeometry(0.31, 0.31, 0.05, 10).rotateZ(Math.PI / 2).translate(0.7, 0.78, 0), k.latao, 0],
      [new THREE.CylinderGeometry(0.32, 0.32, 0.26, 10).rotateZ(Math.PI / 2).translate(1.13, 0.78, 0), k.metalEsc, 0],
      [new THREE.CylinderGeometry(0.08, 0.09, 0.34, 6).translate(1.1, 1.2, 0), k.preto, 0],
      [new THREE.CylinderGeometry(0.21, 0.08, 0.3, 8).translate(1.1, 1.5, 0), k.preto, 0],
      [new THREE.CylinderGeometry(0.11, 0.13, 0.18, 8).translate(0.5, 1.14, 0), k.latao, 0],
      [ico(0.1, 0.5, 1.24, 0), k.latao, 0],
      [new THREE.ConeGeometry(0.06, 0.1, 6).translate(0.2, 1.13, 0), k.latao, 0],
      [bx(0.2, 0.2, 0.2, 1.22, 1.2, 0), k.preto, 0],
      [bx(0.03, 0.12, 0.12, 1.33, 1.2, 0), pv("yellow-400"), 0],
      [new THREE.ConeGeometry(0.33, 0.42, 4).rotateY(Math.PI / 4).rotateZ(-Math.PI / 2).scale(1, 0.7, 1).translate(1.45, 0.25, 0), k.vermelho, 0],
      [bx(0.64, 0.8, 0.72, -0.62, 0.86, 0), k.vermelho, 0],
      [bx(0.32, 0.22, 0.74, -0.6, 1.02, 0), k.janela, 0],
      [bx(0.86, 0.06, 0.88, -0.62, 1.29, 0), k.preto, 0],
      [bx(0.66, 0.05, 0.74, -0.62, 0.5, 0), k.latao, 0],
      roda(-0.55, 0.24, 0.3), roda(-0.55, 0.24, -0.3), roda(0.0, 0.24, 0.3), roda(0.0, 0.24, -0.3),
      cubo(-0.55, 0.24, 0.3), cubo(-0.55, 0.24, -0.3), cubo(0.0, 0.24, 0.3), cubo(0.0, 0.24, -0.3),
      roda(0.62, 0.14, 0.28), roda(0.62, 0.14, -0.28), roda(0.92, 0.14, 0.28), roda(0.92, 0.14, -0.28),
      // Tênder com lenha.
      [bx(0.95, 0.14, 0.56, -1.48, 0.36, 0), k.vermelho, 0],
      [bx(0.92, 0.42, 0.68, -1.48, 0.64, 0), k.preto, 0],
      roda(-1.78, 0.15, 0.28), roda(-1.78, 0.15, -0.28), roda(-1.18, 0.15, 0.28), roda(-1.18, 0.15, -0.28),
    ];
    for (const [z, y] of [[-0.18, 0.92], [0, 0.92], [0.18, 0.92], [-0.09, 1.04], [0.09, 1.04]]) {
      lp.push([new THREE.CylinderGeometry(0.07, 0.07, 0.8, 5).rotateZ(Math.PI / 2).translate(-1.48, y, z), y > 1 ? k.madeira : k.tronco, 0]);
    }
    // Vagão aberto com sacas de castanha.
    lp.push([bx(1.5, 0.12, 0.6, -2.95, 0.36, 0), k.vermelho, 0], [bx(1.5, 0.36, 0.7, -2.95, 0.6, 0), k.madeiraEsc, 0]);
    for (const x of [-3.45, -2.95, -2.45]) lp.push([ico(0.2, x, 0.85, 0.08, 1, 0.65, 1.2), k.palha, 0]);
    lp.push(roda(-3.45, 0.15, 0.28), roda(-3.45, 0.15, -0.28), roda(-2.45, 0.15, 0.28), roda(-2.45, 0.15, -0.28));
    perto.por(molde(lp), mt(LOCO.x, LOCO.y, 0));

    // Estação ao norte do trilho: casinha creme de telhado vermelho, porta e
    // janelas para o sul (para a câmera) e a plataforma entre ela e o trilho.
    const E = ESTACAO;
    const cx = (E.x0 + E.x1) / 2;
    const ep = [
      [bx(15, 0.22, 0.63, 0, 0.11, 0.765), k.creme, 0],
      [bx(15, 0.03, 0.06, 0, 0.235, 1.03), k.asaAmarela, 0],
      [bx(E.x1 - E.x0, 1.05, E.y1 - E.y0, 0, 0.74, 0), k.creme, 0],
      [bx(E.x1 - E.x0 + 0.04, 0.22, E.y1 - E.y0 + 0.04, 0, 0.32, 0), k.telha, 0],
      [bx(0.42, 0.62, 0.04, 0, 0.53, 0.46), k.madeiraEsc, 0],
      [bx(0.5, 0.36, 0.04, -1.6, 0.75, 0.46), k.janela, 0],
      [bx(0.5, 0.36, 0.04, 1.6, 0.75, 0.46), k.janela, 0],
      // Telhado: as duas águas giradas em torno do próprio centro.
      [bx(E.x1 - E.x0 + 0.5, 0.07, 0.8, 0, 0, 0).rotateX(-0.5).translate(0, 1.47, -0.3), k.telha, 0],
      [bx(E.x1 - E.x0 + 0.5, 0.07, 0.8, 0, 0, 0).rotateX(0.5).translate(0, 1.47, 0.3), k.telha, 0],
    ];
    perto.por(molde(ep), mt(cx, (E.y0 + E.y1) / 2, 0));
    // Placa SEMEC num cavalete na ponta oeste da plataforma (sob o beiral a
    // câmera alta não a veria).
    perto.por(molde([[bx(0.06, 1.1, 0.06, -0.6, 0.55, 0), k.madeiraEsc, 0], [bx(0.06, 1.1, 0.06, 0.6, 0.55, 0), k.madeiraEsc, 0]]), mt(67.4, 5.4, 0.22));
    ctx.placa("semec", 67.4, 5.44, 1.17, 1.3, 0.32);
    bloquearRet(65, 81, E.y0 - 0.3, TRILHO.y);
  }

  // ---- Horizonte norte: caixas d'água, Rio Madeira, barco, morros -------------------
  // As Três Caixas d'Água de Porto Velho (pés de ferro, tanque, telhado).
  {
    const partes = [];
    // Pés curtos (fora de escala) para o tanque caber na tela vindo do "alto".
    for (const dx of [-0.55, 0.55]) for (const dz of [-0.55, 0.55]) partes.push([bx(0.1, 3.25, 0.1, dx, 1.62, dz), k.metal, 0]);
    for (const h of [1.1, 2.2]) {
      for (const d of [-0.55, 0.55]) partes.push([bx(1.1, 0.05, 0.05, 0, h, d), k.metal, 0], [bx(0.05, 0.05, 1.1, d, h, 0), k.metal, 0]);
    }
    partes.push(
      [new THREE.CylinderGeometry(0.86, 0.86, 0.08, 10).translate(0, 3.26, 0), k.metalEsc, 0],
      [new THREE.CylinderGeometry(0.78, 0.78, 1.45, 12).translate(0, 4.02, 0), k.caixa, 0],
      [new THREE.CylinderGeometry(0.795, 0.795, 0.1, 12).translate(0, 3.45, 0), k.caixaFaixa, 0],
      [new THREE.CylinderGeometry(0.795, 0.795, 0.1, 12).translate(0, 4.6, 0), k.caixaFaixa, 0],
      [new THREE.ConeGeometry(0.88, 0.5, 12).translate(0, 5.0, 0), k.ferrugem, 0],
      [ico(0.07, 0, 5.28, 0), k.metalEsc, 0],
      [bx(0.04, 4.7, 0.14, 0.83, 2.35, 0), k.caixaFaixa, 0],
    );
    const md = molde(partes);
    CAIXAS.forEach(([x, y], i) => perto.por(md, mt(x, y, 0, i * 0.7, 0.8, 0.68)));
    bloquearRet(19, 28.5, 1, 3.6);
  }

  // Rio Madeira: faixas de água barrenta em facetas, margens de areia,
  // riscos claros da correnteza e o barco regional.
  {
    const X0 = -26.5;
    const X1 = MW + 25.5;
    const ym = (RIO.y0 + RIO.y1) / 2;
    for (let x = X0; x < X1; x += 6) {
      const x2 = Math.min(X1, x + 6);
      const i = Math.round((x - X0) / 6);
      for (const [ya, yb, j] of [[RIO.y1, ym, 0], [ym, RIO.y0, 1]]) {
        const cr = (i + j) % 2 ? k.rio : k.rioFundo;
        fundo.triChao(P3(x, ya, -0.008), P3(x2, ya, -0.008), P3(x2, yb, -0.008), cr);
        fundo.triChao(P3(x, ya, -0.008), P3(x2, yb, -0.008), P3(x, yb, -0.008), mix(cr, white, 0.04));
      }
      fundo.triChao(P3(x, RIO.y1 + 0.7, -0.014), P3(x2, RIO.y1 + 0.7, -0.014), P3(x2, RIO.y1, -0.014), k.areia);
      fundo.triChao(P3(x, RIO.y1 + 0.7, -0.014), P3(x2, RIO.y1, -0.014), P3(x, RIO.y1, -0.014), k.areiaEsc);
      fundo.triChao(P3(x, RIO.y0, -0.014), P3(x2, RIO.y0, -0.014), P3(x2, RIO.y0 - 0.7, -0.014), k.areiaEsc);
      fundo.triChao(P3(x, RIO.y0, -0.014), P3(x2, RIO.y0 - 0.7, -0.014), P3(x, RIO.y0 - 0.7, -0.014), k.areia);
    }
    for (let i = 0; i < 22; i++) {
      const x = R(X0 + 2, X1 - 4);
      const y = R(RIO.y0 + 0.5, RIO.y1 - 0.5);
      const l = R(1.2, 2.6);
      fundo.triChao(P3(x, y - 0.04, -0.004), P3(x + l, y - 0.04, -0.004), P3(x + l, y + 0.04, -0.004), k.rioClaro);
      fundo.triChao(P3(x, y - 0.04, -0.004), P3(x + l, y + 0.04, -0.004), P3(x, y + 0.04, -0.004), k.rioClaro);
    }
    bloquearRet(-99, 999, RIO.y0 - 0.8, RIO.y1 + 0.8);

    // Barco regional de dois andares (casco branco, faixa azul, toldos).
    const bp = [
      [bx(2.7, 0.32, 0.8, 0, 0.12, 0), k.barco, 0],
      [new THREE.ConeGeometry(0.4, 0.6, 4).rotateY(Math.PI / 4).scale(1, 0.4 / 0.565, 1).rotateZ(-Math.PI / 2).translate(1.63, 0.12, 0), k.barco, 0],
      [bx(2.72, 0.07, 0.82, 0, 0.2, 0), k.asaAzul, 0],
      [bx(2.0, 0.4, 0.66, -0.15, 0.48, 0), k.barco, 0],
      [bx(2.0, 0.12, 0.68, -0.15, 0.5, 0), k.janela, 0],
      [bx(2.3, 0.05, 0.78, -0.15, 0.7, 0), k.asaAzul, 0],
      [bx(1.1, 0.32, 0.56, -0.45, 0.88, 0), k.barco, 0],
      [bx(1.3, 0.05, 0.66, -0.45, 1.06, 0), k.vermelho, 0],
    ];
    fundo.por(molde(bp), mt(34, ym + 0.4, -0.02, 0));
  }

  // Morros ao longe (a névoa do jogo apaga; no mapa geral aparecem).
  {
    const morro = (x, y, sx, sy, sz, cr) => fundo.por(molde([[new THREE.IcosahedronGeometry(1, 1).scale(sx, sy, sz).translate(0, -sy * 0.25, 0), cr, 0]]), mt(x, y, -0.02, rand() * 6));
    for (let x = -22; x < MW + 24; x += R(11, 16)) morro(x, R(-22, -18), R(7, 11), R(2.4, 4.5), R(4, 6), k.morro[Math.floor(rand() * 3)]);
    for (let y = 2; y < MH; y += R(12, 16)) {
      morro(R(-24, -21), y, R(4, 6), R(2, 3.6), R(7, 10), k.morro[Math.floor(rand() * 3)]);
      morro(R(MW + 20, MW + 23), y, R(4, 6), R(2, 3.6), R(7, 10), k.morro[Math.floor(rand() * 3)]);
    }
  }

  // Estradinha de terra do portão (sul): nada nasce em cima.
  bloquearRet(GX0 - 1.3, GX1 + 1.3, MH - 2, MH + 30);

  // ---- Vegetação planejada da zona D -----------------------------------------------
  // Ipês em volta do lago (a cena-postal) e buritis na beira do igarapé.
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.2;
    plantar(i % 3 === 2 ? "buriti" : "ipe", LAGO.x + Math.cos(a) * (LAGO.rx + 1.7), LAGO.y + Math.sin(a) * (LAGO.ry + 1.6), { recuo: false });
  }
  for (const y of [10.5, 8.8, 4.8, 2.6]) for (const lado of [-1, 1]) plantar(rand() < 0.6 ? "buriti" : "acai", xIgarape(y) + lado * R(1.3, 1.8), y, { recuo: false });

  // ---- Vegetação espalhada dentro da cerca (rala perto da pista) ----------------------
  const jardins = []; // centros de flores (as borboletas voam ali)
  {
    const PASSO = 1.45;
    for (let y = 1.3; y < MH - 1.2; y += PASSO) {
      for (let x = 1.3; x < MW - 1.4; x += PASSO) {
        const px = x + R(-0.55, 0.55);
        const py = y + R(-0.55, 0.55);
        if (!dentroCerca(px, py)) continue;
        const d = c.distancia(Math.round(px), Math.round(py));
        const naD = zonas.naZona("D", px, py);
        let p = 0.1 + 0.42 * Math.min(1, Math.max(0, (d - 4.5) / 10));
        if (naD) p += 0.08;
        // Faixa ao norte do "alto" e do grampo: atrás da pista, não tapa nada.
        if (py < 5) p += 0.2;
        if (lite) p *= 0.4;
        if (rand() > p) continue;
        const tipo = sortear(naD ? { ipe: 5, redonda: 2, buriti: 2, acai: 2, castanheira: 1, arbustoFlor: 1 } : { ipe: 3, redonda: 4, buriti: 1.5, acai: 1.5, castanheira: 1.2, arbusto: 1, arbustoFlor: 1 });
        plantar(tipo, px, py);
      }
    }
  }

  // Miúdos: capim, flores, pedras (dentro da cerca, na nossa zona).
  {
    const PASSO = 0.85;
    const fCapim = lite ? 0.08 : 0.3;
    for (let y = 1.1; y < MH - 1; y += PASSO) {
      for (let x = 1.1; x < MW - 1.2; x += PASSO) {
        const px = x + R(-0.4, 0.4);
        const py = y + R(-0.4, 0.4);
        if (!dentroCerca(px, py)) continue;
        const v = rand();
        const naD = zonas.naZona("D", px, py);
        const fFlor = (naD ? 0.1 : 0.04) * (lite ? 0.5 : 1);
        if (v < fFlor) {
          if (miudo(M.flores, px, py, { tint: corFlor(), s: R(0.9, 1.3), r: 0.2 })) {
            marcar(px, py, 0.2);
            jardins.push([px, py]);
          }
        } else if (v < fFlor + 0.025) {
          if (miudo(M.pedra, px, py, { tint: mix(pv("gray-400"), pv("gray-200"), rand()), s: R(0.6, 1.3), amp: 0, r: 0.25 })) marcar(px, py, 0.25);
        } else if (v < fFlor + 0.025 + fCapim) {
          miudo(M.tufo, px, py, { tint: mix(cor.gramaA, rand() < 0.5 ? cor.gramaB : pv("yellow-400"), rand() * 0.45), s: R(1.1, 1.8), r: 0.12 });
        }
      }
    }
  }

  // ---- Mata além da cerca: densa a oeste, leste e na outra margem do rio --------------
  {
    const PASSO = 1.6;
    for (let y = -16; y < MH + 8; y += PASSO) {
      for (let x = -15; x < MW + 14; x += PASSO) {
        const px = x + R(-0.6, 0.6);
        const py = y + R(-0.6, 0.6);
        if (dentroCerca(px, py) || naCerca(px, py, 0.6)) continue;
        let p;
        let pesos;
        if (py < CERCA.y0) {
          // Norte: faixa curta entre a cerca e o rio (rala, baixa) e a
          // outra margem (densa, com castanheiras).
          if (py > RIO.y1) {
            p = 0.28;
            pesos = { ipe: 3, acai: 2, buriti: 1, arbusto: 2, arbustoFlor: 1 };
          } else {
            p = 0.6;
            pesos = { redonda: 5, castanheira: 2.5, ipe: 1.5, buriti: 1, acai: 1 };
          }
        } else if (py > CERCA.y1) {
          // Sul: por onde a câmera olha; pouca coisa.
          if (py > MH + 7) continue;
          p = 0.16;
          pesos = { redonda: 3, ipe: 2, arbusto: 2 };
        } else {
          p = 0.56;
          pesos = { redonda: 5, castanheira: 2, ipe: 2, buriti: 1.3, acai: 1.3 };
        }
        if (lite) p *= 0.28;
        if (rand() > p) continue;
        plantar(sortear(pesos), px, py, { s0: 0.9, s1: 1.35, recuo: false });
      }
    }
  }

  // ---- Malhas fixas -------------------------------------------------------------------
  const geoPerto = perto.fechar();
  if (geoPerto) {
    const m = new THREE.Mesh(track(geoPerto), mat);
    m.castShadow = !lite;
    m.receiveShadow = !lite;
    root.add(m);
  }
  const geoFundo = fundo.fechar();
  if (geoFundo) {
    const m = new THREE.Mesh(track(geoFundo), mat);
    m.receiveShadow = !lite;
    root.add(m);
  }

  // ---- Animados: nuvens + fumaça, aves + borboletas, patos ----------------------------
  const dummy = new THREE.Object3D();
  const inst = (geo, n) => {
    const m = new THREE.InstancedMesh(track(geo), mat, Math.max(1, n));
    m.count = n;
    m.frustumCulled = false;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    root.add(m);
    return m;
  };
  const pose = (mesh, i, x, h, z, giro, s, incl = 0) => {
    dummy.position.set(x, h, z);
    dummy.rotation.set(incl, giro, 0, "YXZ");
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  };

  // Nuvens low-poly logo além da cerca norte, altas (passam devagar para o
  // leste) e a fumaça. A câmera de jogo não as vê (ficam acima da borda da
  // tela, nunca entre ela e a pista); aparecem com o zoom afastado.
  const geoNuvem = geoInstancia([
    [ico(0.9, 0, 0, 0, 1.3, 0.72, 1), white],
    [ico(0.7, 0.95, -0.1, 0.15), white],
    [ico(0.65, -0.9, -0.15, -0.1), mix(white, pv("blue-50"), 0.6)],
    [ico(0.55, 0.3, 0.45, -0.1), white],
  ]);
  const N_NUV = lite ? 4 : 9;
  const N_FUM = lite ? 3 : 6;
  const nuvens = inst(geoNuvem, N_NUV + N_FUM);
  const XN0 = -34;
  const XN1 = MW + 34;
  const dadosNuvem = Array.from({ length: N_NUV }, () => ({ x: R(XN0, XN1), y: R(-5, -1), h: R(6, 7.5), s: R(0.9, 1.8), v: R(0.25, 0.5), giro: R(-0.3, 0.3) }));
  for (let i = 0; i < N_NUV + N_FUM; i++) nuvens.setColorAt(i, i < N_NUV ? white : mix(pv("gray-200"), white, 0.4));
  const chamine = { x: wx(LOCO.x + 1.1), h: 1.7, z: wz(LOCO.y) };

  // Aves: araras vermelhas e azuis, periquitos e borboletas (a mesma peça,
  // escalas e cores diferentes; a asa bate no shader).
  const asaG = (lado) => [
    [bx(0.34, 0.012, 0.17, lado * 0.21, 0, -0.02), white, 1, 1],
    [bx(0.1, 0.014, 0.15, lado * 0.42, 0, -0.03), k.asaAmarela, 0, 1],
    [bx(0.16, 0.012, 0.12, lado * 0.55, 0, -0.04), k.asaAzul, 0, 1],
  ];
  const geoAve = geoInstancia([
    [new THREE.OctahedronGeometry(0.1, 0).scale(0.75, 0.65, 2.2), white, 1, 0],
    [ico(0.065, 0, 0.04, 0.22), white, 1, 0],
    [new THREE.ConeGeometry(0.03, 0.08, 4).rotateX(Math.PI / 2).translate(0, 0.02, 0.3), pv("gray-200"), 0, 0],
    [bx(0.07, 0.012, 0.36, 0, 0, -0.36), white, 1, 0],
    ...asaG(1),
    ...asaG(-1),
  ]);
  const bandos = [
    { n: lite ? 3 : 5, cor: pv("red-600"), s: 1.0, cx: 43, cy: -6.6, rx: 34, ry: 2.6, h: 4.2, vel: 0.045, f: 0 },
    { n: lite ? 2 : 4, cor: pv("blue-600"), s: 0.95, cx: LAGO.x, cy: LAGO.y - 1, rx: 3.3, ry: 4.6, h: 5.2, vel: 0.2, f: 2 },
    { n: lite ? 4 : 7, cor: mix(pv("green-500"), pv("yellow-400"), 0.25), s: 0.55, cx: -5.5, cy: 28, rx: 2.4, ry: 24, h: 3.4, vel: 0.07, f: 1 },
    { n: lite ? 0 : 6, cor: mix(pv("green-500"), pv("yellow-400"), 0.25), s: 0.55, cx: MW + 4, cy: 26, rx: 2.4, ry: 22, h: 3.2, vel: -0.08, f: 4 },
  ];
  // Borboletas: em volta de flores longe da pista (no lite, nenhuma).
  const borboletas = [];
  if (!lite) {
    const boas = jardins.filter(([x, y]) => zonas.livre(x, y, 1.1));
    for (let i = 0; i < Math.min(12, boas.length); i++) {
      const [x, y] = boas[Math.floor(rand() * boas.length)];
      borboletas.push({ x, y, f: rand() * 6, cor: corFlor() });
    }
  }
  const nAves = bandos.reduce((a, b) => a + b.n, 0);
  const aves = inst(geoAve, nAves + borboletas.length);
  {
    let i = 0;
    for (const b of bandos) for (let j = 0; j < b.n; j++) aves.setColorAt(i++, b.cor);
    for (const bb of borboletas) aves.setColorAt(i++, bb.cor);
  }

  // Patos nadando em fila no lago (3 adultos e 3 patinhos amarelos).
  const geoPato = geoInstancia([
    [ico(0.13, 0, 0.07, 0, 1, 0.62, 1.45), white, 1],
    [new THREE.ConeGeometry(0.06, 0.13, 4).rotateX(-Math.PI / 2 - 0.6).translate(0, 0.12, -0.2), white, 1],
    [ico(0.075, 0, 0.2, 0.15), white, 1],
    [new THREE.ConeGeometry(0.028, 0.09, 4).rotateX(Math.PI / 2).translate(0, 0.19, 0.25), k.bico, 0],
  ]);
  const coresPato = [white, mix(pv("yellow-800"), pv("gray-600"), 0.4), white, pv("yellow-400"), pv("yellow-400"), pv("yellow-400")];
  const patos = inst(geoPato, coresPato.length);
  coresPato.forEach((cr, i) => patos.setColorAt(i, cr));

  // Posições no instante t (com reducedMotion: só t = 0).
  const animar = (t) => {
    // Nuvens.
    dadosNuvem.forEach((n, i) => {
      const span = XN1 - XN0;
      const x = XN0 + ((((n.x - XN0 + n.v * t) % span) + span) % span);
      pose(nuvens, i, wx(x), n.h, wz(n.y), n.giro, n.s);
    });
    // Fumaça: sobe da chaminé, cresce, vai para trás (oeste) e some.
    for (let j = 0; j < N_FUM; j++) {
      const u = (t * 0.45 + j / N_FUM) % 1;
      const s = (0.14 + u * 0.38) * (u < 0.8 ? 1 : (1 - u) / 0.2);
      pose(nuvens, N_NUV + j, chamine.x - u * 1.4, chamine.h + u * 1.9, chamine.z - u * 0.3, u * 2, Math.max(0.01, s));
    }
    nuvens.instanceMatrix.needsUpdate = true;
    // Bandos em V seguindo uma elipse.
    let i = 0;
    for (const b of bandos) {
      const th = b.f + b.vel * t;
      const sg = Math.sign(b.vel) || 1;
      const tx = -b.rx * Math.sin(th) * sg;
      const ty = b.ry * Math.cos(th) * sg;
      const l = Math.hypot(tx, ty) || 1;
      const fx = tx / l;
      const fy = ty / l;
      const giro = Math.atan2(fx, fy);
      for (let j = 0; j < b.n; j++) {
        const fila = Math.ceil(j / 2);
        const lado = j % 2 ? 1 : -1;
        const tras = fila * 0.7 * b.s;
        const ao = lado * fila * 0.55 * b.s;
        const x = b.cx + b.rx * Math.cos(th) - fx * tras - fy * ao;
        const y = b.cy + b.ry * Math.sin(th) - fy * tras + fx * ao;
        pose(aves, i++, wx(x), b.h + Math.sin(t * 1.3 + j) * 0.15, wz(y), giro, b.s);
      }
    }
    // Borboletas: voltinhas em volta das flores.
    for (const bb of borboletas) {
      const a = t * 0.9 + bb.f;
      const x = bb.x + Math.sin(a) * 0.55;
      const y = bb.y + Math.sin(a * 1.4 + bb.f) * 0.4;
      const giro = Math.atan2(Math.cos(a) * 0.55, Math.cos(a * 1.4 + bb.f) * 0.56);
      pose(aves, i++, wx(x), 0.45 + Math.sin(t * 2.1 + bb.f) * 0.18, wz(y), giro, 0.28);
    }
    aves.instanceMatrix.needsUpdate = true;
    // Patos: fila na parte norte do lago, balançando na água.
    for (let j = 0; j < coresPato.length; j++) {
      const th = t * 0.16 - j * (j < 3 ? 0.42 : 0.3) - (j >= 3 ? 0.35 : 0);
      const x = LAGO.x + Math.cos(th) * 1.7;
      const y = LAGO.y - 1.9 + Math.sin(th) * 1.25;
      const giro = Math.atan2(-Math.sin(th) * 1.7, Math.cos(th) * 1.25);
      pose(patos, j, wx(x), 0.02 + Math.sin(t * 2 + j) * 0.012, wz(y), giro, j < 3 ? 1 : 0.55);
    }
    patos.instanceMatrix.needsUpdate = true;
  };
  animar(0);

  return {
    update(t) {
      if (reducedMotion) return;
      uT.value = t;
      animar(t);
    },
  };
}
