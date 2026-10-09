// Dono + mascote: NPC 3D que passeia em circuito com o mascote colado nele.
//
// O dono (GLB do Hunyuan com os clipes `parado` e `andando`) anda de tile em
// tile e para nos pontos de descanso. O mascote não anda na grade: segue o
// dono de perto (um pouco atrás e ao lado) e, quando ele para, encosta do
// lado dele. Na grade, o mascote reserva o tile que o dono acabou de deixar,
// então o jogador não atravessa nenhum dos dois. Falar com qualquer um faz os
// dois pararem e se virarem para o jogador.
//
// O que o mascote faz (clipes, pulos, espada...) fica no comportamento
// passado em `pet` (scene/pets.js):
//   pet.attach(root, gltf)         monta o modelo dentro de `root`
//   pet.update(dt, { speed })      anima conforme a velocidade (0 = parado)
//   pet.perform(nome) → boolean    começa uma apresentação (tai chi, mortal…)
//   pet.busy                       true enquanto a apresentação roda
//   pet.freeze()                   pose parada (movimento reduzido)
//
// Chefe de ginásio (`anchor`): em vez de passear, o dono segue um objeto do
// motor (o boneco do líder, invisível, que guarda tile, balão e conversa) e só
// anda quando esse objeto anda (cenas). O mascote fica ao lado e se apresenta
// de tempos em tempos; `cheer()` faz ele se exibir na hora (conversa).
//
// Clique: dono e mascote levam cada um uma malha invisível (`hitProxies`, com
// `userData.inspectId` = `id` / `petId`) que o motor usa no raycast para abrir
// a ficha do personagem ou do mascote (opção `onInspect` do createVila).

import * as THREE from "three";

const STEP = 0.55; // segundos por tile
const FADE = 0.25;
const TALK_PAUSE = 4;
// Onde o mascote fica em relação ao dono (unidades de mundo; 1 tile = 1).
const FOLLOW_BACK = 0.5; // andando: atrás
const FOLLOW_SIDE = 0.22; // andando: deslocado para o lado
const REST_SIDE = 0.48; // parado: ao lado
const PET_SMOOTH = 7; // quanto maior, mais grudado no ponto-alvo

// Bordão do dono: balão que aparece de tempos em tempos sobre a cabeça.
const QUOTE_SHOW = 3.2; // segundos visível
const QUOTE_GAP = [9, 16]; // intervalo entre aparições (mín., máx.)
const QUOTE_FADE = 0.3;
// Chefe parado: intervalo entre as apresentações do mascote (mín., máx.).
const SHOW_GAP = [8, 14];

const angleTo = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// Prepara um GLB: sombras, sem corte de frustum e altura normalizada.
// Devolve o modelo já escalado e apoiado no chão.
export function fitModel(gltf, height) {
  const model = gltf.scene;
  let skinned = null;
  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      // A pose animada sai do bounding box de repouso; sem isso o three pode
      // cortar o personagem na borda da tela.
      o.frustumCulled = false;
    }
    if (o.isSkinnedMesh && !skinned) skinned = o;
  });
  const box = new THREE.Box3().setFromObject(skinned || model);
  const size = box.getSize(new THREE.Vector3());
  const k = height / size.y;
  model.scale.setScalar(k);
  model.position.y = -box.min.y * k;
  return model;
}

// Clipes de um GLB com troca suave entre eles.
export function createClips(model, animations) {
  const mixer = new THREE.AnimationMixer(model);
  const acts = {};
  for (const clip of animations) acts[clip.name] = mixer.clipAction(clip);
  const clips = { mixer, acts, current: null };
  clips.play = (name, fade = FADE) => {
    const next = acts[name];
    if (!next || next === clips.current) return;
    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.play();
    if (clips.current) next.crossFadeFrom(clips.current, fade, false);
    clips.current = next;
  };
  clips.play("parado", 0);
  // Fases diferentes para dois personagens não respirarem em sincronia.
  if (acts.parado) acts.parado.time = Math.random() * acts.parado.getClip().duration;
  return clips;
}

// Balão de fala (sprite: sempre de frente para a câmera) com o texto em
// canvas. Fica escondido até o motor mandar aparecer.
function makeQuoteBubble(text, { bg, fg, font }) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  let size = 56;
  do {
    ctx.font = `700 ${size}px ${font}`;
    size -= 2;
  } while (ctx.measureText(text).width > 560 && size > 24);
  ctx.fillStyle = bg.getStyle();
  ctx.strokeStyle = fg.getStyle();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(8, 8, 624, 136, 40);
  ctx.moveTo(296, 141);
  ctx.lineTo(320, 188);
  ctx.lineTo(344, 141);
  ctx.fill();
  ctx.stroke();
  // Tampa a linha da borda entre o balão e o rabinho.
  ctx.fillRect(299, 136, 42, 10);
  ctx.fillStyle = fg.getStyle();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 320, 78);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, fog: false, toneMapped: false })
  );
  sprite.scale.set(1.6, 0.5, 1);
  sprite.renderOrder = 10;
  sprite.visible = false;
  return sprite;
}

// Malha invisível só para o raycast do clique (corpo inteiro, do chão para
// cima). O motor lê `userData.inspectId` para saber quem foi clicado.
export function createHitProxy(parent, inspectId, radius, height) {
  const proxy = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 10),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  proxy.position.y = height / 2;
  proxy.userData.inspectId = inspectId;
  parent.add(proxy);
  return proxy;
}

export function disposeHitProxy(proxy) {
  proxy.removeFromParent();
  proxy.geometry.dispose();
  proxy.material.dispose();
}

function createRoot(scene, shadowColor, shadowSize) {
  const root = new THREE.Group();
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(shadowSize, 20),
    new THREE.MeshBasicMaterial({ color: shadowColor, transparent: true, opacity: 0.18, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.01;
  root.add(blob);
  scene.add(root);
  return root;
}

export function createCompanion({
  scene,
  loader,
  tileToWorld,
  isFree,
  occupied,
  shadowColor,
  reducedMotion = false,
  isPaused = () => false,
  route, // [[x, y], …] circuito fechado
  restAt, // Map<índice do circuito, apresentação do mascote>
  restSeconds,
  talkShow, // apresentação do mascote quando o jogador fala com eles
  ownerUrl,
  ownerHeight = 0.98,
  ownerWalkScale = 1.2,
  petUrl,
  pet,
  quote = null, // { text, bg, fg, font }: bordão do dono em balão
  id = null, // ficha do dono (onInspect): "leo", "tiago", "rafa"…
  petId = null, // ficha do mascote: "samurai", "coelho", "waffle"…
  anchor = null, // Object3D a seguir: chefe parado na porta do ginásio
}) {
  const self = { id, petId };
  let routeIdx = 0;
  let restedAt = -1;
  let state = "loading";
  let wait = 0;
  let talkPending = null;
  let disposed = false;

  // Cada um tem a própria marca na grade (o dono não pode liberar o tile que
  // o mascote acabou de reservar); as duas levam à mesma conversa.
  // `inspectId` diz de quem é o tile (dono ou mascote) para a ficha.
  const tag = (inspectId) => ({ isWalker: true, group: self, inspectId, talk: (rotY) => talk(rotY) });
  const ownerTag = tag(id);
  const petTag = tag(petId ?? id);

  const owner = { root: createRoot(scene, shadowColor, 0.3), clips: null, yaw: 0, yawGoal: 0 };
  const mascot = { root: createRoot(scene, shadowColor, pet.shadowSize ?? 0.18), yaw: 0, yawGoal: 0 };

  // Alvos de clique (invisíveis): dono e mascote.
  const hitProxies = [];
  // Chefe: o clique no dono é do boneco do líder (anda até ele e conversa).
  if (id && !anchor) hitProxies.push(createHitProxy(owner.root, id, 0.28, ownerHeight));
  if (petId) hitProxies.push(createHitProxy(mascot.root, petId, (pet.shadowSize ?? 0.18) + 0.08, 0.55));

  // Grade: tile do dono, movimento entre tiles e tile reservado do mascote.
  let ox = route[0][0];
  let oy = route[0][1];
  let move = null;
  let petKey = null;
  if (anchor) {
    owner.root.position.copy(anchor.position);
    owner.yaw = owner.yawGoal = anchor.rotation.y;
  } else {
    occupied.set(`${ox},${oy}`, ownerTag);
    owner.root.position.copy(tileToWorld(ox, oy));
  }

  function reservePet(x, y) {
    if (petKey && occupied.get(petKey) === petTag) occupied.delete(petKey);
    petKey = `${x},${y}`;
    occupied.set(petKey, petTag);
  }
  const [px0, py0] = route[route.length - 1];
  if (!anchor) reservePet(px0, py0);

  // Ponto-alvo do mascote: atrás e ao lado do dono andando; ao lado dele parado.
  const target = new THREE.Vector3();
  function petTarget() {
    const a = owner.yaw;
    const fwdX = Math.sin(a), fwdZ = Math.cos(a);
    const sideX = Math.cos(a), sideZ = -Math.sin(a);
    const back = move ? FOLLOW_BACK : 0;
    const side = move ? FOLLOW_SIDE : REST_SIDE;
    target.set(
      owner.root.position.x - fwdX * back + sideX * side,
      0,
      owner.root.position.z - fwdZ * back + sideZ * side
    );
    return target;
  }
  mascot.root.position.copy(petTarget());

  // Balão do bordão: conta o tempo até a próxima aparição e some quando o
  // jogo pausa (diálogo ou cena). Com movimento reduzido, aparece sem fade.
  const bubble = quote ? makeQuoteBubble(quote.text, quote) : null;
  const randomGap = () => QUOTE_GAP[0] + Math.random() * (QUOTE_GAP[1] - QUOTE_GAP[0]);
  let quoteWait = 3 + Math.random() * 3;
  let quoteLeft = 0;
  if (bubble) {
    // Chefe: acima do balão de líder do motor.
    bubble.position.y = ownerHeight + (anchor ? 0.9 : 0.42);
    owner.root.add(bubble);
  }

  function updateBubble(dt) {
    if (!bubble) return;
    if (isPaused()) {
      quoteLeft = 0;
    } else if (quoteLeft > 0) {
      quoteLeft -= dt;
      if (quoteLeft <= 0) quoteWait = randomGap();
    } else {
      quoteWait -= dt;
      if (quoteWait <= 0) quoteLeft = QUOTE_SHOW;
    }
    const goal = quoteLeft > 0 ? 1 : 0;
    const mat = bubble.material;
    mat.opacity = reducedMotion ? goal : mat.opacity + Math.sign(goal - mat.opacity) * Math.min(Math.abs(goal - mat.opacity), dt / QUOTE_FADE);
    bubble.visible = mat.opacity > 0.01;
  }

  Promise.all([loader.loadAsync(ownerUrl), loader.loadAsync(petUrl)])
    .then(([gOwner, gPet]) => {
      if (disposed) return;
      const model = fitModel(gOwner, ownerHeight);
      owner.root.add(model);
      owner.clips = createClips(model, gOwner.animations);
      if (owner.clips.acts.andando) owner.clips.acts.andando.timeScale = ownerWalkScale;
      pet.attach(mascot.root, gPet);
      if (reducedMotion) {
        state = "still";
        if (owner.clips.acts.parado) owner.clips.acts.parado.paused = true;
        owner.clips.mixer.update(0);
        pet.freeze();
        return;
      }
      rest(1.5);
    })
    .catch(() => {});

  function turn(body, dt, rate) {
    body.yaw += wrap(body.yawGoal - body.yaw) * (1 - Math.exp(-dt * rate));
    body.root.rotation.y = body.yaw;
  }

  function rest(seconds, show = null) {
    state = "rest";
    wait = seconds;
    owner.clips?.play("parado");
    if (show && !pet.busy) pet.perform(show);
  }

  function stepOwner(nx, ny) {
    occupied.set(`${nx},${ny}`, ownerTag); // reserva o destino já na saída
    move = { from: tileToWorld(ox, oy), to: tileToWorld(nx, ny), t: 0 };
    reservePet(ox, oy); // o mascote fica com o tile que o dono deixa
    owner.yawGoal = angleTo([ox, oy], [nx, ny]);
    ox = nx;
    oy = ny;
    owner.clips?.play("andando");
  }

  function updateOwner(dt) {
    turn(owner, dt, 10);
    if (move) {
      move.t += dt / STEP;
      const k = Math.min(move.t, 1);
      owner.root.position.lerpVectors(move.from, move.to, k);
      if (k >= 1) move = null;
      return;
    }
    if (state === "rest") {
      wait -= dt;
      if (wait > 0 || pet.busy) return;
      state = "walk";
    }
    if (talkPending !== null) {
      owner.yawGoal = mascot.yawGoal = talkPending;
      talkPending = null;
      rest(TALK_PAUSE, talkShow);
      return;
    }
    // Chegou ao ponto de descanso: para de frente para a câmera e o mascote
    // se apresenta do lado.
    if (restAt.has(routeIdx) && restedAt !== routeIdx) {
      restedAt = routeIdx;
      owner.yawGoal = 0;
      rest(restSeconds, restAt.get(routeIdx));
      return;
    }
    const next = (routeIdx + 1) % route.length;
    const [nx, ny] = route[next];
    if (!isFree(nx, ny)) {
      owner.clips?.play("parado"); // caminho ocupado (jogador ou outro NPC): espera
      return;
    }
    stepOwner(nx, ny);
    routeIdx = next;
  }

  const prev = new THREE.Vector3();
  function updatePet(dt) {
    prev.copy(mascot.root.position);
    mascot.root.position.lerp(petTarget(), 1 - Math.exp(-dt * PET_SMOOTH));
    const dx = mascot.root.position.x - prev.x;
    const dz = mascot.root.position.z - prev.z;
    const speed = Math.hypot(dx, dz) / Math.max(dt, 1e-4);
    if (speed > 0.25) mascot.yawGoal = Math.atan2(dx, dz);
    // Parado: olha para onde o dono olha (câmera ou jogador).
    else if (!pet.busy) mascot.yawGoal = owner.yawGoal;
    turn(mascot, dt, 8);
    pet.update(dt, { speed: speed > 0.25 ? speed : 0 });
  }

  // Chefe parado: acompanha o boneco do líder (anda junto nas cenas) e o
  // mascote se apresenta de tempos em tempos.
  const randomShowGap = () => SHOW_GAP[0] + Math.random() * (SHOW_GAP[1] - SHOW_GAP[0]);
  const shows = [...new Set(restAt.values())];
  let showWait = 3 + Math.random() * 4;
  function updateAnchored(dt) {
    const dist = owner.root.position.distanceTo(anchor.position);
    owner.root.position.copy(anchor.position);
    owner.yawGoal = anchor.rotation.y;
    turn(owner, dt, 10);
    const walking = dist / Math.max(dt, 1e-4) > 0.3;
    move = walking ? true : null; // o mascote segue atrás enquanto ele anda
    owner.clips?.play(walking ? "andando" : "parado");
    if (!isPaused() && !walking) {
      showWait -= dt;
      if (showWait <= 0) {
        if (!pet.busy && shows.length) pet.perform(shows[Math.floor(Math.random() * shows.length)]);
        showWait = randomShowGap();
      }
    }
    updatePet(dt);
  }

  // Jogador falou com o chefe: o mascote se exibe.
  function cheer() {
    if (state === "loading" || state === "still" || pet.busy) return;
    pet.perform(talkShow);
    showWait = randomShowGap();
  }

  function update(dt) {
    if (state === "loading") return;
    updateBubble(dt);
    if (state === "still") {
      if (anchor) {
        owner.root.position.copy(anchor.position);
        owner.root.rotation.y = anchor.rotation.y;
        mascot.root.position.copy(petTarget());
      }
      return;
    }
    if (anchor) {
      owner.clips?.mixer.update(dt);
      updateAnchored(dt);
      return;
    }
    owner.clips?.mixer.update(dt);
    if (isPaused()) {
      pet.update(dt, { speed: 0 }); // segue respirando, sem andar
      return;
    }
    updateOwner(dt);
    updatePet(dt);
  }

  // Jogador falou com o dono ou com o mascote: os dois param e se viram para
  // o jogador, e o mascote se exibe.
  function talk(rotY) {
    if (state === "loading" || state === "still") return;
    if (move) {
      talkPending = rotY; // termina o passo e para
      return;
    }
    owner.yawGoal = mascot.yawGoal = rotY;
    rest(TALK_PAUSE, talkShow);
  }

  function dispose() {
    disposed = true;
    owner.clips?.mixer.stopAllAction();
    pet.dispose?.();
    bubble?.material.map.dispose();
    for (const p of hitProxies) disposeHitProxy(p);
    hitProxies.length = 0;
    // Malhas e materiais são liberados pelo dispose do motor (scene.traverse).
    occupied.forEach((v, key) => v.group === self && occupied.delete(key));
  }

  return Object.assign(self, { update, talk, cheer, dispose, owner, mascot, pet, hitProxies });
}
