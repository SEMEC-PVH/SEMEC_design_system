// Pista de bicicleta da Vila SEMEC: a beira da pista (dono: zona "beira" —
// a faixa até 3,5 tiles da linha central em toda a volta e o retângulo C
// de zonas.js).
//
// Em volta da pista inteira (onde fica cada peça: beira-locais.js):
//   - barreiras de pneus por fora das curvas (pilhas de 2, a de cima
//     pintada de vermelho/branco; fila de trás preta fora do `lite`),
//     guard-rail baixo nas retas e cones por dentro das curvas;
//   - placas de publicidade de frente para a câmera (Design System, SEMEC,
//     Vila SEMEC, Pedal, Acessibilidade, Pista): altas com pernas onde não
//     há pista logo ao norte, baixas (no chão) ao sul;
//   - chevrons por fora das curvas fechadas e marcos de frenagem 100/50;
//   - holofotes (torres altas, só onde não tapam o asfalto), câmeras de TV
//     em tripé com cinegrafista (a cabeça segue o jogador), fiscais de pista
//     com bandeira (acenam; na festa, sem parar) e varais de bandeirinhas;
//   - a cerca do mapa: mourões com capitel azul, três réguas brancas e
//     pilares de concreto, com vão no portão.
// Na zona C, a "área técnica" sobre um pátio de concreto: torre de
// cronometragem, telão (logo da pista, contagem da largada, próximo arco e
// PARABÉNS na festa), van de TV com antena, tenda da imprensa e tenda de
// primeiros socorros, com gente trabalhando.
//
// Draw calls próprios: o atlas da beira (beira-atlas.js), as bandeiras dos
// fiscais e as cabeças das câmeras (instanciados, animados); o resto entra
// no lote compartilhado de objetos fixos.
//
// Contrato em comum.js. Eventos: update (câmeras e bandeiras), festa,
// largada, setProximo (telão).

import * as THREE from "three";
import { MH, MW } from "./circuito";
import { GX0, GX1, criarLote, geoChao, wx, wz } from "./comum";
import { AREA_TECNICA, planejarBeira } from "./beira-locais";
import { criarAtlasBeira } from "./beira-atlas";

const UP = new THREE.Vector3(0, 1, 0);

export function montarBeira(ctx) {
  const { pal, pv, mix, white, cor, lite, reducedMotion, c, track, zonas, instanciar } = ctx;
  const { lote } = ctx;
  const rand = ctx.semente(20261018);
  const plano = planejarBeira({ c, zonas, ocupado: ctx.ocupado, lite, rand });
  for (const a of plano.avisos) console.warn("[pista/beira]", a);

  // Cores extras (todas de tokens).
  const laranja = mix(pv("yellow-400"), pv("red-500"), 0.32);
  const vidro = mix(pv("blue-200"), white, 0.3);
  const aco = mix(pv("gray-300"), pv("gray-400"), 0.5);
  const calca = pv("gray-800");
  const lampada = mix(pv("yellow-400"), white, 0.65);
  const cabelos = [pv("gray-900"), mix(pv("gray-900"), pv("yellow-800"), 0.45), pv("yellow-800")];
  const coresBandeirinha = [pv("red-500"), pv("yellow-500"), pv("blue-500"), pv("green-500"), white];

  // ---- Ajudantes de geometria (tudo no lote compartilhado) ------------------------
  // Matriz de um objeto no tile (x, y), girado em Y (frente local = +z).
  const em = (x, y, giro = 0, h = 0) => new THREE.Matrix4().makeTranslation(wx(x), h, wz(y)).multiply(new THREE.Matrix4().makeRotationY(giro));
  // Caixa local (tamanho sx × sy × sz, centro cx, cy, cz) no objeto m.
  const bloco = (m, sx, sy, sz, cx, cy, cz, cr) => lote.add(new THREE.BoxGeometry(sx, sy, sz).translate(cx, cy, cz), cr, m);
  const peca = (m, geo, cr) => lote.add(geo, cr, m);
  // Barra de seção quadrada (esp) do ponto a ao ponto b (locais de m, ou do
  // mundo se m for null).
  const barra = (m, a, b, esp, cr) => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const d = vb.clone().sub(va);
    const L = d.length();
    if (L < 1e-4) return;
    const q = new THREE.Quaternion().setFromUnitVectors(UP, d.normalize());
    const mt = new THREE.Matrix4().compose(va.add(vb).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    lote.add(new THREE.BoxGeometry(esp, L, esp), cr, m ? m.clone().multiply(mt) : mt);
  };
  const P = (x, h, y) => [wx(x), h, wz(y)];

  // Placas com textura: o atlas da beira (próprio) e o compartilhado
  // (regiões "semec" e "pista"). Plano de w × alt, centro a h do chão,
  // inclinado `inclina` para trás (para a câmera), com fundo e borda.
  const { tex, regioes, telao } = criarAtlasBeira(pal, lite);
  track(tex);
  const atlasBeira = criarLote({ uv: true });
  const plano2 = (reg, m, w, alt, z = 0) => {
    const doGeral = reg === "semec" || reg === "pista";
    const alvo = doGeral ? ctx.atlas : atlasBeira;
    const r = doGeral ? ctx.regioes[reg] : regioes[reg];
    alvo.add(new THREE.PlaneGeometry(w, alt).translate(0, 0, z), r, m);
  };
  const tabuleta = (reg, x, y, h, w, alt, { inclina = 0.28, giro = 0, borda = cor.escuro } = {}) => {
    const m = em(x, y, giro, h).multiply(new THREE.Matrix4().makeRotationX(-inclina));
    bloco(m, w + 0.08, alt + 0.08, 0.05, 0, 0, -0.035, borda);
    plano2(reg, m, w, alt, 0.002);
    return m;
  };

  // Pessoa low-poly (frente +z): pernas, tronco, braços, cabeça e cabelo
  // (ou boné). `braco`: "cima" ergue o braço direito (o da bandeira).
  const pessoa = (x, y, giro, camisa, { s = 1, braco = null, bone = null, sentado = false } = {}) => {
    const m = em(x, y, giro).multiply(new THREE.Matrix4().makeScale(s, s, s));
    const pele = cor.pele[Math.floor(rand() * cor.pele.length)];
    const dy = sentado ? -0.16 : 0;
    if (sentado) {
      for (const lx of [-0.06, 0.06]) bloco(m, 0.09, 0.09, 0.26, lx, 0.27, 0.1, calca);
      for (const lx of [-0.06, 0.06]) bloco(m, 0.09, 0.24, 0.09, lx, 0.12, 0.2, calca);
    } else for (const lx of [-0.06, 0.06]) bloco(m, 0.09, 0.3, 0.1, lx, 0.15, 0, calca);
    bloco(m, 0.27, 0.3, 0.16, 0, 0.45 + dy, 0, camisa);
    bloco(m, 0.07, 0.27, 0.08, -0.17, 0.45 + dy, 0, camisa);
    if (braco === "cima") bloco(m, 0.07, 0.3, 0.08, 0.17, 0.68 + dy, 0, camisa);
    else if (braco === "frente") bloco(m, 0.07, 0.08, 0.26, 0.17, 0.52 + dy, 0.1, camisa);
    else bloco(m, 0.07, 0.27, 0.08, 0.17, 0.45 + dy, 0, camisa);
    bloco(m, 0.19, 0.19, 0.19, 0, 0.71 + dy, 0, pele);
    if (bone) {
      bloco(m, 0.2, 0.06, 0.2, 0, 0.82 + dy, 0, bone);
      bloco(m, 0.16, 0.025, 0.1, 0, 0.8 + dy, 0.13, bone);
    } else bloco(m, 0.2, 0.07, 0.2, 0, 0.83 + dy, -0.01, cabelos[Math.floor(rand() * cabelos.length)]);
    return m;
  };

  // ---- Frente: pneus, guard-rail e cones ------------------------------------------
  const segPneu = lite ? 6 : 8;
  const pintados = [cor.vermelho, white];
  for (const p of plano.pneus) {
    const m = em(p.x, p.y, p.giro);
    for (let i = 0; i < p.alt; i++) {
      const topo = i === p.alt - 1 && p.fila === 0;
      const cr = topo ? pintados[Math.floor(p.n / 2) % 2] : cor.pneu;
      peca(m, new THREE.CylinderGeometry(0.17, 0.17, 0.17, segPneu).translate(0, 0.09 + i * 0.18, 0), cr);
    }
  }
  for (const r of plano.rails) {
    // Lâmina (branca) e corrimão (azul), um pouco mais longos para emendar.
    const ux = r.bx - r.ax;
    const uy = r.by - r.ay;
    const l = Math.hypot(ux, uy) || 1;
    const e = 0.03 / l;
    const ax = r.ax - ux * e;
    const ay = r.ay - uy * e;
    const bx = r.bx + ux * e;
    const by = r.by + uy * e;
    barra(null, P(ax, 0.26, ay), P(bx, 0.26, by), 0.1, mix(white, aco, 0.35));
    if (!lite) barra(null, P(ax, 0.39, ay), P(bx, 0.39, by), 0.05, cor.azul);
  }
  for (const p of plano.postes) bloco(em(p.x, p.y), 0.07, 0.42, 0.07, 0, 0.21, 0, cor.metal);
  for (const p of plano.cones) {
    const m = em(p.x, p.y, p.giro);
    bloco(m, 0.32, 0.04, 0.32, 0, 0.02, 0, cor.escuro);
    peca(m, new THREE.ConeGeometry(0.12, 0.38, 8).translate(0, 0.23, 0), laranja);
    peca(m, new THREE.CylinderGeometry(0.07, 0.088, 0.07, 8).translate(0, 0.24, 0), white);
  }

  // ---- Fundo: placas, chevrons, marcos ---------------------------------------------
  for (const p of plano.placas) {
    const alt = p.w / 4;
    if (p.baixa) {
      // Placa no chão (cavalete baixo), inclinada para a câmera.
      const h = 0.06 + alt / 2;
      const m = tabuleta(p.reg, p.x, p.y, h, p.w, alt, { inclina: 0.55 });
      bloco(m, p.w, 0.04, 0.2, 0, -alt / 2 - 0.02, -0.12, cor.metal);
    } else {
      const h = 0.4 + alt / 2;
      tabuleta(p.reg, p.x, p.y, h, p.w, alt);
      for (const dx of [-p.w / 2 + 0.12, p.w / 2 - 0.12]) bloco(em(p.x, p.y), 0.06, h, 0.06, dx, h / 2, -0.06, cor.metal);
    }
  }
  for (const p of plano.chevrons) {
    const [w, alt] = p.baixa ? [0.54, 0.36] : [0.62, 0.42];
    const h = p.baixa ? 0.04 + alt / 2 : 0.32 + alt / 2;
    tabuleta(p.dir > 0 ? "chevD" : "chevE", p.x, p.y, h, w, alt, { inclina: p.baixa ? 0.5 : 0.25 });
    if (!p.baixa) bloco(em(p.x, p.y), 0.05, h, 0.05, 0, h / 2, -0.05, cor.metal);
  }
  for (const p of plano.marcos) {
    const s = 0.3;
    const h = p.baixa ? 0.05 + s / 2 : 0.3 + s / 2;
    tabuleta(p.reg, p.x, p.y, h, s, s, { inclina: p.baixa ? 0.5 : 0.25, borda: cor.metal });
    if (!p.baixa) bloco(em(p.x, p.y), 0.04, h, 0.04, 0, h / 2, -0.04, cor.metal);
  }

  // ---- Holofotes: base, poste, plataforma e painel de lâmpadas virado para a pista --
  for (const p of plano.holofotes) {
    const m = em(p.x, p.y, p.giro);
    bloco(m, 0.5, 0.2, 0.5, 0, 0.1, 0, cor.concreto);
    peca(m, new THREE.CylinderGeometry(0.06, 0.09, 3.1, 6).translate(0, 1.65, 0), aco);
    bloco(m, 0.7, 0.06, 0.4, 0, 3.08, 0, cor.metal);
    const mp = m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 3.38, 0.08)).multiply(new THREE.Matrix4().makeRotationX(0.45));
    bloco(mp, 0.96, 0.56, 0.12, 0, 0, 0, cor.escuro);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) bloco(mp, 0.24, 0.2, 0.04, (i - 1) * 0.3, (j - 0.5) * 0.25, 0.07, lampada);
  }

  // ---- Câmeras de TV: tripé e cinegrafista fixos, cabeça instanciada -----------------
  const camLista = [];
  for (const p of plano.cameras) {
    const m = em(p.x, p.y, p.giro);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + 0.5;
      barra(m, [0, 0.6, 0], [Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24], 0.035, cor.escuro);
    }
    bloco(m, 0.08, 0.06, 0.08, 0, 0.6, 0, cor.escuro);
    pessoa(p.x - Math.sin(p.giro) * 0.36, p.y - Math.cos(p.giro) * 0.36, p.giro, cor.azulEsc, { s: 0.92, braco: "frente", bone: cor.vermelho });
    camLista.push({ x: wx(p.x), z: wz(p.y), h: 0.7, giro: p.giro, base: p.giro, cor: white });
  }
  const geoCam = ctx.vertexColored([
    [new THREE.BoxGeometry(0.2, 0.17, 0.34), cor.escuro],
    [new THREE.CylinderGeometry(0.06, 0.07, 0.16, 8).rotateX(Math.PI / 2).translate(0, 0, 0.24), pv("gray-950")],
    [new THREE.BoxGeometry(0.08, 0.06, 0.1).translate(-0.12, 0.06, -0.08), cor.metal],
    [new THREE.BoxGeometry(0.04, 0.04, 0.04).translate(0.06, 0.1, 0.12), cor.vermelho],
    [new THREE.BoxGeometry(0.22, 0.03, 0.12).translate(0, 0.1, -0.04), white],
  ]);
  const camMesh = camLista.length ? instanciar(geoCam, camLista) : null;

  // ---- Fiscais de pista: posto, fiscal (braço erguido) e bandeira instanciada -------
  const bandLista = [];
  const coresBand = [pv("yellow-400"), pv("green-500"), pv("blue-500"), white];
  plano.fiscais.forEach((p, i) => {
    const m = em(p.x, p.y, p.giro);
    // Posto: estrado com placa laranja e um extintor.
    bloco(m, 0.78, 0.08, 0.56, 0, 0.04, 0, cor.concreto);
    bloco(m, 0.06, 0.34, 0.06, -0.34, 0.25, 0.22, cor.metal);
    bloco(m, 0.06, 0.34, 0.06, 0.34, 0.25, 0.22, cor.metal);
    bloco(m, 0.74, 0.12, 0.03, 0, 0.34, 0.22, laranja);
    peca(m, new THREE.CylinderGeometry(0.045, 0.045, 0.2, 6).translate(-0.28, 0.18, -0.15), cor.vermelho);
    const s = 0.95;
    pessoa(p.x, p.y, p.giro, laranja, { s, braco: "cima", bone: white });
    // Mão direita (lado +x local, no alto do braço erguido), em mundo.
    const mao = new THREE.Vector3(0.17 * s, 0.84 * s + 0.08, 0).applyMatrix4(em(p.x, p.y, p.giro));
    bandLista.push({ x: mao.x, z: mao.z, h: mao.y, giro: p.giro, fase: i * 1.7, cor: coresBand[i % coresBand.length] });
  });
  // Bandeira: haste (presa pela ponta de baixo, na mão) e pano para o lado.
  const geoBand = ctx.vertexColored([
    [new THREE.BoxGeometry(0.03, 0.7, 0.03).translate(0, 0.28, 0), mix(white, pv("gray-300"), 0.5)],
    [new THREE.BoxGeometry(0.42, 0.3, 0.02).translate(0.22, 0.47, 0), white],
  ]);
  const bandMesh = bandLista.length ? instanciar(geoBand, bandLista) : null;

  // ---- Varais de bandeirinhas entre postes -----------------------------------------
  const tri = (() => {
    const g = new THREE.BufferGeometry();
    // Frente e verso (o material do lote não é DoubleSide).
    const v = [-0.075, 0, 0, 0.075, 0, 0, 0, -0.17, 0, 0.075, 0, 0, -0.075, 0, 0, 0, -0.17, 0];
    g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    return g;
  })();
  let nb = 0;
  for (const v of plano.varais) {
    for (const p of v) {
      peca(em(p.x, p.y), new THREE.CylinderGeometry(0.035, 0.045, 1.5, 5).translate(0, 0.75, 0), cor.metal);
      bloco(em(p.x, p.y), 0.09, 0.09, 0.09, 0, 1.52, 0, cor.amarelo);
    }
    for (let i = 0; i + 1 < v.length; i++) {
      const a = v[i];
      const b = v[i + 1];
      const giro = -Math.atan2(b.y - a.y, b.x - a.x);
      const curva = (t) => [a.x + (b.x - a.x) * t, 1.42 - 0.3 * 4 * t * (1 - t), a.y + (b.y - a.y) * t];
      const SEG = 4;
      for (let k = 0; k < SEG; k++) {
        const [x0, h0, y0] = curva(k / SEG);
        const [x1, h1, y1] = curva((k + 1) / SEG);
        barra(null, P(x0, h0, y0), P(x1, h1, y1), 0.018, cor.escuro);
      }
      const L = Math.hypot(b.x - a.x, b.y - a.y);
      const n = Math.max(2, Math.floor(L / (lite ? 0.42 : 0.3)));
      for (let k = 1; k < n; k++) {
        const [x, h, y] = curva(k / n);
        peca(em(x, y, giro, h - 0.01), tri.clone(), coresBandeirinha[nb++ % coresBandeirinha.length]);
      }
    }
  }
  tri.dispose();

  // ---- Área técnica (zona C) -------------------------------------------------------
  const T = plano.tecnica;
  {
    const pz = AREA_TECNICA.piso;
    // Pátio de concreto (canto sudeste chanfrado, longe da curva 1) com
    // meio-fio e faixas de circulação.
    const contorno = [[pz.x0, pz.y0], [pz.x1, pz.y0], [pz.x1, pz.ya], [pz.xb, pz.y1], [pz.x0, pz.y1]];
    const cPiso = mix(cor.concreto, cor.concretoClaro, 0.4);
    lote.add(
      geoChao([
        { pts: [contorno[0], contorno[1], contorno[2], [pz.x0, pz.ya]], h: 0.03, c: cPiso },
        { pts: [[pz.x0, pz.ya], contorno[2], contorno[3], contorno[4]], h: 0.03, c: cPiso },
      ]),
      cPiso,
    );
    contorno.forEach(([x, y], i) => {
      const [bx, by] = contorno[(i + 1) % contorno.length];
      barra(null, P(x, 0.03, y), P(bx, 0.03, by), 0.12, cor.concretoClaro);
    });
    lote.add(new THREE.BoxGeometry(pz.x1 - pz.x0 - 1.2, 0.035, 0.1).translate(wx((pz.x0 + pz.x1) / 2), 0.03, wz(38.2)), cor.amarelo);
    for (let x = pz.x0 + 1; x < pz.xb - 0.8; x += 1.4) lote.add(new THREE.BoxGeometry(0.7, 0.035, 0.08).translate(wx(x + 0.35), 0.03, wz(pz.y1 - 0.5)), white);
    ctx.reservar(Math.round(pz.x0), Math.round(pz.x1), Math.round(pz.y0), Math.floor(pz.ya));
    ctx.reservar(Math.round(pz.x0), Math.floor(pz.xb), Math.ceil(pz.ya), Math.round(pz.y1));
  }
  if (T.torre) {
    const { x, y } = T.torre;
    const m = em(x, y);
    // Base, faixa azul, porta; cabine envidraçada com montantes; laje e beiral.
    bloco(m, 2.5, 1.7, 2.1, 0, 0.85, 0, cor.concretoClaro);
    bloco(m, 2.54, 0.18, 2.14, 0, 1.5, 0, cor.azul);
    bloco(m, 0.5, 0.85, 0.04, -0.6, 0.43, 1.06, cor.azulEsc);
    bloco(m, 3.1, 1.1, 2.6, 0, 2.25, 0, vidro);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bloco(m, 0.1, 1.1, 0.1, sx * 1.52, 2.25, sz * 1.27, white);
    for (const dx of [-0.52, 0.52]) bloco(m, 0.06, 1.1, 0.06, dx, 2.25, 1.31, white);
    bloco(m, 3.3, 0.08, 2.8, 0, 1.73, 0, white);
    bloco(m, 3.4, 0.16, 2.9, 0, 2.88, 0, cor.concretoClaro);
    bloco(m, 3.44, 0.1, 2.94, 0, 2.82, 0, cor.azul);
    // Gente na cabine (cronometristas).
    for (const dx of [-0.8, 0.5]) {
      bloco(m, 0.26, 0.28, 0.16, dx, 2.0, 0.7, cor.camisas[Math.floor(rand() * 4)]);
      bloco(m, 0.18, 0.18, 0.18, dx, 2.25, 0.7, cor.pele[0]);
    }
    // Letreiro no telhado (de frente para a câmera) e a antena.
    for (const dx of [-1.1, 1.1]) bloco(m, 0.06, 0.36, 0.06, dx, 3.1, 0.9, cor.metal);
    tabuleta("crono", x, y + 0.95, 3.4, 2.9, 0.54, { inclina: 0.2 });
    peca(m, new THREE.CylinderGeometry(0.03, 0.04, 1.4, 5).translate(1.3, 3.7, 0.9), aco);
    peca(m, new THREE.CylinderGeometry(0.2, 0.05, 0.1, 8).rotateX(-0.9).translate(1.3, 4.1, 0.9), white);
    // Escada externa a leste.
    for (let i = 0; i < 6; i++) bloco(m, 0.5, 0.06, 0.28, 1.5, 0.15 + i * 0.28, 0.95 - i * 0.3, cor.metal);
  }
  if (T.telao) {
    const { x, y } = T.telao;
    const m = em(x, y);
    for (const dx of [-2.3, 2.3]) {
      bloco(m, 0.5, 0.15, 0.5, dx, 0.075, 0.05, cor.concreto);
      barra(m, [dx - 0.1, 0, 0.05], [dx - 0.1, 1.2, 0.05], 0.08, aco);
      barra(m, [dx + 0.1, 0, 0.05], [dx + 0.1, 1.2, 0.05], 0.08, aco);
      bloco(m, 0.34, 0.06, 0.06, dx, 0.6, 0.05, aco);
    }
    const mt = em(x, y, 0, 2.6).multiply(new THREE.Matrix4().makeRotationX(-0.12));
    bloco(mt, 5.5, 3.05, 0.22, 0, 0, -0.14, cor.escuro);
    bloco(mt, 5.6, 0.14, 0.26, 0, 1.56, -0.14, cor.azul);
    for (const dx of [-3.0, 3.0]) bloco(mt, 0.36, 1.2, 0.3, dx, -0.6, -0.14, cor.escuro);
    plano2("telao", mt, 5.1, 2.75, 0.0);
  }
  if (T.van) {
    const { x, y } = T.van;
    const m = em(x, y);
    // Baú (branco, faixa azul), cabine a leste com para-brisa, rodas.
    bloco(m, 2.4, 1.15, 1.25, -0.4, 0.82, 0, white);
    bloco(m, 2.42, 0.14, 1.27, -0.4, 0.62, 0, cor.azul);
    bloco(m, 0.95, 0.85, 1.2, 1.25, 0.67, 0, white);
    bloco(m, 0.08, 0.36, 1.0, 1.72, 0.9, 0, mix(pv("blue-900"), vidro, 0.35));
    bloco(m, 0.5, 0.32, 0.02, 1.25, 0.88, 0.61, mix(pv("blue-900"), vidro, 0.35));
    for (const dx of [-1.15, 1.2]) for (const dz of [-0.62, 0.62]) peca(m, new THREE.CylinderGeometry(0.22, 0.22, 0.16, 8).rotateX(Math.PI / 2).translate(dx, 0.22, dz), cor.pneu);
    plano2("tv", em(x - 0.4, y + 0.63, 0, 0.95), 1.5, 0.5, 0);
    // Antena parabólica no teto e mastro.
    barra(m, [-1.0, 1.4, 0], [-1.0, 1.7, 0], 0.06, cor.metal);
    peca(m.clone().multiply(new THREE.Matrix4().makeTranslation(-1.0, 1.8, 0)).multiply(new THREE.Matrix4().makeRotationX(-0.8)), new THREE.CylinderGeometry(0.42, 0.12, 0.12, 10), white);
    barra(m, [0.3, 1.4, -0.4], [0.3, 2.0, -0.4], 0.04, aco);
    // Gerador e bobinas de cabo ao lado.
    bloco(em(x - 1.2, y + 1.35), 0.7, 0.45, 0.45, 0, 0.225, 0, cor.amarelo);
    for (const [dx, dz] of [[0.2, 1.3], [0.55, 1.45]]) peca(em(x + dx, y + dz), new THREE.CylinderGeometry(0.16, 0.16, 0.12, 8).translate(0, 0.06, 0), cor.escuro);
    pessoa(x + 1.0, y + 1.25, 0.4, cor.camisas[4], { bone: cor.azul });
  }
  if (T.imprensa) {
    const { x, y, rx, ry } = T.imprensa;
    const m = em(x, y);
    // Tenda: 4 mastros, teto listrado (azul/branco) e testeira com letreiro.
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bloco(m, 0.07, 1.5, 0.07, sx * (rx - 0.1), 0.75, sz * (ry - 0.1), cor.metal);
    const n = 6;
    for (let i = 0; i < n; i++) bloco(m, (2 * rx) / n, 0.1, 2 * ry, -rx + ((i + 0.5) * 2 * rx) / n, 1.55, 0, i % 2 ? white : cor.azul);
    bloco(m, 2 * rx, 0.22, 0.04, 0, 1.4, ry, white);
    plano2("imprensa", em(x, y + ry + 0.025, 0, 1.4), 1.6, 0.3, 0);
    // Duas bancadas com notebooks e cadeiras; jornalistas sentados.
    for (const dz of [-0.4, 0.45]) {
      bloco(m, 2.9, 0.05, 0.42, 0, 0.45, dz, white);
      for (const dx of [-1.3, 1.3]) bloco(m, 0.05, 0.45, 0.38, dx, 0.225, dz, cor.metal);
      for (const dx of [-0.9, 0, 0.9]) {
        bloco(m, 0.3, 0.02, 0.2, dx, 0.485, dz, cor.escuro);
        const ms = m.clone().multiply(new THREE.Matrix4().makeTranslation(dx, 0.58, dz - 0.09)).multiply(new THREE.Matrix4().makeRotationX(-0.25));
        bloco(ms, 0.3, 0.2, 0.02, 0, 0, 0, cor.escuro);
        bloco(ms, 0.26, 0.16, 0.01, 0, 0, 0.012, mix(pv("blue-300"), white, 0.4));
      }
    }
    for (const dx of [-0.9, 0.9]) pessoa(x + dx, y - 0.72, 0, cor.camisas[(dx > 0) + 5], { sentado: true, braco: "frente" });
    pessoa(x, y + 0.2, 0, cor.camisas[2], { sentado: true, braco: "frente" });
    // Fotógrafos na frente do pátio, olhando para a reta.
    for (const dx of [-1.6, 1.4]) {
      const mp = pessoa(x + dx, y + 1.9, Math.PI, cor.camisas[dx > 0 ? 6 : 1], { braco: "frente" });
      bloco(mp, 0.14, 0.1, 0.12, 0.12, 0.62, 0.26, cor.escuro);
    }
  }
  if (T.socorro) {
    const { x, y, rx } = T.socorro;
    const m = em(x, y);
    // Tenda branca de pirâmide com cruz vermelha na frente e no teto.
    bloco(m, 2 * rx - 0.2, 1.2, 2 * rx - 0.2, 0, 0.6, 0, white);
    bloco(m, 1.0, 0.95, 0.03, 0.35, 0.48, rx - 0.09, mix(white, pv("gray-300"), 0.5));
    peca(m, new THREE.ConeGeometry(rx * 1.35, 0.62, 4).rotateY(Math.PI / 4).translate(0, 1.51, 0), white);
    bloco(m, 2 * rx - 0.16, 0.1, 2 * rx - 0.16, 0, 1.2, 0, cor.vermelho);
    bloco(m, 0.5, 0.15, 0.03, -0.55, 0.75, rx - 0.08, cor.vermelho);
    bloco(m, 0.15, 0.5, 0.03, -0.55, 0.75, rx - 0.08, cor.vermelho);
    const mt = m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 1.62, 0.36)).multiply(new THREE.Matrix4().makeRotationX(0.95));
    bloco(mt, 0.42, 0.13, 0.02, 0, 0, 0, cor.vermelho);
    bloco(mt, 0.13, 0.42, 0.02, 0, 0, 0, cor.vermelho);
    // Maca, socorrista e uma cadeira.
    bloco(em(x - 0.5, y + rx + 0.55), 1.0, 0.05, 0.38, 0, 0.42, 0, white);
    for (const dx of [-0.42, 0.42]) bloco(em(x - 0.5, y + rx + 0.55), 0.04, 0.4, 0.34, dx, 0.2, 0, cor.metal);
    pessoa(x - 1.3, y + rx + 0.45, 0.5, mix(white, pv("red-200"), 0.15), { bone: cor.vermelho });
  }
  {
    // Pódio (1º no meio) com painel da pista atrás.
    const [px, py] = [65.3, 42.0];
    const bronze = mix(pv("yellow-800"), pv("red-400"), 0.35);
    for (const [dx, h, cr] of [[-0.66, 0.36, pv("gray-300")], [0, 0.5, cor.amarelo], [0.66, 0.26, bronze]]) {
      bloco(em(px + dx, py), 0.64, h, 0.62, 0, h / 2, 0, cr);
      bloco(em(px + dx, py), 0.66, 0.04, 0.64, 0, h, 0, white);
    }
    for (const dx of [-0.9, 0.9]) bloco(em(px + dx, py - 0.5), 0.05, 1.0, 0.05, 0, 0.5, 0, cor.metal);
    tabuleta("pista", px, py - 0.5, 0.95, 2.0, 0.5, { inclina: 0.1 });
    // Carrinho de serviço (golfe) e pilhas de pneus de reserva.
    const mc = em(55.6, 36.9, Math.PI / 2);
    bloco(mc, 0.7, 0.3, 1.2, 0, 0.3, 0, white);
    bloco(mc, 0.6, 0.22, 0.36, 0, 0.55, -0.2, cor.azul);
    bloco(mc, 0.62, 0.3, 0.06, 0, 0.62, 0.32, mix(pv("blue-900"), vidro, 0.35));
    for (const sx of [-0.3, 0.3]) for (const sz of [-0.45, 0.42]) bloco(mc, 0.04, 0.5, 0.04, sx, 0.95, sz, cor.metal);
    bloco(mc, 0.76, 0.06, 1.1, 0, 1.2, 0, cor.azul);
    for (const sx of [-0.36, 0.36]) for (const sz of [-0.38, 0.38]) peca(mc, new THREE.CylinderGeometry(0.14, 0.14, 0.1, 8).rotateZ(Math.PI / 2).translate(sx, 0.14, sz), cor.pneu);
    for (const [tx, ty] of [[53.6, 35.2], [54.0, 35.6], [53.6, 36.0]]) for (let i = 0; i < 3; i++) peca(em(tx, ty), new THREE.CylinderGeometry(0.17, 0.17, 0.17, segPneu).translate(0, 0.09 + i * 0.18, 0), i === 2 ? cor.vermelho : cor.pneu);
  }
  if (!lite) {
    // Detalhes soltos no pátio: cones, barris e uma bandeira SEMEC num mastro.
    for (const [cx, cy] of [[57.4, 38.6], [58.2, 38.6], [64.8, 38.6], [65.6, 38.6]]) {
      const m = em(cx, cy);
      peca(m, new THREE.ConeGeometry(0.1, 0.3, 6).translate(0, 0.18, 0), laranja);
      bloco(m, 0.24, 0.03, 0.24, 0, 0.03, 0, cor.escuro);
    }
    for (const [cx, cy, cr] of [[70.4, 37.4, cor.azul], [70.8, 37.0, cor.vermelho], [70.9, 37.6, cor.azul]]) peca(em(cx, cy), new THREE.CylinderGeometry(0.17, 0.17, 0.48, 8).translate(0, 0.27, 0), cr);
    barra(null, P(63.6, 0, 37.6), P(63.6, 2.3, 37.6), 0.05, aco);
    tabuleta("semec", 64.15, 37.6, 2.05, 1.0, 0.25, { inclina: 0.1 });
  }

  // ---- Cerca do mapa: mourões com capitel, três réguas e pilares, vão no portão -----
  {
    const X0 = 0.6;
    const X1 = MW - 1.6;
    const Y0 = 0.6;
    const Y1 = MH - 0.9;
    const reguas = lite ? [0.32, 0.66] : [0.24, 0.48, 0.72];
    const lado = (ax, ay, bx, by) => {
      for (const h of reguas) barra(null, P(ax, h, ay), P(bx, h, by), 0.055, mix(white, cor.concretoClaro, 0.3));
      const comp = Math.hypot(bx - ax, by - ay);
      const n = Math.max(1, Math.round(comp / 1.6));
      for (let i = 0; i <= n; i++) {
        const x = ax + ((bx - ax) * i) / n;
        const y = ay + ((by - ay) * i) / n;
        const m = em(x, y);
        if (i % 6 === 0 || i === n) {
          bloco(m, 0.26, 1.0, 0.26, 0, 0.5, 0, cor.concreto);
          bloco(m, 0.32, 0.08, 0.32, 0, 1.04, 0, cor.concretoClaro);
          if (!lite) bloco(m, 0.14, 0.12, 0.14, 0, 1.14, 0, cor.amarelo);
        } else {
          bloco(m, 0.11, 0.86, 0.11, 0, 0.43, 0, cor.madeira);
          if (!lite) bloco(m, 0.15, 0.06, 0.15, 0, 0.89, 0, cor.azul);
        }
      }
    };
    lado(X0, Y0, X1, Y0);
    lado(X1, Y0, X1, Y1);
    lado(X0, Y0, X0, Y1);
    lado(X0, Y1, GX0 - 0.4, Y1);
    lado(GX1 + 0.4, Y1, X1, Y1);
  }

  // Reservas (para a vila e a paisagem não plantarem em cima).
  for (const p of [...plano.placas, ...plano.holofotes, ...plano.cameras, ...plano.fiscais]) ctx.reservarArea(p.x, p.y, (p.w ?? 1) / 2 + 0.3, 0.6);
  for (const v of plano.varais) for (const p of v) ctx.reservarArea(p.x, p.y, 0.4, 0.4);

  // Fecha o atlas da beira (um draw call; levemente "aceso" para as placas
  // lerem bem de longe).
  const matAtlas = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0, side: THREE.DoubleSide, emissive: white, emissiveMap: tex, emissiveIntensity: 0.28 }));
  const meshAtlas = atlasBeira.fechar(matAtlas);
  if (meshAtlas) {
    track(meshAtlas.geometry);
    meshAtlas.receiveShadow = !lite;
    ctx.root.add(meshAtlas);
  }

  // ---- Animação: câmeras seguem o jogador; bandeiras acenam -------------------------
  const dummy = new THREE.Object3D();
  let festaT = -1;
  let ultimoArco = null;
  // O motor não avisa o fim da largada: o "VAI!" volta sozinho para o arco.
  let voltaTelao = -1;
  const telaoArco = () => {
    if (!ultimoArco) telao({ tipo: "logo" });
    else if (ultimoArco === ctx.N) telao({ tipo: "chegada" });
    else telao({ tipo: "arco", n: ultimoArco });
  };
  const atualizarBandeiras = (t) => {
    if (!bandMesh) return;
    bandLista.forEach((b, i) => {
      const forte = festaT >= 0 && festaT < 10;
      const ang = reducedMotion ? 0.35 : forte ? Math.sin(t * 9 + b.fase) * 0.95 : 0.25 + Math.sin(t * 1.6 + b.fase) * 0.35;
      dummy.position.set(b.x, b.h, b.z);
      dummy.rotation.set(0, b.giro, -ang);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      bandMesh.setMatrixAt(i, dummy.matrix);
    });
    bandMesh.instanceMatrix.needsUpdate = true;
  };
  atualizarBandeiras(0);
  const angulo = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  return {
    update(t, dt) {
      if (festaT >= 0) festaT += dt;
      if (voltaTelao > 0 && (voltaTelao -= dt) <= 0 && festaT < 0) telaoArco();
      if (reducedMotion) return;
      atualizarBandeiras(t);
      if (camMesh) {
        const j = ctx.jogador();
        camLista.forEach((cm, i) => {
          let alvo = cm.base;
          if (j) {
            const dx = j.x - cm.x;
            const dz = j.z - cm.z;
            if (dx * dx + dz * dz < 18 * 18) alvo = Math.atan2(dx, dz);
          }
          cm.giro += angulo(alvo - cm.giro) * Math.min(1, dt * 3);
          dummy.position.set(cm.x, cm.h, cm.z);
          dummy.rotation.set(0, cm.giro, 0);
          dummy.scale.setScalar(1);
          dummy.updateMatrix();
          camMesh.setMatrixAt(i, dummy.matrix);
        });
        camMesh.instanceMatrix.needsUpdate = true;
      }
    },
    festa() {
      festaT = 0;
      telao({ tipo: "festa" });
      atualizarBandeiras(0);
    },
    largada(fase) {
      if (fase != null) festaT = -1;
      voltaTelao = fase === "verde" ? 2.5 : -1;
      if (fase == null) telaoArco();
      else telao({ tipo: "contagem", fase });
    },
    setProximo(i) {
      // -1 chega logo antes da festa (o telão fica no PARABÉNS); 0 abre
      // uma corrida nova.
      if (i < 0) return;
      festaT = -1;
      ultimoArco = i < ctx.N ? i + 1 : null;
      if (voltaTelao < 0) telaoArco();
    },
  };
}
