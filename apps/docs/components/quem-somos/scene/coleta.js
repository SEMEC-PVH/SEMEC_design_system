// Itens das quests de coleta (components/quem-somos/quests-coleta.js) no mapa:
// páginas do Livro Sábio, notas musicais e bugs de acessibilidade flutuando
// sobre o tile, com brilhos em volta. Tudo procedural (sem GLB), barato e com
// cores dos tokens.
//
//   createColetaveis({ scene, pal, track, tileToWorld, reducedMotion })
//     -> { add(questId, itens, tipo), set(questId, { visivel, coletados }),
//          itemAt(x, y), tem(questId, itemId), pop(questId, itemId, origem),
//          burst(pos), update(t, dt) }
//
//   tipo: "pagina" | "nota" | "bug". itemAt devolve { quest, item } do item
//   visível no tile (o motor chama ao pisar ou com Espaço de frente). pop()
//   faz o item subir girando sobre o jogador e sumir (devolve false se o item
//   não é desta instância: a Vila e cada andar do prédio têm a sua); burst()
//   solta notas musicais subindo (o show da Emily).

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

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

// Bug de acessibilidade: besourinho vermelho de casco brilhante (a cabeça
// para o sul, onde fica a câmera), com as partes escuras (cabeça, antenas,
// patas e a risca do casco) fundidas numa geometria só. Por cima, um "!" de
// alerta em pé. Três draw calls por bug: casco, partes escuras e "!" (os
// olhinhos vão junto do "!", no mesmo material claro).
function bugGeos() {
  const casco = new THREE.SphereGeometry(0.17, 16, 10);
  casco.scale(1, 0.62, 1.25);
  const escuras = [];
  const cabeca = new THREE.SphereGeometry(0.095, 12, 8);
  cabeca.translate(0, 0, 0.22);
  escuras.push(cabeca);
  const risca = new THREE.BoxGeometry(0.022, 0.02, 0.38);
  risca.translate(0, 0.1, -0.02);
  escuras.push(risca);
  // Patas: 3 de cada lado, abertas para fora e para baixo.
  for (const lado of [-1, 1]) {
    for (const z of [-0.12, 0, 0.12]) {
      const pata = new THREE.CylinderGeometry(0.013, 0.01, 0.2, 5);
      pata.rotateZ(lado * 1.05);
      pata.rotateY(lado * z * 2.2);
      pata.translate(lado * 0.2, -0.05, z);
      escuras.push(pata);
    }
    // Antena: sai da cabeça para a frente e para o lado.
    const antena = new THREE.CylinderGeometry(0.008, 0.008, 0.17, 4);
    antena.rotateX(1.0);
    antena.rotateZ(-lado * 0.45);
    antena.translate(lado * 0.05, 0.1, 0.32);
    escuras.push(antena);
  }
  const claras = [];
  // "!" em pé sobre o casco: haste e ponto.
  const haste = new THREE.BoxGeometry(0.07, 0.2, 0.07);
  haste.translate(0, 0.47, 0);
  const ponto = new THREE.BoxGeometry(0.07, 0.07, 0.07);
  ponto.translate(0, 0.29, 0);
  claras.push(haste, ponto);
  // Olhinhos na frente da cabeça.
  for (const lado of [-1, 1]) {
    const olho = new THREE.SphereGeometry(0.026, 8, 6);
    olho.translate(lado * 0.042, 0.035, 0.295);
    claras.push(olho);
  }
  // Mesmos atributos em todas (toNonIndexed): o merge exige isso.
  const fundir = (lista) => {
    const soltas = lista.map((x) => x.toNonIndexed());
    const g = mergeGeometries(soltas);
    for (const x of [...lista, ...soltas]) x.dispose();
    return g;
  };
  return { casco, escuras: fundir(escuras), claras: fundir(claras) };
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
  // Bug: geometrias e materiais criados só se alguma quest usar (add).
  let bug = null;
  function bugRecursos() {
    if (bug) return bug;
    const g = bugGeos();
    const vermelho = pv("red-600");
    const alerta = pv("yellow-400");
    bug = {
      casco: track(g.casco),
      escuras: track(g.escuras),
      claras: track(g.claras),
      cascoMat: track(new THREE.MeshStandardMaterial({ color: vermelho, emissive: vermelho, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.1 })),
      escuroMat: track(new THREE.MeshStandardMaterial({ color: pv("gray-900"), roughness: 0.7 })),
      claroMat: track(new THREE.MeshStandardMaterial({ color: alerta, emissive: alerta, emissiveIntensity: 0.6, roughness: 0.4 })),
      // Faíscas de "glitch": cubinhos vermelhos piscando em volta.
      faiscaMat: track(
        new THREE.MeshBasicMaterial({ color: pv("red-400"), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })
      ),
      faiscaGeo: track(new THREE.BoxGeometry(0.06, 0.06, 0.06)),
    };
    return bug;
  }

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
    } else if (tipo === "bug") {
      const b = bugRecursos();
      g.add(new THREE.Mesh(b.casco, b.cascoMat), new THREE.Mesh(b.escuras, b.escuroMat), new THREE.Mesh(b.claras, b.claroMat));
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

  // Altura em que cada tipo flutua: o bug fica mais baixo (anda no chão,
  // só "pairando" um pouco), e o "!" dele já sobe acima do casco.
  const alturaDe = (tipo) => (tipo === "bug" ? 0.32 : 0.45);

  const porQuest = new Map(); // questId → [{ id, x, y, root, model, glints, visible }]
  const pops = [];

  function add(questId, itens, tipo) {
    const lista = itens.map((it, i) => {
      const root = new THREE.Group();
      root.position.copy(tileToWorld(it.x, it.y));
      root.visible = false;
      const model = makeModel(tipo);
      const base = alturaDe(tipo);
      model.position.y = base;
      model.rotation.x = tipo === "pagina" ? -0.85 : 0;
      model.userData.fase = i * 1.7;
      root.add(model);
      // Brilhos: estrelinhas douradas (página, nota) ou faíscas vermelhas de
      // "glitch" (bug), um pouco mais baixas e abertas.
      const ehBug = tipo === "bug";
      const pontos = ehBug
        ? [
            [0.3, 0.42, 0.12, 0],
            [-0.3, 0.3, 0.02, 1.4],
            [0.16, 0.66, -0.2, 2.6],
            [-0.12, 0.6, 0.22, 3.9],
          ]
        : [
            [0.24, 0.6, 0.1, 0],
            [-0.22, 0.4, 0.05, 1.9],
            [0.05, 0.78, -0.15, 3.4],
          ];
      const glints = pontos.map(([x, y, z, phase]) => {
        const s = ehBug ? new THREE.Mesh(bugRecursos().faiscaGeo, bugRecursos().faiscaMat) : new THREE.Mesh(glintGeo, glintMat);
        s.position.set(x, y, z);
        if (!ehBug) s.scale.set(0.6, 1.6, 0.6);
        s.userData = { phase, noShadow: true, home: s.position.clone() };
        root.add(s);
        return s;
      });
      scene.add(root);
      return { id: it.id, x: it.x, y: it.y, tipo, base, home: root.position.clone(), root, model, glints };
    });
    porQuest.set(questId, lista);
  }

  // Mostra os itens ainda não coletados enquanto a quest está em coleta.
  function set(questId, { visivel, coletados = [] }) {
    for (const it of porQuest.get(questId) ?? []) {
      if (pops.some((p) => p.it === it)) continue;
      // Volta para o tile (depois de um pop, ou ao recomeçar a quest).
      it.root.position.copy(it.home);
      it.model.position.y = it.base;
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

  const tem = (questId, itemId) => Boolean(porQuest.get(questId)?.some((i) => i.id === itemId));

  // Coletou: o item sobe girando sobre o jogador e some. false: o item não
  // é desta instância (está na Vila ou noutro andar).
  function pop(questId, itemId, origem) {
    const it = porQuest.get(questId)?.find((i) => i.id === itemId);
    if (!it) return false;
    for (const g of it.glints) g.visible = false;
    it.root.position.copy(origem);
    it.model.position.y = 1.3;
    it.root.visible = true;
    // Sem o "glitch" no meio do pop (o bug volta ao centro e ao tamanho).
    it.model.position.x = 0;
    it.model.scale.setScalar(1);
    pops.push({ it, t: 0 });
    return true;
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
        it.model.position.y = it.base + Math.sin(t * 2 + f) * (it.tipo === "bug" ? 0.035 : 0.06);
        // Página deitada para trás (de frente para a câmera alta), balançando
        // como papel ao vento; nota gira devagar. O bug olha de um lado para
        // o outro, treme (as patinhas) e, de vez em quando, dá um "glitch":
        // pula de lado e estica por um instante.
        if (it.tipo === "pagina") {
          it.model.rotation.set(-0.85 + Math.sin(t * 1.6 + f) * 0.18, Math.sin(t * 1.1 + f) * 0.45, Math.sin(t * 2.3 + f) * 0.15);
        } else if (it.tipo === "bug") {
          const glitch = Math.sin(t * 2.7 + f * 1.3) > 0.97;
          it.model.rotation.set(0, Math.sin(t * 1.2 + f) * 0.6, Math.sin(t * 22 + f) * 0.04);
          it.model.position.x = glitch ? 0.06 * Math.sign(Math.sin(t * 40)) : 0;
          it.model.scale.x = glitch ? 1.18 : 1;
        } else it.model.rotation.y = t * 1.4 + f;
        for (const g of it.glints) {
          const k = (Math.sin(t * 3 + g.userData.phase) + 1) / 2;
          if (it.tipo === "bug") {
            // Faísca de pixel: liga e desliga seco e sobe um tico enquanto acesa.
            const on = k > 0.45;
            g.visible = on;
            g.position.copy(g.userData.home);
            if (on) g.position.y += (k - 0.45) * 0.25;
          } else g.scale.set(0.6 * k, 1.6 * k, 0.6 * k);
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

  return { add, set, itemAt, tem, pop, burst: startBurst, update, BURST_TIME };
}
