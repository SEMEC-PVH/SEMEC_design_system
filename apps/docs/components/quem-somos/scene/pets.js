// Comportamentos dos mascotes (ver scene/companion.js para o contrato).
//
// Cada mascote tem um jeito próprio de se mexer, diferente do dono:
// - samurai (Leo): clipes do Hunyuan — trote, guarda, tai chi e ataque, em
//   que ele saca a lâmina (nó `Espada`) e solta um arco de corte;
// - coelho (Tiago): sem esqueleto (o Hunyuan não aceita rig nele), tudo
//   procedural — anda aos pulinhos com achatamento ao tocar o chão, respira
//   parado, dá pulinhos e mortal para trás;
// - waffle (Rafa): também procedural — anda gingando de pé em pé, respira
//   parado, dança twist e dá um pulo com rodopio.

import * as THREE from "three";
import { createClips, fitModel } from "./companion";

const smooth = (a, b, t) => THREE.MathUtils.smoothstep(t, a, b);
const easeInOut = (t) => t * t * (3 - 2 * t);

// ---- Samurai ----------------------------------------------------------------

const TROT_SPEED = 1.8; // velocidade em que o trote roda em 1x
// Quando a lâmina sai e volta, em segundos do clipe `ataque` (2,7 s).
const DRAW = [0.38, 0.55];
const SHEATHE = [2.0, 2.2];
// Rastro do corte (arco que pisca no golpe), em segundos do `ataque`.
const SLASH = [1.1, 1.55];

export function samuraiPet({ slashColor, height = 0.52 }) {
  let clips = null;
  let sword = null;
  let swordScaleY = 1;
  let busy = false;

  // Arco do corte à frente do samurai, na altura da cintura.
  const slash = new THREE.Mesh(
    new THREE.RingGeometry(0.3, 0.4, 28, 1, -0.4, 2.6),
    new THREE.MeshBasicMaterial({
      color: slashColor,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
  );
  slash.position.set(0, 0.3, 0.2);
  slash.visible = false;

  // Lâmina: 0 = guardada (escondida), 1 = toda para fora. Escala só no
  // comprimento, então ela "desliza" a partir do punho.
  function setSword(k) {
    if (!sword) return;
    sword.visible = k > 0.01;
    sword.scale.y = swordScaleY * Math.max(k, 0.01);
  }

  function updateSlash(t) {
    const p = (t - SLASH[0]) / (SLASH[1] - SLASH[0]);
    slash.visible = p > 0 && p < 1;
    if (!slash.visible) return;
    slash.material.opacity = Math.sin(Math.PI * p) * 0.85;
    slash.scale.setScalar(0.85 + 0.35 * p);
    slash.rotation.z = 0.7 - 1.1 * p; // varre de cima para baixo
  }

  return {
    shadowSize: 0.18,
    get busy() {
      return busy;
    },
    attach(root, gltf) {
      const model = fitModel(gltf, height);
      root.add(model, slash);
      clips = createClips(model, gltf.animations);
      sword = model.getObjectByName("Espada");
      if (sword) {
        swordScaleY = sword.scale.y;
        setSword(0);
      }
      const shows = ["taichi", "ataque"].map((n) => clips.acts[n]).filter(Boolean);
      for (const a of shows) {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      }
      clips.mixer.addEventListener("finished", (e) => {
        if (!shows.includes(e.action)) return;
        busy = false;
        setSword(0);
        clips.play("parado", 0.4);
      });
    },
    perform(name) {
      if (!clips?.acts[name]) return false;
      busy = true;
      clips.play(name, 0.35);
      return true;
    },
    update(dt, { speed }) {
      if (!clips) return;
      clips.mixer.update(dt);
      if (!busy) {
        if (speed > 0) {
          clips.play("andando", 0.2);
          if (clips.acts.andando) clips.acts.andando.timeScale = THREE.MathUtils.clamp(speed / TROT_SPEED, 0.6, 1.5);
        } else clips.play("parado", 0.3);
      }
      const atk = clips.acts.ataque;
      if (sword && atk && clips.current === atk) {
        const t = atk.time;
        setSword(smooth(DRAW[0], DRAW[1], t) * (1 - smooth(SHEATHE[0], SHEATHE[1], t)));
        updateSlash(t);
      } else {
        if (sword?.visible) setSword(0);
        slash.visible = false;
      }
    },
    freeze() {
      if (clips?.acts.parado) clips.acts.parado.paused = true;
      clips?.mixer.update(0);
    },
    dispose() {
      clips?.mixer.stopAllAction();
    },
  };
}

// ---- Coelho -----------------------------------------------------------------

const HOP_HEIGHT = 0.13;
const HOPS_PER_SECOND = 3.4; // na velocidade do dono
const OWNER_SPEED = 1.8;
const SHOWS = {
  // Quatro pulinhos no lugar, bem altos.
  pulinhos: { dur: 2.0 },
  // Agacha, salta girando para trás e aterrissa achatado.
  mortal: { dur: 1.15 },
};

export function bunnyPet({ height = 0.5 }) {
  // root → hop (altura do pulo e achatamento, a partir dos pés)
  //      → pivot (giro, no meio do corpo) → modelo
  const hop = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.position.y = height / 2;
  hop.add(pivot);
  let ready = false;
  let show = null;
  let phase = 0;
  let amp = 0; // 0 parado … 1 pulando
  let time = Math.random() * 10;

  // Sobe/desce, achata no chão e estica no ar. q = fase do pulo (0…1).
  function hopPose(q, h) {
    const air = Math.sin(Math.PI * q);
    return { y: h * air, sy: 0.86 + 0.24 * air };
  }

  function showPose(s) {
    const p = Math.min(s.t / SHOWS[s.name].dur, 1);
    if (s.name === "pulinhos") {
      const q = (p * 4) % 1;
      return { ...hopPose(q, 0.22), rot: 0 };
    }
    // mortal: agachar (0–0,18), voar girando (0,18–0,85), aterrissar (0,85–1)
    if (p < 0.18) return { y: 0, sy: 1 - 0.25 * easeInOut(p / 0.18), rot: 0 };
    if (p < 0.85) {
      const q = (p - 0.18) / 0.67;
      return { y: 0.5 * Math.sin(Math.PI * q), sy: 1.12, rot: -Math.PI * 2 * easeInOut(q) };
    }
    const q = (p - 0.85) / 0.15;
    return { y: 0, sy: 0.78 + 0.22 * easeInOut(q), rot: 0 };
  }

  return {
    shadowSize: 0.17,
    get busy() {
      return !!show;
    },
    attach(root, gltf) {
      const model = fitModel(gltf, height);
      model.position.y -= height / 2;
      pivot.add(model);
      root.add(hop);
      ready = true;
    },
    perform(name) {
      if (!ready || !SHOWS[name]) return false;
      show = { name, t: 0 };
      return true;
    },
    update(dt, { speed }) {
      if (!ready) return;
      time += dt;
      let pose;
      if (show) {
        show.t += dt;
        pose = showPose(show);
        if (show.t >= SHOWS[show.name].dur) show = null;
        amp = 0;
      } else {
        // Pulinhos enquanto anda; ao parar, termina o pulo e assenta.
        amp += ((speed > 0 ? 1 : 0) - amp) * (1 - Math.exp(-dt * 8));
        phase += dt * HOPS_PER_SECOND * Math.max(speed / OWNER_SPEED, amp > 0.05 ? 0.6 : 0);
        const h = hopPose(phase % 1, HOP_HEIGHT);
        const breath = 1 + 0.025 * Math.sin(time * 2.4);
        pose = { y: h.y * amp, sy: THREE.MathUtils.lerp(breath, h.sy, amp), rot: 0.15 * amp };
      }
      hop.position.y = pose.y;
      hop.scale.set(1 / Math.sqrt(pose.sy), pose.sy, 1 / Math.sqrt(pose.sy));
      pivot.rotation.x = pose.rot;
    },
    freeze() {
      show = null;
      hop.position.y = 0;
      hop.scale.setScalar(1);
      pivot.rotation.x = 0;
    },
  };
}

// ---- Waffle -----------------------------------------------------------------

const WADDLE_STEPS_PER_SECOND = 3.6; // na velocidade do dono
const WAFFLE_SHOWS = {
  // Twist: rebola girando o corpo, quica no ritmo e fecha com um giro.
  danca: { dur: 3.2 },
  // Pulo com rodopio completo.
  giro: { dur: 1.0 },
};

export function wafflePet({ height = 0.46 }) {
  // root → body (tudo a partir dos pés: altura, achatamento, ginga e giro) → modelo
  const body = new THREE.Group();
  let ready = false;
  let show = null;
  let phase = 0;
  let amp = 0; // 0 parado … 1 andando
  let time = Math.random() * 10;

  function showPose(s) {
    const p = Math.min(s.t / WAFFLE_SHOWS[s.name].dur, 1);
    if (s.name === "giro") {
      const air = Math.sin(Math.PI * p);
      return { y: 0.32 * air, sy: 1 - 0.18 * Math.cos(Math.PI * 2 * p) * (1 - air), rock: 0, twist: Math.PI * 2 * easeInOut(p) };
    }
    // danca: 2,6 s de twist + 0,6 s de giro final
    const tw = Math.min(s.t / 2.6, 1);
    if (tw < 1) {
      const beat = s.t * 2.5; // batidas por segundo
      const fade = Math.sin(Math.PI * Math.min(tw * 4, 1) / 2); // entra suave
      return {
        y: 0.05 * Math.abs(Math.sin(Math.PI * beat)) * fade,
        sy: 1 - 0.1 * Math.abs(Math.cos(Math.PI * beat)) * fade,
        rock: 0.22 * Math.sin(Math.PI * beat) * fade,
        twist: 0.7 * Math.sin(Math.PI * beat) * fade,
      };
    }
    const q = (s.t - 2.6) / 0.6;
    return { y: 0.12 * Math.sin(Math.PI * q), sy: 1, rock: 0, twist: Math.PI * 2 * easeInOut(Math.min(q, 1)) };
  }

  return {
    shadowSize: 0.2,
    get busy() {
      return !!show;
    },
    attach(root, gltf) {
      body.add(fitModel(gltf, height));
      root.add(body);
      ready = true;
    },
    perform(name) {
      if (!ready || !WAFFLE_SHOWS[name]) return false;
      show = { name, t: 0 };
      return true;
    },
    update(dt, { speed }) {
      if (!ready) return;
      time += dt;
      let pose;
      if (show) {
        show.t += dt;
        pose = showPose(show);
        if (show.t >= WAFFLE_SHOWS[show.name].dur) show = null;
        amp = 0;
      } else {
        // Ginga de pé em pé; ao parar, assenta e respira.
        amp += ((speed > 0 ? 1 : 0) - amp) * (1 - Math.exp(-dt * 8));
        phase += dt * WADDLE_STEPS_PER_SECOND * Math.max(speed / OWNER_SPEED, amp > 0.05 ? 0.6 : 0);
        const step = Math.sin(Math.PI * phase);
        const breath = 1 + 0.02 * Math.sin(time * 2.2);
        pose = {
          y: 0.035 * Math.abs(step) * amp,
          sy: THREE.MathUtils.lerp(breath, 1 - 0.05 * (1 - Math.abs(step)), amp),
          rock: 0.16 * step * amp,
          twist: 0,
        };
      }
      body.position.y = pose.y;
      body.scale.set(1 / Math.sqrt(pose.sy), pose.sy, 1 / Math.sqrt(pose.sy));
      body.rotation.set(0, pose.twist, pose.rock);
    },
    freeze() {
      show = null;
      body.position.y = 0;
      body.scale.setScalar(1);
      body.rotation.set(0, 0, 0);
    },
  };
}
