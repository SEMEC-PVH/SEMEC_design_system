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
//   { emblem: who, color?, insignia? }       insígnia da Stack sobe girando como
//                                            moeda, para de frente e entra no
//                                            personagem (insignia = id em
//                                            insignias.js; color = token pv do
//                                            brilho, ex. "blue-500")
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
const EMBLEM_DUR = 3;
const SPARKS = 10;

// urlInsignia(id) → URL da imagem da insígnia (insignias.js) ou null.
export function createCutscene({ scene, track, pal, tileToWorld, DIRS, reducedMotion, actors, onSay, mundo = () => 0, urlInsignia = () => null }) {
  let steps = [];
  let index = -1;
  let current = null; // { step, t, ... } do passo em andamento
  let waitingSay = false;
  let resolveDone = null;
  const camGoal = new THREE.Vector3();
  let camActive = false;
  let camZoom = 1;

  // Insígnia da Stack: uma medalha redonda e OPACA (aro dourado, miolo
  // azul-marinho e a imagem da insígnia pintados numa única textura de canvas)
  // que gira como moeda, com faíscas e anel no chão da cor da Stack; sem
  // imagem, uma gema. Nada de plano quadrado translúcido: a medalha é um
  // CircleGeometry com alphaTest (borda nítida), e o brilho é um anel fino.
  // Reaproveitada a cada cena.
  const MEDAL_R = 0.42;
  const MEDAL_PX = 256;
  const emblem = new THREE.Group();
  // Inclinada para trás: de frente para a câmera alta quando para de girar.
  const coinPivot = new THREE.Group();
  coinPivot.rotation.x = -0.55;
  // Strings de cor para o canvas 2D, geradas dos tokens pv (pal.pv devolve um
  // THREE.Color lido de --pv-*; getHexString() o converte de volta para sRGB).
  // Não são cores literais: mudam junto com os tokens.
  const css = (c) => "#" + c.getHexString();
  const corMiolo = pal.pv("blue-900");
  const cores = {
    miolo: css(corMiolo),
    mioloClaro: css(pal.mix(corMiolo, pal.pv("blue-700"), 0.6)),
    ouro: css(pal.pv("yellow-500")),
    ouroEscuro: css(pal.pv("yellow-600")),
    ouroClaro: css(pal.mix(pal.pv("yellow-500"), pal.white, 0.55)),
    ouroSombra: css(pal.mix(pal.pv("yellow-600"), pal.pv("yellow-800"), 0.6)),
  };
  // Pinta a medalha (aro com bisel + miolo) num canvas e devolve o contexto;
  // fora do círculo o canvas fica com alfa 0 (cortado pelo alphaTest).
  function pintarMedalha() {
    const cv = document.createElement("canvas");
    cv.width = cv.height = MEDAL_PX;
    const ctx = cv.getContext("2d");
    const c = MEDAL_PX / 2;
    const disco = (r, fill) => {
      ctx.beginPath();
      ctx.arc(c, c, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    };
    // Aro: luz no alto à esquerda, sombra embaixo à direita (bisel).
    const aro = ctx.createLinearGradient(0, 0, MEDAL_PX, MEDAL_PX);
    aro.addColorStop(0, cores.ouroClaro);
    aro.addColorStop(0.45, cores.ouro);
    aro.addColorStop(1, cores.ouroSombra);
    disco(c, aro);
    // Bisel interno invertido: o degrau entre aro e miolo.
    const degrau = ctx.createLinearGradient(0, 0, MEDAL_PX, MEDAL_PX);
    degrau.addColorStop(0, cores.ouroSombra);
    degrau.addColorStop(0.55, cores.ouroEscuro);
    degrau.addColorStop(1, cores.ouroClaro);
    disco(c * 0.9, degrau);
    // Miolo azul-marinho com leve luz no centro.
    const miolo = ctx.createRadialGradient(c * 0.85, c * 0.75, 0, c, c, c * 0.85);
    miolo.addColorStop(0, cores.mioloClaro);
    miolo.addColorStop(1, cores.miolo);
    disco(c * 0.85, miolo);
    return { cv, ctx, c };
  }
  function texturaDe(cv) {
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return track(tex);
  }
  // Verso: a mesma medalha, lisa, com um friso dourado no miolo.
  const versoTex = (() => {
    const { cv, ctx, c } = pintarMedalha();
    ctx.beginPath();
    ctx.arc(c, c, c * 0.6, 0, Math.PI * 2);
    ctx.lineWidth = c * 0.05;
    ctx.strokeStyle = cores.ouro;
    ctx.stroke();
    return texturaDe(cv);
  })();
  const medalGeo = track(new THREE.CircleGeometry(MEDAL_R, 64));
  // Opaca: transparent false; alphaTest 0.5 só recorta a borda do círculo.
  const frenteMat = track(new THREE.MeshBasicMaterial({ transparent: false, alphaTest: 0.5 }));
  const frente = new THREE.Mesh(medalGeo, frenteMat);
  frente.position.z = 0.021;
  const versoMat = track(new THREE.MeshBasicMaterial({ map: versoTex, transparent: false, alphaTest: 0.5 }));
  const verso = new THREE.Mesh(medalGeo, versoMat);
  verso.rotation.y = Math.PI;
  verso.position.z = -0.021;
  // Borda da moeda (vista quando ela passa de perfil girando).
  const rimMat = track(
    new THREE.MeshStandardMaterial({ color: pal.pv("yellow-500"), emissive: pal.pv("yellow-600"), emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.6 })
  );
  const rim = new THREE.Mesh(track(new THREE.CylinderGeometry(MEDAL_R, MEDAL_R, 0.042, 64, 1, true)), rimMat);
  rim.rotation.x = Math.PI / 2;
  const gemMat = track(new THREE.MeshStandardMaterial({ color: pal.white, emissive: pal.white, emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.25 }));
  const gem = new THREE.Mesh(track(new THREE.OctahedronGeometry(0.16)), gemMat);
  gem.scale.y = 1.35;
  // Brilho: um anel fino da cor da Stack que se abre quando a medalha para de
  // frente (RingGeometry, nunca um quad).
  const brilhoMat = track(new THREE.MeshBasicMaterial({ color: pal.white, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  const brilho = new THREE.Mesh(track(new THREE.RingGeometry(MEDAL_R + 0.02, MEDAL_R + 0.07, 64)), brilhoMat);
  const moeda = new THREE.Group();
  moeda.add(frente, verso, rim);
  coinPivot.add(moeda, brilho, gem);
  const ringMat = track(new THREE.MeshBasicMaterial({ color: pal.white, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  const ring = new THREE.Mesh(track(new THREE.RingGeometry(0.3, 0.36, 40)), ringMat);
  ring.rotation.x = -Math.PI / 2;
  const sparkMat = track(new THREE.MeshBasicMaterial({ color: pal.white, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending }));
  const sparkGeo = track(new THREE.OctahedronGeometry(0.035, 0));
  const sparks = Array.from({ length: SPARKS }, (_, i) => {
    const sp = new THREE.Mesh(sparkGeo, sparkMat);
    sp.userData.ang = (i / SPARKS) * Math.PI * 2;
    sp.userData.alt = (i % 3) * 0.12;
    emblem.add(sp);
    return sp;
  });
  emblem.add(coinPivot, ring);
  emblem.traverse((o) => (o.userData.noShadow = true));
  emblem.visible = false;
  scene.add(emblem);

  // Medalhas compostas (frente com a insígnia), uma por id, criadas quando
  // uma cena que usa a insígnia começa.
  const insignias = new Map(); // id → THREE.Texture | null (carregando ou falhou)
  function carregarInsignia(id) {
    const url = urlInsignia(id);
    if (!url || insignias.has(id)) return;
    insignias.set(id, null);
    const img = new Image();
    img.onload = () => {
      const { cv, ctx, c } = pintarMedalha();
      // Insígnia centrada (~78% do diâmetro), recortada ao miolo+aro para
      // nada vazar para fora do círculo.
      const lado = MEDAL_PX * 0.78;
      ctx.save();
      ctx.beginPath();
      ctx.arc(c, c, c * 0.9, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, c - lado / 2, c - lado / 2, lado, lado);
      ctx.restore();
      insignias.set(id, texturaDe(cv));
    };
    img.src = url;
  }

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
      brilhoMat.color.copy(color).lerp(pal.white, 0.25);
      sparkMat.color.copy(color).lerp(pal.white, 0.45);
      // Medalha com miolo azul-marinho (combina com todas as insígnias); a cor
      // da Stack fica no brilho, nas faíscas e no anel do chão.
      const tex = step.insignia ? insignias.get(step.insignia) : null;
      frenteMat.map = tex ?? null;
      frenteMat.needsUpdate = true;
      moeda.visible = Boolean(tex);
      brilho.visible = Boolean(tex);
      gem.visible = !tex;
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
      // Sobe com um leve passo além e assenta (0–35%), gira como moeda
      // desacelerando até ficar de frente (até 55%), brilha parada e, no fim
      // (80–100%), desce encolhendo para dentro do personagem.
      const u = Math.min(k / 0.35, 1);
      const rise = 1 + 2.2 * (u - 1) ** 3 + 1.2 * (u - 1) ** 2; // easeOutBack
      const fade = Math.max(0, (k - 0.8) / 0.2);
      emblem.position.copy(c.base);
      emblem.position.y = 0.55 + rise * 1.25 - fade * 0.9;
      const giro = Math.max(0, 1 - k / 0.55);
      // A moeda inteira (medalha + insígnia) gira junto.
      const ang = reducedMotion ? 0 : giro ** 2 * Math.PI * 6;
      moeda.rotation.y = gem.rotation.y = ang;
      const pulso = reducedMotion ? 1 : 1 + Math.sin(c.t * 9) * 0.04 * (1 - giro);
      coinPivot.scale.setScalar((0.4 + 0.6 * u) * pulso * (1 - fade));
      // Brilho: quando a medalha assenta de frente (55–80%), um anel fino se
      // abre em volta dela e some.
      const b = Math.min(1, Math.max(0, (k - 0.55) / 0.25));
      brilho.scale.setScalar(1 + (reducedMotion ? 0 : b * 0.45));
      brilhoMat.opacity = b > 0 && b < 1 ? 0.9 * Math.sin(b * Math.PI) : 0;
      // Anel no chão abre em onda; faíscas giram em volta e se espalham.
      ring.position.y = -emblem.position.y + 0.02;
      ring.scale.setScalar(1 + (reducedMotion ? 0 : k * 3));
      ringMat.opacity = 0.8 * (1 - k);
      for (const sp of sparks) {
        sp.visible = !reducedMotion && k > 0.1 && k < 0.85;
        if (!sp.visible) continue;
        const a = sp.userData.ang + c.t * 2.2;
        const r = 0.35 + k * 0.55;
        sp.position.set(Math.cos(a) * r, sp.userData.alt + Math.sin(c.t * 4 + sp.userData.ang) * 0.08, Math.sin(a) * r);
        sp.scale.setScalar(1 - Math.max(0, (k - 0.6) / 0.25));
      }
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
      for (const st of list) if (st.insignia) carregarInsignia(st.insignia);
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
