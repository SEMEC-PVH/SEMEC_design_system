// Roda de história do Zé Carlos (cenas.js, cenaHistoria): o acampamento da
// noite (scene/acampamento.js, bancos em roda, luzinhas, vaga-lumes) em volta
// da fogueira (scene/fogueira.js). As ilustrações aparecem grandes na
// interface (LivroHistoria.jsx); aqui fica só o cenário.
//
//   createHistoria({ scene, pal, track, reducedMotion, lite })
//     -> { setPos(pos), setOn(on), assento(i), ASSENTOS, alturaAssento, update(t, dt), dispose }
//
//   ASSENTOS: lugares da roda em volta da fogueira (locais; ângulo 0 = norte,
//   onde senta o Zé, de frente para a câmera). O sul fica aberto para a
//   câmera. assento(i) devolve { pos (mundo), yaw } virado para o fogo.

import * as THREE from "three";
import { createAcampamento } from "./acampamento";
import { createFogueira } from "./fogueira";

const RAIO = 1.5;
// Graus a partir do norte, no sentido horário visto de cima.
const ANGULOS = [0, -30, 30, -60, 60, -90, 90, -120, 120, -150, 150];
const ASSENTOS = ANGULOS.map((g) => {
  const a = THREE.MathUtils.degToRad(g);
  const x = Math.sin(a) * RAIO;
  const z = -Math.cos(a) * RAIO;
  // De frente para a fogueira (yaw 0 = olhando para +z, o sul).
  return { x, z, yaw: Math.atan2(-x, -z) };
});

export function createHistoria({ scene, pal, track, reducedMotion = false, lite = false }) {
  const root = new THREE.Group();
  scene.add(root);
  const fogueira = createFogueira({ pal, track, lite, reducedMotion });
  const acampamento = createAcampamento({ pal, track, lite, reducedMotion, assentos: ASSENTOS });
  root.add(fogueira.object, acampamento.object);

  function setPos(pos) {
    root.position.copy(pos);
  }

  function setOn(on) {
    acampamento.setOn(on);
    fogueira.setOn(on);
  }

  function assento(i) {
    const s = ASSENTOS[i];
    return { pos: new THREE.Vector3(s.x, 0, s.z).add(root.position), yaw: s.yaw };
  }

  function update(t, dt) {
    fogueira.update(t, dt);
    acampamento.update(t, dt);
  }

  function dispose() {
    fogueira.dispose();
    acampamento.dispose();
    scene.remove(root);
  }

  return { setPos, setOn, assento, ASSENTOS, alturaAssento: acampamento.alturaAssento, update, dispose };
}
