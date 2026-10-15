// Itens das quests de coleta (components/quem-somos/quests-coleta.js) no mapa:
// páginas do Livro Sábio e notas musicais flutuando sobre o tile, com brilhos
// em volta. Tudo procedural (sem GLB), barato e com cores dos tokens.
//
//   createColetaveis({ scene, pal, track, tileToWorld, reducedMotion })
//     -> { add(questId, itens, tipo), set(questId, { visivel, coletados }),
//          itemAt(x, y), pop(questId, itemId, origem), burst(pos), update(t, dt) }
//
//   tipo: "pagina" | "nota". itemAt devolve { quest, item } do item visível
//   no tile (o motor chama ao pisar ou com Espaço de frente). pop() faz o
//   item subir girando sobre o jogador e sumir; burst() solta notas musicais
//   subindo (o show da Emily).

import * as THREE from "three";

const POP_TIME = 1.4; // s
const BURST_TIME = 3.2; // s

// Nota musical (colcheia): cabeça oval, haste e bandeirinha.
function notaGeo() {
  const head = new THREE.SphereGeometry(0.07, 12, 8);
  head.scale(1.25, 0.9, 0.75);
  head.rotateZ(0.35);
  const stem = new THREE.CylinderGeometry(0.014, 0.014, 0.26, 6);
  stem.translate(0.075, 0.13, 0);
  const flag = new THREE.BoxGeometry(0.1, 0.035, 0.03);
  flag.rotateZ(-0.6);
  flag.translate(0.115, 0.23, 0);
  const parts = [head, stem, flag].map((g) => g.toNonIndexed());
  const pos = [];
  for (const g of parts) pos.push(...g.attributes.position.array);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  geo.translate(-0.04, -0.1, 0);
  for (const g of parts) g.dispose();
  return geo;
}

export function createColetaveis({ scene, pal, track, tileToWorld, reducedMotion = false }) {
  const { pv } = pal;
  const gold = pv("yellow-500");
  const paper = pv("gray-50");
  const ink = pv("gray-400");

  const pageGeo = track(new THREE.BoxGeometry(0.4, 0.5, 0.02));
  const lineGeo = track(new THREE.BoxGeometry(0.28, 0.024, 0.024));
  const pageMat = track(new THREE.MeshStandardMaterial({ color: paper, emissive: paper, emissiveIntensity: 0.25, roughness: 0.8 }));
  const lineMat = track(new THREE.MeshStandardMaterial({ color: ink, roughness: 0.9 }));
  const noteGeo = track(notaGeo());
  const noteMat = track(
    new THREE.MeshStandardMaterial({ color: gold, emissive: gold, emissiveIntensity: 0.5, roughness: 0.35, metalness: 0.15 })
  );
  const glintMat = track(
    new THREE.MeshBasicMaterial({ color: pv("yellow-400"), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  const glintGeo = track(new THREE.OctahedronGeometry(0.04, 0));

  function makeModel(tipo) {
    const g = new THREE.Group();
    if (tipo === "pagina") {
      g.add(new THREE.Mesh(pageGeo, pageMat));
      for (let i = 0; i < 4; i++) {
        const l = new THREE.Mesh(lineGeo, lineMat);
        l.position.set(i === 3 ? -0.05 : 0, 0.15 - i * 0.09, 0);
        if (i === 3) l.scale.x = 0.6;
        g.add(l);
      }
    } else {
      const n = new THREE.Mesh(noteGeo, noteMat);
      n.scale.setScalar(1.7);
      g.add(n);
    }
    g.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    return g;
  }

  const porQuest = new Map(); // questId → [{ id, x, y, root, model, glints, visible }]
  const pops = [];

  function add(questId, itens, tipo) {
    const lista = itens.map((it, i) => {
      const root = new THREE.Group();
      root.position.copy(tileToWorld(it.x, it.y));
      root.visible = false;
      const model = makeModel(tipo);
      model.position.y = 0.45;
      model.rotation.x = tipo === "pagina" ? -0.85 : 0;
      model.userData.fase = i * 1.7;
      root.add(model);
      const glints = [
        [0.24, 0.6, 0.1, 0],
        [-0.22, 0.4, 0.05, 1.9],
        [0.05, 0.78, -0.15, 3.4],
      ].map(([x, y, z, phase]) => {
        const s = new THREE.Mesh(glintGeo, glintMat);
        s.position.set(x, y, z);
        s.scale.set(0.6, 1.6, 0.6);
        s.userData = { phase, noShadow: true };
        root.add(s);
        return s;
      });
      scene.add(root);
      return { id: it.id, x: it.x, y: it.y, tipo, home: root.position.clone(), root, model, glints };
    });
    porQuest.set(questId, lista);
  }

  // Mostra os itens ainda não coletados enquanto a quest está em coleta.
  function set(questId, { visivel, coletados = [] }) {
    for (const it of porQuest.get(questId) ?? []) {
      if (pops.some((p) => p.it === it)) continue;
      // Volta para o tile (depois de um pop, ou ao recomeçar a quest).
      it.root.position.copy(it.home);
      it.model.position.y = 0.45;
      for (const g of it.glints) g.visible = true;
      it.root.visible = visivel && !coletados.includes(it.id);
    }
  }

  function itemAt(x, y) {
    for (const [quest, lista] of porQuest) {
      const it = lista.find((i) => i.x === x && i.y === y && i.root.visible);
      if (it) return { quest, item: it.id };
    }
    return null;
  }

  // Coletou: o item sobe girando sobre o jogador e some.
  function pop(questId, itemId, origem) {
    const it = porQuest.get(questId)?.find((i) => i.id === itemId);
    if (!it) return;
    for (const g of it.glints) g.visible = false;
    it.root.position.copy(origem);
    it.model.position.y = 1.3;
    it.root.visible = true;
    pops.push({ it, t: 0 });
  }

  // Show da Emily: notas sobem em espiral a partir da posição dada.
  const burstNotes = Array.from({ length: 10 }, (_, i) => {
    const m = new THREE.Mesh(noteGeo, noteMat);
    m.visible = false;
    m.userData = { ang: (i / 10) * Math.PI * 2, delay: (i % 5) * 0.28, noShadow: true };
    scene.add(m);
    return m;
  });
  let burst = null; // { t, pos }

  function startBurst(pos) {
    if (reducedMotion) return;
    burst = { t: 0, pos: pos.clone() };
  }

  function update(t, dt) {
    for (const lista of porQuest.values()) {
      for (const it of lista) {
        if (!it.root.visible || pops.some((p) => p.it === it)) continue;
        if (reducedMotion) continue;
        const f = it.model.userData.fase;
        it.model.position.y = 0.45 + Math.sin(t * 2 + f) * 0.06;
        // Página deitada para trás (de frente para a câmera alta), balançando
        // como papel ao vento; nota gira devagar.
        if (it.tipo === "pagina") {
          it.model.rotation.set(-0.85 + Math.sin(t * 1.6 + f) * 0.18, Math.sin(t * 1.1 + f) * 0.45, Math.sin(t * 2.3 + f) * 0.15);
        } else it.model.rotation.y = t * 1.4 + f;
        for (const g of it.glints) {
          const k = (Math.sin(t * 3 + g.userData.phase) + 1) / 2;
          g.scale.set(0.6 * k, 1.6 * k, 0.6 * k);
        }
      }
    }

    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.t += dt;
      const k = p.t / POP_TIME;
      if (!reducedMotion) {
        p.it.model.rotation.y += dt * 6;
        p.it.model.position.y += dt * (k < 0.5 ? 0.3 : 0);
      }
      const s = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
      p.it.model.scale.setScalar(1.4 * s);
      if (k >= 1) {
        p.it.root.visible = false;
        p.it.model.scale.setScalar(1);
        pops.splice(i, 1);
      }
    }

    if (burst) {
      burst.t += dt;
      for (const m of burstNotes) {
        const u = (burst.t - m.userData.delay) / (BURST_TIME - 1.4);
        m.visible = u > 0 && u < 1;
        if (!m.visible) continue;
        const a = m.userData.ang + u * 2.4;
        const r = 0.35 + u * 0.9;
        m.position.set(burst.pos.x + Math.cos(a) * r, 0.6 + u * 2.2, burst.pos.z + Math.sin(a) * r);
        m.rotation.y = a;
        m.scale.setScalar(2.2 * Math.min(1, u * 5, (1 - u) * 4));
      }
      if (burst.t > BURST_TIME) {
        for (const m of burstNotes) m.visible = false;
        burst = null;
      }
    }
  }

  return { add, set, itemAt, pop, burst: startBurst, update, BURST_TIME };
}
