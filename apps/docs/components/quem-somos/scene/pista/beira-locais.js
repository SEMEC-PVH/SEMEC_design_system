// Pista de bicicleta da Vila SEMEC: ONDE vai cada peça da beira (sem
// three.js; puro e testável no Node, como circuito.js e zonas.js).
//
// A beira é um anel estreito (de RESERVA_PISTA ≈ 2,38 a 3,5 tiles da linha
// central) mais o retângulo C. Dividimos o anel em duas "pistas" de
// objetos, para um não pisar no outro:
//   frente (d ≈ 2,85) pneus por fora das curvas, guard-rail nas retas e
//                     cones por dentro das curvas: tudo baixo (< 0,46);
//   fundo  (d ≈ 3,25) placas, chevrons, marcos 100/50, holofotes, câmeras
//                     de TV, fiscais e varais de bandeirinhas.
// Cada peça confere a pegada inteira (cantos e meio): na zona "beira", fora
// do asfalto + corredor (zonas.livre e d > PROIBIDO), fora do que outros
// módulos reservaram (ocupado) e do que esta própria beira já pôs, e com a
// altura dentro de zonas.alturaMax na borda norte (a câmera vem do sul).
// Ao sul de um trecho de pista sobra ~0,46 de altura: lá só entra peça
// baixa (as placas viram "baixas", sem pernas).
//
// A área técnica do retângulo C (torre, telão, imprensa, socorro, TV) tem
// posições fixas, conferidas do mesmo jeito (o que não couber some e avisa).

import { CORREDOR_FOLGA, RAIO_ASFALTO } from "./circuito";

// Nenhum ponto de peça pode ficar a esta distância da linha central ou menos.
export const PROIBIDO = RAIO_ASFALTO + CORREDOR_FOLGA + 0.35;
const FRENTE = 2.85;
const FUNDO = [3.25, 3.1, 3.4];

// Área técnica (zona C), tiles: centro, meia-pegada e altura.
export const AREA_TECNICA = {
  // Pátio: retângulo com o canto sudeste chanfrado (ali a curva 1 chega a
  // 1,5 tile do canto; com o chanfro o pátio fica a 2,6+ da linha central).
  piso: { x0: 52.6, x1: 71.4, y0: 34.2, y1: 43.2, ya: 40.6, xb: 68.6 },
  torre: { x: 60.5, y: 35.6, rx: 1.7, ry: 1.5, h: 4.6 },
  telao: { x: 66.6, y: 35.3, rx: 2.9, ry: 0.6, h: 4.1 },
  van: { x: 55.4, y: 40.2, rx: 1.75, ry: 0.85, h: 2 },
  imprensa: { x: 61.2, y: 40.9, rx: 2, ry: 1.3, h: 1.75 },
  socorro: { x: 68.4, y: 40.4, rx: 1.4, ry: 1.4, h: 1.9 },
};

// Vitrine do camarote SEMEC (arquibancadas.js, x 30,45..39,55): na faixa da
// beira logo à frente dele não entra peça do fundo (placa, fiscal, câmera,
// varal), senão ela tapa o time e os mascotes para a câmera do sul. O guard-rail
// (frente, baixo) continua.
const VITRINE = { x0: 30.2, x1: 39.8, y0: 43.2, y1: 45.8 };
const naVitrine = (x, y, rx, ry) => x + rx > VITRINE.x0 && x - rx < VITRINE.x1 && y + ry > VITRINE.y0 && y - ry < VITRINE.y1;

export function planejarBeira({ c, zonas, ocupado, lite, rand }) {
  const { pts } = c;
  const M = pts.length;
  const passo = c.total / M;
  const avisos = [];

  // Grade fina (1/4 de tile) do que a beira já pôs.
  const G = 4;
  const meu = new Set();
  const varrer = (x, y, rx, ry, f) => {
    for (let i = Math.floor((x - rx) * G); i <= Math.floor((x + rx) * G); i++) {
      for (let j = Math.floor((y - ry) * G); j <= Math.floor((y + ry) * G); j++) if (f(`${i},${j}`)) return true;
    }
    return false;
  };
  const colide = (x, y, rx, ry) => varrer(x, y, rx, ry, (k) => meu.has(k));
  const marcar = (x, y, rx, ry) => varrer(x, y, rx, ry, (k) => void meu.add(k));

  const dPista = (x, y) => c.corredor(x, y)?.d ?? Infinity;
  const pontoOk = (x, y) => zonas.naZona("beira", x, y) && zonas.livre(x, y, 0) && dPista(x, y) > PROIBIDO && !ocupado(x, y);
  // A pegada (retângulo de meia-largura rx, meia-profundidade ry) cabe, com
  // altura h? Confere 9 pontos e a altura na borda norte.
  const cabe = (x, y, rx, ry, h) => {
    const p = [[x, y], [x - rx, y - ry], [x + rx, y - ry], [x - rx, y + ry], [x + rx, y + ry], [x, y - ry], [x, y + ry], [x - rx, y], [x + rx, y]];
    if (!p.every(([a, b]) => pontoOk(a, b))) return false;
    if (![[x, y], [x - rx, y - ry], [x + rx, y - ry], [x, y - ry]].every(([a, b]) => zonas.alturaMax(a, b) >= h)) return false;
    return !colide(x, y, rx, ry);
  };
  const lado = (p, d) => [p.x - p.ty * d, p.y + p.tx * d];
  // Giro (em Y, mundo) para a peça no ponto (x, y) olhar para a pista.
  const paraPista = (x, y) => {
    const q = c.corredor(x, y);
    return q ? Math.atan2(-q.nx, -q.ny) : 0;
  };

  // Curvatura da linha central (± 2 tiles): > 0 vira para a direita na tela.
  const kv = pts.map((_, k) => {
    const a = pts[(k - 10 + M) % M];
    const b = pts[(k + 10) % M];
    return a.tx * b.ty - a.ty * b.tx;
  });
  // Distância ao longo da volta (cíclica) e espaçamento mínimo por tipo.
  const ds = (a, b) => {
    const d = Math.abs(a - b) % c.total;
    return Math.min(d, c.total - d);
  };
  const longe = (lista, s, min) => lista.every((t) => ds(t, s) >= min);

  // ---- Área técnica (C): posições fixas ------------------------------------------
  const tecnica = {};
  for (const [nome, o] of Object.entries(AREA_TECNICA)) {
    if (nome === "piso") continue;
    if (cabe(o.x, o.y, o.rx, o.ry, o.h)) {
      tecnica[nome] = o;
      marcar(o.x, o.y, o.rx + 0.15, o.ry + 0.15);
    } else avisos.push(`área técnica: "${nome}" não coube`);
  }
  {
    const pz = AREA_TECNICA.piso;
    marcar((pz.x0 + pz.x1) / 2, (pz.y0 + pz.ya) / 2, (pz.x1 - pz.x0) / 2 + 0.2, (pz.ya - pz.y0) / 2 + 0.2);
    marcar((pz.x0 + pz.xb) / 2, (pz.ya + pz.y1) / 2, (pz.xb - pz.x0) / 2 + 0.2, (pz.y1 - pz.ya) / 2 + 0.2);
  }

  // Ápices das curvas (máximos locais de |kv| acima de 0,5) e a entrada de
  // cada uma (onde |kv| cai abaixo de 0,3 voltando a partir do ápice).
  const apices = [];
  for (let k = 0; k < M; k++) {
    const v = Math.abs(kv[k]);
    if (v < 0.5) continue;
    let max = true;
    for (let d = -25; d <= 25 && max; d++) if (d && Math.abs(kv[(k + d + M) % M]) > v) max = false;
    if (max && longe(apices.map((a) => a.s), pts[k].s, 6)) {
      let e = k;
      while (Math.abs(kv[(e - 1 + M) % M]) >= 0.3 && (k - e + M) % M < 200) e = (e - 1 + M) % M;
      apices.push({ k, s: pts[k].s, entrada: e, fora: -Math.sign(kv[k]) });
    }
  }

  // ---- Fundo: holofotes, placas, chevrons, marcos, fiscais, câmeras ---------------
  // Tenta, a partir da amostra k, os dois lados (ou só `lados`) e as
  // distâncias do fundo; devolve a 1ª posição em que a pegada cabe.
  const noFundo = (k, rx, ry, h, lados = [1, -1]) => {
    const p = pts[k];
    for (const sg of lados) {
      for (const d of FUNDO) {
        const [x, y] = lado(p, sg * d);
        if (!naVitrine(x, y, rx, ry) && cabe(x, y, rx, ry, h)) return { x, y, sg };
      }
    }
    return null;
  };

  // Holofotes (torres altas, ~3,5): só onde não há pista logo ao norte.
  const holofotes = [];
  const sHolo = [];
  const maxHolo = lite ? 3 : 7;
  for (let k = 0; k < M && holofotes.length < maxHolo; k += 3) {
    if (!longe(sHolo, pts[k].s, 22)) continue;
    const r = noFundo(k, 0.45, 0.4, 3.7);
    if (!r) continue;
    holofotes.push({ x: r.x, y: r.y, giro: paraPista(r.x, r.y) });
    sHolo.push(pts[k].s);
    marcar(r.x, r.y, 0.55, 0.5);
  }

  // Chevrons por fora das curvas fechadas: 3 no ápice (2 no `lite`). A seta
  // aponta para onde a pista vai na tela (x da tangente na saída da curva).
  const chevrons = [];
  for (const a of apices) {
    const saida = pts[(a.k + 15) % M];
    const dir = Math.abs(saida.tx) > 0.25 ? Math.sign(saida.tx) : Math.sign(pts[a.k].tx) || 1;
    const offs = lite ? [-4, 4] : [-8, 0, 8];
    for (const o of offs) {
      const k = (a.k + o + M) % M;
      let r = noFundo(k, 0.36, 0.08, 0.78, [a.fora]);
      let baixa = false;
      if (!r) {
        r = noFundo(k, 0.3, 0.08, 0.44, [a.fora]);
        baixa = true;
      }
      if (!r) continue;
      chevrons.push({ x: r.x, y: r.y, dir, baixa });
      marcar(r.x, r.y, baixa ? 0.32 : 0.38, 0.3);
    }
  }

  // Marcos de frenagem 100 e 50 antes das curvas, do lado de fora.
  const marcos = [];
  for (const a of apices) {
    for (const [reg, antes] of [["m100", 4.5], ["m50", 2.2]]) {
      const k = (a.entrada - Math.round(antes / passo) + M) % M;
      let r = noFundo(k, 0.2, 0.08, 0.62, [a.fora]);
      let baixa = false;
      if (!r) {
        r = noFundo(k, 0.18, 0.08, 0.44, [a.fora]);
        baixa = true;
      }
      if (!r) continue;
      marcos.push({ x: r.x, y: r.y, reg, baixa });
      marcar(r.x, r.y, 0.24, 0.3);
    }
  }

  // Placas de publicidade (de frente para a câmera): altas com pernas onde
  // dá, baixas (no chão) ao sul da pista; as regiões se alternam.
  const placas = [];
  const sPlaca = [];
  const REGS = ["ds", "semec", "vila", "pedal", "acesso", "pista"];
  for (let k = 0; k < M; k += 4) {
    if (!longe(sPlaca, pts[k].s, lite ? 11 : 7)) continue;
    let r = null;
    let w = 0;
    let baixa = false;
    for (const ww of [2.2, 1.7, 1.25]) {
      r = noFundo(k, ww / 2, 0.1, 0.4 + ww / 4);
      if (r) {
        w = ww;
        break;
      }
    }
    if (!r) {
      for (const ww of [1.6, 1.2]) {
        r = noFundo(k, ww / 2, 0.1, 0.44);
        if (r) {
          w = ww;
          baixa = true;
          break;
        }
      }
    }
    if (!r) continue;
    placas.push({ x: r.x, y: r.y, w, baixa, reg: REGS[placas.length % REGS.length] });
    sPlaca.push(pts[k].s);
    marcar(r.x, r.y, w / 2 + 0.1, 0.14);
  }

  // Fiscais de pista (com bandeira; a bandeira sobe até ~1,1) e câmeras de
  // TV (tripé + cinegrafista).
  const fiscais = [];
  const sFiscal = [];
  const maxFiscal = lite ? 5 : 9;
  for (const a of [...apices, ...pts.map((_, k) => ({ k })).filter((_, k) => k % 25 === 0)]) {
    if (fiscais.length >= maxFiscal) break;
    for (const o of [12, 20, 4, 28]) {
      const k = (a.k + o) % M;
      if (!longe(sFiscal, pts[k].s, 16)) continue;
      const r = noFundo(k, 0.45, 0.32, 1.15, a.fora ? [a.fora, -a.fora] : [1, -1]);
      if (!r) continue;
      fiscais.push({ x: r.x, y: r.y, giro: paraPista(r.x, r.y) });
      sFiscal.push(pts[k].s);
      marcar(r.x, r.y, 0.45, 0.32);
      break;
    }
  }
  const cameras = [];
  const sCam = [];
  const maxCam = lite ? 3 : 6;
  for (let k = 0; k < M && cameras.length < maxCam; k += 5) {
    if (!longe(sCam, pts[k].s, 26) || !longe(sFiscal, pts[k].s, 5)) continue;
    const r = noFundo(k, 0.55, 0.4, 1.0);
    if (!r) continue;
    cameras.push({ x: r.x, y: r.y, giro: paraPista(r.x, r.y) });
    sCam.push(pts[k].s);
    marcar(r.x, r.y, 0.55, 0.4);
  }

  // Varais de bandeirinhas: postes de 1,45 a cada ~2,6 tiles nas retas;
  // só trechos de 3+ postes seguidos.
  const varais = [];
  {
    const passoPoste = Math.round(2.6 / passo);
    let atual = [];
    const fechar = () => {
      if (atual.length >= 3) {
        varais.push(atual);
        for (const q of atual) marcar(q.x, q.y, 0.1, 0.1);
      }
      atual = [];
    };
    let total = 0;
    for (const sg of [1, -1]) {
      for (let k = 0; k < M; k += passoPoste) {
        if (Math.abs(kv[k]) > 0.3 || total > (lite ? 14 : 34)) {
          fechar();
          continue;
        }
        const [x, y] = lado(pts[k], sg * FUNDO[0]);
        if (!naVitrine(x, y, 0.08, 0.08) && cabe(x, y, 0.08, 0.08, 1.55)) {
          const ant = atual.at(-1);
          if (ant && Math.hypot(ant.x - x, ant.y - y) > 3.4) fechar();
          atual.push({ x, y });
          total++;
        } else fechar();
      }
      fechar();
    }
  }

  // ---- Frente: pneus, guard-rail e cones ------------------------------------------
  // Pneus por fora das curvas (|kv| > 0,3): pilhas de 2 (de 1 onde só cabe
  // isso); fila de trás (só pneus pretos) fora do `lite`.
  const pneus = [];
  const SUB = 4;
  for (const fila of lite ? [0] : [0, 1]) {
    let ultimo = null;
    let n = 0;
    for (let k = 0; k < M; k++) {
      if (Math.abs(kv[k]) < 0.3) {
        ultimo = null;
        continue;
      }
      const fora = -Math.sign(kv[k]);
      const a = pts[k];
      const b = pts[(k + 1) % M];
      // Sub-amostras: por fora da curva o passo cresce, e o vão entre
      // pneus tem de ficar justo.
      for (let f = 0; f < SUB; f++) {
        const u = f / SUB;
        const q = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, tx: a.tx + (b.tx - a.tx) * u, ty: a.ty + (b.ty - a.ty) * u };
        const l = Math.hypot(q.tx, q.ty) || 1;
        q.tx /= l;
        q.ty /= l;
        const [x, y] = lado(q, fora * (FRENTE + fila * 0.33));
        if (ultimo && Math.hypot(ultimo[0] - x, ultimo[1] - y) < 0.33) continue;
        let alt = 2;
        if (!cabe(x, y, 0.1, 0.1, 0.4)) {
          if (!cabe(x, y, 0.1, 0.1, 0.2)) continue;
          alt = 1;
        }
        pneus.push({ x, y, alt: fila ? 1 : alt, fila, n: n++, giro: rand() * 6 });
        ultimo = [x, y];
      }
    }
  }
  for (const p of pneus) marcar(p.x, p.y, 0.17, 0.17);

  // Guard-rail nas retas (|kv| < 0,3: onde não há pneu), dos dois lados:
  // trechos de amostras seguidas que cabem, com poste a cada ~1,2.
  const rails = [];
  const postes = [];
  // Trechos curtos (menos de 4 lâminas) ficam de fora: picotado demais.
  const fecharTrecho = (t) => {
    if (t.length < 5) return;
    for (let i = 0; i + 1 < t.length; i++) rails.push({ ax: t[i].x, ay: t[i].y, bx: t[i + 1].x, by: t[i + 1].y });
    t.forEach((q, i) => {
      if (i % 3 === 0 || i === t.length - 1) postes.push(q);
    });
  };
  for (const sg of [1, -1]) {
    let trecho = [];
    for (let k = 0; k < M; k += 2) {
      const [x, y] = lado(pts[k], sg * FRENTE);
      if (Math.abs(kv[k]) >= 0.3 || !cabe(x, y, 0.06, 0.06, 0.43)) {
        fecharTrecho(trecho);
        trecho = [];
        continue;
      }
      trecho.push({ x, y });
    }
    fecharTrecho(trecho);
  }
  for (const r of rails) marcar((r.ax + r.bx) / 2, (r.ay + r.by) / 2, 0.15, 0.15);

  // Cones por dentro das curvas (no ápice e a cada ~1,6).
  const cones = [];
  {
    let ultimo = -99;
    for (let k = 0; k < M; k++) {
      if (Math.abs(kv[k]) < 0.32 || pts[k].s - ultimo < 1.6) continue;
      const [x, y] = lado(pts[k], Math.sign(kv[k]) * 2.8);
      if (!cabe(x, y, 0.16, 0.16, 0.44)) continue;
      cones.push({ x, y, giro: rand() * 6 });
      marcar(x, y, 0.16, 0.16);
      ultimo = pts[k].s;
    }
  }

  return { tecnica, holofotes, chevrons, marcos, placas, fiscais, cameras, varais, pneus, rails, postes, cones, apices, avisos };
}
