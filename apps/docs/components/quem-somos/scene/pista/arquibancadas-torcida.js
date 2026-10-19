// Pista de bicicleta da Vila SEMEC: a torcida genérica (dono: arquibancadas.js).
//
// Todo o público e tudo que tem texto da arquibancada (cartazes na mão,
// faixas no parapeito e o telão) é UMA InstancedMesh, num material só:
//   - a geometria é um boneco voxel (pernas, camisa, cabeça, cabelo, olhos,
//     dois braços com mão e um cartaz de dois lados acima da cabeça);
//   - cada vértice diz de que parte é (aParte: parte, braço, cartaz) e cada
//     instância traz as suas cores (camisa, pele, cabelo, calça) e o jeito
//     (fase, energia, braço parado, modo); o shader pinta e anima;
//   - modo 0: sem cartaz (o cartaz some, vira um ponto dentro do peito);
//     modo 1: segura o cartaz com os dois braços para cima;
//     modo 2: "só cartaz": o boneco some e o cartaz vira um quadro unitário
//     (a matriz da instância dá o tamanho) — assim faixas e telão entram na
//     mesma draw call. A região de textura do cartaz vem de aPlaca.
//
// Animação toda na GPU (o PC da prefeitura agradece: por quadro só mudam
// quatro uniforms): balanço leve, a "ola" correndo para o leste ao longo da
// arquibancada (e continuando na torcida do outro lado da reta), o grito da
// largada (uGrito: pulo e braços para cima, curto) e a festa (uFesta: todo
// mundo pulando e acenando). A sombra usa um MeshDepthMaterial com o mesmo
// trecho de vértice, então pula junto. Com reducedMotion o tempo não anda e
// os uniforms ficam em 0: cada um fica na pose sorteada (alguns com um braço
// para cima).
//
// A textura é um canvas próprio (cores só de tokens): branco (corpo), papelão
// (verso do cartaz), cartazes (VAI!, SEMEC, DS, coração, BORA!, NOTA 10),
// faixas e dois quadros do telão (normal e festa).

import * as THREE from "three";

// ---- Textura: cartazes, faixas e telão ---------------------------------------------
export function criarTexturaTorcida(pal, lite) {
  const { pv, mix } = pal;
  const W = 512;
  const H = 512;
  const k = lite ? 0.5 : 1;
  const canvas = document.createElement("canvas");
  canvas.width = W * k;
  canvas.height = H * k;
  const g = canvas.getContext("2d");
  g.scale(k, k);
  const reg = {};
  // Região (pixels do canvas de 512) → uv, com 2 px de folga (mipmaps).
  const regiao = (nome, x, y, w, h) => {
    reg[nome] = { u0: (x + 2) / W, u1: (x + w - 2) / W, v0: 1 - (y + h - 2) / H, v1: 1 - (y + 2) / H };
  };
  const texto = (str, x, y, { tam = 48, peso = 700, cor, max = 400 }) => {
    let s = tam;
    g.font = `${peso} ${s}px ${pal.font}`;
    while (g.measureText(str).width > max && s > 8) {
      s -= 2;
      g.font = `${peso} ${s}px ${pal.font}`;
    }
    g.fillStyle = cor.getStyle();
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(str, x, y);
  };
  const coracao = (cx, cy, r, cor) => {
    g.fillStyle = cor.getStyle();
    g.beginPath();
    g.moveTo(cx, cy + r * 0.9);
    g.bezierCurveTo(cx - r * 1.5, cy - r * 0.1, cx - r * 0.7, cy - r * 1.2, cx, cy - r * 0.45);
    g.bezierCurveTo(cx + r * 0.7, cy - r * 1.2, cx + r * 1.5, cy - r * 0.1, cx, cy + r * 0.9);
    g.fill();
  };
  const estrela = (cx, cy, r, cor) => {
    g.fillStyle = cor.getStyle();
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    g.fill();
  };
  const quadro = (x, y, w, h, fundo, borda) => {
    g.fillStyle = (borda ?? fundo).getStyle();
    g.fillRect(x, y, w, h);
    g.fillStyle = fundo.getStyle();
    if (borda) g.fillRect(x + 5, y + 5, w - 10, h - 10);
  };
  const xadrez = (x, y, w, h, n, m) => {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        g.fillStyle = ((i + j) % 2 ? pv("white") : pv("gray-950")).getStyle();
        g.fillRect(x + (i * w) / n, y + (j * h) / m, w / n + 0.5, h / m + 0.5);
      }
    }
  };
  const branco = pv("white");
  const azul = pv("blue-700");
  const azulEsc = pv("blue-900");
  const amarelo = pv("yellow-500");
  const vermelho = pv("red-600");

  // Corpo (branco, tingido no shader) e o verso dos cartazes (papelão).
  g.fillStyle = branco.getStyle();
  g.fillRect(0, 0, 32, 32);
  regiao("branco", 0, 0, 32, 32);
  g.fillStyle = mix(pv("yellow-800"), branco, 0.55).getStyle();
  g.fillRect(32, 0, 32, 32);
  regiao("papelao", 32, 0, 32, 32);

  // Cartazes (128 × 80, proporção do cartaz da mão: 0,5 × 0,3).
  const cartaz = (nome, i, desenha) => {
    const x = (i % 4) * 128;
    const y = 32 + Math.floor(i / 4) * 80;
    g.save();
    desenha(x, y);
    g.restore();
    regiao(nome, x, y, 128, 80);
  };
  cartaz("vai", 0, (x, y) => {
    quadro(x, y, 128, 80, amarelo, azul);
    texto("VAI!", x + 64, y + 42, { tam: 52, cor: azul, max: 110 });
  });
  cartaz("semec", 1, (x, y) => {
    quadro(x, y, 128, 80, azul, amarelo);
    texto("SEMEC", x + 64, y + 42, { tam: 40, cor: branco, max: 108 });
  });
  cartaz("ds", 2, (x, y) => {
    quadro(x, y, 128, 80, branco, azul);
    texto("DS", x + 50, y + 42, { tam: 50, cor: azul, max: 70 });
    coracao(x + 96, y + 40, 16, vermelho);
  });
  cartaz("coracao", 3, (x, y) => {
    quadro(x, y, 128, 80, branco, vermelho);
    coracao(x + 64, y + 40, 30, vermelho);
  });
  cartaz("bora", 4, (x, y) => {
    quadro(x, y, 128, 80, vermelho, branco);
    texto("BORA!", x + 64, y + 42, { tam: 42, cor: branco, max: 108 });
  });
  cartaz("nota10", 5, (x, y) => {
    quadro(x, y, 128, 80, branco, amarelo);
    texto("NOTA 10", x + 64, y + 42, { tam: 34, cor: azulEsc, max: 108 });
  });
  cartaz("estrela", 6, (x, y) => {
    quadro(x, y, 128, 80, azulEsc, amarelo);
    estrela(x + 64, y + 40, 28, amarelo);
  });
  cartaz("a11y", 7, (x, y) => {
    quadro(x, y, 128, 80, pv("green-600"), branco);
    texto("A11Y", x + 64, y + 42, { tam: 40, cor: branco, max: 108 });
  });

  // Faixas (512 × 48): no parapeito da arquibancada e do camarote.
  const faixa = (nome, y, fundo, desenha) => {
    g.fillStyle = fundo.getStyle();
    g.fillRect(0, y, 512, 48);
    desenha(y);
    regiao(nome, 0, y, 512, 48);
  };
  faixa("fTorcida", 192, azul, (y) => {
    g.fillStyle = amarelo.getStyle();
    g.fillRect(0, y + 40, 512, 8);
    coracao(34, y + 22, 13, amarelo);
    coracao(478, y + 22, 13, amarelo);
    texto("TORCIDA SEMEC", 256, y + 22, { tam: 34, cor: branco, max: 380 });
  });
  faixa("fVai", 240, amarelo, (y) => {
    xadrez(0, y, 48, 48, 3, 3);
    xadrez(464, y, 48, 48, 3, 3);
    texto("VAI, CICLISTA!", 256, y + 25, { tam: 34, cor: azulEsc, max: 380 });
  });
  faixa("fDs", 288, branco, (y) => {
    g.fillStyle = azul.getStyle();
    g.fillRect(0, y, 512, 6);
    g.fillRect(0, y + 42, 512, 6);
    texto("DESIGN SYSTEM", 220, y + 25, { tam: 32, cor: azul, max: 330 });
    coracao(420, y + 24, 14, vermelho);
  });
  faixa("fCamarote", 336, azulEsc, (y) => {
    g.fillStyle = amarelo.getStyle();
    g.fillRect(0, y, 512, 5);
    g.fillRect(0, y + 43, 512, 5);
    estrela(40, y + 24, 14, amarelo);
    estrela(472, y + 24, 14, amarelo);
    texto("CAMAROTE SEMEC", 256, y + 25, { tam: 32, cor: branco, max: 360 });
  });
  faixa("fVila", 384, pv("green-700"), (y) => {
    texto("VILA SEMEC", 256, y + 25, { tam: 34, cor: branco, max: 360 });
    coracao(90, y + 24, 12, amarelo);
    coracao(422, y + 24, 12, amarelo);
  });

  // Telão (256 × 80 cada): normal e festa.
  const tela = (nome, x, desenha) => {
    g.fillStyle = pv("gray-950").getStyle();
    g.fillRect(x, 432, 256, 80);
    desenha(x, 432);
    regiao(nome, x, 432, 256, 80);
  };
  tela("telao", 0, (x, y) => {
    g.fillStyle = azul.getStyle();
    g.fillRect(x + 6, y + 6, 244, 68);
    texto("VAI, VILA!", x + 128, y + 32, { tam: 36, cor: branco, max: 220 });
    texto("2 VOLTAS · BOA CORRIDA", x + 128, y + 60, { tam: 16, peso: 600, cor: amarelo, max: 220 });
  });
  tela("telaoFesta", 256, (x, y) => {
    g.fillStyle = amarelo.getStyle();
    g.fillRect(x + 6, y + 6, 244, 68);
    estrela(x + 30, y + 40, 18, azul);
    estrela(x + 226, y + 40, 18, azul);
    texto("VITÓRIA!", x + 128, y + 34, { tam: 34, cor: azulEsc, max: 170 });
    texto("VOLTA COMPLETA", x + 128, y + 61, { tam: 16, peso: 600, cor: azulEsc, max: 170 });
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, reg };
}

// ---- Geometria do boneco ----------------------------------------------------------
// Partes (aParte.x): 0 olhos (escuro fixo), 1 camisa, 2 pele, 3 calça,
// 4 cabelo, 5 cartaz (sem tinta). aParte.y: braço (+1 esquerdo, em +x, −1
// direito, 0 nenhum). aParte.z: 1 frente do cartaz, 2 verso, 0 corpo.
// Olhando para +z (o sul, a câmera); pés no chão (y = 0), ~0,74 de altura.
export const OMBRO = { x: 0.165, y: 0.46 };

export function geometriaPessoa(reg) {
  const pos = [];
  const uv = [];
  const parte = [];
  const meio = (r) => [(r.u0 + r.u1) / 2, (r.v0 + r.v1) / 2];
  const uvBranco = meio(reg.branco);
  const uvPapelao = meio(reg.papelao);
  const box = (w, h, d, x, y, z, p, braco = 0) => {
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed();
    g.translate(x, y, z);
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      pos.push(a.getX(i), a.getY(i), a.getZ(i));
      uv.push(...uvBranco);
      parte.push(p, braco, 0);
    }
    g.dispose();
  };
  // Quadro do cartaz (frente para +z ou verso para −z), uv 0..1 na frente.
  const quad = (lado) => {
    const w = 0.5;
    const h = 0.3;
    const y0 = 0.69;
    const z = 0.035 * lado;
    const c = [
      [-w / 2, y0, 0, 0],
      [w / 2, y0, 1, 0],
      [w / 2, y0 + h, 1, 1],
      [-w / 2, y0 + h, 0, 1],
    ];
    const ordem = lado > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2];
    for (const i of ordem) {
      const [x, y, u, v] = c[i];
      pos.push(x, y, z);
      if (lado > 0) uv.push(u, v);
      else uv.push(...uvPapelao);
      parte.push(5, 0, lado > 0 ? 1 : 2);
    }
  };
  // Olho: um quadradinho escuro colado na cara (2 triângulos).
  const olho = (x, y) => {
    const w = 0.018;
    const h = 0.024;
    for (const [dx, dy] of [[-w, -h], [w, -h], [w, h], [-w, -h], [w, h], [-w, h]]) {
      pos.push(x + dx, y + dy, 0.101);
      uv.push(...uvBranco);
      parte.push(0, 0, 0);
    }
  };
  box(0.2, 0.24, 0.13, 0, 0.12, 0, 3); // pernas
  box(0.27, 0.25, 0.17, 0, 0.365, 0, 1); // camisa
  box(0.22, 0.2, 0.2, 0, 0.59, 0, 2); // cabeça
  box(0.236, 0.06, 0.216, 0, 0.705, -0.002, 4); // cabelo (topo)
  box(0.236, 0.13, 0.06, 0, 0.635, -0.085, 4); // cabelo (nuca)
  for (const s of [-1, 1]) {
    olho(s * 0.05, 0.6);
    // Braço (manga da camisa) e mão, pendurados do ombro.
    box(0.075, 0.2, 0.085, s * OMBRO.x, OMBRO.y - 0.1, 0, 1, s);
    box(0.07, 0.06, 0.08, s * OMBRO.x, OMBRO.y - 0.23, 0, 2, s);
  }
  quad(1);
  quad(-1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute("aParte", new THREE.Float32BufferAttribute(parte, 3));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

// ---- Shader (trechos injetados no MeshStandardMaterial e no de sombra) ---------
const CABECALHO = /* glsl */ `
uniform float uT;
uniform float uOla;
uniform float uFesta;
uniform float uGrito;
attribute vec3 aParte;
attribute vec4 aCor1; // camisa, fase
attribute vec4 aCor2; // pele, energia
attribute vec4 aCor3; // cabelo, braço parado (rad)
attribute vec4 aCor4; // calça, modo
attribute vec4 aPlaca; // u0, v0, u1, v1 do cartaz
`;

const ANIMA = /* glsl */ `
{
  float modo = aCor4.w;
  float cartaz = aParte.z;
  if (modo > 1.5) {
    // Só cartaz: quadro unitário (a matriz da instância dá tamanho e lugar).
    transformed = (cartaz > 0.5 && cartaz < 1.5) ? vec3(uv.x - 0.5, uv.y - 0.5, 0.0) : vec3(0.0);
  } else {
    float fase = aCor1.w;
    float energia = aCor2.w;
    float xw = instanceMatrix[3].x;
    // Ola: um pico estreito que corre para o leste (~7 tiles/s).
    float ola = pow(max(0.0, sin(uT * 0.9 - xw * 0.12)), 10.0) * uOla;
    float agito = max(uFesta, uGrito);
    float pulo = ola * 0.17
      + uFesta * abs(sin(uT * 7.0 + fase)) * 0.2 * energia
      + uGrito * abs(sin(uT * 9.0 + fase)) * 0.22
      + 0.012 * sin(uT * 2.6 + fase) * (1.0 - agito);
    float ang = max(aCor3.w, max(ola * 2.6, agito * (2.35 + 0.4 * sin(uT * 9.0 + fase * 2.0))));
    if (modo > 0.5) ang = 2.62 + 0.06 * sin(uT * 3.0 + fase);
    float braco = aParte.y;
    if (braco != 0.0) {
      vec2 piv = vec2(braco * ${OMBRO.x.toFixed(3)}, ${OMBRO.y.toFixed(3)});
      vec2 v = transformed.xy - piv;
      float a = braco * ang;
      float c = cos(a);
      float s = sin(a);
      transformed.xy = piv + vec2(v.x * c - v.y * s, v.x * s + v.y * c);
    }
    // Sem cartaz: o cartaz vira um ponto dentro do peito (não desenha).
    if (cartaz > 0.5 && modo < 0.5) transformed = vec3(0.0, 0.36, 0.0);
    // Cartaz balança um pouco na mão.
    if (cartaz > 0.5 && modo > 0.5) transformed.x += 0.03 * sin(uT * 3.0 + fase);
    transformed.y += max(pulo, 0.0);
  }
}
`;

export function criarTorcida({ tex, reg, lista, lite, reducedMotion, pal, track }) {
  const { pv } = pal;
  const geo = track(geometriaPessoa(reg));
  const n = Math.max(1, lista.length);
  const cor = [1, 2, 3, 4].map(() => new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4));
  const placa = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
  cor.forEach((a, i) => geo.setAttribute(`aCor${i + 1}`, a));
  geo.setAttribute("aPlaca", placa);

  const U = {
    uT: { value: 0 },
    uOla: { value: reducedMotion ? 0 : 1 },
    uFesta: { value: 0 },
    uGrito: { value: 0 },
  };
  const escuro = pv("gray-900");
  const mat = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0, flatShading: true }));
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\n${CABECALHO}\nvarying vec3 vTint;`)
      .replace(
        "#include <uv_vertex>",
        "#include <uv_vertex>\n#ifdef USE_MAP\nif (aParte.z > 0.5 && aParte.z < 1.5) vMapUv = mix(aPlaca.xy, aPlaca.zw, uv);\n#endif"
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>\n${ANIMA}
        {
          float p = aParte.x;
          vTint = p < 0.5 ? vec3(${escuro.r.toFixed(4)}, ${escuro.g.toFixed(4)}, ${escuro.b.toFixed(4)})
            : p < 1.5 ? aCor1.rgb : p < 2.5 ? aCor2.rgb : p < 3.5 ? aCor4.rgb : p < 4.5 ? aCor3.rgb : vec3(1.0);
        }`
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vTint;")
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= vTint;");
  };
  mat.customProgramCacheKey = () => "pista-torcida";
  const matSombra = track(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
  matSombra.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>\n${CABECALHO}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${ANIMA}`);
  };
  matSombra.customProgramCacheKey = () => "pista-torcida-sombra";

  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.count = lista.length;
  const dummy = new THREE.Object3D();
  const porPlaca = (i, r) => placa.setXYZW(i, r.u0, r.v0, r.u1, r.v1);
  lista.forEach((it, i) => {
    dummy.position.set(it.x, it.h ?? 0, it.z);
    dummy.rotation.set(it.inclina ?? 0, it.giro ?? 0, 0, "YXZ");
    if (it.modo === 2) dummy.scale.set(it.w, it.alt, 1);
    else dummy.scale.setScalar(it.s ?? 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    const c = (k, col, w) => cor[k].setXYZW(i, col.r, col.g, col.b, w);
    const branco = pal.white;
    c(0, it.camisa ?? branco, it.fase ?? 0);
    c(1, it.pele ?? branco, it.energia ?? 1);
    c(2, it.cabelo ?? branco, it.braco ?? 0);
    c(3, it.calca ?? branco, it.modo ?? 0);
    porPlaca(i, reg[it.placa ?? "vai"]);
  });
  mesh.instanceMatrix.needsUpdate = true;
  // A animação sai do volume das matrizes (pulos, braços): sem corte.
  mesh.frustumCulled = false;
  mesh.castShadow = !lite;
  mesh.receiveShadow = !lite;
  mesh.customDepthMaterial = matSombra;

  return {
    mesh,
    U,
    // Troca a região do cartaz da instância i (o telão na festa).
    trocarPlaca(i, nome) {
      porPlaca(i, reg[nome]);
      placa.needsUpdate = true;
    },
  };
}
