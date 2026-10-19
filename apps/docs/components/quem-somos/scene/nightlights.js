// Luzes da noite da Vila SEMEC: acompanham o fator `night` do ciclo dia/noite.
//
//   - luminárias dos postes (material com userData.streetLamp) quase apagadas
//     de dia e acesas à noite;
//   - janelas e interiores dos prédios (todo material emissivo) brilham mais;
//   - poça de luz quente no chão sob cada poste (decalque aditivo, sem luz
//     real: barato em qualquer GPU);
//   - vaga-lumes sobre o mato alto e as flores.
//
// Uso (depois de montar a cena inteira):
//   const nightLights = createNightLights({ scene, pal, track, lamps, glowSpots, reducedMotion });
//   nightLights.update(night, t);   // no tick
import * as THREE from "three";

const POOL_SIZE = 2.3;
const POOL_OPACITY = 0.34;
const FIREFLIES_PER_SPOT = 2;
const WINDOW_BOOST = 1.4;

// Gradiente radial (branco no centro → preto na borda) usado como alphaMap.
// As cores vêm dos tokens via THREE.Color.getStyle().
function makePoolTexture(pal) {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx2d = canvas.getContext("2d");
  const g = ctx2d.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, pal.white.getStyle());
  g.addColorStop(0.35, pal.mix(pal.white, pal.black, 0.45).getStyle());
  g.addColorStop(1, pal.black.getStyle());
  ctx2d.fillStyle = g;
  ctx2d.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function createNightLights({ scene, pal, track, lamps, glowSpots, reducedMotion }) {
  const warm = pal.mix(pal.pv("yellow-400"), pal.pv("yellow-500"), 0.4);

  // ---- Materiais emissivos já existentes na cena ----------------------------
  const lampMats = [];
  const windowMats = [];
  const seen = new Set();
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || seen.has(m) || !m.emissive || !(m.emissiveIntensity > 0)) continue;
      seen.add(m);
      (m.userData.streetLamp ? lampMats : windowMats).push({ m, base: m.emissiveIntensity });
    }
  });

  // ---- Poças de luz dos postes ------------------------------------------------
  const poolMat = track(
    new THREE.MeshBasicMaterial({
      color: warm,
      alphaMap: track(makePoolTexture(pal)),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  );
  const poolGeo = track(new THREE.PlaneGeometry(POOL_SIZE, POOL_SIZE));
  poolGeo.rotateX(-Math.PI / 2);
  const pools = new THREE.InstancedMesh(poolGeo, poolMat, Math.max(lamps.length, 1));
  const m4 = new THREE.Matrix4();
  lamps.forEach((p, i) => pools.setMatrixAt(i, m4.makeTranslation(p.x, 0.012, p.z)));
  pools.count = lamps.length;
  pools.userData.noShadow = true;
  pools.renderOrder = 2;
  pools.visible = false;
  scene.add(pools);

  // ---- Vaga-lumes -------------------------------------------------------------
  const n = glowSpots.length * FIREFLIES_PER_SPOT;
  const base = new Float32Array(n * 3);
  const phase = new Float32Array(n);
  let seed = 11;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < n; i++) {
    const s = glowSpots[i % glowSpots.length];
    base[i * 3] = s.x + (rand() - 0.5) * 0.9;
    base[i * 3 + 1] = 0.35 + rand() * 0.6;
    base[i * 3 + 2] = s.z + (rand() - 0.5) * 0.9;
    phase[i] = rand() * Math.PI * 2;
  }
  const flyGeo = track(new THREE.BufferGeometry());
  const flyPos = new THREE.BufferAttribute(base.slice(), 3);
  flyPos.setUsage(THREE.DynamicDrawUsage);
  flyGeo.setAttribute("position", flyPos);
  const flyMat = track(
    new THREE.PointsMaterial({
      color: pal.mix(pal.pv("yellow-400"), pal.pv("green-500"), 0.3),
      size: 0.1,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    })
  );
  const flies = new THREE.Points(flyGeo, flyMat);
  flies.visible = false;
  flies.frustumCulled = false;
  scene.add(flies);

  let lastNight = -1;
  function update(night, t) {
    if (night !== lastNight) {
      lastNight = night;
      for (const { m, base: b } of lampMats) m.emissiveIntensity = b * (0.08 + 1.5 * night);
      for (const { m, base: b } of windowMats) m.emissiveIntensity = b * (1 + WINDOW_BOOST * night);
      poolMat.opacity = POOL_OPACITY * night;
      pools.visible = night > 0.01;
      flyMat.opacity = Math.max(0, night * 1.2 - 0.2);
      flies.visible = night > 0.2 && !reducedMotion;
    }
    if (!flies.visible) return;
    const arr = flyPos.array;
    for (let i = 0; i < n; i++) {
      const ph = phase[i];
      arr[i * 3] = base[i * 3] + Math.sin(t * 0.7 + ph) * 0.25;
      arr[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 1.3 + ph * 2) * 0.12;
      arr[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.6 + ph) * 0.25;
    }
    flyPos.needsUpdate = true;
  }

  function dispose() {
    scene.remove(pools, flies);
    pools.dispose();
  }
  track({ dispose });

  return { update };
}
