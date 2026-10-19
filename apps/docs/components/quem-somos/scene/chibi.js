// Personagens chibi da Vila SEMEC (NPCs do time e jogador provisório).
//
// Proporção chibi: cabeça grande, corpo curto, rosto simpático (olhos com
// brilho, bochechas, sorriso). Cabelo, acessórios, tom de pele e roupa
// variam pelo índice, então cada pessoa do time tem um visual próprio, mas
// a vila é sempre igual (sem aleatoriedade).
//
// Desempenho: toda geometria é compartilhada entre os bonecos (esfera
// unitária escalada para cabeça, mãos, olhos, sapatos...) e os materiais
// ficam em cache por cor. Tudo passa por track() para o dispose().
//
// Contrato com o motor:
//   createChibiKit({ pal, track }) -> { makeChibi, makeMarker, setMarkerDone }
//   makeChibi(opts) -> THREE.Group com userData.body (escala na respiração)
//     e userData.head (balanço leve da cabeça). Frente em +z.
//   makeMarker({ leader }) -> Mesh (balão de conversa). marker.material tem
//     color e emissive (o motor pinta com pal.markerDone ao conversar).
//     Com leader: true (líder de ginásio ou Diretoria), balão maior em
//     pal.markerLeader com uma estrela no lugar do "!" — forma diferente,
//     não só cor, para quem não distingue as cores.
//   setMarkerDone(marker, done) troca o "!" (ou a estrela) pelo "✓".

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const CHIBI_SCALE = 0.9;

// Estilos de cabelo (por índice).
const HAIR_STYLES = ["curto", "coque", "rabo", "cacheado", "longo", "topete"];

// Pontos dos cachos (ângulo em volta da cabeça, altura, raio).
const CURLS = [
  [0, 0.27, 0.075], [1.05, 0.25, 0.07], [2.1, 0.24, 0.072], [3.14, 0.22, 0.078],
  [4.2, 0.24, 0.072], [5.25, 0.25, 0.07], [0.5, 0.32, 0.068], [2.6, 0.31, 0.07],
  [3.7, 0.3, 0.07], [5.7, 0.31, 0.066], [1.6, 0.33, 0.066], [4.7, 0.33, 0.068],
  [3.14, 0.1, 0.08], [2.5, 0.12, 0.075], [3.8, 0.12, 0.075],
];

// Mechas da franja (x, y, rotação z, largura), relativas ao centro da cabeça.
const FRINGE = [
  [-0.1, 0.15, -0.6, 0.075],
  [-0.01, 0.168, -0.45, 0.085],
  [0.09, 0.15, -0.3, 0.07],
];

// Mechas da coroa (ângulo, raio, altura, largura).
const CROWN = [
  [0.4, 0.1, 0.225, 0.1],
  [2.2, 0.12, 0.215, 0.1],
  [3.6, 0.13, 0.2, 0.1],
  [5.1, 0.11, 0.22, 0.095],
];

export function createChibiKit({ pal, track }) {
  const { pv, mix, white } = pal;

  // ---- Paleta derivada (somente tokens) ------------------------------------
  const tones = {
    skins: [
      pal.skin,
      mix(pal.skin, pv("yellow-800"), 0.28),
      mix(pal.skin, pv("yellow-800"), 0.5),
      mix(pal.skin, white, 0.18),
      mix(pal.skin, pv("red-300"), 0.2),
    ],
    hairs: [
      pal.hair,
      mix(pv("gray-900"), pv("gray-950"), 0.6),
      mix(pv("yellow-800"), pv("red-800"), 0.45),
      mix(pv("yellow-600"), pv("yellow-800"), 0.62),
      mix(pv("gray-900"), pv("yellow-800"), 0.2),
      mix(pv("red-900"), pv("yellow-800"), 0.35),
    ],
    pants: [pal.pants, pv("blue-800"), mix(pv("gray-800"), pv("gray-900"), 0.4), mix(pv("blue-900"), pv("gray-700"), 0.5)],
    shoes: [pv("gray-900"), white, mix(pv("yellow-800"), pv("gray-900"), 0.5)],
    accent: [pv("blue-700"), pv("red-600"), pv("green-600"), pv("gray-800")],
    blush: mix(pv("red-300"), pv("red-400"), 0.3),
    mouth: mix(pv("red-800"), pv("gray-900"), 0.4),
    ink: pv("gray-900"),
    lens: mix(pv("blue-200"), white, 0.4),
  };

  // ---- Geometria compartilhada ---------------------------------------------
  const geo = {
    sphere: track(new THREE.SphereGeometry(1, 24, 16)),
    sphereLow: track(new THREE.SphereGeometry(1, 12, 8)),
    hairCap: track(new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.6)),
    leg: track(new THREE.CapsuleGeometry(0.062, 0.1, 6, 14)),
    arm: track(new THREE.CapsuleGeometry(0.046, 0.13, 6, 14)),
    tail: track(new THREE.CapsuleGeometry(0.055, 0.16, 6, 12)),
    torso: track(
      new THREE.LatheGeometry(
        [
          [0, 0], [0.13, 0], [0.155, 0.015], [0.168, 0.06], [0.17, 0.13],
          [0.16, 0.21], [0.135, 0.27], [0.09, 0.315], [0.035, 0.335], [0, 0.34],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        24
      )
    ),
    ring: track(new THREE.TorusGeometry(0.048, 0.008, 6, 20)),
    band: track(new THREE.TorusGeometry(0.285, 0.016, 6, 24, Math.PI)),
    cup: track(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16)),
    smile: track(new THREE.TorusGeometry(0.032, 0.0075, 6, 14, Math.PI)),
    box: track(new THREE.BoxGeometry(1, 1, 1)),
    vneck: track(new THREE.CylinderGeometry(0.068, 0.068, 0.02, 3)),
    blob: track(new THREE.CircleGeometry(0.3, 28)),
  };

  // Balão de conversa: retângulo arredondado com "rabinho" embaixo.
  const roundRect = (w, h, r, tail = 0) => {
    const s = new THREE.Shape();
    const x0 = -w / 2;
    const y0 = -h / 2;
    s.moveTo(x0 + r, y0);
    if (tail) {
      s.lineTo(-0.045, y0);
      s.lineTo(-0.01, y0 - tail);
      s.lineTo(0.035, y0);
    }
    s.lineTo(x0 + w - r, y0);
    s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
    s.lineTo(x0 + w, y0 + h - r);
    s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
    s.lineTo(x0 + r, y0 + h);
    s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
    s.lineTo(x0, y0 + r);
    s.quadraticCurveTo(x0, y0, x0 + r, y0);
    return s;
  };
  const BUBBLE_DEPTH = 0.03;
  const BUBBLE_BEVEL = 0.014;
  const bubbleGeo = track(
    new THREE.ExtrudeGeometry(roundRect(0.3, 0.26, 0.09, 0.075), {
      depth: BUBBLE_DEPTH,
      bevelEnabled: true,
      bevelThickness: BUBBLE_BEVEL,
      bevelSize: BUBBLE_BEVEL,
      bevelSegments: 3,
      curveSegments: 10,
    })
  );
  bubbleGeo.translate(0, 0, -BUBBLE_DEPTH / 2);
  const BUBBLE_FRONT = BUBBLE_DEPTH / 2 + BUBBLE_BEVEL;
  const plateGeo = track(new THREE.ShapeGeometry(roundRect(0.25, 0.21, 0.07), 10));
  const glyphBar = track(new THREE.CapsuleGeometry(0.021, 0.07, 4, 10));
  const glyphDot = track(new THREE.SphereGeometry(0.025, 12, 8));
  const checkShort = track(new THREE.CapsuleGeometry(0.019, 0.045, 4, 10));
  const checkLong = track(new THREE.CapsuleGeometry(0.019, 0.1, 4, 10));
  // Estrela de 5 pontas (marcador dos líderes).
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.085 : 0.036;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  starShape.closePath();
  const starGeo = track(new THREE.ShapeGeometry(starShape));

  // ---- Materiais em cache por cor ------------------------------------------
  const matCache = new Map();
  const mat = (color, roughness = 0.8, extra = {}) => {
    const key = `${color.getHexString()}|${roughness}|${extra.emissiveIntensity ?? 0}|${extra.opacity ?? 1}`;
    let m = matCache.get(key);
    if (!m) {
      m = track(new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra }));
      matCache.set(key, m);
    }
    return m;
  };
  const blobMat = track(
    new THREE.MeshBasicMaterial({
      color: pal.black,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  );
  const plateMat = track(new THREE.MeshBasicMaterial({ color: white }));
  const inkMat = track(new THREE.MeshBasicMaterial({ color: tones.ink }));
  const doneMat = track(new THREE.MeshBasicMaterial({ color: pal.markerDone }));
  const starMat = track(new THREE.MeshBasicMaterial({ color: pal.markerLeader ?? pv("blue-600") }));

  // Mesh com esfera unitária escalada.
  const blobby = (parent, m, sx, sy, sz, x, y, z, { low = false, shadow = true } = {}) => {
    const mesh = new THREE.Mesh(low ? geo.sphereLow : geo.sphere, m);
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    if (!shadow) mesh.userData.noShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // ---- Cabelo ----------------------------------------------------------------
  // Coordenadas relativas ao centro da cabeça.
  function addHair(head, style, hairMat) {
    const cap = new THREE.Mesh(geo.hairCap, hairMat);
    // Inclinada para trás: testa livre na frente, nuca coberta atrás.
    cap.scale.set(0.262, 0.262, 0.266);
    cap.position.set(0, 0.018, -0.006);
    cap.rotation.x = -0.62;
    head.add(cap);

    if (style === "cacheado") {
      cap.scale.multiplyScalar(1.03);
      for (const [a, h, r] of CURLS) {
        // Cachos assentados na superfície da cabeça (raio ~0,25): antes eles
        // ficavam soltos acima do crânio e pareciam "bolhas" vistos de cima.
        // A testa fica livre: cachos da frente sobem um pouco.
        const front = Math.cos(a) > 0.6 ? 0.25 : 0;
        const el = Math.asin(Math.min(0.97, (h - 0.04) / 0.27)) + front;
        const rr = 0.245 * Math.cos(el);
        blobby(head, hairMat, r * 1.08, r, r * 1.08, Math.sin(a) * rr, 0.245 * Math.sin(el) + 0.01, Math.cos(a) * rr - 0.025, { low: true });
      }
      return;
    }

    // Mechas no alto da cabeça: tiram o aspecto de "capacete" visto de cima.
    for (const [a, r, y, w] of CROWN) {
      const tuft = blobby(head, hairMat, w, 0.06, w * 1.25, Math.sin(a) * r, y, Math.cos(a) * r - 0.02, { low: true });
      tuft.rotation.set(Math.cos(a) * 0.5, a, -Math.sin(a) * 0.5);
    }

    // Franja (todas as outras): mechas varridas para o lado sobre a testa.
    const side = style === "topete" ? 0 : 1;
    for (const [x, y, rz, sx] of FRINGE) {
      const lock = blobby(head, hairMat, sx, 0.05, 0.07, x, y, Math.sqrt(Math.max(0, 0.0576 - x * x - y * y)) - 0.02);
      lock.rotation.set(0.7, 0, rz * side);
    }

    if (style === "coque") {
      blobby(head, hairMat, 0.1, 0.095, 0.1, 0, 0.27, -0.09);
      blobby(head, hairMat, 0.06, 0.03, 0.06, 0, 0.2, -0.07, { low: true });
    } else if (style === "rabo") {
      const tail = new THREE.Mesh(geo.tail, hairMat);
      tail.position.set(0, -0.06, -0.27);
      tail.rotation.x = 0.45;
      head.add(tail);
      blobby(head, hairMat, 0.07, 0.07, 0.07, 0, 0.07, -0.24, { low: true });
    } else if (style === "longo") {
      blobby(head, hairMat, 0.262, 0.28, 0.15, 0, -0.08, -0.12);
      for (const sx of [-1, 1]) {
        const lock = blobby(head, hairMat, 0.07, 0.17, 0.08, sx * 0.215, -0.08, 0.02);
        lock.rotation.z = sx * 0.12;
      }
    } else if (style === "topete") {
      const quiff = blobby(head, hairMat, 0.15, 0.08, 0.13, 0.03, 0.23, 0.1);
      quiff.rotation.x = -0.35;
    } else {
      // Curto: volume extra no topo, levemente de lado.
      const top = blobby(head, hairMat, 0.2, 0.08, 0.18, -0.04, 0.22, 0.0);
      top.rotation.z = 0.2;
    }
  }

  // ---- Acessórios ----------------------------------------------------------
  function addGlasses(head) {
    const frame = mat(tones.ink, 0.4);
    for (const sx of [-1, 1]) {
      const ring = new THREE.Mesh(geo.ring, frame);
      ring.position.set(sx * 0.085, -0.01, 0.243);
      ring.rotation.y = sx * 0.3;
      ring.userData.noShadow = true;
      head.add(ring);
      const lens = blobby(head, mat(tones.lens, 0.1, { transparent: true, opacity: 0.35 }), 0.044, 0.044, 0.004, sx * 0.085, -0.01, 0.24, { shadow: false });
      lens.rotation.y = sx * 0.3;
    }
    const bridge = new THREE.Mesh(geo.box, frame);
    bridge.scale.set(0.05, 0.01, 0.01);
    bridge.position.set(0, 0.0, 0.255);
    bridge.userData.noShadow = true;
    head.add(bridge);
  }

  function addHeadphones(head, accent) {
    const band = new THREE.Mesh(geo.band, mat(tones.ink, 0.5));
    band.position.set(0, 0.02, -0.02);
    head.add(band);
    for (const sx of [-1, 1]) {
      const cup = new THREE.Mesh(geo.cup, mat(accent, 0.45));
      cup.rotation.z = Math.PI / 2;
      cup.position.set(sx * 0.27, 0.0, -0.02);
      head.add(cup);
    }
  }

  // ---- Fusão por material --------------------------------------------------
  // Cada boneco tem ~40 peças; sem fusão seriam ~40 draw calls por NPC (o
  // dobro com o passe de sombra). Funde as peças estáticas de um grupo por
  // material (+ flag de sombra), mantendo os grupos animados separados
  // (corpo respira, cabeça balança). A geometria fundida passa por track().
  const _rel = new THREE.Matrix4();
  const _inv = new THREE.Matrix4();
  function bake(root, skip) {
    root.updateMatrixWorld(true);
    _inv.copy(root.matrixWorld).invert();
    const buckets = new Map();
    const visit = (o) => {
      for (const c of [...o.children]) {
        if (c === skip) continue;
        if (c.isMesh) {
          const key = `${c.material.uuid}|${c.userData.noShadow ? 0 : 1}`;
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key).push(c);
        }
        visit(c);
      }
    };
    visit(root);
    for (const list of buckets.values()) {
      if (list.length < 2) continue;
      const parts = list.map((m) => {
        _rel.multiplyMatrices(_inv, m.matrixWorld);
        return m.geometry.clone().applyMatrix4(_rel);
      });
      const merged = track(mergeGeometries(parts, false));
      for (const p of parts) p.dispose();
      const mesh = new THREE.Mesh(merged, list[0].material);
      mesh.userData.noShadow = !!list[0].userData.noShadow;
      for (const m of list) m.removeFromParent();
      root.add(mesh);
    }
    // Grupos (ombros) que ficaram vazios saem da cena.
    const empty = [];
    root.traverse((o) => {
      if (o !== root && o !== skip && !o.isMesh && o.children.length === 0) empty.push(o);
    });
    for (const o of empty) o.removeFromParent();
  }

  // ---- Boneco --------------------------------------------------------------
  // opts: shirt (obrigatório), variant (índice), director, e cores opcionais
  // (pants, skin, hair, eye) que sobrescrevem as derivadas do índice.
  function makeChibi({ shirt, pants, skin, hair, eye, variant = 0, director = false, hairStyle, accessory }) {
    const v = Math.abs(variant | 0);
    const skinC = skin ?? tones.skins[(v * 3 + 1) % tones.skins.length];
    const hairC = hair ?? tones.hairs[(v * 5 + 2) % tones.hairs.length];
    const pantsC = pants ?? (director ? pv("gray-800") : tones.pants[(v * 2 + 1) % tones.pants.length]);
    const shoeC = director ? tones.shoes[0] : tones.shoes[v % tones.shoes.length];
    const style = hairStyle ?? HAIR_STYLES[(v * 7 + 3) % HAIR_STYLES.length];
    const acc = accessory ?? (v % 3 === 1 ? "glasses" : v % 4 === 2 && !director ? "headphones" : "none");

    const skinMat = mat(skinC, 0.62);
    const hairMat = mat(hairC, 0.5);
    const shirtMat = mat(shirt, 0.78);
    const pantsMat = mat(pantsC, 0.8);
    const shoeMat = mat(shoeC, 0.55);
    const eyeMat = mat(eye ?? pal.eye, 0.2);

    const g = new THREE.Group();
    const body = new THREE.Group();
    g.add(body);

    // Pernas e sapatos.
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(geo.leg, pantsMat);
      leg.position.set(sx * 0.072, 0.165, 0);
      body.add(leg);
      blobby(body, shoeMat, 0.072, 0.048, 0.1, sx * 0.075, 0.045, 0.025);
    }

    // Tronco (levemente achatado na profundidade).
    const torso = new THREE.Mesh(geo.torso, shirtMat);
    torso.position.y = 0.215;
    torso.scale.set(1, 1, 0.84);
    body.add(torso);

    if (director) {
      // Camisa clara em V (prisma triangular com a ponta para baixo) + gravata.
      const collar = new THREE.Mesh(geo.vneck, mat(white, 0.7));
      collar.rotation.x = Math.PI / 2 - 0.5;
      collar.position.set(0, 0.488, 0.112);
      collar.userData.noShadow = true;
      body.add(collar);
      const tie = new THREE.Mesh(geo.box, mat(tones.accent[(v + 1) % tones.accent.length], 0.6));
      tie.scale.set(0.034, 0.12, 0.016);
      tie.position.set(0, 0.42, 0.142);
      tie.rotation.x = -0.12;
      tie.userData.noShadow = true;
      body.add(tie);
    } else {
      // Crachá da SEMEC no peito.
      const badge = new THREE.Mesh(geo.box, mat(white, 0.5));
      badge.scale.set(0.065, 0.085, 0.012);
      badge.position.set(0.065, 0.41, 0.143);
      badge.rotation.x = -0.1;
      badge.userData.noShadow = true;
      body.add(badge);
      const stripe = new THREE.Mesh(geo.box, mat(pv("blue-700"), 0.6));
      stripe.scale.set(0.066, 0.02, 0.014);
      stripe.position.set(0.065, 0.44, 0.144);
      stripe.rotation.x = -0.1;
      stripe.userData.noShadow = true;
      body.add(stripe);
    }

    // Braços com pivô no ombro.
    for (const sx of [-1, 1]) {
      const shoulder = new THREE.Group();
      shoulder.position.set(sx * 0.155, 0.505, 0);
      shoulder.rotation.z = sx * 0.2;
      const arm = new THREE.Mesh(geo.arm, shirtMat);
      arm.position.y = -0.1;
      shoulder.add(arm);
      blobby(shoulder, skinMat, 0.052, 0.052, 0.052, 0, -0.215, 0.005);
      body.add(shoulder);
    }

    // Cabeça com pivô no pescoço.
    const head = new THREE.Group();
    head.position.y = 0.79;
    body.add(head);
    blobby(head, skinMat, 0.25, 0.238, 0.24, 0, 0, 0);
    for (const sx of [-1, 1]) blobby(head, skinMat, 0.035, 0.05, 0.04, sx * 0.248, -0.02, -0.005, { low: true });

    // Rosto: olhos com brilho, bochechas, sorriso.
    for (const sx of [-1, 1]) {
      const e = blobby(head, eyeMat, 0.031, 0.044, 0.02, sx * 0.083, -0.012, 0.222, { shadow: false });
      e.rotation.y = sx * 0.33;
      blobby(head, plateMat, 0.011, 0.011, 0.006, sx * 0.083 + 0.011, 0.006, 0.241, { low: true, shadow: false });
      const cheek = blobby(head, mat(tones.blush, 0.9), 0.04, 0.022, 0.01, sx * 0.14, -0.07, 0.197, { low: true, shadow: false });
      cheek.rotation.y = sx * 0.62;
    }
    const smile = new THREE.Mesh(geo.smile, mat(tones.mouth, 0.6));
    smile.rotation.z = Math.PI;
    smile.position.set(0, -0.085, 0.228);
    smile.rotation.x = -0.25;
    smile.userData.noShadow = true;
    head.add(smile);

    addHair(head, style, hairMat);
    if (acc === "glasses") addGlasses(head);
    else if (acc === "headphones" && style !== "coque" && style !== "cacheado") {
      addHeadphones(head, tones.accent[v % tones.accent.length]);
    }

    // Funde as peças: cabeça (balança) e corpo sem a cabeça (respira).
    bake(head);
    bake(body, head);

    // Sombra de contato (o shadow map sozinho deixa os pés "flutuando").
    const blob = new THREE.Mesh(geo.blob, blobMat);
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.012;
    blob.renderOrder = 1;
    blob.userData.noShadow = true;
    g.add(blob);

    g.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = !o.userData.noShadow;
      o.receiveShadow = o !== blob;
    });
    // Um pouco menor que 1 para ficar na mesma escala do jogador 3D.
    g.scale.setScalar(CHIBI_SCALE);
    g.userData.body = body;
    g.userData.head = head;
    return g;
  }

  // ---- Marcador de conversa ------------------------------------------------
  function makeMarker({ leader = false } = {}) {
    const color = leader ? (pal.markerLeader ?? pv("blue-600")) : pal.marker;
    const marker = new THREE.Mesh(
      bubbleGeo,
      track(new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0, emissive: color, emissiveIntensity: 0.35 }))
    );
    marker.rotation.order = "YXZ";
    marker.userData.noShadow = true;
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0.005, BUBBLE_FRONT + 0.003);
    marker.add(plate);

    // "!" — ainda não conversou (líder: estrela — ainda não foi vencido).
    const todo = new THREE.Group();
    if (leader) {
      todo.add(new THREE.Mesh(starGeo, starMat));
    } else {
      const bar = new THREE.Mesh(glyphBar, inkMat);
      bar.position.y = 0.035;
      const dot = new THREE.Mesh(glyphDot, inkMat);
      dot.position.y = -0.052;
      todo.add(bar, dot);
    }
    todo.position.z = BUBBLE_FRONT + 0.012;
    marker.add(todo);

    // "✓" — já conversou.
    const done = new THREE.Group();
    const a = new THREE.Mesh(checkShort, doneMat);
    a.position.set(-0.036, -0.012, 0);
    a.rotation.z = 0.8;
    const b = new THREE.Mesh(checkLong, doneMat);
    b.position.set(0.022, 0.012, 0);
    b.rotation.z = -0.62;
    done.add(a, b);
    done.position.z = BUBBLE_FRONT + 0.012;
    done.visible = false;
    marker.add(done);

    marker.traverse((o) => (o.userData.noShadow = true));
    marker.userData.todo = todo;
    marker.userData.done = done;
    // Líder com balão um pouco maior: chama atenção de longe.
    marker.userData.baseScale = leader ? 1.15 : 1;
    marker.scale.setScalar(marker.userData.baseScale);
    return marker;
  }

  function setMarkerDone(marker, isDone) {
    const { todo, done } = marker.userData;
    if (done.visible === isDone) return;
    todo.visible = !isDone;
    done.visible = isDone;
    marker.scale.setScalar((marker.userData.baseScale ?? 1) * (isDone ? 0.82 : 1));
  }

  return { makeChibi, makeMarker, setMarkerDone };
}
