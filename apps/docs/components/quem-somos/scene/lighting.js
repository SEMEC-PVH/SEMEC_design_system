// Iluminação, sombras e pós-processamento da Vila SEMEC.
//
// Responsável por:
//   - configurar o renderer (espaço de cor sRGB, tone mapping neutro, sombras
//     PCF suaves);
//   - sol quente + hemisfério céu/chão derivados dos tokens --pv-*;
//   - névoa que acompanha a distância da câmera (visão geral não fica lavada);
//   - frustum de sombra justo, centrado no que a câmera vê e "grudado" na
//     grade de texels (sem tremer quando a câmera anda);
//   - oclusão de ambiente (GTAO) opcional via EffectComposer, com queda
//     automática de qualidade se o quadro ficar lento.
//
// Uso no motor:
//   const lighting = createLighting({ renderer, scene, camera, pal, track, dayNight });
//   // fim do tick:
//   lighting.update(camTarget, camera.userData.far || 1);
//   lighting.render(ts);
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

// Direção do sol padrão (sudeste, ~48°) quando não há ciclo dia/noite. Com o
// ciclo, a direção, as cores e a exposição vêm de scene/daynight.js; o astro
// sempre passa pelo sul, então as sombras caem para o norte, sem cobrir as
// fachadas (portas para o sul) que a câmera vê.
const SUN_DIR = new THREE.Vector3(10, 13.5, 7).normalize();
const UP = new THREE.Vector3(0, 1, 0);
const ORIGIN = new THREE.Vector3();
const SUN_DISTANCE = 30;
// Meia-largura do frustum de sombra por unidade de `far` da câmera.
const SHADOW_HALF = 12.5;
// O centro do que a câmera vê fica um pouco ao norte do alvo (perspectiva).
const VIEW_AHEAD = 1.6;

// Níveis de qualidade, do mais caro ao mais barato.
const QUALITY = {
  high: { ao: true, aoScale: 1, maxRatio: 1.5, shadowSize: 2048, shadowRadius: 3 },
  medium: { ao: false, maxRatio: 2, shadowSize: 2048, shadowRadius: 3 },
  low: { ao: false, maxRatio: 1, shadowSize: 1024, shadowRadius: 2 },
};
const ORDER = ["high", "medium", "low"];

// Cores da luz a partir dos tokens (nada de hex).
function lightPalette(pal) {
  const { pv, mix } = pal;
  const white = pv("white");
  return {
    // Sol de fim de manhã: branco levemente amanteigado.
    sun: mix(white, pv("yellow-400"), 0.24),
    // Céu: azul claro; chão: verde da grama puxado para o terroso (rebote quente).
    hemiSky: mix(pv("blue-200"), white, 0.2),
    hemiGround: mix(pv("green-600"), pv("yellow-800"), 0.35),
    // Névoa (e fundo): céu claro, um toque mais neutro para não azular o mapa.
    fog: mix(mix(pv("blue-100"), white, 0.5), pv("green-500"), 0.06),
  };
}

function pickInitialQuality() {
  const dpr = window.devicePixelRatio || 1;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency || 4;
  if (coarse || cores <= 2) return "low";
  if (dpr > 1.5 || cores <= 4) return "medium";
  return "high";
}

export function createLighting({ renderer, scene, camera, pal, track, dayNight = null }) {
  const lp = lightPalette(pal);

  // ---- Renderer -------------------------------------------------------------
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // Neutral (Khronos PBR Neutral) preserva os matizes dos tokens e só
  // comprime os realces — ACES/AgX dessaturam e deslocam as cores da marca.
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  // Em three r18x, PCFShadowMap + shadow.radius = amostragem em disco de
  // Vogel (o antigo PCFSoftShadowMap foi removido).
  renderer.shadowMap.type = THREE.PCFShadowMap;

  // ---- Céu e névoa ----------------------------------------------------------
  // Fundo = cor da névoa: onde o mapa termina (tela estreita, visão geral) o
  // chão some no céu sem emenda.
  scene.fog = new THREE.Fog(lp.fog, 22, 50);
  scene.background = lp.fog.clone();

  // ---- Luzes ------------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(lp.hemiSky, lp.hemiGround, 1.15);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(lp.sun, 2.4);
  sun.castShadow = true;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = SUN_DISTANCE * 2;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  scene.add(sun.target);

  // Base ortonormal do espaço da luz, para alinhar o centro do frustum à grade
  // de texels. Recalculada quando o astro anda (ciclo dia/noite).
  const sunDir = SUN_DIR.clone();
  const lightRot = new THREE.Matrix4().lookAt(sunDir, ORIGIN, UP);
  const lightRotInv = lightRot.clone().invert();
  const center = new THREE.Vector3();
  let shadowHalf = 0;

  // ---- Pós-processamento (GTAO) ---------------------------------------------
  let composer = null;
  let gtao = null;
  const dbSize = new THREE.Vector2();
  const composerSize = new THREE.Vector2();

  function buildComposer() {
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    gtao = new GTAOPass(scene, camera, 1, 1, undefined, {
      radius: 0.8,
      distanceExponent: 2,
      thickness: 1.5,
      scale: 1.6,
      samples: 16,
      distanceFallOff: 1,
      screenSpaceRadius: false,
    }, {
      lumaPhi: 10,
      depthPhi: 2,
      normalPhi: 3,
      radius: 8,
      rings: 2,
      samples: 16,
    });
    gtao.blendIntensity = 1;
    // Sprites (balões de fala) ficam fora do AO: no passe de normais/profundidade
    // eles viram um retângulo cheio e o AO escurece o quadro inteiro. O GTAOPass
    // já esconde pontos e linhas nesse passe; aqui entram os sprites também.
    const hideForAO = gtao._overrideVisibility.bind(gtao);
    gtao._overrideVisibility = () => {
      hideForAO();
      scene.traverse((o) => {
        if (o.isSprite && o.visible) {
          o.visible = false;
          gtao._visibilityCache.push(o);
        }
      });
    };
    composer.addPass(gtao);
    composer.addPass(new OutputPass());
    composerSize.set(0, 0);
  }

  function disposeComposer() {
    if (!composer) return;
    for (const p of composer.passes) p.dispose?.();
    composer.renderTarget1.dispose();
    composer.renderTarget2.dispose();
    composer = null;
    gtao = null;
  }

  // Mantém o composer do tamanho do drawing buffer (o resize do motor só
  // mexe no renderer). A resolução do AO segue QUALITY.aoScale.
  function syncComposerSize() {
    renderer.getDrawingBufferSize(dbSize);
    if (dbSize.equals(composerSize)) return;
    composerSize.copy(dbSize);
    composer.setPixelRatio(1);
    composer.setSize(dbSize.x, dbSize.y);
    const k = QUALITY[level].aoScale;
    gtao.setSize(Math.max(1, Math.round(dbSize.x * k)), Math.max(1, Math.round(dbSize.y * k)));
  }

  // ---- Qualidade ----------------------------------------------------------------
  let level = pickInitialQuality();

  function applyQuality() {
    const q = QUALITY[level];
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.maxRatio));
    if (sun.shadow.mapSize.x !== q.shadowSize) {
      sun.shadow.mapSize.set(q.shadowSize, q.shadowSize);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
    sun.shadow.radius = q.shadowRadius;
    if (q.ao && !composer) buildComposer();
    if (!q.ao) disposeComposer();
    shadowHalf = 0; // força recalcular o frustum
  }
  applyQuality();

  // Medição de quadro: só conta quadros reais do requestAnimationFrame
  // (timestamp próximo de performance.now()); quadros sintéticos — como os do
  // gancho de prints — e retomadas após pausa são ignorados. Em navegador
  // automatizado não rebaixa (prints reproduzíveis).
  const automated = typeof navigator !== "undefined" && navigator.webdriver === true;
  let prevNow = 0;
  let avgGap = 0;
  let sampled = 0;
  function measure(ts) {
    const now = performance.now();
    const gap = now - prevNow;
    prevNow = now;
    if (automated || level === "low") return;
    if (typeof ts !== "number" || Math.abs(now - ts) > 100 || gap > 250) return;
    // Média móvel exponencial do intervalo entre quadros (~1,5 s de memória).
    sampled++;
    avgGap = sampled === 1 ? gap : avgGap + (gap - avgGap) * 0.02;
    // Depois do aquecimento (~2 s), média abaixo de ~42 fps = lento: desce um
    // nível. O alvo é 60 fps; 30–40 fps com AO não compensa o efeito.
    if (sampled > 120 && avgGap > 24) {
      level = ORDER[ORDER.indexOf(level) + 1];
      sampled = 0;
      applyQuality();
    }
  }

  // ---- API ------------------------------------------------------------------------
  // Aplica o estado do ciclo dia/noite (cores, intensidades, exposição, astro).
  function applyDayNight() {
    const st = dayNight.state;
    sun.color.copy(st.sunColor);
    sun.intensity = st.sunIntensity;
    hemi.color.copy(st.hemiSky);
    hemi.groundColor.copy(st.hemiGround);
    hemi.intensity = st.hemiIntensity;
    scene.fog.color.copy(st.fog);
    scene.background.copy(st.fog);
    renderer.toneMappingExposure = st.exposure;
    if (!sunDir.equals(st.sunDir)) {
      sunDir.copy(st.sunDir);
      lightRot.lookAt(sunDir, ORIGIN, UP);
      lightRotInv.copy(lightRot).invert();
    }
  }

  function update(target, far) {
    if (dayNight) applyDayNight();
    const half = SHADOW_HALF * far;
    if (half !== shadowHalf) {
      shadowHalf = half;
      const cam = sun.shadow.camera;
      cam.left = -half;
      cam.right = half;
      cam.top = half;
      cam.bottom = -half;
      cam.updateProjectionMatrix();
      // Normal bias acompanha o tamanho do texel (sem acne nem peter-panning).
      sun.shadow.normalBias = 0.012 + (2 * half / sun.shadow.mapSize.x) * 0.9;
      // Névoa acompanha a distância da câmera.
      scene.fog.near = 13 * far;
      scene.fog.far = 52 * far;
    }
    // Centro do frustum, alinhado à grade de texels no espaço da luz.
    center.set(target.x, 0, target.z - VIEW_AHEAD * far).applyMatrix4(lightRotInv);
    const texel = (2 * half) / sun.shadow.mapSize.x;
    center.x = Math.round(center.x / texel) * texel;
    center.y = Math.round(center.y / texel) * texel;
    center.applyMatrix4(lightRot);
    sun.target.position.copy(center);
    sun.position.copy(center).addScaledVector(sunDir, SUN_DISTANCE);
  }

  function render(ts) {
    measure(ts);
    if (composer) {
      syncComposerSize();
      composer.render();
    } else {
      renderer.render(scene, camera);
    }
  }

  function dispose() {
    disposeComposer();
    scene.remove(hemi, sun, sun.target);
    sun.shadow.map?.dispose();
    hemi.dispose();
    sun.dispose();
  }

  const api = {
    sun,
    hemi,
    update,
    render,
    dispose,
    get quality() {
      return level;
    },
  };
  track(api);
  return api;
}
