// Quest da ocarina (components/quem-somos/quest.js) no mapa 3D:
//
//   createQuestMarker({ pal, track, reducedMotion }) -> { object, setEtapa, update }
//     Símbolo de quest sobre o Pedro: um cristal (octaedro) girando, forma
//     diferente dos balões de conversa dos NPCs. Dourado e grande quando há
//     algo a fazer com ele ("nova": aceitar; "achou": devolver); azul-claro e
//     menor enquanto o jogador procura; some quando a quest termina.
//
//   createOcarinaHideout({ scene, loader, url, pos, pal, track, reducedMotion })
//     -> { setEtapa, pop(origem), update, dispose }
//     A ocarina caída no mato alto, com brilhos piscando em volta (só durante
//     "procurando"). pop() faz ela subir girando sobre a cabeça do jogador e
//     sumir ("guardou na mochila").

import * as THREE from "three";

const SPIN = 1.6; // rad/s
const POP_TIME = 1.8; // s

export function createQuestMarker({ pal, track, reducedMotion = false }) {
  const gold = pal.pv("yellow-500");
  const calm = pal.pv("blue-300");
  const mat = track(
    new THREE.MeshStandardMaterial({ color: gold, emissive: gold, emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.1, flatShading: true })
  );
  const crystal = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.14, 0)), mat);
  crystal.scale.set(1, 1.45, 1);
  // Anel fino em volta: reforça a silhueta de longe.
  const ring = new THREE.Mesh(
    track(new THREE.TorusGeometry(0.2, 0.014, 6, 28)),
    track(new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.75 }))
  );
  ring.rotation.x = Math.PI / 2;
  const object = new THREE.Group();
  object.add(crystal, ring);
  object.traverse((o) => (o.userData.noShadow = true));

  let etapa = "nova";
  let base = 1;
  function setEtapa(e) {
    etapa = e;
    const destaque = e === "nova" || e === "achou";
    object.visible = e !== "concluida";
    const c = destaque ? gold : calm;
    mat.color.copy(c);
    mat.emissive.copy(c);
    ring.material.color.copy(c);
    ring.visible = destaque;
    base = destaque ? 1 : 0.7;
    object.scale.setScalar(base);
  }

  function update(t, dt) {
    if (!object.visible || reducedMotion) return;
    crystal.rotation.y += dt * (etapa === "procurando" ? SPIN * 0.4 : SPIN);
    object.position.y = object.userData.baseY + Math.sin(t * 2.4) * 0.05;
    // Devolver a ocarina: o cristal pulsa para chamar o jogador de volta.
    if (etapa === "achou") object.scale.setScalar(base * (1 + Math.sin(t * 5) * 0.08));
  }

  object.userData.baseY = 0;
  setEtapa("nova");
  return { object, setEtapa, update };
}

export function createOcarinaHideout({ scene, loader, url, pos, pal, track, reducedMotion = false }) {
  const root = new THREE.Group();
  root.position.copy(pos);
  scene.add(root);

  // Ocarina deitada e meio enterrada no capim: só a ponta aparece.
  const holder = new THREE.Group();
  holder.position.set(0.12, 0.06, 0.1);
  holder.rotation.set(0.25, 0.8, 0.35);
  root.add(holder);
  let model = null;
  let disposed = false;
  loader
    .loadAsync(url)
    .then((gltf) => {
      if (disposed) return;
      model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const k = 0.3 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(k);
      model.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-k));
      model.traverse((o) => {
        if (o.isMesh) o.castShadow = true;
      });
      holder.add(model);
    })
    .catch(() => {});

  // Brilhos: estrelinhas douradas que piscam em volta do esconderijo.
  const glintMat = track(
    new THREE.MeshBasicMaterial({ color: pal.pv("yellow-400"), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  const glintGeo = track(new THREE.OctahedronGeometry(0.045, 0));
  const glints = [
    [0.25, 0.55, 0.15, 0],
    [-0.2, 0.42, 0.05, 1.7],
    [0.05, 0.68, -0.2, 3.1],
    [-0.05, 0.35, 0.28, 4.4],
  ].map(([x, y, z, phase]) => {
    const g = new THREE.Mesh(glintGeo, glintMat);
    g.position.set(x, y, z);
    g.scale.set(0.6, 1.6, 0.6);
    g.userData = { phase, noShadow: true };
    root.add(g);
    return g;
  });

  let etapa = "nova";
  let pop = null; // { t, from }

  function setEtapa(e) {
    etapa = e;
    // Antes de aceitar a quest a ocarina fica escondida de vez (sem atalho).
    holder.visible = e === "procurando" || Boolean(pop);
    for (const g of glints) g.visible = e === "procurando";
  }

  // Achou: a ocarina sobe girando sobre o jogador e some.
  function startPop(origem) {
    if (!model) return;
    pop = { t: 0 };
    holder.removeFromParent();
    holder.position.copy(origem).setY(origem.y + 1.25);
    holder.rotation.set(0, 0, 0);
    holder.scale.setScalar(1.5);
    holder.visible = true;
    scene.add(holder);
    for (const g of glints) g.visible = false;
  }

  function update(t, dt) {
    if (pop) {
      pop.t += dt;
      const k = pop.t / POP_TIME;
      if (!reducedMotion) {
        holder.rotation.y += dt * 5;
        holder.position.y += dt * (k < 0.5 ? 0.25 : 0);
      }
      if (k > 0.75) holder.scale.setScalar(1.5 * Math.max(0, 1 - (k - 0.75) / 0.25));
      if (k >= 1) {
        pop = null;
        holder.visible = false;
      }
      return;
    }
    if (etapa !== "procurando" || reducedMotion) return;
    for (const g of glints) {
      const s = Math.max(0, Math.sin(t * 2.2 + g.userData.phase));
      g.scale.set(0.6 * s, 1.6 * s, 0.6 * s);
      g.rotation.y = t * 1.5;
    }
  }

  // Malhas e materiais (inclusive os do GLB) ficam na cena e são liberados
  // pelo dispose do motor (scene.traverse).
  function dispose() {
    disposed = true;
  }

  setEtapa("nova");
  return { setEtapa, pop: startPop, update, dispose };
}
