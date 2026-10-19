// Fogueira da roda de história (scene/historia.js): lenha em tenda com pontas
// em brasa, anel de pedras, chamas em camadas (shader com ruído em billboards),
// faíscas subindo, fumaça leve, brilho no chão e luz quente que tremula.
// Tudo procedural e com cores dos tokens; ~7 draw calls.
//
//   createFogueira({ pal, track, lite, reducedMotion })
//     -> { object, setOn(on), update(t, dt), dispose }
//
//   object: THREE.Group centrado na origem (diâmetro ~1 com as pedras); quem
//   chama posiciona. Começa apagada e invisível; setOn(true) acende em ~1 s,
//   setOn(false) apaga devagar e esconde o grupo no fim.
//   lite: sem PointLight, sem fumaça e metade das faíscas.
//   reducedMotion: chamas quase paradas e sem faíscas.

import * as THREE from "three";

const ACENDE = 1.0; // s
const APAGA = 2.4; // s

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ruído de valor 2D/3D e fbm (compartilhado pelos shaders).
const NOISE = /* glsl */ `
float fgHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float fgNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(fgHash(i), fgHash(i + vec2(1.0, 0.0)), f.x),
             mix(fgHash(i + vec2(0.0, 1.0)), fgHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fgFbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * fgNoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}
float fgHash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float fgNoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = mix(fgHash3(i), fgHash3(i + vec3(1, 0, 0)), f.x);
  float b = mix(fgHash3(i + vec3(0, 1, 0)), fgHash3(i + vec3(1, 1, 0)), f.x);
  float c = mix(fgHash3(i + vec3(0, 0, 1)), fgHash3(i + vec3(1, 0, 1)), f.x);
  float d = mix(fgHash3(i + vec3(0, 1, 1)), fgHash3(i + vec3(1, 1, 1)), f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z);
}
`;

// Billboard em espaço de vista: o "para cima" é o eixo Y do mundo projetado
// na tela, então a chama sobe reta mesmo com a câmera alta.
const BILLBOARD = /* glsl */ `
vec4 fgBillboard(vec3 center, vec2 corner, vec2 size) {
  vec4 mv = modelViewMatrix * vec4(center, 1.0);
  float sc = length(modelMatrix[0].xyz);
  vec3 upW = (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz;
  vec2 up = normalize(upW.xy + vec2(0.0, 1e-4));
  vec2 right = vec2(up.y, -up.x);
  mv.xy += (right * corner.x * size.x + up * corner.y * size.y) * sc;
  return projectionMatrix * mv;
}
`;

const FRAG_END = /* glsl */ `
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
`;

// n quads (4 vértices cada) com cantos em aCorner e atributos por quad.
// `attrs`: { nome: [itemSize, (i) => número | array] }.
function quadGeo(n, attrs, cornerY0 = -0.5) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 12);
  const corner = new Float32Array(n * 8);
  const idx = [];
  const cs = [
    [-0.5, cornerY0],
    [0.5, cornerY0],
    [0.5, cornerY0 + 1],
    [-0.5, cornerY0 + 1],
  ];
  const bufs = {};
  for (const [name, [size]] of Object.entries(attrs)) bufs[name] = new Float32Array(n * 4 * size);
  for (let i = 0; i < n; i++) {
    const vals = {};
    for (const [name, [, fn]] of Object.entries(attrs)) vals[name] = [].concat(fn(i));
    for (let k = 0; k < 4; k++) {
      const v = i * 4 + k;
      corner[v * 2] = cs[k][0];
      corner[v * 2 + 1] = cs[k][1];
      for (const [name, [size]] of Object.entries(attrs)) {
        for (let c = 0; c < size; c++) bufs[name][v * size + c] = vals[name][c];
      }
      if (vals.aCenter) pos.set(vals.aCenter, v * 3);
    }
    const b = i * 4;
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aCorner", new THREE.BufferAttribute(corner, 2));
  for (const [name, [size]] of Object.entries(attrs)) geo.setAttribute(name, new THREE.BufferAttribute(bufs[name], size));
  geo.setIndex(idx);
  // Posições reais saem do shader: esfera fixa cobre fogo, faíscas e fumaça.
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.2, 0), 2.4);
  return geo;
}

function fxMesh(geo, mat, order) {
  const m = new THREE.Mesh(geo, mat);
  m.renderOrder = order;
  m.castShadow = false;
  m.receiveShadow = false;
  m.userData.noShadow = true;
  return m;
}

export function createFogueira({ pal, track, lite = false, reducedMotion = false }) {
  const { pv, mix } = pal;
  const rand = mulberry32(20261014);
  const r = (a, b) => a + (b - a) * rand();

  const white = pv("white");
  const red = pv("red-600");
  const redHot = pv("red-500");
  const orange = mix(pv("red-500"), pv("yellow-500"), 0.5);
  const yellow = pv("yellow-500");
  const core = mix(pv("yellow-400"), white, 0.6);

  const object = new THREE.Group();
  object.name = "fogueira";
  object.visible = false;

  const uTime = { value: 0 };
  const uK = { value: 0 }; // 0 apagada → 1 acesa
  const uEmber = { value: 0 }; // brilho das brasas (some depois das chamas)
  const uFlick = { value: 1 }; // tremulação global (luz, chão, brasas)

  // ---- Lenha, brasas e pedras: uma malha só ---------------------------------
  // Atributo aGlow = (quanto brilha, quanto é rachadura de brasa).
  const P = [];
  const N = [];
  const C = [];
  const G = [];
  const m4 = new THREE.Matrix4();
  const nm = new THREE.Matrix3();
  const tmp = new THREE.Vector3();
  const col = new THREE.Color();
  function push(geo, matrix, paint) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    if (!g.attributes.normal) g.computeVertexNormals();
    const pa = g.attributes.position;
    const na = g.attributes.normal;
    nm.getNormalMatrix(matrix);
    for (let i = 0; i < pa.count; i++) {
      tmp.fromBufferAttribute(pa, i);
      const local = tmp.clone();
      tmp.applyMatrix4(matrix);
      P.push(tmp.x, tmp.y, tmp.z);
      const n = new THREE.Vector3().fromBufferAttribute(na, i).applyMatrix3(nm).normalize();
      N.push(n.x, n.y, n.z);
      const [c, glow, crack] = paint(local, tmp, n);
      C.push(c.r, c.g, c.b);
      G.push(glow, crack);
    }
    if (g !== geo) g.dispose();
    geo.dispose();
  }

  const bark = mix(pv("yellow-800"), pv("gray-900"), 0.45);
  const barkLight = mix(pv("yellow-800"), pv("yellow-600"), 0.25);
  const charred = mix(pv("gray-950"), pv("gray-900"), 0.3);
  const ash = mix(pv("gray-800"), pv("gray-600"), 0.35);

  // Tenda: toras inclinadas com as pontas se cruzando sobre o braseiro.
  const LOGS = 7;
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < LOGS; i++) {
    const a = (i / LOGS) * Math.PI * 2 + r(-0.18, 0.18);
    const baseR = r(0.25, 0.3);
    const rad = r(0.034, 0.048);
    const base = new THREE.Vector3(Math.cos(a) * baseR, rad * 0.8, Math.sin(a) * baseR);
    const tipR = r(0.03, 0.08);
    const tip = new THREE.Vector3(Math.cos(a + 2.7) * tipR, r(0.36, 0.44), Math.sin(a + 2.7) * tipR);
    const dir = tip.clone().sub(base);
    const len = dir.length() + 0.04;
    dir.normalize();
    const geo = new THREE.CylinderGeometry(rad * 0.78, rad, len, 8, 4);
    // Casca irregular.
    const pa = geo.attributes.position;
    for (let k = 0; k < pa.count; k++) {
      const s = 1 + (Math.sin(pa.getY(k) * 31 + i * 7 + pa.getX(k) * 40) * 0.08);
      pa.setX(k, pa.getX(k) * s);
      pa.setZ(k, pa.getZ(k) * s);
    }
    geo.computeVertexNormals();
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
    m4.compose(base.clone().add(tip).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1));
    const shade = rand();
    push(geo, m4, (local) => {
      const t = local.y / len + 0.5; // 0 base → 1 ponta
      const burn = THREE.MathUtils.smoothstep(t, 0.3, 0.78);
      col.copy(bark).lerp(barkLight, shade * 0.5 * (1 - burn)).lerp(charred, burn);
      const glow = THREE.MathUtils.smoothstep(t, 0.62, 0.97);
      return [col.clone(), glow, 0.85];
    });
  }

  // Braseiro: cinza no chão e carvões em brasa.
  {
    const geo = new THREE.CylinderGeometry(0.29, 0.32, 0.02, 18);
    m4.makeTranslation(0, 0.006, 0);
    push(geo, m4, (local) => {
      const d = Math.hypot(local.x, local.z);
      col.copy(charred).lerp(ash, THREE.MathUtils.smoothstep(d, 0.12, 0.32));
      return [col.clone(), 1 - THREE.MathUtils.smoothstep(d, 0.05, 0.26), 1];
    });
    for (let i = 0; i < 16; i++) {
      const a = r(0, Math.PI * 2);
      const d = Math.sqrt(rand()) * 0.22;
      const s = r(0.03, 0.05);
      const g = new THREE.DodecahedronGeometry(1, 0);
      m4.compose(
        new THREE.Vector3(Math.cos(a) * d, 0.025, Math.sin(a) * d),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(r(0, 3), r(0, 3), r(0, 3))),
        new THREE.Vector3(s * 1.3, s * 0.6, s)
      );
      const hot = 1 - d / 0.3;
      push(g, m4, () => [charred, 0.45 + hot * 0.55, 1]);
    }
  }

  // Anel de pedras irregulares (faces chapadas; o lado de dentro pega um
  // reflexo quente mesmo sem luz, no modo lite).
  const stoneA = pv("gray-500");
  const stoneB = pv("gray-600");
  const stoneC = pv("gray-400");
  const STONES = 12;
  for (let i = 0; i < STONES; i++) {
    const a = (i / STONES) * Math.PI * 2 + r(-0.1, 0.1);
    const d = r(0.42, 0.47);
    const s = r(0.065, 0.085);
    const g = new THREE.IcosahedronGeometry(1, 0);
    const pa = g.attributes.position;
    for (let k = 0; k < pa.count; k++) {
      // Deslocamento pelo hash da posição: vértices repetidos andam juntos.
      const h = Math.sin(pa.getX(k) * 12.9898 + pa.getY(k) * 78.233 + pa.getZ(k) * 37.719 + i * 4.1) * 43758.5453;
      const j = 0.8 + 0.4 * (h - Math.floor(h));
      pa.setXYZ(k, pa.getX(k) * j, pa.getY(k) * j, pa.getZ(k) * j);
    }
    g.computeVertexNormals();
    m4.compose(
      new THREE.Vector3(Math.cos(a) * d, s * 0.45, Math.sin(a) * d),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(r(-0.3, 0.3), -a + r(-0.4, 0.4), r(-0.3, 0.3))),
      new THREE.Vector3(s * 1.35, s * 0.8, s * 1.05)
    );
    const tone = mix(stoneA, rand() < 0.5 ? stoneB : stoneC, rand() * 0.7);
    push(g, m4, (_local, _world, n) => {
      const inward = Math.max(0, -(n.x * Math.cos(a) + n.z * Math.sin(a)));
      return [tone, inward * (lite ? 0.28 : 0.12), 0];
    });
  }

  const solidGeo = track(new THREE.BufferGeometry());
  solidGeo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  solidGeo.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
  solidGeo.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
  solidGeo.setAttribute("aGlow", new THREE.Float32BufferAttribute(G, 2));
  solidGeo.computeBoundingSphere();

  const solidMat = track(
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0, emissive: white })
  );
  const uEmberDeep = { value: red.clone() };
  const uEmberHot = { value: mix(orange, yellow, 0.2) };
  solidMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uTime, uEmber, uFlick, uEmberDeep, uEmberHot });
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aGlow;\nvarying vec2 vGlow;\nvarying vec3 vObj;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGlow = aGlow;\nvObj = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uTime;\nuniform float uEmber;\nuniform float uFlick;\nuniform vec3 uEmberDeep;\nuniform vec3 uEmberHot;\nvarying vec2 vGlow;\nvarying vec3 vObj;\n" +
          NOISE
      )
      .replace(
        "#include <emissivemap_fragment>",
        [
          "#include <emissivemap_fragment>",
          // Rachaduras de brasa (ruído "ridged") sobre um fundo morno que pulsa.
          "float fgN = fgNoise3(vObj * 26.0 + vec3(0.0, uTime * 0.25, 0.0)) * 0.65 + fgNoise3(vObj * 61.0) * 0.35;",
          "float fgRidge = 1.0 - smoothstep(0.0, 0.09, abs(fgN - 0.5));",
          "float fgPulse = 0.6 + 0.4 * fgNoise3(vObj * 9.0 - vec3(uTime * 0.3));",
          "float fgCrack = mix(1.0, 0.18 + fgRidge * 0.95, vGlow.y) * fgPulse;",
          "float fgG = vGlow.x * uEmber * uFlick;",
          "totalEmissiveRadiance = mix(uEmberDeep, uEmberHot, clamp(max(fgCrack * vGlow.x, 1.0 - vGlow.y), 0.0, 1.0)) * fgG * fgCrack * 1.1;",
        ].join("\n")
      );
  };
  solidMat.customProgramCacheKey = () => "fogueira-brasa";
  const solid = new THREE.Mesh(solidGeo, solidMat);
  solid.castShadow = true;
  solid.receiveShadow = true;
  object.add(solid);

  // ---- Brilho no chão -------------------------------------------------------
  const glowMat = track(
    new THREE.ShaderMaterial({
      uniforms: { uK, uFlick, uColor: { value: mix(red, orange, 0.55) }, uHot: { value: yellow.clone() } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uK; uniform float uFlick; uniform vec3 uColor; uniform vec3 uHot;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          float a = exp(-d * d * 4.5) * (1.0 - smoothstep(0.75, 1.0, d));
          vec3 c = mix(uColor, uHot, exp(-d * d * 30.0) * 0.6);
          gl_FragColor = vec4(c * a * uK * uFlick * 0.3, 1.0);
          ${FRAG_END}
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    })
  );
  const glowGeo = track(new THREE.PlaneGeometry(3.4, 3.4));
  glowGeo.rotateX(-Math.PI / 2);
  const glow = fxMesh(glowGeo, glowMat, 1);
  glow.position.y = 0.02;
  object.add(glow);

  // ---- Chamas -----------------------------------------------------------------
  // [x, y, z, largura, altura, camada (0 borda · 1 meio · 2 núcleo)]
  const FLAMES = [
    [0, 0.03, 0, 0.78, 1.0, 0],
    [0.07, 0.06, 0.03, 0.36, 0.86, 1],
    [-0.08, 0.06, 0.02, 0.34, 0.78, 1],
    [0.02, 0.06, -0.08, 0.32, 0.92, 1],
    [-0.02, 0.06, 0.08, 0.3, 0.7, 1],
    [0.15, 0.1, -0.05, 0.18, 0.42, 1],
    [-0.14, 0.1, -0.06, 0.17, 0.38, 1],
    [0, 0.05, 0.01, 0.3, 0.58, 2],
    [0.03, 0.05, -0.02, 0.2, 0.45, 2],
  ];
  const flameGeo = track(
    quadGeo(
      FLAMES.length,
      {
        aCenter: [3, (i) => FLAMES[i].slice(0, 3)],
        aSize: [2, (i) => [FLAMES[i][3], FLAMES[i][4]]],
        aInfo: [2, (i) => [FLAMES[i][5], i * 0.137 + 0.21]],
      },
      0
    )
  );
  const flameMat = track(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime,
        uK,
        uRed: { value: redHot.clone() },
        uOrange: { value: orange.clone() },
        uYellow: { value: yellow.clone() },
        uCore: { value: core.clone() },
      },
      vertexShader: /* glsl */ `
        attribute vec2 aCorner; attribute vec3 aCenter; attribute vec2 aSize; attribute vec2 aInfo;
        uniform float uK;
        varying vec2 vUv; varying float vLayer; varying float vSeed; varying float vK;
        ${BILLBOARD}
        void main() {
          vLayer = aInfo.x; vSeed = aInfo.y;
          // Chamas crescem em sequência ao acender (núcleo por último).
          vK = clamp(uK * 1.5 - vSeed * 0.35 - vLayer * 0.1, 0.0, 1.0);
          float grow = 0.25 + 0.75 * vK;
          vUv = aCorner;
          gl_Position = fgBillboard(aCenter, aCorner, aSize * vec2(mix(0.6, 1.0, vK), grow));
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uRed; uniform vec3 uOrange; uniform vec3 uYellow; uniform vec3 uCore;
        varying vec2 vUv; varying float vLayer; varying float vSeed; varying float vK;
        ${NOISE}
        void main() {
          float y = vUv.y;
          float x = vUv.x * 2.0;
          float t = uTime * (1.0 + vLayer * 0.25);
          float s = vSeed * 31.0;
          // Ondulação: o corpo verga e as bordas se rasgam subindo.
          float bend = (fgNoise(vec2(s, y * 1.3 - t * 1.1)) - 0.5) * 1.1 * y * y;
          float n = fgFbm(vec2(x * 1.8 + s, y * 2.6 - t * 2.4));
          x += bend + (n - 0.5) * 0.55 * y;
          // Gota: base redonda, ponta fina.
          float rad = 0.95 * pow(max(1.0 - y, 0.0), 0.7) * sqrt(clamp(y / 0.2, 0.0, 1.0));
          float body = 1.0 - smoothstep(rad * 0.15, rad + 0.001, abs(x));
          float tongue = smoothstep(0.0, 0.3, n * 1.35 - y * 0.95 + 0.25);
          float a = body * tongue * vK;
          if (a < 0.003) discard;
          // Calor: centro e base mais quentes; camada interna puxa pro claro.
          float heat = a * (1.0 - y * 0.55) + vLayer * 0.22 - 0.05;
          vec3 c = mix(uRed, uOrange, smoothstep(0.1, 0.45, heat));
          c = mix(c, uYellow, smoothstep(0.45, 0.75, heat));
          c = mix(c, uCore, smoothstep(0.75, 1.05, heat));
          float gain = vLayer < 0.5 ? 0.55 : (vLayer < 1.5 ? 0.8 : 1.0);
          gl_FragColor = vec4(c * gain, a);
          ${FRAG_END}
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  object.add(fxMesh(flameGeo, flameMat, 3));

  // ---- Faíscas ------------------------------------------------------------------
  let sparks = null;
  if (!reducedMotion) {
    const n = lite ? 22 : 44;
    const seeds = Array.from({ length: n }, () => [rand(), rand(), rand(), rand()]);
    const sparkGeo = track(
      quadGeo(n, {
        aCenter: [3, () => [0, 0.3, 0]],
        aSeed: [4, (i) => seeds[i]],
      })
    );
    const sparkMat = track(
      new THREE.ShaderMaterial({
        uniforms: { uTime, uK, uHot: { value: core.clone() }, uMid: { value: orange.clone() }, uCold: { value: red.clone() } },
        vertexShader: /* glsl */ `
          attribute vec2 aCorner; attribute vec4 aSeed;
          uniform float uTime; uniform float uK;
          varying vec2 vUv; varying float vLife; varying float vOn;
          ${BILLBOARD}
          void main() {
            float speed = 0.28 + aSeed.y * 0.3;
            float life = fract(uTime * speed + aSeed.x);
            float cyc = floor(uTime * speed + aSeed.x);
            // Cada ciclo sorteia outro ponto de partida.
            float h = fract(sin((cyc + 1.0) * 91.7 + aSeed.z * 37.0) * 4375.85);
            float ang = (aSeed.z + h) * 6.2831;
            float rad = 0.04 + 0.12 * fract(h * 7.3);
            vec3 p = vec3(cos(ang) * rad, 0.25 + life * (1.3 + aSeed.w * 1.1), sin(ang) * rad);
            p.x += sin(uTime * (2.0 + aSeed.w * 3.0) + aSeed.x * 20.0) * 0.12 * life + life * life * 0.18;
            p.z += cos(uTime * (1.7 + aSeed.y * 2.5) + aSeed.z * 20.0) * 0.1 * life;
            vLife = life;
            vOn = step(aSeed.y, uK * 1.05) * smoothstep(0.0, 0.06, life);
            vUv = aCorner;
            float sz = 0.035 * (1.0 - life * 0.6) * (0.7 + aSeed.w * 0.6);
            gl_Position = fgBillboard(p, aCorner, vec2(sz));
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uHot; uniform vec3 uMid; uniform vec3 uCold;
          varying vec2 vUv; varying float vLife; varying float vOn;
          void main() {
            float d = length(vUv) * 2.0;
            float a = (1.0 - smoothstep(0.2, 1.0, d)) * pow(1.0 - vLife, 1.3) * vOn;
            if (a < 0.003) discard;
            vec3 c = mix(uHot, uMid, smoothstep(0.0, 0.35, vLife));
            c = mix(c, uCold, smoothstep(0.4, 0.9, vLife));
            gl_FragColor = vec4(c * 1.6, a);
            ${FRAG_END}
          }`,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    sparks = fxMesh(sparkGeo, sparkMat, 4);
    object.add(sparks);
  }

  // ---- Fumaça ---------------------------------------------------------------------
  if (!lite) {
    const n = 9;
    const seeds = Array.from({ length: n }, (_, i) => [i / n + r(0, 0.05), rand(), rand()]);
    const smokeGeo = track(
      quadGeo(n, {
        aCenter: [3, () => [0, 1, 0]],
        aSeed: [3, (i) => seeds[i]],
      })
    );
    const smokeMat = track(
      new THREE.ShaderMaterial({
        uniforms: { uTime, uK, uWarm: { value: mix(pv("gray-500"), orange, 0.35) }, uGray: { value: pv("gray-400").clone() } },
        vertexShader: /* glsl */ `
          attribute vec2 aCorner; attribute vec3 aSeed;
          uniform float uTime;
          varying vec2 vUv; varying float vLife; varying float vSeed;
          ${BILLBOARD}
          void main() {
            float life = fract(uTime * 0.11 + aSeed.x);
            vec3 p = vec3(0.0, 0.85 + life * 2.1, 0.0);
            p.x += sin(uTime * 0.5 + aSeed.y * 6.28) * 0.12 * life + life * life * 0.45;
            p.z += cos(uTime * 0.4 + aSeed.z * 6.28) * 0.1 * life - life * 0.15;
            vLife = life; vSeed = aSeed.y;
            vUv = aCorner;
            float sz = 0.35 + life * 1.05;
            gl_Position = fgBillboard(p, aCorner, vec2(sz));
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uK; uniform vec3 uWarm; uniform vec3 uGray;
          varying vec2 vUv; varying float vLife; varying float vSeed;
          ${NOISE}
          void main() {
            float d = length(vUv) * 2.0;
            float n = fgFbm(vUv * 3.0 + vec2(vSeed * 10.0, -uTime * 0.25));
            float a = (1.0 - smoothstep(0.1, 1.0, d + (n - 0.5) * 0.5));
            a *= smoothstep(0.0, 0.18, vLife) * (1.0 - smoothstep(0.45, 1.0, vLife)) * 0.2 * uK * uK;
            if (a < 0.003) discard;
            gl_FragColor = vec4(mix(uWarm, uGray, smoothstep(0.0, 0.5, vLife)), a);
            ${FRAG_END}
          }`,
        transparent: true,
        depthWrite: false,
      })
    );
    object.add(fxMesh(smokeGeo, smokeMat, 2));
  }

  // ---- Luz quente -----------------------------------------------------------------
  // Só fora do lite (cada luz pesa em todo pixel); no lite o brilho do chão
  // e as brasas emissivas fazem o papel.
  const luz = lite ? null : new THREE.PointLight(mix(orange, yellow, 0.25), 0, 6, 2);
  if (luz) {
    luz.position.set(0, 0.9, 0);
    luz.castShadow = false;
    object.add(luz);
  }

  // ---- Estado -----------------------------------------------------------------------
  let on = false;
  let k = 0;

  function setOn(v) {
    on = !!v;
    if (on) object.visible = true;
  }

  function update(t, dt) {
    if (!object.visible) return;
    k = THREE.MathUtils.clamp(k + (on ? dt / ACENDE : -dt / APAGA), 0, 1);
    if (!on && k === 0) {
      object.visible = false;
      return;
    }
    // Acender: rápido no começo; apagar: as brasas duram mais que as chamas.
    const kk = on ? 1 - (1 - k) * (1 - k) : k * k;
    uK.value = kk;
    uEmber.value = Math.min(1, k * 1.6);
    uTime.value = reducedMotion ? t * 0.15 : t;
    const flick = reducedMotion
      ? 1
      : 0.86 + Math.sin(t * 11.3) * 0.06 + Math.sin(t * 23.7 + 1.3) * 0.04 + Math.sin(t * 5.1 + 0.7) * 0.05;
    uFlick.value = flick;
    if (luz) {
      luz.intensity = kk * 2.8 * flick;
      luz.position.x = reducedMotion ? 0 : Math.sin(t * 7.3) * 0.04;
      luz.position.z = reducedMotion ? 0 : Math.cos(t * 6.1) * 0.03;
    }
  }

  function dispose() {
    object.removeFromParent();
    if (luz) luz.dispose();
  }

  return { object, setOn, update, dispose };
}
