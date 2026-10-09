// Pedro — NPC 3D avulso, parado na frente da SEMEC, que dá a quest da
// ocarina (components/quem-somos/quest.js).
//
// O GLB (public/quem-somos/pedro.glb) traz quatro clipes: `parado`,
// `entrada` (a ocarina surge girando), `dancando` (ele dança, a ocarina
// orbita e solta notas) e `andando`. Ocarina e notas são nós do próprio GLB e
// os clipes já os escondem (escala ~0) fora da dança.
//
// Enquanto a ocarina está perdida ele só fica parado (clipe `parado`), com o
// símbolo de quest (scene/quest.js) sobre a cabeça. Devolvida a ocarina,
// celebrate() faz ele dançar e, dali em diante, ele volta a dançar de vez em
// quando. Ocupa um tile da grade como os outros NPCs; conversar com ele vira
// o Pedro para o jogador. Uma malha invisível (`hitProxies`, inspectId
// "pedro") deixa o motor achar o Pedro no clique.

import * as THREE from "three";
import { createHitProxy, disposeHitProxy } from "./companion";

const FADE = 0.25;
const DANCE_LOOPS = 2;
// Com a ocarina de volta: dança de novo depois deste tempo parado (s).
const DANCE_EVERY = [9, 15];

export function createPedro({
  scene,
  loader,
  url,
  tileToWorld,
  spot,
  index,
  marker,
  occupied,
  shadowColor,
  reducedMotion = false,
  isPaused = () => false,
}) {
  const root = new THREE.Group();
  const self = { isQuestNpc: true, id: "pedro", index, x: spot.x, y: spot.y, root };
  const hitProxies = [createHitProxy(root, "pedro", 0.28, 0.98)];
  let mixer = null;
  let acts = null;
  let current = null;
  let state = "loading"; // idle | entrada | dance
  let danceLeft = 0;
  let restLeft = 0;
  let hasOcarina = false;
  // Tocando numa cena (cenaOcarina): dança sem parar até tocar(false).
  let tocando = false;
  const restYaw = spot.rot;
  let yaw = restYaw;
  let yawGoal = restYaw;
  let faceTimer = 0;
  let disposed = false;

  root.position.copy(tileToWorld(spot.x, spot.y));
  root.rotation.y = yaw;
  occupied.set(`${spot.x},${spot.y}`, self);
  scene.add(root);

  // O símbolo de quest fica num grupo que não gira com o Pedro.
  const markerHolder = new THREE.Group();
  markerHolder.position.copy(root.position);
  marker.userData.baseY = 1.24;
  marker.position.y = 1.24;
  markerHolder.add(marker);
  scene.add(markerHolder);

  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.3, 20),
    new THREE.MeshBasicMaterial({ color: shadowColor, transparent: true, opacity: 0.18, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.01;
  root.add(blob);

  const sorteiaDescanso = () => DANCE_EVERY[0] + Math.random() * (DANCE_EVERY[1] - DANCE_EVERY[0]);

  function play(name, fade = FADE) {
    const next = acts?.[name];
    if (!next || next === current) return;
    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.play();
    if (current) next.crossFadeFrom(current, fade, false);
    current = next;
  }

  function idle() {
    state = "idle";
    restLeft = sorteiaDescanso();
    play("parado");
  }

  function startDance() {
    if (!acts?.entrada || reducedMotion) return;
    state = "entrada";
    yawGoal = 0; // de frente para a câmera
    play("entrada", 0.2);
  }

  loader
    .loadAsync(url)
    .then((gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      let body = null;
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          // A pose animada sai do bounding box de repouso; sem isso o
          // three pode cortar o personagem e as notas na borda da tela.
          o.frustumCulled = false;
        }
        if (o.isSkinnedMesh && !body) body = o;
      });
      const box = new THREE.Box3().setFromObject(body || model);
      const size = box.getSize(new THREE.Vector3());
      const k = 0.98 / size.y;
      model.scale.setScalar(k);
      model.position.y = -box.min.y * k;
      root.add(model);

      mixer = new THREE.AnimationMixer(model);
      const clip = (n) => gltf.animations.find((a) => a.name === n);
      acts = {};
      for (const n of ["parado", "entrada", "dancando"]) {
        const c = clip(n);
        if (c) acts[n] = mixer.clipAction(c);
      }
      if (acts.entrada) {
        acts.entrada.setLoop(THREE.LoopOnce, 1);
        acts.entrada.clampWhenFinished = true;
      }
      mixer.addEventListener("finished", (e) => {
        if (e.action === acts.entrada && state === "entrada") {
          state = "dance";
          danceLeft = (acts.dancando?.getClip().duration || 4) * DANCE_LOOPS;
          play("dancando", 0.2);
        }
      });

      idle();
      if (reducedMotion) {
        acts.parado.paused = true;
        mixer.update(0);
      }
    })
    .catch(() => {});

  function update(dt) {
    if (!mixer) return;
    if (!reducedMotion) mixer.update(dt);

    // Vira suave para a direção desejada; depois de conversar, volta a olhar
    // para a rua.
    if (faceTimer > 0 && !isPaused()) {
      faceTimer -= dt;
      if (faceTimer <= 0 && state === "idle") yawGoal = restYaw;
    }
    let d = yawGoal - yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    yaw += reducedMotion ? d : d * (1 - Math.exp(-dt * 10));
    root.rotation.y = yaw;

    if (isPaused() && !tocando) return;
    if (state === "dance") {
      danceLeft -= dt;
      if (danceLeft <= 0 && tocando) {
        danceLeft = acts.dancando?.getClip().duration || 4;
      } else if (danceLeft <= 0) {
        yawGoal = restYaw;
        idle();
      }
    } else if (state === "idle" && hasOcarina) {
      restLeft -= dt;
      if (restLeft <= 0) startDance();
    }
  }

  // Jogador falou com ele: vira para o jogador.
  function talk(rotY) {
    yawGoal = rotY;
    faceTimer = 4;
  }

  // Ocarina devolvida: dança na hora e passa a dançar de vez em quando.
  function celebrate() {
    hasOcarina = true;
    if (state === "idle") startDance();
  }

  // Cena da ocarina: começa (ou para) de tocar e dançar.
  function tocar(on) {
    tocando = on;
    if (on && state === "idle") startDance();
    else if (on) yawGoal = 0;
    else if (state !== "idle") {
      yawGoal = restYaw;
      idle();
    }
  }

  // Estado salvo (recarga da página): já devolvida, mas sem a festa agora.
  function setHasOcarina(on) {
    hasOcarina = on;
  }

  function dispose() {
    disposed = true;
    mixer?.stopAllAction();
    for (const p of hitProxies) disposeHitProxy(p);
    hitProxies.length = 0;
    markerHolder.removeFromParent();
    // Malhas e materiais são liberados pelo dispose do motor (scene.traverse).
    occupied.forEach((v, key) => v === self && occupied.delete(key));
  }

  return Object.assign(self, { update, talk, celebrate, tocar, setHasOcarina, dispose, hitProxies });
}
