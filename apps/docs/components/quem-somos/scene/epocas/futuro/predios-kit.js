// Peças do módulo "predios" (Vila 2030): neon desenhado, telões de LED,
// letreiros de neon e cintilação determinística. Ver futuro/predios.js.
import * as THREE from "three";

// Ruído fixo por índice (cintilação sempre igual para o mesmo k).
export const ruido = (n) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};
// Tira a malha do passe de normais/profundidade do GTAO (lighting.js): o
// GTAOPass esconde pontos e linhas (isLine2) nesse passe. Sem isso, o que
// emite luz ganha sombra de oclusão em volta e o neon ainda não desenhado
// (descartado só no shader de cor) apareceria como contorno escuro.
export function foraDoAO(obj) {
  obj.isLine2 = true;
  return obj;
}
export const suave = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// Brilho de algo "ligando" entre a e b: começa apagado com lampejos, falha
// algumas vezes e termina aceso. Depende só de k (determinístico).
export function cintila(k, a, b, seed = 0) {
  if (k <= a) return 0;
  if (k >= b) return 1;
  const u = (k - a) / (b - a);
  const n = ruido(Math.floor(k * 1400) + seed * 97);
  if (n < u * u * 1.15) return 0.75 + 0.25 * u;
  if (n < u * 1.4) return 0.2;
  return 0.02;
}

// ---- Neon desenhado ---------------------------------------------------------------
// Todos os tubos de neon da vila ficam numa malha só (e o halo em outra). Cada
// vértice guarda o k em que acende (aT): o shader descarta o que ainda não
// chegou, então o traço cresce ao longo do caminho sem setDrawRange e vários
// caminhos crescem ao mesmo tempo. A ponta recém-acesa sai branca ("quente").
// aS = comprimento ao longo do caminho (pulso de energia e tracejado que corre).
// aM = modo: 0 contínuo com pulso suave, 1 tracejado correndo (anéis girando,
// fitas de LED "chase").
const NEON_VERT = /* glsl */ `
attribute float aT;
attribute float aS;
attribute float aM;
attribute vec3 aCor;
varying float vT;
varying float vS;
varying float vM;
varying vec3 vCor;
varying float vFace;
void main() {
  vT = aT; vS = aS; vM = aM; vCor = aCor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  vFace = abs(dot(n, normalize(-mv.xyz)));
  gl_Position = projectionMatrix * mv;
}`;
const NEON_FRAG = /* glsl */ `
uniform float uK;
uniform float uTempo;
uniform float uOpac;
uniform float uHalo;
varying float vT;
varying float vS;
varying float vM;
varying vec3 vCor;
varying float vFace;
void main() {
  if (vT > uK) discard;
  float idade = uK - vT;
  float quente = 1.0 - smoothstep(0.0, 0.03, idade);
  float pulso = 0.84 + 0.16 * sin(vS * 5.0 - uTempo * 3.2);
  float traco = smoothstep(0.35, 0.5, fract(vS * 2.6 - uTempo * 0.9)) * (1.0 - smoothstep(0.85, 1.0, fract(vS * 2.6 - uTempo * 0.9)));
  float b = mix(pulso, 0.45 + 0.75 * traco, vM);
  vec3 c = mix(vCor * b, vec3(1.0), quente * 0.8);
  float a = uOpac;
  if (uHalo > 0.5) a *= pow(vFace, 2.2) * (1.0 + quente);
  else c = mix(c, vec3(1.0), 0.5 * pow(vFace, 3.0));
  gl_FragColor = vec4(c, a);
  #include <colorspace_fragment>
}`;

export function criarNeon({ track }) {
  const LADOS = 6;
  const uK = { value: 0 };
  const uTempo = { value: 0 };
  const bufs = [0, 1].map(() => ({ pos: [], nrm: [], t: [], s: [], m: [], cor: [], idx: [], n: 0 }));
  const caminhos = []; // para as pontas brilhantes
  const d = new THREE.Vector3();
  const u = new THREE.Vector3();
  const v = new THREE.Vector3();
  const p = new THREE.Vector3();
  const nr = new THREE.Vector3();

  function seg(a, b, r, ta, tb, sa, sb, cor, modo) {
    d.subVectors(b, a);
    const len = d.length();
    if (len < 1e-4) return;
    d.divideScalar(len);
    u.set(0, 1, 0);
    if (Math.abs(d.y) > 0.9) u.set(1, 0, 0);
    u.cross(d).normalize();
    v.crossVectors(d, u);
    bufs.forEach((B, h) => {
      const rr = h ? Math.max(r * 3.6, 0.1) : r;
      const base = B.n;
      for (let e = 0; e < 2; e++) {
        const c = e ? b : a;
        const ext = (e ? 1 : -1) * r * 0.9;
        for (let j = 0; j < LADOS; j++) {
          const ang = (j / LADOS) * Math.PI * 2;
          nr.copy(u).multiplyScalar(Math.cos(ang)).addScaledVector(v, Math.sin(ang));
          p.copy(c).addScaledVector(d, ext).addScaledVector(nr, rr);
          B.pos.push(p.x, p.y, p.z);
          B.nrm.push(nr.x, nr.y, nr.z);
          B.t.push(e ? tb : ta);
          B.s.push(e ? sb : sa);
          B.m.push(modo);
          B.cor.push(cor.r, cor.g, cor.b);
        }
      }
      for (let j = 0; j < LADOS; j++) {
        const j2 = (j + 1) % LADOS;
        const a0 = base + j;
        const a1 = base + j2;
        const b0 = base + LADOS + j;
        const b1 = base + LADOS + j2;
        B.idx.push(a0, b0, a1, a1, b0, b1);
      }
      B.n += LADOS * 2;
    });
  }

  // Polilinha acesa de t0 a t1 (proporcional ao comprimento).
  function caminho(pts, t0, t1, cor, { modo = 0, raio = 0.034, s0 = 0, ponta = true } = {}) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
    const L = cum[cum.length - 1] || 1;
    for (let i = 1; i < pts.length; i++) {
      const ta = t0 + ((t1 - t0) * cum[i - 1]) / L;
      const tb = t0 + ((t1 - t0) * cum[i]) / L;
      seg(pts[i - 1], pts[i], raio, ta, tb, s0 + cum[i - 1], s0 + cum[i], cor, modo);
    }
    if (ponta) caminhos.push({ pts, cum, L, t0, t1 });
  }

  // Anel horizontal: duas metades partem da frente (+z) e se encontram atrás.
  // q (opcional) inclina o anel em torno do centro.
  function anel(c, raio, y, t0, t1, cor, { modo = 0, raioTubo = 0.036, sentido = 1, n = 40, q = null, ponta = true } = {}) {
    for (const lado of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= n / 2; i++) {
        const ang = (i / n) * Math.PI * 2 * lado;
        const o = new THREE.Vector3(Math.sin(ang) * raio, 0, Math.cos(ang) * raio);
        if (q) o.applyQuaternion(q);
        pts.push(o.add(new THREE.Vector3(c.x, y, c.z)));
      }
      // s contínuo no anel inteiro (o tracejado gira num sentido só).
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
      const L = cum[cum.length - 1];
      for (let i = 1; i < pts.length; i++) {
        const ta = t0 + ((t1 - t0) * cum[i - 1]) / L;
        const tb = t0 + ((t1 - t0) * cum[i]) / L;
        seg(pts[i - 1], pts[i], raioTubo, ta, tb, sentido * lado * cum[i - 1], sentido * lado * cum[i], cor, modo);
      }
      if (ponta) caminhos.push({ pts, cum, L, t0, t1 });
    }
  }

  const material = (halo) =>
    track(
      new THREE.ShaderMaterial({
        uniforms: { uK, uTempo, uOpac: { value: halo ? 0.5 : 1 }, uHalo: { value: halo ? 1 : 0 } },
        vertexShader: NEON_VERT,
        fragmentShader: NEON_FRAG,
        transparent: halo,
        depthWrite: !halo,
        blending: halo ? THREE.AdditiveBlending : THREE.NormalBlending,
        toneMapped: false,
      })
    );

  let pontas = null;
  let halosPonta = null;
  const m4 = new THREE.Matrix4();
  const tmp = new THREE.Vector3();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);

  // Monta as malhas (chamar depois de todos os caminhos).
  function montar(pai) {
    bufs.forEach((B, h) => {
      const g = track(new THREE.BufferGeometry());
      g.setAttribute("position", new THREE.Float32BufferAttribute(B.pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(B.nrm, 3));
      g.setAttribute("aT", new THREE.Float32BufferAttribute(B.t, 1));
      g.setAttribute("aS", new THREE.Float32BufferAttribute(B.s, 1));
      g.setAttribute("aM", new THREE.Float32BufferAttribute(B.m, 1));
      g.setAttribute("aCor", new THREE.Float32BufferAttribute(B.cor, 3));
      g.setIndex(B.idx);
      g.computeBoundingSphere();
      const mesh = new THREE.Mesh(g, material(h));
      mesh.renderOrder = h ? 3 : 0;
      pai.add(foraDoAO(mesh));
    });
    if (!caminhos.length) return;
    const esfera = track(new THREE.IcosahedronGeometry(1, 1));
    pontas = new THREE.InstancedMesh(esfera, track(new THREE.MeshBasicMaterial({ toneMapped: false })), caminhos.length);
    halosPonta = new THREE.InstancedMesh(
      esfera,
      track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })),
      caminhos.length
    );
    for (const m of [pontas, halosPonta]) {
      m.frustumCulled = false;
      m.renderOrder = 4;
      pai.add(foraDoAO(m));
    }
  }

  function pontoEm(c, f, alvo) {
    const s = f * c.L;
    let i = 1;
    while (i < c.cum.length - 1 && c.cum[i] < s) i++;
    const seg0 = c.cum[i - 1];
    const w = (s - seg0) / Math.max(c.cum[i] - seg0, 1e-5);
    return alvo.lerpVectors(c.pts[i - 1], c.pts[i], Math.min(1, Math.max(0, w)));
  }

  function setK(k) {
    uK.value = k;
    if (!pontas) return;
    let vivas = 0;
    caminhos.forEach((c, i) => {
      if (k > c.t0 && k < c.t1) {
        pontoEm(c, (k - c.t0) / (c.t1 - c.t0), tmp);
        pontas.setMatrixAt(i, m4.makeScale(0.026, 0.026, 0.026).setPosition(tmp));
        halosPonta.setMatrixAt(i, m4.makeScale(0.11, 0.11, 0.11).setPosition(tmp));
        vivas++;
      } else {
        pontas.setMatrixAt(i, zero);
        halosPonta.setMatrixAt(i, zero);
      }
    });
    pontas.visible = halosPonta.visible = vivas > 0;
    pontas.instanceMatrix.needsUpdate = halosPonta.instanceMatrix.needsUpdate = true;
  }

  return { caminho, anel, montar, setK, uTempo, uK };
}

// Material padrão que só mostra o que já "chegou" (atributo aT <= k): cabos
// grossos descendo pelas fachadas. Mesmo truque do neon, com luz normal.
export function revelar(material, uK) {
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uK = uK;
    sh.vertexShader = "attribute float aT;\nvarying float vT;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvT = aT;");
    sh.fragmentShader = "uniform float uK;\nvarying float vT;\n" + sh.fragmentShader.replace("void main() {", "void main() {\nif (vT > uK) discard;");
  };
  material.customProgramCacheKey = () => "revelar-predios";
  return material;
}

// ---- Telas de LED (canvas) ------------------------------------------------------------
// desenhar(g, t, W, H) pinta um quadro; redesenha a ~12 qps enquanto visível.
export function criarTela({ track, largura, altura, px = 256, desenhar, geo = null }) {
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = Math.round((px * altura) / largura);
  const g = canvas.getContext("2d");
  const tex = track(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = track(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  const mesh = foraDoAO(new THREE.Mesh(geo || track(new THREE.PlaneGeometry(largura, altura)), mat));
  let ultimo = -1;
  function pintar(t, forcar = false) {
    const q = Math.floor(t * 12);
    if (!forcar && q === ultimo) return;
    ultimo = q;
    desenhar(g, t, canvas.width, canvas.height);
    tex.needsUpdate = true;
  }
  pintar(0, true);
  // brilho 0..1 (cintilação) e abertura vertical da imagem (liga como CRT).
  function ligar(brilho, abertura = 1) {
    mesh.visible = brilho > 0.01;
    mat.color.setScalar(brilho);
    mesh.scale.y = Math.max(0.02, abertura);
  }
  return { mesh, pintar, ligar };
}

// Faixa de letreiro corrido: textura repetida em x, deslocada no update.
export function criarFaixa({ track, largura, altura, texto, cor, fundo, font }) {
  const canvas = document.createElement("canvas");
  canvas.height = 64;
  const g = canvas.getContext("2d");
  g.font = `600 40px ${font}`;
  canvas.width = Math.min(2048, Math.ceil(g.measureText(texto).width + 40));
  g.fillStyle = fundo.getStyle();
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.font = `600 40px ${font}`;
  g.textBaseline = "middle";
  g.shadowColor = cor.getStyle();
  g.shadowBlur = 10;
  g.fillStyle = cor.getStyle();
  g.fillText(texto, 20, 34);
  const tex = track(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  // Repetições para manter a proporção das letras.
  tex.repeat.x = (largura / altura) * (canvas.height / canvas.width);
  const mat = track(new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  const mesh = foraDoAO(new THREE.Mesh(track(new THREE.PlaneGeometry(largura, altura)), mat));
  return {
    mesh,
    rolar(t) {
      tex.offset.x = (t * 0.09) % 1;
    },
    ligar(brilho, abertura = 1) {
      mesh.visible = brilho > 0.01;
      mat.color.setScalar(brilho);
      mesh.scale.x = Math.max(0.02, abertura);
    },
  };
}

// ---- Letreiro de neon ------------------------------------------------------------------
// Letras de tubo: apagadas ficam como tubo de vidro escuro; acesas brilham
// com halo. As letras acendem uma a uma (ligar(n, falhas)). vertical = letras
// empilhadas (letreiro de lâmina).
export function criarLetreiro({ track, texto, largura, altura, cor, branco, font, vertical = false }) {
  const letras = [...texto];
  const canvas = document.createElement("canvas");
  canvas.width = vertical ? 128 : 1024;
  canvas.height = vertical ? Math.round((128 * altura) / largura) : Math.round((1024 * altura) / largura);
  const g = canvas.getContext("2d");
  const tex = track(new THREE.CanvasTexture(canvas));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = track(
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
  );
  const mesh = foraDoAO(new THREE.Mesh(track(new THREE.PlaneGeometry(largura, altura)), mat));
  mesh.renderOrder = 2;
  const W = canvas.width;
  const H = canvas.height;
  // Posição e tamanho de cada letra.
  let tam;
  const pos = [];
  if (vertical) {
    const passo = H / letras.length;
    tam = Math.min(passo * 0.86, W * 0.78);
    letras.forEach((_, i) => pos.push([W / 2, passo * (i + 0.5)]));
  } else {
    tam = H * 0.62;
    g.font = `700 ${tam}px ${font}`;
    while (g.measureText(texto).width > W * 0.9 && tam > 10) {
      tam -= 2;
      g.font = `700 ${tam}px ${font}`;
    }
    let x = (W - g.measureText(texto).width) / 2;
    letras.forEach((l) => {
      const w = g.measureText(l).width;
      pos.push([x + w / 2, H / 2 + tam * 0.04]);
      x += w;
    });
  }
  const quente = cor.clone().lerp(branco, 0.55).getStyle();
  const corCss = cor.getStyle();
  let assinatura = "";
  function ligar(acesas) {
    // acesas: array de brilhos 0..1 por letra.
    const sig = acesas.map((a) => (a > 0.5 ? 2 : a > 0.05 ? 1 : 0)).join("");
    if (sig === assinatura) return;
    assinatura = sig;
    g.clearRect(0, 0, W, H);
    g.font = `700 ${tam}px ${font}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineJoin = "round";
    letras.forEach((l, i) => {
      const [x, y] = pos[i];
      const a = acesas[i];
      if (a > 0.05) {
        g.globalAlpha = a > 0.5 ? 1 : 0.45;
        g.shadowColor = corCss;
        g.shadowBlur = tam * 0.35;
        g.strokeStyle = corCss;
        g.lineWidth = tam * 0.12;
        g.strokeText(l, x, y);
        g.shadowBlur = tam * 0.12;
        g.lineWidth = tam * 0.05;
        g.strokeStyle = quente;
        g.strokeText(l, x, y);
      } else {
        // Tubo apagado: contorno fino e escuro.
        g.globalAlpha = 0.28;
        g.shadowBlur = 0;
        g.strokeStyle = corCss;
        g.lineWidth = tam * 0.04;
        g.strokeText(l, x, y);
      }
    });
    g.globalAlpha = 1;
    g.shadowBlur = 0;
    tex.needsUpdate = true;
  }
  ligar(letras.map(() => 0));
  return { mesh, n: letras.length, ligar };
}
