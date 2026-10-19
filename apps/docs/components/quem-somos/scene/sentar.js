// Pose SENTADA para qualquer corpo da Vila (roda da fogueira, bancos...).
//
// Não cria clipes novos: por cima da animação que já roda (o `parado` segue
// dando respiração e cabeça), trava quadril e pernas numa pose sentada e,
// opcionalmente, apoia as mãos nas coxas. Transição suave ao sentar/levantar.
//
// API
//   createSentado(root, opts) -> { setSentado(on, { instantaneo }), update(dt),
//                                  sentado, peso, info, dispose() }
//   root: o contêiner do corpo com a origem NO CHÃO e a frente em +z:
//     - NPC 3D (scene/companion.js): owner.root
//     - Pedro (scene/pedro.js): o grupo raiz dele (origem no chão)
//     - jogador (vila-engine.js): player.body (o `wrap` do gava.glb)
//     - chibi (scene/chibi.js): o próprio grupo do makeChibi (fig)
//     O modelo já precisa estar dentro de `root` (crie depois do load).
//   opts:
//     tipo           "chibi" | "mixamo" | "gava" (omitido: detecta pelos ossos;
//                    sem esqueleto e com userData.body → chibi)
//     alturaAssento  altura do assento em unidades de mundo, medida a partir
//                    da origem de `root` (padrão 0.25)
//     bordaAssento   z (unidades de mundo, referencial de `root`) da borda da
//                    FRENTE do banco. Com ela, o quadril recua sozinho até a
//                    parte de trás do joelho ficar logo à frente da borda — a
//                    canela pende livre e todos os modelos alinham no mesmo
//                    banco. Recomendado (ex.: 0.05 com banco de 0.3 de fundo
//                    centrado em z = 0.05 - 0.15). Omitido: usa `recuo`.
//     recuo          (sem bordaAssento) desloca o quadril para trás (+) ou para
//                    a frente (-), em unidades de mundo (padrão 0)
//     bracos         true (padrão): mãos apoiadas nas coxas; false: braços
//                    seguem a animação (ex.: gava `digitando` no colo)
//     inclinacao     inclinação do tronco para a frente, rad (padrão 0.08)
//     seguir         objetos soltos (não ossos) que descem junto com o quadril,
//                    ex.: [model.getObjectByName("Laptop")] no gava
//     duracao        segundos da transição (padrão 0.4)
//
//   setSentado(true|false, { instantaneo }) — liga/desliga (transição suave;
//     instantaneo: true pula a transição, útil com movimento reduzido).
//   info — depois do 1º update sentado (ou logo, no chibi): medidas em
//     unidades de mundo no referencial de `root` (x lado, y cima, z frente):
//     { alturaQuadril, joelhoZ, tornozeloZ, peAltura } — joelhoZ ajuda a
//     posicionar a borda da frente do banco (deixe ~0.05 de folga atrás dele).
//
// ORDEM (importante, a cada quadro):
//   1. mixer.update(dt)            (ou companion.update(dt), que chama o mixer)
//   2. sentado.update(dt)          LOGO DEPOIS, antes do renderer.render
//   O sentado.update sobrescreve só os ossos que mexe; quando a pose está
//   totalmente desligada (peso 0) ele não toca em nada.
//   Chibi: não há mixer; chame sentado.update(dt) em qualquer ponto do quadro
//   (o motor só mexe em body.scale/head.rotation, que esta pose não usa).
//
// Como funciona
//   Esqueleto (Mixamo "Hips/LeftUpLeg..." ou GavaRig "root/thigh.L..."):
//   depois do mixer, o quadril (Hips/root) desce até a altura calibrada e as
//   pernas são resolvidas por IK de dois ossos no referencial de `root`:
//   coxa para a frente, canela descendo até o tornozelo voltar à altura em
//   que estava de pé (pé no chão) e o pé com a mesma orientação de quando
//   estava de pé (plano). A altura do quadril é calibrada uma vez pelos
//   vértices da malha (os de quadril/coxas) para a parte de baixo encostar no
//   assento — vale para qualquer escala/proporção (fitModel). Cada osso é
//   misturado com a animação pelo peso da transição.
//   Chibi: as pernas (fundidas por material no makeChibi) vão para um pivô no
//   quadril e giram para a frente; o `body` sobe/desce até o assento. As
//   pernas do chibi são curtas: num assento de 0.25 os pés ficam no ar.

import * as THREE from "three";

const PADRAO = { alturaAssento: 0.25, recuo: 0, bordaAssento: null, bracos: true, inclinacao: 0.08, duracao: 0.4 };

// Nomes de osso normalizados (o GLTFLoader tira o "." de "thigh.L").
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const RIGS = {
  mixamo: {
    pelvis: "hips",
    spine: "spine",
    legs: [
      ["leftupleg", "leftleg", "leftfoot"],
      ["rightupleg", "rightleg", "rightfoot"],
    ],
    arms: [
      ["leftarm", "leftforearm", "lefthand"],
      ["rightarm", "rightforearm", "righthand"],
    ],
  },
  gava: {
    pelvis: "root",
    spine: "spine",
    legs: [
      ["thighl", "shinl", "footl"],
      ["thighr", "shinr", "footr"],
    ],
    arms: [
      ["upperarml", "forearml", "handl"],
      ["upperarmr", "forearmr", "handr"],
    ],
  },
};

// Quanto a coxa pode descer em relação à horizontal (rad). Os modelos têm
// perna curta (cabeça grande): num assento de 0.25 os pés ficam ~5–13 cm no
// ar em vez de a coxa mergulhar no banco.
const QUEDA_MAX = 0.22;

const easing = (k) => k * k * (3 - 2 * k);

export function createSentado(root, opts = {}) {
  const o = { ...PADRAO, ...opts };
  let goal = 0;
  let k = 0; // progresso linear da transição (0 em pé … 1 sentado)
  const info = { alturaQuadril: 0, joelhoZ: 0, tornozeloZ: 0, peAltura: 0 };

  const bones = new Map();
  let skinned = null;
  root.traverse((n) => {
    if (n.isBone) bones.set(norm(n.name), n);
    if (n.isSkinnedMesh && !skinned) skinned = n;
  });
  let tipo = o.tipo;
  if (!tipo) tipo = bones.has("hips") ? "mixamo" : bones.has("thighl") ? "gava" : root.userData.body ? "chibi" : null;
  const pose = tipo === "chibi" ? poseChibi(root, o, info) : RIGS[tipo] && skinned ? poseEsqueleto(root, skinned, bones, RIGS[tipo], o, info) : null;

  function setSentado(on, { instantaneo = false } = {}) {
    goal = on ? 1 : 0;
    if (instantaneo) k = goal;
  }

  function update(dt) {
    if (!pose) return;
    const step = o.duracao > 0 ? dt / o.duracao : 1;
    k = goal > k ? Math.min(goal, k + step) : Math.max(goal, k - step);
    pose.apply(easing(k));
  }

  return {
    setSentado,
    update,
    get sentado() {
      return goal === 1;
    },
    get peso() {
      return easing(k);
    },
    info,
    tipo,
    dispose() {
      pose?.dispose?.();
    },
  };
}

// ---- Chibi -----------------------------------------------------------------
// Medidas do makeChibi (coordenadas do `body`, antes da escala do boneco).
const CHIBI_QUADRIL = 0.215; // centro da semiesfera de cima da perna
const CHIBI_RAIO_PERNA = 0.062;
const CHIBI_ANGULO = 1.35; // rad: pernas quase na horizontal (pés no ar)

function poseChibi(fig, o, info) {
  const body = fig.userData.body;
  if (!body) return null;
  // Pernas e sapatos são as peças fundidas que ficam inteiras abaixo do tronco.
  const pivot = new THREE.Group();
  pivot.position.set(0, CHIBI_QUADRIL, 0.02);
  const legs = body.children.filter((c) => {
    if (!c.isMesh) return false;
    if (!c.geometry.boundingBox) c.geometry.computeBoundingBox();
    return c.geometry.boundingBox.max.y < 0.3;
  });
  for (const m of legs) {
    pivot.add(m);
    m.position.y -= pivot.position.y;
    m.position.z -= pivot.position.z;
  }
  body.add(pivot);

  // Parte de baixo: a coxa girada (raio da perna abaixo do pivô).
  const contato = CHIBI_QUADRIL - CHIBI_RAIO_PERNA;
  const escala = () => fig.getWorldScale(new THREE.Vector3()).y || 1;
  const s0 = escala();
  // Com bordaAssento, a borda do banco fica no meio da perna (curta).
  const recuo = o.bordaAssento == null ? o.recuo : (pivot.position.z + 0.08) * s0 - o.bordaAssento;
  info.alturaQuadril = o.alturaAssento + CHIBI_RAIO_PERNA * s0;
  info.joelhoZ = (pivot.position.z + 0.2) * s0 - recuo;
  info.tornozeloZ = info.joelhoZ;
  info.peAltura = info.alturaQuadril;

  return {
    apply(w) {
      const s = escala();
      pivot.rotation.x = -CHIBI_ANGULO * w;
      body.position.y = (o.alturaAssento / s - contato) * w;
      body.position.z = (-recuo / s) * w;
      body.rotation.x = o.inclinacao * w;
    },
    dispose() {
      for (const m of [...pivot.children]) {
        m.position.y += pivot.position.y;
        m.position.z += pivot.position.z;
        body.add(m);
      }
      pivot.removeFromParent();
      body.position.set(0, 0, 0);
      body.rotation.x = 0;
    },
  };
}

// ---- Esqueleto ---------------------------------------------------------------
function poseEsqueleto(root, skinned, bones, rig, o, info) {
  const get = (n) => bones.get(n) ?? null;
  const pelvis = get(rig.pelvis);
  const spine = get(rig.spine);
  const legs = rig.legs.map((l) => l.map(get)).filter((l) => l.every(Boolean));
  const arms = rig.arms.map((l) => l.map(get)).filter((l) => l.every(Boolean));
  if (!pelvis || legs.length !== 2) return null;

  // Temporários.
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const v3 = new THREE.Vector3();
  const q1 = new THREE.Quaternion();
  const q2 = new THREE.Quaternion();
  const m1 = new THREE.Matrix4();

  // Referencial F = posição + rotação de `root` (sem escala): unidades de mundo.
  const F = { pos: new THREE.Vector3(), q: new THREE.Quaternion(), qi: new THREE.Quaternion(), s: new THREE.Vector3() };
  const toF = (world, out) => out.copy(world).sub(F.pos).applyQuaternion(F.qi);
  const fromF = (local, out) => out.copy(local).applyQuaternion(F.q).add(F.pos);
  const dirFromF = (local, out) => out.copy(local).applyQuaternion(F.q);
  const wpos = (b, out) => b.getWorldPosition(out);

  // Valores da animação. Se o mixer não animou o canal neste quadro (valor
  // ainda igual ao que escrevemos), vale o original guardado.
  const mem = new Map();
  function anim(obj, prop) {
    const key = obj.uuid + prop;
    let m = mem.get(key);
    const cur = obj[prop];
    if (!m) {
      m = { obj, prop, orig: cur.clone(), written: null };
      mem.set(key, m);
    } else if (!m.written || !cur.equals(m.written)) {
      m.orig.copy(cur);
    }
    return m;
  }
  function write(m, value) {
    m.obj[m.prop].copy(value);
    m.written = m.written ? m.written.copy(value) : value.clone();
  }
  function restoreAll() {
    for (const m of mem.values()) {
      m.obj[m.prop].copy(m.orig);
      m.written = null;
    }
  }

  // Gira `bone` (rotação de mundo mínima) para o filho `child` apontar para
  // `alvoWorld`; devolve o quaternion local resultante.
  function aim(bone, child, alvoWorld, out) {
    const p = wpos(bone, v1);
    const cur = wpos(child, v2).sub(p).normalize();
    const tgt = v3.copy(alvoWorld).sub(p).normalize();
    q1.setFromUnitVectors(cur, tgt);
    bone.getWorldQuaternion(q2).premultiply(q1);
    bone.parent.getWorldQuaternion(q1).invert();
    out.copy(q1.multiply(q2));
    bone.quaternion.copy(out);
    bone.updateMatrixWorld(true);
    return out;
  }
  // Mesma ideia, mas impondo a orientação de mundo inteira (pé plano).
  const qo = new THREE.Quaternion();
  function orient(bone, worldQ, out) {
    qo.copy(worldQ);
    bone.parent.getWorldQuaternion(q1).invert();
    out.copy(q1.multiply(qo));
    bone.quaternion.copy(out);
    bone.updateMatrixWorld(true);
    return out;
  }

  // IK de dois ossos: A raiz, C alvo, comprimentos l1/l2, `pole` direção para
  // onde a articulação do meio dobra. Escreve o meio em `outB` e o alvo
  // alcançável em `outC`.
  function ik2(A, C, l1, l2, pole, outB, outC) {
    const d0 = A.distanceTo(C);
    const dir = v1.copy(C).sub(A).normalize();
    const d = THREE.MathUtils.clamp(d0, Math.abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4);
    outC.copy(A).addScaledVector(dir, d);
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const pd = v2.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize();
    outB.copy(A).addScaledVector(dir, a).addScaledVector(pd, h);
  }

  // Comprimentos dos ossos (unidades de mundo; não mudam com a animação).
  const len = (a, b) => wpos(a, v1).distanceTo(wpos(b, v2));

  // Estado por perna/braço.
  const L = legs.map(([thigh, shin, foot], i) => ({
    thigh, shin, foot,
    side: i === 0 ? 1 : -1, // esquerda do personagem = +x (frente +z)
    mThigh: null, mShin: null, mFoot: null,
    tThigh: new THREE.Quaternion(), tShin: new THREE.Quaternion(), tFoot: new THREE.Quaternion(),
    footQ: new THREE.Quaternion(),
    H: new THREE.Vector3(), K: new THREE.Vector3(), A: new THREE.Vector3(),
  }));
  const ARM = arms.map(([upper, fore, hand], i) => ({
    upper, fore, hand,
    side: i === 0 ? 1 : -1,
    tUpper: new THREE.Quaternion(), tFore: new THREE.Quaternion(),
  }));

  let recuo = o.recuo;
  let calib = null; // { c: quadril acima da malha mais baixa, ankleY, l: comprimentos }
  const pelvisAnimW = new THREE.Vector3();
  const pelvisTargetW = new THREE.Vector3();
  const tmpB = new THREE.Vector3();
  const tmpC = new THREE.Vector3();
  const tmpW = new THREE.Vector3();
  const poleF = new THREE.Vector3();
  const poleW = new THREE.Vector3();

  // Vértices de quadril/coxas (osso dominante), para calibrar o contato.
  let contactIdx = null;
  function contactVertices() {
    const pick = new Set([pelvis, ...legs.map((l) => l[0])].map((b) => skinned.skeleton.bones.indexOf(b)));
    const si = skinned.geometry.attributes.skinIndex;
    const sw = skinned.geometry.attributes.skinWeight;
    const out = [];
    for (let i = 0; i < si.count; i++) {
      let best = 0;
      let bi = -1;
      for (let c = 0; c < 4; c++) {
        const w = sw.getComponent(i, c);
        if (w > best) {
          best = w;
          bi = si.getComponent(i, c);
        }
      }
      if (pick.has(bi)) out.push(i);
    }
    return out;
  }
  function minContactY() {
    contactIdx ??= contactVertices();
    const pos = skinned.geometry.attributes.position;
    skinned.updateMatrixWorld(true);
    let min = Infinity;
    const v = new THREE.Vector3();
    for (const i of contactIdx) {
      v.fromBufferAttribute(pos, i);
      skinned.applyBoneTransform(i, v);
      v.applyMatrix4(skinned.matrixWorld);
      min = Math.min(min, toF(v, v).y);
    }
    return min;
  }

  // Pose sentada completa a partir da pose animada atual, com o quadril na
  // altura `pelvisY` (em F). Guarda os quaternions-alvo em L/ARM.
  function solveFull(pelvisY, withArms) {
    const pm = mem.get(pelvis.uuid + "position");
    // Quadril: posição animada em x, recuo em z, altura dada.
    pelvis.position.copy(pm.orig);
    pelvis.updateMatrixWorld(true);
    toF(wpos(pelvis, pelvisAnimW), pelvisTargetW);
    pelvisTargetW.y = pelvisY;
    pelvisTargetW.z -= recuo;
    fromF(pelvisTargetW, tmpW);
    pelvis.position.copy(pelvis.parent.worldToLocal(tmpW));
    pelvis.updateMatrixWorld(true);

    // Tronco levemente para a frente (eixo x de F).
    if (spine && o.inclinacao) {
      const sm = mem.get(spine.uuid + "quaternion");
      spine.quaternion.copy(sm.orig);
      spine.updateMatrixWorld(true);
      q2.setFromAxisAngle(dirFromF(v3.set(1, 0, 0), tmpW), o.inclinacao);
      spine.getWorldQuaternion(q1).premultiply(q2);
      orient(spine, q1, (sm.target ??= new THREE.Quaternion()));
    }

    for (const leg of L) {
      leg.thigh.quaternion.copy(leg.mThigh.orig);
      leg.shin.quaternion.copy(leg.mShin.orig);
      leg.foot.quaternion.copy(leg.mFoot.orig);
      leg.thigh.updateMatrixWorld(true);
      toF(wpos(leg.thigh, v3), leg.H);
      // Tornozelo: à frente do quadril (~comprimento da coxa), na altura em
      // que fica de pé, com os joelhos levemente abertos.
      const l1 = calib.l[leg.side > 0 ? 0 : 1];
      tmpC.set(leg.H.x + leg.side * l1.thigh * 0.12, calib.ankleY, leg.H.z + l1.thigh * 0.92);
      poleF.set(leg.side * 0.15, 1, 0.6);
      ik2(leg.H, tmpC, l1.thigh, l1.shin, poleF, leg.K, leg.A);
      // Perna curta para o assento: a coxa não desce mais que QUEDA_MAX (o
      // joelho entraria no banco); a canela aponta para o chão e o pé fica
      // pendurado.
      const queda = Math.atan2(leg.H.y - leg.K.y, leg.K.z - leg.H.z);
      if (queda > QUEDA_MAX) {
        const dx = (leg.K.x - leg.H.x) / l1.thigh;
        leg.K.set(dx, -Math.sin(QUEDA_MAX), Math.cos(QUEDA_MAX)).normalize().multiplyScalar(l1.thigh).add(leg.H);
        leg.A.copy(tmpC).sub(leg.K).normalize().multiplyScalar(l1.shin).add(leg.K);
      }
      aim(leg.thigh, leg.shin, fromF(leg.K, tmpW), leg.tThigh);
      aim(leg.shin, leg.foot, fromF(leg.A, tmpW), leg.tShin);
      orient(leg.foot, q2.copy(F.q).multiply(leg.footQ), leg.tFoot);
    }

    if (withArms) {
      for (const arm of ARM) {
        const leg = L.find((l) => l.side === arm.side) ?? L[0];
        arm.upper.quaternion.copy(arm.mUpper.orig);
        arm.fore.quaternion.copy(arm.mFore.orig);
        arm.upper.updateMatrixWorld(true);
        const S = toF(wpos(arm.upper, v3), new THREE.Vector3());
        // Mão sobre a coxa, perto do quadril e sem cruzar o corpo (os braços
        // dos modelos são curtos: puxar a mão para dentro amassa o ombro).
        const r = calib.raioCoxa;
        tmpC.copy(leg.H).lerp(leg.K, 0.4);
        tmpC.y += r * 1.3;
        tmpC.x = THREE.MathUtils.lerp(tmpC.x, S.x, 0.7);
        poleF.set(arm.side * 0.6, -0.3, -1);
        ik2(S, tmpC, arm.l1, arm.l2, poleF, tmpB, tmpW);
        const handTarget = tmpW.clone();
        aim(arm.upper, arm.fore, fromF(tmpB, poleW), arm.tUpper);
        aim(arm.fore, arm.hand, fromF(handTarget, poleW), arm.tFore);
      }
    }
  }

  function calibrate(h) {
    const l = L.map((leg) => ({ thigh: len(leg.thigh, leg.shin), shin: len(leg.shin, leg.foot) }));
    let ankleY = Infinity;
    for (const leg of L) ankleY = Math.min(ankleY, toF(wpos(leg.foot, v3), v3).y);
    const hl = toF(wpos(L[0].thigh, v1), new THREE.Vector3());
    const hr = toF(wpos(L[1].thigh, v1), new THREE.Vector3());
    const raioCoxa = hl.distanceTo(hr) * 0.5;
    calib = { l, ankleY, raioCoxa };
    for (const arm of ARM) {
      arm.l1 = len(arm.upper, arm.fore);
      arm.l2 = len(arm.fore, arm.hand);
    }
    // Quadril (osso) acima da malha mais baixa de quadril/coxas: itera porque
    // a coxa muda de ângulo com a altura.
    const pelvisY0 = toF(wpos(pelvis, v1), v1).y;
    let c = pelvisY0 - (Math.min(hl.y, hr.y) - raioCoxa);
    for (let i = 0; i < 3; i++) {
      solveFull(h + c, false);
      const err = minContactY() - h;
      c -= err;
      if (Math.abs(err) < 1e-4) break;
    }
    calib.c = c;
    solveFull(h + c, false);
    // Borda do banco dada: recua o quadril até a parte de trás do joelho
    // ficar logo à frente dela.
    if (o.bordaAssento != null) {
      recuo += Math.max(L[0].K.z, L[1].K.z) - raioCoxa * 0.9 - o.bordaAssento;
      solveFull(h + c, false);
    }
    info.alturaQuadril = h + c;
    info.joelhoZ = Math.max(L[0].K.z, L[1].K.z);
    info.tornozeloZ = Math.max(L[0].A.z, L[1].A.z);
    info.peAltura = Math.min(L[0].A.y, L[1].A.y);
  }

  const outQ = new THREE.Quaternion();
  const outP = new THREE.Vector3();
  let wasOn = false;

  return {
    apply(w) {
      if (w <= 0) {
        if (wasOn) restoreAll();
        wasOn = false;
        return;
      }
      wasOn = true;
      root.updateWorldMatrix(true, true);
      root.matrixWorld.decompose(F.pos, F.q, F.s);
      F.qi.copy(F.q).invert();

      // Lê a pose animada deste quadro.
      const pm = anim(pelvis, "position");
      const sm = spine ? anim(spine, "quaternion") : null;
      for (const leg of L) {
        leg.mThigh = anim(leg.thigh, "quaternion");
        leg.mShin = anim(leg.shin, "quaternion");
        leg.mFoot = anim(leg.foot, "quaternion");
      }
      for (const arm of ARM) {
        arm.mUpper = anim(arm.upper, "quaternion");
        arm.mFore = anim(arm.fore, "quaternion");
      }
      const seg = (o.seguir ?? []).filter(Boolean).map((obj) => anim(obj, "position"));
      // Volta à pose animada antes de medir (o quadro anterior pode ter
      // deixado ossos não animados na pose sentada).
      for (const m of [pm, sm, ...L.flatMap((l) => [l.mThigh, l.mShin, l.mFoot]), ...ARM.flatMap((a) => [a.mUpper, a.mFore]), ...seg]) {
        if (m) m.obj[m.prop].copy(m.orig);
      }
      root.updateWorldMatrix(true, true);
      // Pé de pé (plano): orientação no referencial F.
      for (const leg of L) leg.foot.getWorldQuaternion(leg.footQ).premultiply(F.qi);
      if (!calib) {
        calibrate(o.alturaAssento);
        // calibrate mexeu nos ossos: volta à animação.
        for (const m of [pm, sm, ...L.flatMap((l) => [l.mThigh, l.mShin, l.mFoot])]) if (m) m.obj[m.prop].copy(m.orig);
        root.updateWorldMatrix(true, true);
      }

      const withArms = o.bracos && ARM.length === 2;
      solveFull(o.alturaAssento + calib.c, withArms);
      const pelvisFull = pelvis.position.clone();
      // Deslocamento de mundo do quadril (para os objetos em `seguir`).
      const delta = fromF(pelvisTargetW, tmpW).sub(pelvisAnimW).multiplyScalar(w);

      // Mistura com a animação pelo peso.
      write(pm, outP.copy(pm.orig).lerp(pelvisFull, w));
      if (sm && sm.target) write(sm, outQ.copy(sm.orig).slerp(sm.target, w));
      for (const leg of L) {
        write(leg.mThigh, outQ.copy(leg.mThigh.orig).slerp(leg.tThigh, w));
        write(leg.mShin, outQ.copy(leg.mShin.orig).slerp(leg.tShin, w));
        write(leg.mFoot, outQ.copy(leg.mFoot.orig).slerp(leg.tFoot, w));
      }
      for (const arm of ARM) {
        if (withArms) {
          write(arm.mUpper, outQ.copy(arm.mUpper.orig).slerp(arm.tUpper, w));
          write(arm.mFore, outQ.copy(arm.mFore.orig).slerp(arm.tFore, w));
        } else {
          write(arm.mUpper, arm.mUpper.orig);
          write(arm.mFore, arm.mFore.orig);
        }
      }
      for (const m of seg) {
        const obj = m.obj;
        obj.parent.updateWorldMatrix(true, false);
        m1.copy(obj.parent.matrixWorld).invert();
        obj.parent.localToWorld(tmpB.copy(m.orig)).add(delta);
        write(m, tmpB.applyMatrix4(m1));
      }
    },
    dispose() {
      restoreAll();
      mem.clear();
    },
  };
}
