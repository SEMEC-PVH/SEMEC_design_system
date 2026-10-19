// Galeria da Equipe: o museu no último andar da SEMFAZ, numa cena própria.
//
// Junta a sala (sala.js, com o elevador), os quadros (quadros.js), o time em
// 3D (personagens.js) e a exposição do Design System (exposicao.js) sobre a
// planta de layout.js. O motor (vila-engine.js) cria isto na primeira
// visita, troca a cena renderizada e passa a usar `passable`/`tileToWorld`
// daqui para o jogador. Mesma interface dos andares de escritório
// (predio/escritorio.js): elevador no meio da parede norte (abrirElevador,
// cabine, sinalElevador, displayElevador) e objetos que ensinam (infoEm).

import * as THREE from "three";
import * as layout from "./layout";
import { CHEGADA, ELEVADOR, EXPOSICAO, FACE, MH, MW, SLOTS, andavelBase, tileToWorld } from "./layout";
import { buildExposicao } from "./exposicao";
import { createPersonagens } from "./personagens";
import { buildQuadros } from "./quadros";
import { buildSala } from "./sala";

export { CHEGADA, ELEVADOR, EXPOSICAO, tileToWorld };

const chave = (x, y) => `${x},${y}`;

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
  // Os GLBs do time chegam depois: o motor espera por eles (pronto) para
  // aquecer a Galeria ainda no elevador. Conta as cargas sem mexer no módulo.
  const cargas = [];
  const loaderContado = Object.create(loader);
  loaderContado.loadAsync = (...args) => {
    const p = loader.loadAsync(...args);
    cargas.push(p);
    return p;
  };
  const personagens = createPersonagens({ ...ctx, loader: loaderContado, baseUrl });
  const exposicao = buildExposicao({ ...ctx, layout });
  const { elevador } = sala;

  // Objetos que ensinam: { id, titulo, texto, tiles: [[x, y], ...] }. Os
  // módulos registram os seus (a exposição já entra aqui); Espaço de frente
  // para um dos tiles mostra o texto (vila-engine.js, targetAt → infoEm).
  const infos = [];
  const infoPorTile = new Map();
  function registrarInfos(lista = []) {
    for (const info of lista) {
      infos.push(info);
      for (const [x, y] of info.tiles ?? []) infoPorTile.set(chave(x, y), info);
    }
  }
  registrarInfos(exposicao.infos);

  // Pisar num dos 2 tiles do elevador chama o elevador.
  const saidas = new Map(ELEVADOR.tiles.map(([x, y]) => [chave(x, y), "elevador"]));
  const saidaEm = (x, y) => saidas.get(chave(x, y)) ?? null;

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
    porta: null,
    // andavelBase já tira pedestal, bancos, pessoas e os tiles da exposição.
    passable: (x, y) => andavelBase(x, y),
    inBounds: (x, y) => x >= 0 && y >= 0 && x < MW && y < MH,
    saidaEm,
    ehPorta: (x, y) => saidaEm(x, y) !== null,
    // Objeto que ensina no tile (x, y): { id, titulo, texto } ou null.
    infoEm: (x, y) => infoPorTile.get(chave(x, y)) ?? null,
    infos,
    registrarInfos,
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
    // Raiz 3D (Group fixo no tile) e tile da pessoa `id`, ou null: o motor
    // pendura o cristal de quest sobre quem dá a quest aqui (o Rafa).
    raizPessoa: (id) => personagens.raizDe(id),
    tilePessoa: (id) => personagens.tileDe(id),
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
    // Posição viva do jogador (Vector3 da cena) ou null: o time vira para ele.
    setJogador: (v) => personagens.setJogador?.(v),
    // Sem porta para a rua: só o elevador (o motor não chama abrirPorta aqui).
    abrirPorta() {},
    abrirElevador: (k) => elevador.abrir(k),
    // Viagem de elevador (vila-engine.js): onde o jogador para dentro da
    // cabine e os sinais do display/lanterna ("chamando", "ding", null).
    cabine: new THREE.Vector3(0, 0, FACE.norte - elevador.dentro),
    sinalElevador: (estado) => elevador.sinal(estado),
    // Display acima da porta na viagem: o andar que passa e a seta do sentido.
    displayElevador: (texto, sentido) => elevador.viagem(texto, sentido),
    // Promise: os GLBs do time carregados (ou falhos) e já postos na cena.
    pronto: () => Promise.allSettled(cargas).then(() => new Promise((r) => setTimeout(r, 0))),
    update(t, dt) {
      sala.update(t, dt);
      molduras.update(t, dt);
      personagens.update(dt);
      exposicao.update(t, dt);
    },
    dispose() {
      exposicao.dispose();
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
