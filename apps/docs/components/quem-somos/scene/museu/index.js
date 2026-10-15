// Galeria da Equipe: o museu no último andar da SEMFAZ, numa cena própria.
//
// Junta a sala (sala.js), os quadros (quadros.js) e o time em 3D
// (personagens.js) sobre a planta de layout.js. O motor (vila-engine.js)
// cria isto na primeira visita, troca a cena renderizada e passa a usar
// `passable`/`tileToWorld` daqui para o jogador. Mesma interface dos andares
// de escritório (predio/escritorio.js): a porta da sala é o elevador.

import * as THREE from "three";
import { CHEGADA, MH, MW, PORTA, SLOTS, andavelBase, tileToWorld } from "./layout";
import { createPersonagens } from "./personagens";
import { buildQuadros } from "./quadros";
import { buildSala } from "./sala";

export { CHEGADA, PORTA, tileToWorld };

export function createMuseu({ loader, baseUrl, pal, lite, reducedMotion, quadros }) {
  const disposables = [];
  const track = (x) => {
    disposables.push(x);
    return x;
  };
  const scene = new THREE.Scene();
  // Fora das paredes: o "vazio" da maquete, escuro como a noite da Vila.
  scene.background = pal.mix(pal.pv("blue-950"), pal.black, 0.35);

  const ctx = { scene, pal, track, lite, reducedMotion };
  const sala = buildSala(ctx);
  const molduras = buildQuadros({ ...ctx, quadros });
  const personagens = createPersonagens({ ...ctx, loader, baseUrl });

  // Quadro i ↔ id da pessoa (quadros vem na ordem dos slots).
  const idDoSlot = (i) => quadros[i]?.id ?? null;
  const slotDoId = (id) => quadros.findIndex((q) => q.id === id);

  return {
    scene,
    MW,
    MH,
    tileToWorld,
    chegada: CHEGADA,
    entradaRua: null,
    passable: (x, y) => andavelBase(x, y),
    inBounds: (x, y) => x >= 0 && y >= 0 && x < MW && y < MH,
    ehPorta: (x, y) => x === PORTA.tile[0] && y === PORTA.tile[1],
    saidaEm: (x, y) => (x === PORTA.tile[0] && y === PORTA.tile[1] ? "elevador" : null),
    // Quadro que o jogador vê do tile (x, y) olhando `dir` (ou null).
    quadroVisto(x, y, dir) {
      const i = SLOTS.findIndex((s) => s.ver[0] === x && s.ver[1] === y && s.dir === dir);
      return i >= 0 ? idDoSlot(i) : null;
    },
    // Quadro pendurado no tile de parede (x, y) (clique no quadro).
    quadroNaParede(x, y) {
      const i = SLOTS.findIndex((s) => s.parede[0] === x && s.parede[1] === y);
      return i >= 0 ? idDoSlot(i) : null;
    },
    // Tile e direção de onde se olha o quadro `id`.
    pontoDeVista(id) {
      const s = SLOTS[slotDoId(id)];
      return s ? { x: s.ver[0], y: s.ver[1], dir: s.dir } : null;
    },
    pessoaEm: (x, y) => personagens.at(x, y),
    ids: quadros.map((q) => q.id),
    // A placa de latão fica sob a moldura: entra no close (abaixo).
    pose: (id) => {
      const p = molduras.pose(id);
      return p ? { ...p, abaixo: 0.45 } : null;
    },
    hitQuadros: molduras.hitMeshes,
    hitPessoas: personagens.hitProxies,
    setDestaque: (id) => molduras.setDestaque(id),
    setPerto: (id) => molduras.setPerto?.(id),
    falar: (id, yaw) => personagens.falar(id, yaw),
    abrirPorta: (k) => sala.abrirPorta?.(k),
    abrirElevador: (k) => sala.abrirPorta?.(k),
    update(t, dt) {
      sala.update(t, dt);
      molduras.update(t, dt);
      personagens.update(dt);
    },
    dispose() {
      sala.dispose();
      molduras.dispose();
      personagens.dispose();
      scene.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const mat of mats) mat?.dispose();
        }
      });
      for (const d of disposables) d.dispose?.();
    },
  };
}
