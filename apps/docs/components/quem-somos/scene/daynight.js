// Ciclo dia/noite da Vila SEMEC.
//
// Um dia inteiro passa em CYCLE_SECONDS (acelerado). O relógio começa no fim
// da tarde para quem entra ver o pôr do sol logo no primeiro minuto. Com
// prefers-reduced-motion o tempo fica parado de manhã.
//
// Cada hora-chave define a luz (cores derivadas dos tokens --pv-*, nada de hex);
// entre elas tudo é interpolado. `night` (0..1) liga postes, janelas e
// vaga-lumes.
//
// Uso:
//   const dayNight = createDayNight({ pal, reducedMotion });
//   dayNight.update(dt);            // no tick
//   dayNight.state                  // { hours, night, sunDir, sunColor, ... }
import * as THREE from "three";

export const CYCLE_SECONDS = 300;
const START_HOUR = 15.5;
const FROZEN_HOUR = 10;

// O astro (sol de dia, lua de noite) cruza o céu pelo sul, de leste a oeste,
// e as sombras caem sempre para o norte, sem cobrir as fachadas. A troca
// sol → lua acontece com a luz quase apagada (SWAP_*), sem salto visível.
const SUN_RISE = 5.5;
const SUN_SET = 19.5;

function keyframes(pal) {
  const { pv, mix } = pal;
  const white = pv("white");
  const day = {
    sun: mix(white, pv("yellow-400"), 0.24),
    sunI: 2.4,
    sky: mix(pv("blue-200"), white, 0.2),
    ground: mix(pv("green-600"), pv("yellow-800"), 0.35),
    hemiI: 1.15,
    fog: mix(mix(pv("blue-100"), white, 0.5), pv("green-500"), 0.06),
    exposure: 0.92,
  };
  const night = {
    sun: mix(pv("blue-300"), white, 0.35),
    sunI: 0.6,
    sky: mix(pv("blue-700"), pv("blue-900"), 0.4),
    ground: mix(pv("gray-900"), pv("blue-900"), 0.5),
    hemiI: 0.85,
    fog: mix(pv("blue-950"), pv("blue-900"), 0.35),
    exposure: 1.05,
  };
  const at = (h, k) => ({ h, ...k });
  return [
    at(0, night),
    at(4.6, night),
    at(SUN_RISE, { ...night, sunI: 0.05, hemiI: 0.8 }),
    at(6.3, {
      sun: mix(pv("red-400"), pv("yellow-400"), 0.55),
      sunI: 1.1,
      sky: mix(pv("red-200"), pv("blue-200"), 0.55),
      ground: mix(pv("green-700"), pv("red-300"), 0.25),
      hemiI: 0.9,
      fog: mix(mix(pv("red-200"), pv("blue-200"), 0.5), white, 0.3),
      exposure: 0.98,
    }),
    at(8, day),
    at(16.3, day),
    at(17.8, {
      sun: mix(pv("yellow-500"), pv("red-400"), 0.35),
      sunI: 1.9,
      sky: mix(pv("yellow-400"), pv("blue-200"), 0.45),
      ground: mix(pv("green-600"), pv("yellow-600"), 0.45),
      hemiI: 1.0,
      fog: mix(mix(pv("yellow-400"), pv("red-200"), 0.4), white, 0.35),
      exposure: 0.95,
    }),
    at(18.8, {
      sun: mix(pv("yellow-500"), pv("red-400"), 0.5),
      sunI: 0.7,
      sky: mix(pv("blue-700"), pv("red-300"), 0.16),
      ground: mix(pv("gray-800"), pv("blue-800"), 0.45),
      hemiI: 0.85,
      fog: mix(pv("blue-800"), pv("red-300"), 0.14),
      exposure: 1.0,
    }),
    at(SUN_SET, { ...night, sunI: 0.05, hemiI: 0.85 }),
    at(20.6, night),
    at(24, night),
  ];
}

// Fator de noite: 0 de dia, 1 de noite (postes acesos).
function nightFactor(h) {
  if (h >= 20 || h < 4.8) return 1;
  if (h >= 18.4) return (h - 18.4) / 1.6;
  if (h < 6.6) return 1 - (h - 4.8) / 1.8;
  return 0;
}

export function createDayNight({ pal, reducedMotion }) {
  const keys = keyframes(pal);
  let hours = reducedMotion ? FROZEN_HOUR : START_HOUR;

  const state = {
    hours,
    night: 0,
    sunDir: new THREE.Vector3(),
    sunColor: new THREE.Color(),
    sunIntensity: 1,
    hemiSky: new THREE.Color(),
    hemiGround: new THREE.Color(),
    hemiIntensity: 1,
    fog: new THREE.Color(),
    exposure: 1,
  };

  function sample(h) {
    let i = 0;
    while (i < keys.length - 2 && keys[i + 1].h <= h) i++;
    const a = keys[i];
    const b = keys[i + 1];
    const t = THREE.MathUtils.smoothstep(h, a.h, b.h);
    state.sunColor.copy(a.sun).lerp(b.sun, t);
    state.sunIntensity = a.sunI + (b.sunI - a.sunI) * t;
    state.hemiSky.copy(a.sky).lerp(b.sky, t);
    state.hemiGround.copy(a.ground).lerp(b.ground, t);
    state.hemiIntensity = a.hemiI + (b.hemiI - a.hemiI) * t;
    state.fog.copy(a.fog).lerp(b.fog, t);
    state.exposure = a.exposure + (b.exposure - a.exposure) * t;

    // Arco do astro: 0 no nascente (leste), 1 no poente (oeste).
    const isSun = h >= SUN_RISE && h < SUN_SET;
    const span = isSun ? SUN_SET - SUN_RISE : 24 - (SUN_SET - SUN_RISE);
    const from = isSun ? SUN_RISE : SUN_SET;
    const phase = (((h - from) % 24) + 24) % 24 / span;
    const arc = Math.sin(phase * Math.PI);
    const peak = isSun ? 13.5 : 10;
    state.sunDir.set(Math.cos(phase * Math.PI) * 11, 3 + arc * peak, 7).normalize();
    state.night = nightFactor(h);
    state.hours = h;
  }

  function update(dt) {
    if (!reducedMotion) hours = (hours + (dt * 24) / CYCLE_SECONDS) % 24;
    sample(hours);
  }

  // Pula para uma hora (0..24), ex.: testes e prints.
  function setHours(h) {
    hours = ((h % 24) + 24) % 24;
    sample(hours);
  }

  sample(hours);
  return { state, update, setHours };
}

// "15:30" a partir de horas decimais (arredonda para 15 minutos).
export function formatClock(hours) {
  const quarter = Math.floor((hours * 60) / 15) * 15;
  const h = Math.floor(quarter / 60) % 24;
  const m = quarter % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
