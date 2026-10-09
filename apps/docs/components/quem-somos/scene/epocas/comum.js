// Peças compartilhadas pelas épocas (scene/epocas/*.js).
import * as THREE from "three";

export function createKit({ pal, track }) {
  const box = track(new THREE.BoxGeometry(1, 1, 1));
  const mat = (color, extra = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra }));
  const glow = (color) => track(new THREE.MeshBasicMaterial({ color, toneMapped: false }));
  const part = (geo, material, [sx, sy, sz], [x, y, z]) => {
    const m = new THREE.Mesh(geo, material);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };
  return { box, mat, glow, part };
}

// Liga 0..1 a um trecho [a, b] do progresso (0 antes de a, 1 depois de b).
export const trecho = (k, a, b) => Math.min(1, Math.max(0, (k - a) / (b - a)));
// Saída com leve passada do ponto (peça "assentando").
export const assentar = (x) => {
  const c = 1.70158;
  return x <= 0 ? 0 : x >= 1 ? 1 : 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};
