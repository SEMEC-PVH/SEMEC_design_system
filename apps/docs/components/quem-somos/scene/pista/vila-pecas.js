// Pista de bicicleta da Vila SEMEC: as peças fixas da zona "vila" (low-poly,
// tudo no lote compartilhado de cor por vértice: nenhum draw call a mais).
//
// Cada `pecaX(k, p)` monta uma peça em coordenadas LOCAIS (chão em y = 0,
// frente em +z, que é o sul: de frente para a câmera) num construtor `k`
// (novaPeca, abaixo); vila.js põe a peça no tile (p.x, p.y) com o giro.
// Placas com texto vão para o atlas da vila (k.placa → vila-rotulos.js).
// Lâmpadas e luzinhas não entram aqui: a peça devolve a posição delas em
// k.luzes (vila.js junta todas numa malha instanciada que pisca).

import * as THREE from "three";

// Construtor de peça: junta [geometria, cor] e placas em coordenadas locais.
export function novaPeca() {
  const partes = [];
  const placas = [];
  const luzes = [];
  const k = {
    partes,
    placas,
    luzes,
    geo(g, cor) {
      partes.push([g, cor]);
      return g;
    },
    // Caixa pelo centro (cx, cz), largura w (x), fundo d (z), altura h0..h1.
    caixa(cor, cx, cz, w, d, h0, h1, giro = 0) {
      const g = new THREE.BoxGeometry(w, h1 - h0, d);
      if (giro) g.rotateY(giro);
      g.translate(cx, (h0 + h1) / 2, cz);
      return k.geo(g, cor);
    },
    // Cilindro em pé (raio de cima r1, de baixo r2).
    cil(cor, cx, cz, r1, r2, h0, h1, seg = 8, aberto = false) {
      const g = new THREE.CylinderGeometry(r1, r2, h1 - h0, seg, 1, aberto);
      g.translate(cx, (h0 + h1) / 2, cz);
      return k.geo(g, cor);
    },
    bola(cor, cx, cy, cz, r, det = 0, sy = 1) {
      const g = new THREE.IcosahedronGeometry(r, det);
      if (sy !== 1) g.scale(1, sy, 1);
      g.translate(cx, cy, cz);
      return k.geo(g, cor);
    },
    // Placa do atlas da vila: plano w × h com a matriz local `m`.
    placa(regiao, w, h, m) {
      placas.push([regiao, w, h, m]);
    },
    luz(x, y, z, tipo = "lampada") {
      luzes.push({ x, y, z, tipo });
    },
  };
  return k;
}

// Traço grosso (polilinha 2D com espessura `esp`) → contorno (Shape), com
// a quina em "miter" limitada (as chaves têm bico).
export function traco(pts, esp) {
  const n = pts.length;
  const normal = (a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  };
  const esq = [];
  const dir = [];
  for (let i = 0; i < n; i++) {
    const n1 = i > 0 ? normal(pts[i - 1], pts[i]) : normal(pts[i], pts[i + 1]);
    const n2 = i < n - 1 ? normal(pts[i], pts[i + 1]) : n1;
    let mx = n1[0] + n2[0];
    let my = n1[1] + n2[1];
    const ml = Math.hypot(mx, my) || 1;
    mx /= ml;
    my /= ml;
    const s = esp / 2 / Math.max(0.55, mx * n1[0] + my * n1[1]);
    esq.push([pts[i][0] + mx * s, pts[i][1] + my * s]);
    dir.push([pts[i][0] - mx * s, pts[i][1] - my * s]);
  }
  const contorno = [...esq, ...dir.reverse()];
  const sh = new THREE.Shape();
  contorno.forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y)));
  sh.closePath();
  return sh;
}

// Forma 2D → sólido de espessura `fundo` (centrado em z), sem chanfro.
export function extrudar(forma, fundo) {
  const g = new THREE.ExtrudeGeometry(forma, { depth: fundo, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -fundo / 2);
  return g;
}

// Estrela de 5 pontas (sólido), centrada na origem, de frente para +z.
export function estrela(rFora, rDentro, fundo) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? rDentro : rFora;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i) sh.lineTo(x, y);
    else sh.moveTo(x, y);
  }
  sh.closePath();
  return extrudar(sh, fundo);
}

// ---- Mobiliário -------------------------------------------------------------------

// Banco de praça (madeira clara e pés escuros), assento de frente para +z.
export function pecaBanco(k, cor) {
  k.caixa(cor.ripa, 0, 0.04, 1.0, 0.32, 0.3, 0.36);
  k.caixa(cor.ripa, 0, -0.15, 1.0, 0.06, 0.4, 0.62);
  for (const sx of [-0.42, 0.42]) {
    k.caixa(cor.ferro, sx, 0.02, 0.06, 0.34, 0, 0.3);
    k.caixa(cor.ferro, sx, -0.15, 0.06, 0.06, 0.3, 0.6);
  }
}

// Poste de luz (a lâmpada pisca no lote de luzinhas).
export function pecaPoste(k, cor) {
  k.cil(cor.ferro, 0, 0, 0.09, 0.11, 0, 0.12, 6);
  k.cil(cor.ferro, 0, 0, 0.035, 0.045, 0.12, 1.72, 5);
  k.caixa(cor.ferro, 0, 0, 0.26, 0.26, 1.72, 1.78);
  k.cil(cor.ferro, 0, 0, 0.07, 0.15, 1.92, 2.0, 6);
  k.luz(0, 1.86, 0, "lampada");
}

// Ipê (amarelo ou rosa): tronco fino e copa em três bolas.
export function pecaIpe(k, cor, flor, rand) {
  k.cil(cor.madeira, 0, 0, 0.06, 0.1, 0, 0.95, 5);
  k.caixa(cor.madeira, 0.12, 0, 0.05, 0.05, 0.7, 1.05, 0.5);
  const tons = [flor, cor.mix(flor, cor.white, 0.25), cor.mix(flor, cor.folha, 0.2)];
  k.bola(tons[0], 0, 1.35, 0, 0.5, 0, 0.8);
  k.bola(tons[1], 0.32, 1.25 + rand() * 0.1, 0.12, 0.34);
  k.bola(tons[2], -0.3, 1.2 + rand() * 0.1, -0.08, 0.36);
  k.bola(tons[1], 0.05, 1.68, -0.05, 0.28);
}

// Arbusto redondo (uma ou duas bolas).
export function pecaArbusto(k, cor, rand) {
  const r = 0.2 + rand() * 0.14;
  k.bola(rand() < 0.5 ? cor.folha : cor.folhaEsc, 0, r * 0.85, 0, r, 0, 0.85);
  if (!cor.lite && rand() < 0.6) k.bola(cor.folhaClara, r * 0.7, r * 0.6, r * 0.2, r * 0.65, 0, 0.85);
}

// Flor: cabinho e uma bolinha (no `lite`, sem cabinho e mais simples).
export function flor(k, cor, x, z, c, lite, rand) {
  const h = 0.16 + rand() * 0.12;
  if (!lite) {
    const g = new THREE.CylinderGeometry(0.012, 0.012, h, 3, 1, true);
    g.translate(x, h / 2, z);
    k.geo(g, cor.caule);
  }
  const r = 0.075 + rand() * 0.03;
  // No `lite`, octaedro (8 triângulos em vez de 20).
  if (lite) k.geo(new THREE.OctahedronGeometry(r * 1.15, 0).translate(x, h, z), c);
  else k.bola(c, x, h, z, r);
}

// Canteiro w × d: mureta de pedra, terra e flores na cor do token.
export function pecaCanteiro(k, cor, p, florCor, lite, rand) {
  const { w, d } = p;
  const e = 0.12;
  k.caixa(cor.mureta, 0, -d / 2 + e / 2, w, e, 0, 0.18);
  k.caixa(cor.mureta, 0, d / 2 - e / 2, w, e, 0, 0.18);
  k.caixa(cor.mureta, -w / 2 + e / 2, 0, e, d - 2 * e, 0, 0.18);
  k.caixa(cor.mureta, w / 2 - e / 2, 0, e, d - 2 * e, 0, 0.18);
  k.caixa(cor.terraEsc, 0, 0, w - 2 * e, d - 2 * e, 0, 0.12);
  const passo = lite ? 0.4 : 0.21;
  const tons = [florCor, cor.mix(florCor, cor.white, 0.3), cor.mix(florCor, cor.white, 0.12)];
  for (let z = -d / 2 + e + passo / 2; z < d / 2 - e; z += passo) {
    for (let x = -w / 2 + e + passo / 2; x < w / 2 - e; x += passo) {
      const jx = (rand() - 0.5) * passo * 0.5;
      const jz = (rand() - 0.5) * passo * 0.5;
      if (rand() < 0.12 && !lite) k.bola(cor.folha, x + jx, 0.14, z + jz, 0.09, 0, 0.7);
      else flor(k, cor, x + jx, z + jz, tons[Math.floor(rand() * 3)], lite, rand);
    }
  }
}

// Botão gigante do Design System (cápsula em pé, inclinada para a câmera,
// com a "sombra" de botão atrás e o rótulo do atlas na face).
export function pecaBotao(k, cor, corpo, borda, regiao) {
  const incl = -0.55; // inclina para trás (lê-se de cima)
  const m = new THREE.Matrix4().makeTranslation(0, 0.1, 0).multiply(new THREE.Matrix4().makeRotationX(incl));
  const add = (g, c) => {
    g.applyMatrix4(m);
    k.geo(g, c);
  };
  const R = 0.35;
  const L = 1.42;
  // Corpo (caixa + duas meias-cápsulas) e a base escura atrás (o "relevo").
  const corpoGeo = (dz, prof, c, enc = 0) => {
    const b = new THREE.BoxGeometry(L, 2 * (R - enc), prof);
    b.translate(0, R, dz);
    add(b, c);
    for (const s of [-1, 1]) {
      const cl = new THREE.CylinderGeometry(R - enc, R - enc, prof, 10, 1, false, s > 0 ? 0 : Math.PI, Math.PI);
      cl.rotateX(Math.PI / 2);
      cl.translate((s * L) / 2, R, dz);
      add(cl, c);
    }
  };
  corpoGeo(-0.12, 0.14, borda);
  corpoGeo(0.02, 0.16, corpo);
  // Pezinhos (apoio no chão).
  k.caixa(cor.ferro, -0.6, -0.3, 0.06, 0.5, 0, 0.12);
  k.caixa(cor.ferro, 0.6, -0.3, 0.06, 0.5, 0, 0.12);
  const mp = m.clone().multiply(new THREE.Matrix4().makeTranslation(0, R, 0.105));
  k.placa(regiao, 2.2, 2.2 / 2.656, mp);
}

// Placa de praça: duas estacas e o quadro inclinado para a câmera.
export function pecaPlaca(k, cor, regiao, w) {
  const h = w / 4;
  for (const sx of [-w / 2 + 0.15, w / 2 - 0.15]) k.caixa(cor.madeira, sx, 0, 0.08, 0.08, 0, 0.75);
  const m = new THREE.Matrix4().makeTranslation(0, 0.5 + h / 2, 0).multiply(new THREE.Matrix4().makeRotationX(-0.75));
  const fundo = new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.05);
  fundo.applyMatrix4(m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0, -0.035)));
  k.geo(fundo, cor.madeira);
  k.placa(regiao, w, h, m);
}

// Bicicletário com n bicicletas pequenas (rodas de toro, quadro colorido).
export function pecaBicicletario(k, cor, n, coresBike) {
  const larg = n * 0.62 + 0.2;
  k.caixa(cor.piso, 0, 0, larg + 0.2, 0.9, 0, 0.03);
  for (let i = 0; i < n; i++) {
    const x = -larg / 2 + 0.41 + i * 0.62;
    // Arco do suporte (U invertido).
    k.caixa(cor.ferro, x - 0.08, -0.05, 0.04, 0.04, 0.03, 0.42);
    k.caixa(cor.ferro, x + 0.08, -0.05, 0.04, 0.04, 0.03, 0.42);
    k.caixa(cor.ferro, x, -0.05, 0.2, 0.04, 0.4, 0.44);
    // Bicicleta estacionada na diagonal (de frente, de cima, ficaria só um
    // risco): monta apontando para o sul e gira em volta do próprio centro.
    const ini = k.partes.length;
    const c = coresBike[i % coresBike.length];
    for (const dz of [-0.3, 0.3]) {
      const roda = new THREE.TorusGeometry(0.17, 0.025, 4, 12);
      roda.rotateY(Math.PI / 2);
      roda.translate(x + 0.02, 0.2, dz);
      k.geo(roda, cor.pneu);
    }
    k.caixa(c, x + 0.02, 0, 0.04, 0.5, 0.33, 0.37);
    k.caixa(c, x + 0.02, -0.08, 0.04, 0.05, 0.2, 0.46, 0);
    k.caixa(c, x + 0.02, 0.25, 0.04, 0.04, 0.2, 0.5);
    k.caixa(cor.escuro, x + 0.02, -0.1, 0.07, 0.14, 0.47, 0.5);
    k.caixa(cor.escuro, x + 0.02, 0.25, 0.26, 0.03, 0.5, 0.53);
    for (const [g] of k.partes.slice(ini)) g.translate(-x, 0, 0).rotateY(-0.8).translate(x, 0, 0.05);
  }
}

// Cápsula (caixa + duas meias-cápsulas) deitada no plano xy, frente em +z,
// centro em (0, R, dz) antes da matriz `m`: comprimento reto L, raio R.
function capsula(k, m, L, R, dz, prof, c) {
  const b = new THREE.BoxGeometry(L, 2 * R, prof);
  b.translate(0, R, dz);
  k.geo(b.applyMatrix4(m), c);
  for (const s of [-1, 1]) {
    const cl = new THREE.CylinderGeometry(R, R, prof, 10, 1, false, s > 0 ? 0 : Math.PI, Math.PI);
    cl.rotateX(Math.PI / 2);
    cl.translate((s * L) / 2, R, dz);
    k.geo(cl.applyMatrix4(m), c);
  }
}

// Switch do kit, gigante: trilho azul ligado e a bolinha branca à direita.
export function pecaSwitch(k, cor) {
  const m = new THREE.Matrix4().makeTranslation(0, 0.08, 0).multiply(new THREE.Matrix4().makeRotationX(-0.7));
  capsula(k, m, 0.8, 0.3, -0.08, 0.12, cor.azulEsc);
  capsula(k, m, 0.8, 0.3, 0.02, 0.12, cor.azul);
  const bola = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 12);
  bola.rotateX(Math.PI / 2);
  bola.translate(0.4, 0.3, 0.1);
  k.geo(bola.applyMatrix4(m), cor.branco);
  k.caixa(cor.ferro, -0.45, -0.22, 0.06, 0.4, 0, 0.1);
  k.caixa(cor.ferro, 0.45, -0.22, 0.06, 0.4, 0, 0.1);
}

// Checkbox do kit, gigante: quadrado azul marcado com o ✓ branco.
export function pecaCheckbox(k, cor) {
  const m = new THREE.Matrix4().makeTranslation(0, 0.08, 0).multiply(new THREE.Matrix4().makeRotationX(-0.7));
  const add = (g, c) => k.geo(g.applyMatrix4(m), c);
  add(new THREE.BoxGeometry(0.86, 0.86, 0.12).translate(0, 0.43, -0.1), cor.azulEsc);
  add(new THREE.BoxGeometry(0.82, 0.82, 0.14).translate(0, 0.43, 0.0), cor.azul);
  const v = extrudar(traco([[-0.24, 0.45], [-0.06, 0.26], [0.26, 0.62]], 0.12), 0.06);
  add(v.translate(0, 0, 0.09), cor.branco);
  k.caixa(cor.ferro, 0, -0.25, 0.5, 0.06, 0, 0.1);
}

// Teclado gigante (deitado, um pouco inclinado para a câmera): teclas
// claras, Esc vermelho, Enter amarelo e a barra de espaço.
export function pecaTeclado(k, cor) {
  const m = new THREE.Matrix4().makeTranslation(0, 0.12, 0).multiply(new THREE.Matrix4().makeRotationX(0.18));
  const add = (g, c) => k.geo(g.applyMatrix4(m), c);
  add(new THREE.BoxGeometry(2.2, 0.12, 0.92).translate(0, 0, 0), cor.grafite);
  k.caixa(cor.grafite, 0, -0.38, 2.2, 0.12, 0, 0.14);
  const tecla = (x, z, w, c) => add(new THREE.BoxGeometry(w, 0.07, 0.15).translate(x, 0.09, z), c);
  for (let fila = 0; fila < 4; fila++) {
    const z = -0.33 + fila * 0.19;
    const desloca = fila * 0.05;
    for (let i = 0; i < 10; i++) {
      const x = -0.95 + desloca + i * 0.19;
      if (fila === 1 && i === 9) continue; // lugar do Enter
      let c = cor.tecla;
      if (fila === 0 && i === 0) c = cor.vermelho;
      tecla(x, z, 0.15, c);
    }
  }
  tecla(0.92, -0.14, 0.3, cor.amarelo);
  tecla(0, 0.4, 1.1, cor.tecla);
}
