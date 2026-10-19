// Utilitários compartilhados pelos construtores de prédios da Vila SEMEC.
//
// Contrato de um construtor (ver vila-engine.js, BUILDERS):
//   buildX(group, b, ctx) -> { labelPos: THREE.Vector3, labelBg: THREE.Color }
//   - group: THREE.Group já posicionado no centro do footprint; fachada em +z
//     (virada para a câmera, ao sul). Coordenadas locais em metros/tiles.
//   - b: { id, kind, x, y, w, h, label } — w/h em tiles (1 tile = 1 unidade).
//   - ctx: { pal, track, unitBox, reducedMotion, onFrame }
//       pal.pv("blue-700") -> THREE.Color de um token --pv-*;
//       pal.mix(a, b, t) -> cor interpolada. Nunca use hex.
//       track(x) registra geometria/material/textura para dispose().
//       unitBox: BoxGeometry(1,1,1) compartilhada.
//       onFrame(fn(t, dt)) registra animação por quadro; o motor não a
//       chama com prefers-reduced-motion.
// O motor aplica sombras a todo mesh do grupo, exceto os com
// userData.noShadow = true (use em vidro e luzes).

import * as THREE from "three";

export function std(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });
}

// Caixa a partir dos limites (x0..x1, y0..y1, z0..z1), adicionada ao grupo.
export function makeBox(group, unitBox) {
  return (mat, x0, x1, y0, y1, z0, z1, opts = {}) => {
    const m = new THREE.Mesh(unitBox, mat);
    m.scale.set(x1 - x0, y1 - y0, z1 - z0);
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    if (opts.noShadow) m.userData.noShadow = true;
    group.add(m);
    return m;
  };
}
