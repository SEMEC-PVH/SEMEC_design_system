import * as THREE from "three";

// Roteirista de cenas (cutscenes) da Vila SEMEC.
//
// Uma cena é uma lista de passos executados em ordem, um por vez, dentro do
// tick do motor. Enquanto ela roda, o motor ignora a entrada do jogador e a
// câmera segue o alvo da cena em vez do jogador.
//
// Passos (who = "player" ou o índice da pessoa em `members`):
//   { cam: [x, y] | who, zoom?, dur? }       câmera desliza até o tile ou a
//                                            pessoa ("follow" volta a seguir)
//   { face: who, dir: "up" | ... | who }     vira para uma direção ou alguém
//   { hop: who, times? }                     pulinho de comemoração
//   { walk: who, path: [[x, y], ...] }       anda tile a tile (só NPCs)
//   { emblem: who, color? }                  insígnia sobe girando e some
//                                            (color = token pv, ex. "blue-500")
//   { say: { title, text } }                 fala; espera continuar()
//   { mundo: { ... } }                       mudança no mundo feita pelo motor
//                                            (tempo, época, efeitos; ver
//                                            mundo() no vila-engine.js); espera
//                                            o tempo que o motor devolver
//   { wait: segundos }
//
// pular() aplica o estado final dos passos que faltam (posição dos NPCs e
// direções), sem animar, e devolve a câmera ao jogador.

const HOP_DUR = 0.32;
const HOP_HEIGHT = 0.28;
const NPC_STEP = 0.3;
const EMBLEM_DUR = 2.2;

export function createCutscene({ scene, track, pal, tileToWorld, DIRS, reducedMotion, actors, onSay, mundo = () => 0 }) {
  let steps = [];
  let index = -1;
  let current = null; // { step, t, ... } do passo em andamento
  let waitingSay = false;
  let resolveDone = null;
  const camGoal = new THREE.Vector3();
  let camActive = false;
  let camZoom = 1;

  // Insígnia da Stack: octaedro brilhante + anel, reaproveitados a cada cena.
  const emblem = new THREE.Group();
  const gemMat = track(new THREE.MeshStandardMaterial({ color: pal.white, emissive: pal.white, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.25 }));
  const gem = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.16)), gemMat);
  gem.scale.y = 1.35;
  const ringMat = track(new THREE.MeshBasicMaterial({ color: pal.white, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  const ring = new THREE.Mesh(track(new THREE.RingGeometry(0.22, 0.27, 32)), ringMat);
  ring.rotation.x = -Math.PI / 2;
  emblem.add(gem, ring);
  emblem.visible = false;
  scene.add(emblem);

  const dirToward = (from, to) => {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    if (Math.abs(to.x - from.x) >= Math.abs(to.y - from.y) && dx) return dx > 0 ? "right" : "left";
    return dy > 0 ? "down" : "up";
  };

  function faceStep(step) {
    const actor = actors.get(step.face);
    if (!actor) return;
    let dir = step.dir;
    if (!DIRS[dir]) {
      const other = actors.get(dir);
      if (!other) return;
      dir = dirToward(actor, other);
    }
    actor.face(dir);
  }

  function setCam(step) {
    if (step.cam === "follow") {
      camActive = false;
      return;
    }
    if (Array.isArray(step.cam)) camGoal.copy(tileToWorld(step.cam[0], step.cam[1]));
    else {
      const actor = actors.get(step.cam);
      if (!actor) return;
      camGoal.copy(tileToWorld(actor.x, actor.y));
    }
    camZoom = step.zoom ?? 1;
    camActive = true;
  }

  // Aplica o passo sem animar (usado por pular() e com reduced motion).
  function finishInstant(step) {
    if (step.cam !== undefined) setCam(step);
    else if (step.face !== undefined) faceStep(step);
    else if (step.walk !== undefined) {
      const actor = actors.get(step.walk);
      const last = step.path[step.path.length - 1];
      if (actor && last) actor.moveTo(last[0], last[1]);
    } else if (step.mundo !== undefined) mundo(step.mundo, true);
  }

  function begin(step) {
    current = { step, t: 0 };
    if (step.cam !== undefined) {
      setCam(step);
      current.dur = step.cam === "follow" ? 0 : reducedMotion ? 0.3 : (step.dur ?? 1.4);
    } else if (step.face !== undefined) {
      faceStep(step);
      current.dur = 0.15;
    } else if (step.hop !== undefined) {
      current.actor = actors.get(step.hop);
      current.dur = reducedMotion || !current.actor ? 0 : HOP_DUR * (step.times ?? 2);
    } else if (step.walk !== undefined) {
      current.actor = actors.get(step.walk);
      current.queue = [...step.path];
      current.dur = Infinity;
      if (!current.actor) current.dur = 0;
    } else if (step.emblem !== undefined) {
      const actor = actors.get(step.emblem);
      const color = step.color ? pal.pv(step.color) : pal.white;
      gemMat.color.copy(color);
      gemMat.emissive.copy(color);
      ringMat.color.copy(color);
      emblem.position.copy(actor ? actor.object.position : camGoal);
      emblem.visible = true;
      current.base = emblem.position.clone();
      current.dur = EMBLEM_DUR;
    } else if (step.mundo !== undefined) {
      current.dur = mundo(step.mundo, false) || 0;
    } else if (step.say !== undefined) {
      waitingSay = true;
      current.dur = Infinity;
      onSay(step.say);
    } else {
      current.dur = step.wait ?? 0;
    }
  }

  function end() {
    const s = current?.step;
    if (s?.hop !== undefined && current.actor) current.actor.object.position.y = 0;
    if (s?.emblem !== undefined) emblem.visible = false;
    current = null;
  }

  function next() {
    end();
    index += 1;
    if (index >= steps.length) {
      stop();
      return;
    }
    begin(steps[index]);
  }

  function stop() {
    current = null;
    steps = [];
    index = -1;
    camActive = false;
    waitingSay = false;
    emblem.visible = false;
    const r = resolveDone;
    resolveDone = null;
    r?.();
  }

  function updateWalk(dt) {
    const c = current;
    if (!c.move) {
      const tile = c.queue.shift();
      if (!tile) {
        c.dur = 0;
        return;
      }
      const a = c.actor;
      const dir = dirToward(a, { x: tile[0], y: tile[1] });
      a.face(dir);
      c.move = { from: tileToWorld(a.x, a.y), to: tileToWorld(tile[0], tile[1]), k: 0 };
      a.moveTo(tile[0], tile[1], false);
    }
    c.move.k += dt / NPC_STEP;
    const k = Math.min(c.move.k, 1);
    c.actor.object.position.lerpVectors(c.move.from, c.move.to, k);
    if (!reducedMotion) c.actor.object.position.y = Math.abs(Math.sin(k * Math.PI)) * 0.05;
    if (k >= 1) {
      c.actor.object.position.y = 0;
      c.move = null;
    }
  }

  function update(dt) {
    if (!current) return;
    const c = current;
    c.t += dt;
    const s = c.step;
    if (s.hop !== undefined && c.actor && c.dur > 0) {
      const ph = (c.t % HOP_DUR) / HOP_DUR;
      c.actor.object.position.y = c.t < c.dur ? Math.sin(ph * Math.PI) * HOP_HEIGHT : 0;
    } else if (s.walk !== undefined && c.actor) {
      updateWalk(dt);
    } else if (s.emblem !== undefined) {
      const k = Math.min(c.t / c.dur, 1);
      const rise = 1 - (1 - Math.min(k / 0.4, 1)) ** 3; // sobe rápido e para
      emblem.position.copy(c.base);
      emblem.position.y = 0.6 + rise * 1.1;
      if (!reducedMotion) gem.rotation.y = c.t * 5;
      // Anel pulsa para fora no fim; a insígnia "entra" no personagem.
      const fade = Math.max(0, (k - 0.75) / 0.25);
      ring.scale.setScalar(1 + (reducedMotion ? 0 : k * 2.2));
      ringMat.opacity = 0.8 * (1 - k);
      emblem.scale.setScalar(1 - fade);
    }
    if (c.t >= c.dur && !waitingSay) next();
  }

  return {
    get active() {
      return index >= 0;
    },
    // Alvo da câmera (null = seguir o jogador) e zoom desejado.
    camera() {
      return camActive ? { target: camGoal, zoom: camZoom } : null;
    },
    play(list) {
      if (index >= 0) stop();
      steps = list;
      index = -1;
      return new Promise((resolve) => {
        resolveDone = resolve;
        next();
      });
    },
    continuar() {
      if (!waitingSay) return;
      waitingSay = false;
      next();
    },
    pular() {
      if (index < 0) return;
      // O passo em andamento também termina no estado final (NPC no último tile).
      const cur = current?.step;
      end();
      if (cur) finishInstant(cur);
      for (let i = index + 1; i < steps.length; i++) finishInstant(steps[i]);
      stop();
    },
    update,
  };
}
