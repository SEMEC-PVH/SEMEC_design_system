// Vila 2030 — módulo "atmosfera": a luz e o ar da noite cyberpunk.
//
//   - reescreve dayNight.state (roda depois do dayNight.update e antes de a luz
//     ser aplicada): névoa/céu roxos, hemisfério violeta em cima e ciano escuro
//     embaixo, lua fria e fraca, exposição que deixa o neon estourar sem a cena
//     virar breu (jogo, não simulação: tudo continua legível);
//   - 4 luzes reais coloridas (o orçamento inteiro da época): magenta banhando
//     a SEDE, ciano no eixo do Front/Back-End, violeta na megatorre e verde-água
//     no lago;
//   - chuva fina (uma malha só, animada no shader), névoa baixa colorida
//     (planos aditivos rasteiros) e feixes falsos de holofotes varrendo o céu.
//
// Janela: a noite cai em k 0,00–0,40; as luzes acompanham o neon até k 1.
// Em k = 0 nada existe (grupo oculto) e o update nem roda: o ciclo dia/noite
// volta a mandar sozinho no quadro seguinte.
import * as THREE from "three";
import { trecho } from "../comum";

const suave = (x) => x * x * (3 - 2 * x);

// Área da chuva (tiles) e altura da coluna de chuva.
const CHUVA = { x0: 3, x1: 27, y0: -1, y1: 21, alt: 9, gotas: 1600, vel: 7.5 };
const VENTO = new THREE.Vector2(0.16, 0.07); // deslocamento x/z por unidade de queda

// Gradiente radial branco → preto (alphaMap/cor de halos aditivos).
function texturaRadial(pal, size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const c = canvas.getContext("2d");
  const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, pal.white.getStyle());
  g.addColorStop(0.4, pal.mix(pal.white, pal.black, 0.6).getStyle());
  g.addColorStop(1, pal.black.getStyle());
  c.fillStyle = g;
  c.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function createAtmosfera({ scene, pal, track, tileToWorld, reducedMotion, dayNight, cores }) {
  const grupo = new THREE.Group();
  grupo.name = "futuro-atmosfera";
  grupo.visible = false;
  scene.add(grupo);

  const { ciano, magenta, roxo, violeta, verde, branco, noite } = cores;
  const lerp = (a, b, t) => a.clone().lerp(b, t);

  // ---- Céu da noite cyberpunk (alvos do dayNight.state) --------------------
  const alvo = {
    fog: lerp(noite, roxo, 0.32),
    sky: pal.mix(pal.pv("blue-600"), violeta, 0.4),
    ground: lerp(ciano, noite, 0.62),
    sun: pal.mix(ciano, pal.pv("blue-300"), 0.5),
    sunI: 0.8,
    hemiI: 1.3,
    exposure: 1.08,
  };

  // ---- Luzes reais (4: o orçamento inteiro da época) -----------------------
  // Sem sombra; distância curta para cada uma pintar só o seu canto.
  const luz = (cor, [tx, ty], y, intens, dist) => {
    const l = new THREE.PointLight(cor, 0, dist, 1.5);
    l.position.copy(tileToWorld(tx, ty)).setY(y);
    l.userData.max = intens;
    grupo.add(l);
    return l;
  };
  const luzes = [
    luz(magenta, [6, 8], 2, 34, 6.5), // fachada da SEDE SEMEC
    luz(ciano, [21, 16.4], 1.9, 34, 7), // eixo do Front-End / Back-End
    luz(lerp(violeta, ciano, 0.3), [17.4, 7.6], 2.6, 26, 5.5), // megatorre
    luz(lerp(ciano, verde, 0.35), [23.5, 5.4], 1.3, 18, 6), // lago
  ];

  // ---- Chuva fina ------------------------------------------------------------
  // Uma malha só: cada gota é um risco (quad virado para a câmera, que olha do
  // sul) com a cabeça clara e a cauda apagada; o shader faz a queda com mod(),
  // sem tocar em matriz nenhuma por quadro.
  const a = tileToWorld(CHUVA.x0, CHUVA.y0);
  const b = tileToWorld(CHUVA.x1, CHUVA.y1);
  const N = CHUVA.gotas;
  const pos = new Float32Array(N * 4 * 3);
  const base = new Float32Array(N * 4 * 3);
  const cor = new Float32Array(N * 4 * 3);
  const idx = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < N; i++) {
    const bx = a.x + rnd() * (b.x - a.x);
    const by = rnd() * CHUVA.alt;
    const bz = a.z + rnd() * (b.z - a.z);
    const len = 0.22 + rnd() * 0.26;
    const w = 0.006 + rnd() * 0.006;
    const brilho = 0.45 + rnd() * 0.55;
    // Cauda acima e "contra o vento" da cabeça.
    const tx = VENTO.x * len;
    const tz = VENTO.y * len;
    const vs = [
      [-w, 0, 0, brilho],
      [w, 0, 0, brilho],
      [w + tx, len, tz, 0],
      [-w + tx, len, tz, 0],
    ];
    vs.forEach(([x, y, z, c], j) => {
      const o = (i * 4 + j) * 3;
      pos.set([x, y, z], o);
      base.set([bx, by, bz], o);
      cor.set([c, c, c], o);
    });
    const o = i * 4;
    idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  }
  const chuvaGeo = track(new THREE.BufferGeometry());
  chuvaGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  chuvaGeo.setAttribute("aBase", new THREE.BufferAttribute(base, 3));
  chuvaGeo.setAttribute("color", new THREE.BufferAttribute(cor, 3));
  chuvaGeo.setIndex(idx);
  chuvaGeo.boundingSphere = new THREE.Sphere(
    new THREE.Vector3((a.x + b.x) / 2, CHUVA.alt / 2, (a.z + b.z) / 2),
    Math.hypot(b.x - a.x, b.z - a.z, CHUVA.alt) / 2 + 1
  );
  const uTempo = { value: 0 };
  const chuvaMat = track(
    new THREE.MeshBasicMaterial({
      color: lerp(ciano, branco, 0.45),
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      fog: false,
      side: THREE.DoubleSide,
    })
  );
  chuvaMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTempo = uTempo;
    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute vec3 aBase;
uniform float uTempo;`
      )
      .replace(
        "#include <begin_vertex>",
        `float queda = mod(aBase.y - uTempo * ${CHUVA.vel.toFixed(2)}, ${CHUVA.alt.toFixed(2)});
float desce = aBase.y - queda;
vec3 transformed = position + vec3(aBase.x - desce * ${VENTO.x.toFixed(3)}, queda, aBase.z - desce * ${VENTO.y.toFixed(3)});`
      );
  };
  chuvaMat.customProgramCacheKey = () => "futuro-chuva";
  const chuva = new THREE.Mesh(chuvaGeo, chuvaMat);
  chuva.frustumCulled = false;
  chuva.renderOrder = 6;
  chuva.userData.noShadow = true;
  // Movimento reduzido: sem chuva (gotas paradas no ar parecem defeito).
  chuva.visible = !reducedMotion;
  grupo.add(chuva);

  // ---- Névoa baixa colorida --------------------------------------------------
  // Manchas rasteiras aditivas, cada uma puxando a cor da luz mais próxima.
  const radial = track(texturaRadial(pal));
  const nevoaGeo = track(new THREE.PlaneGeometry(1, 1));
  nevoaGeo.rotateX(-Math.PI / 2);
  const nevoaMat = track(
    new THREE.MeshBasicMaterial({
      map: radial,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      fog: false,
    })
  );
  const MANCHAS = [
    // [tx, ty, tamanho, cor, altura]
    [6, 8.2, 6.5, magenta, 0.22],
    [10.5, 9.3, 5, violeta, 0.3],
    [15.5, 8.6, 5.5, lerp(violeta, ciano, 0.5), 0.26],
    [19, 16.6, 6.5, ciano, 0.2],
    [24.5, 16.4, 6, lerp(ciano, magenta, 0.55), 0.28],
    [23.5, 7.4, 6, lerp(ciano, verde, 0.4), 0.18],
    [12.5, 15.5, 5, magenta, 0.24],
    [8, 13, 5, lerp(roxo, magenta, 0.4), 0.3],
  ];
  const nevoa = new THREE.InstancedMesh(nevoaGeo, nevoaMat, MANCHAS.length);
  MANCHAS.forEach(([, , , c], i) => nevoa.setColorAt(i, c));
  nevoa.renderOrder = 3;
  nevoa.userData.noShadow = true;
  nevoa.frustumCulled = false;
  grupo.add(nevoa);

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  function posicionarNevoa(t, f) {
    MANCHAS.forEach(([tx, ty, tam, , y], i) => {
      const fase = i * 1.7;
      const dx = reducedMotion ? 0 : Math.sin(t * 0.13 + fase) * 0.6;
      const dz = reducedMotion ? 0 : Math.cos(t * 0.11 + fase) * 0.35;
      p.copy(tileToWorld(tx, ty)).add(s.set(dx, y, dz));
      const e = tam * (0.55 + 0.45 * f);
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, fase);
      nevoa.setMatrixAt(i, m4.compose(p, q, s.set(e, 1, e * 0.7)));
    });
    nevoa.instanceMatrix.needsUpdate = true;
  }

  // ---- Feixes de holofote varrendo o céu -------------------------------------
  // Cone aberto com o vértice na fonte. O shader apaga a ponta e as bordas da
  // silhueta (onde a normal foge da câmera), o que dá o ar de luz em suspensão
  // em vez de um triângulo chapado. Aditivo: preto = transparente.
  const ALT_FEIXE = 16;
  const feixeGeo = track(new THREE.ConeGeometry(0.8, ALT_FEIXE, 28, 1, true));
  feixeGeo.translate(0, -ALT_FEIXE / 2, 0);
  feixeGeo.rotateX(Math.PI); // vértice na origem, boca para +y
  const feixeShader = {
    vertexShader: `
varying float vBorda;
varying float vAlong;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 n = normalize(normalMatrix * normal);
  vBorda = abs(dot(n, normalize(-mv.xyz)));
  vAlong = position.y / ${ALT_FEIXE.toFixed(1)};
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: `
uniform vec3 uCor;
uniform float uForca;
varying float vBorda;
varying float vAlong;
void main() {
  float ponta = pow(clamp(1.0 - vAlong, 0.0, 1.0), 1.8);
  float boca = smoothstep(0.0, 0.04, vAlong);
  float a = pow(vBorda, 2.2) * ponta * boca * uForca;
  gl_FragColor = vec4(uCor * a, 1.0);
  #include <colorspace_fragment>
}`,
  };
  // Fontes no chão, atrás dos prédios (o feixe sobe por trás e cruza o céu).
  const HOLOFOTES = [
    { t: [9.5, 2.2], cor: magenta, fase: 0, vel: 0.33, incl: 0.72, rumo: -0.5 },
    { t: [21.2, 1.4], cor: ciano, fase: 2.1, vel: -0.27, incl: 0.62, rumo: 0.15 },
    { t: [28.4, 10.2], cor: lerp(violeta, ciano, 0.3), fase: 4.2, vel: 0.22, incl: 0.8, rumo: 0.7 },
  ];
  const feixes = HOLOFOTES.map((h) => {
    const mat = track(
      new THREE.ShaderMaterial({
        ...feixeShader,
        uniforms: { uCor: { value: h.cor.clone() }, uForca: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    );
    const m = new THREE.Mesh(feixeGeo, mat);
    m.position.copy(tileToWorld(...h.t)).setY(0.25);
    m.renderOrder = 5;
    m.userData.noShadow = true;
    m.frustumCulled = false;
    grupo.add(m);
    return m;
  });

  // Halo na boca de cada holofote.
  const haloMats = HOLOFOTES.map((h) => track(
    new THREE.SpriteMaterial({
      color: lerp(h.cor, branco, 0.35),
      map: radial,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      fog: false,
    })
  ));
  const halos = HOLOFOTES.map((h, i) => {
    const sp = new THREE.Sprite(haloMats[i]);
    sp.position.copy(tileToWorld(...h.t)).setY(0.3);
    sp.scale.setScalar(0.6);
    sp.renderOrder = 5;
    grupo.add(sp);
    return sp;
  });

  // Liga com tremida de reator (determinística em k, não no tempo): a volta
  // ao presente desliga pelo mesmo caminho.
  const ligar = (k, a, b) => {
    const u = trecho(k, a, b);
    if (u <= 0 || u >= 1) return u;
    const pisca = u < 0.55 && Math.sin(u * 61 + a * 17) > 0.15 ? 0.25 : 1;
    return suave(u) * pisca;
  };
  const forcaFeixe = (k, i) => ligar(k, 0.24 + i * 0.09, 0.48 + i * 0.09);

  const eixo = new THREE.Euler();
  function posicionarFeixes(t, k) {
    HOLOFOTES.forEach((h, i) => {
      // Varre um leque para o norte (longe da câmera), com balanço lento.
      const ang = reducedMotion ? h.fase : t * h.vel + h.fase;
      const f = trecho(k, 0.24 + i * 0.09, 0.6 + i * 0.09);
      // Ao ligar, o feixe sobe do chão até a inclinação de trabalho.
      const yaw = h.rumo + Math.sin(ang) * 0.75 * f;
      const incl = h.incl + Math.sin(ang * 0.7 + 1) * 0.12 * f + (1 - suave(f)) * 0.5;
      eixo.set(-incl, yaw, 0, "YXZ");
      feixes[i].quaternion.setFromEuler(eixo);
    });
  }

  // ---- Progresso -------------------------------------------------------------
  let kAtual = 0;
  function aplicarK(k, t) {
    const fLuz = 0.55 + 0.45 * suave(trecho(k, 0.35, 0.9)); // crescem com o neon
    const fAr = suave(trecho(k, 0.12, 0.45)); // chuva/névoa depois que escurece
    luzes.forEach((l, i) => (l.intensity = l.userData.max * fLuz * ligar(k, 0.06 + i * 0.07, 0.3 + i * 0.07)));
    chuvaMat.opacity = 0.5 * fAr;
    nevoaMat.opacity = 0.13 * fAr;
    feixes.forEach((m, i) => {
      const f = forcaFeixe(k, i);
      m.material.uniforms.uForca.value = 0.55 * f;
      m.visible = f > 0;
      halos[i].visible = f > 0;
      haloMats[i].opacity = 0.6 * f;
    });
    posicionarNevoa(t, fAr);
    posicionarFeixes(t, k);
    chuva.visible = !reducedMotion && fAr > 0;
    nevoa.visible = fAr > 0;
  }

  function setProgress(k) {
    kAtual = k;
    grupo.visible = k > 0;
    if (k > 0) aplicarK(k, uTempo.value);
  }

  function update(t, dt, k) {
    if (k !== kAtual) setProgress(k);
    if (!reducedMotion) {
      uTempo.value = t;
      posicionarNevoa(t, suave(trecho(k, 0.12, 0.45)));
      posicionarFeixes(t, k);
    }

    // A noite cai: puxa o estado do ciclo dia/noite para a noite roxa.
    const st = dayNight?.state;
    if (!st) return;
    const f = suave(trecho(k, 0, 0.4));
    st.fog.lerp(alvo.fog, f);
    st.hemiSky.lerp(alvo.sky, f);
    st.hemiGround.lerp(alvo.ground, f);
    st.hemiIntensity += (alvo.hemiI - st.hemiIntensity) * f;
    st.sunColor.lerp(alvo.sun, f);
    st.sunIntensity += (alvo.sunI - st.sunIntensity) * f;
    st.exposure += (alvo.exposure - st.exposure) * f;
    // Janelas e postes acesos (nightlights lê depois).
    st.night = Math.max(st.night, f);
  }

  return { setProgress, update };
}
