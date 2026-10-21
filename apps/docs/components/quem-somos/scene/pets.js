// Comportamentos dos mascotes (ver scene/companion.js para o contrato).
//
// Cada mascote tem um jeito próprio de se mexer, diferente do dono:
// - samurai (Leo): clipes do Hunyuan — trote, guarda, tai chi e ataque, em
//   que ele saca a lâmina (nó `Espada`) e solta um arco de corte;
// - coelho (Thiago): sem esqueleto (o Hunyuan não aceita rig nele), tudo
//   procedural — anda aos pulinhos com achatamento ao tocar o chão, respira
//   parado, dá pulinhos e mortal para trás;
// - waffle (Rafa): também procedural — anda gingando de pé em pé, respira
//   parado, dança twist e dá um pulo com rodopio;
// - rena (Mariana): procedural — trotinho saltitado, pulinhos de alegria de
//   um lado para o outro e o jeito tímido de virar de costas e se encolher;
// - livro (Zé Carlos): procedural — anda gingando devagar, concorda com a
//   cabeça como quem sabe das coisas e dá uma cambalhota para a frente;
// - microfone (Emily): procedural — balança no ritmo cantando, esticando nas
//   notas altas, e dá um giro de estrela do rock.

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

// ---- Rena -------------------------------------------------------------------

const TROT_STEPS_PER_SECOND = 4.4; // passinhos curtos e rápidos
const RENA_SHOWS = {
  // Alegria: pulinhos de um lado para o outro, inclinando a cada pulo.
  alegria: { dur: 2.4 },
  // Tímida: vira de costas, se encolhe balançando e volta de frente.
  timida: { dur: 2.6 },
};

export function renaPet({ height = 0.5 }) {
  // root → body (tudo a partir dos pés: altura, deslocamento, inclinação, giro) → modelo
  const body = new THREE.Group();
  let ready = false;
  let show = null;
  let phase = 0;
  let amp = 0; // 0 parado … 1 andando
  let time = Math.random() * 10;

  function showPose(s) {
    const p = Math.min(s.t / RENA_SHOWS[s.name].dur, 1);
    if (s.name === "alegria") {
      // Seis pulinhos alternando o lado; entra e sai suave.
      const q = (p * 6) % 1;
      const side = Math.floor(p * 6) % 2 ? -1 : 1;
      const fade = Math.min(p * 8, 1, (1 - p) * 8);
      const air = Math.sin(Math.PI * q);
      return {
        y: 0.16 * air * fade,
        x: 0.07 * side * Math.sin(Math.PI * q) * fade,
        sy: 1 - 0.14 * (1 - air) * fade,
        tilt: 0.28 * side * air * fade,
        yaw: 0,
      };
    }
    // timida: vira (0–0,2), encolhe balançando (0,2–0,8), volta (0,8–1)
    const turn = p < 0.2 ? easeInOut(p / 0.2) : p > 0.8 ? 1 - easeInOut((p - 0.8) / 0.2) : 1;
    const shy = smooth(0.15, 0.3, p) * (1 - smooth(0.75, 0.85, p));
    return {
      y: 0,
      x: 0,
      sy: 1 - 0.1 * shy,
      tilt: 0.12 * Math.sin(s.t * 9) * shy,
      yaw: Math.PI * turn,
    };
  }

  return {
    shadowSize: 0.18,
    get busy() {
      return !!show;
    },
    attach(root, gltf) {
      body.add(fitModel(gltf, height));
      root.add(body);
      ready = true;
    },
    perform(name) {
      if (!ready || !RENA_SHOWS[name]) return false;
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
        if (show.t >= RENA_SHOWS[show.name].dur) show = null;
        amp = 0;
      } else {
        // Trotinho saltitado; parada, respira e mexe a cabeça de leve.
        amp += ((speed > 0 ? 1 : 0) - amp) * (1 - Math.exp(-dt * 8));
        phase += dt * TROT_STEPS_PER_SECOND * Math.max(speed / OWNER_SPEED, amp > 0.05 ? 0.6 : 0);
        const step = Math.sin(Math.PI * phase);
        const breath = 1 + 0.022 * Math.sin(time * 2.6);
        pose = {
          y: 0.05 * Math.abs(step) * amp,
          x: 0,
          sy: THREE.MathUtils.lerp(breath, 1 + 0.04 * Math.abs(step), amp),
          tilt: 0.09 * step * amp + 0.04 * Math.sin(time * 0.9) * (1 - amp),
          yaw: 0,
        };
      }
      body.position.set(pose.x, pose.y, 0);
      body.scale.set(1 / Math.sqrt(pose.sy), pose.sy, 1 / Math.sqrt(pose.sy));
      body.rotation.set(0, pose.yaw, pose.tilt);
    },
    freeze() {
      show = null;
      body.position.set(0, 0, 0);
      body.scale.setScalar(1);
      body.rotation.set(0, 0, 0);
    },
  };
}

// ---- Livro e microfone --------------------------------------------------------

// Mascote de corpo único sem esqueleto: root → body (altura, achatamento e
// giro a partir dos pés) → pivot (no meio do corpo, para tombar e dar
// cambalhota sem sair do lugar) → modelo. `walk(phase, amp, time)` e
// `shows[nome](t, p)` devolvem a pose { y, sy, rock, pitch, twist }.
function toyPet({ height, shadowSize, stepsPerSecond, walk, shows }) {
  const body = new THREE.Group();
  const pivot = new THREE.Group();
  pivot.position.y = height / 2;
  body.add(pivot);
  let ready = false;
  let show = null;
  let phase = 0;
  let amp = 0; // 0 parado … 1 andando
  let time = Math.random() * 10;

  function apply(pose) {
    body.position.y = pose.y ?? 0;
    const sy = pose.sy ?? 1;
    body.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
    body.rotation.set(0, pose.twist ?? 0, 0);
    pivot.rotation.set(pose.pitch ?? 0, 0, pose.rock ?? 0);
  }

  return {
    shadowSize,
    get busy() {
      return !!show;
    },
    attach(root, gltf) {
      const model = fitModel(gltf, height);
      model.position.y -= height / 2;
      pivot.add(model);
      root.add(body);
      ready = true;
    },
    perform(name) {
      if (!ready || !shows[name]) return false;
      show = { name, t: 0 };
      return true;
    },
    update(dt, { speed }) {
      if (!ready) return;
      time += dt;
      if (show) {
        show.t += dt;
        const { dur, pose } = shows[show.name];
        apply(pose(show.t, Math.min(show.t / dur, 1)));
        if (show.t >= dur) show = null;
        amp = 0;
        return;
      }
      amp += ((speed > 0 ? 1 : 0) - amp) * (1 - Math.exp(-dt * 8));
      phase += dt * stepsPerSecond * Math.max(speed / OWNER_SPEED, amp > 0.05 ? 0.6 : 0);
      apply(walk(phase, amp, time));
    },
    freeze() {
      show = null;
      apply({});
    },
  };
}

export function livroPet({ height = 0.5 }) {
  return toyPet({
    height,
    shadowSize: 0.2,
    stepsPerSecond: 3.2,
    // Ginga de pé em pé, meio pesado (livro de capa dura); parado, respira.
    walk: (phase, amp, time) => {
      const step = Math.sin(Math.PI * phase);
      return {
        y: 0.03 * Math.abs(step) * amp,
        sy: THREE.MathUtils.lerp(1 + 0.018 * Math.sin(time * 1.8), 1 - 0.04 * (1 - Math.abs(step)), amp),
        rock: 0.14 * step * amp,
        pitch: 0.06 * amp,
      };
    },
    shows: {
      // Sábio: concorda com a cabeça três vezes, balançando de leve.
      sabio: {
        dur: 2.4,
        pose: (t, p) => {
          const fade = Math.min(p * 6, 1, (1 - p) * 6);
          return {
            pitch: 0.22 * Math.max(0, Math.sin(t * Math.PI * 2.5)) * fade,
            rock: 0.06 * Math.sin(t * Math.PI * 1.25) * fade,
            sy: 1 - 0.04 * Math.abs(Math.sin(t * Math.PI * 2.5)) * fade,
          };
        },
      },
      // Cambalhota para a frente: agacha, pula girando e aterrissa achatado.
      cambalhota: {
        dur: 1.2,
        pose: (t, p) => {
          const air = smooth(0.15, 0.3, p) * (1 - smooth(0.75, 0.88, p));
          const flip = easeInOut(Math.min(Math.max((p - 0.18) / 0.62, 0), 1));
          const squash = 0.16 * (Math.exp(-((p - 0.1) ** 2) / 0.004) + Math.exp(-((p - 0.9) ** 2) / 0.004));
          return { y: 0.3 * Math.sin(Math.PI * Math.min(Math.max((p - 0.15) / 0.73, 0), 1)) * air, sy: 1 - squash, pitch: Math.PI * 2 * flip };
        },
      },
    },
  });
}

// 0,56: o lacinho soma altura e o corpo é estreito; o fitModel escala pela
// altura total, então sobe um pouco para o corpo ficar do tamanho dos outros.
export function microfonePet({ height = 0.56 }) {
  return toyPet({
    height,
    shadowSize: 0.18,
    stepsPerSecond: 4,
    // Passinhos saltitados de quem está sempre no ritmo.
    walk: (phase, amp, time) => {
      const step = Math.sin(Math.PI * phase);
      return {
        y: 0.045 * Math.abs(step) * amp,
        sy: THREE.MathUtils.lerp(1 + 0.02 * Math.sin(time * 2.4), 1 + 0.035 * Math.abs(step), amp),
        rock: 0.1 * step * amp + 0.035 * Math.sin(time * 1.1) * (1 - amp),
      };
    },
    shows: {
      // Cantar: balança de um lado para o outro no compasso e estica nas
      // notas altas (duas vezes no refrão).
      cantar: {
        dur: 3.2,
        pose: (t, p) => {
          const fade = Math.min(p * 6, 1, (1 - p) * 6);
          const beat = t * 2.2;
          const belt = Math.exp(-((p - 0.45) ** 2) / 0.006) + Math.exp(-((p - 0.8) ** 2) / 0.006);
          return {
            y: 0.03 * Math.abs(Math.sin(Math.PI * beat)) * fade,
            sy: 1 + 0.12 * belt - 0.05 * Math.abs(Math.cos(Math.PI * beat)) * fade,
            rock: 0.2 * Math.sin(Math.PI * beat) * fade * (1 - belt),
            pitch: -0.15 * belt,
          };
        },
      },
      // Giro de estrela do rock: pula rodopiando duas vezes e cai inclinado.
      giro: {
        dur: 1.1,
        pose: (t, p) => {
          const air = Math.sin(Math.PI * p);
          return { y: 0.28 * air, sy: 1 - 0.15 * Math.cos(Math.PI * 2 * p) * (1 - air), twist: Math.PI * 4 * easeInOut(p), rock: 0.2 * smooth(0.85, 1, p) * (1 - smooth(0.97, 1, p)) };
        },
      },
    },
  });
}
