// Pista de bicicleta da Vila SEMEC: a corrida, numa cena própria.
//
// Mesmo contrato dos interiores (predio/escritorio.js e scene/museu/index.js):
// o motor (vila-engine.js) cria isto, troca a cena renderizada e passa a usar
// `passable`/`tileToWorld` daqui para o jogador. Chega-se pelo portão do box
// (entradaRua = chegada, com o portão logo atrás) e sai-se pisando no portão
// (saidaEm → "rua", que o motor trata como "voltar para a Vila").
//
// Croqui do circuito com as peças (86 × 56 tiles; sentido →, anti-horário na
// tela; o mapa exato, tile a tile, está no topo de circuito.js):
//
//   x →     10        20        30        40        50        60        70        80
//   y  7         ###########3###                                                       3 = arco "alto"
//      9       ###           ####                                ######1####           1 = arco "grampo"
//     12      ##                ###                           ####          ####
//     16     ###                 ##                           ##              ###
//     20     ###  (S)            ##                          ###               ###
//     24      ###                ###                         ##                 ##
//     28     ###                  ###                       ###                 ##
//     30    ##4##                  ####     ("U")         ###                   ##       4 = arco "esse"
//     33    ###                      ####2##########    ####                   #0#    2 = "vale", 0 = "subida"
//     36    ###                        ##########                              ##
//     40     ###     AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA                         ###      A = arquibancada
//     44      #####   f   f   f  T f   f   f   f                    ######             f = bandeira, T = semáforo
//     47        ####################F#L######################################          F = chegada (pórtico), L = largada
//     49                  ===========...======                                         = = muro dos boxes, ... = abertura
//     50                  B R :::: BOX ::::  GGGGG                                     B = bancada, R = placa das regras, G = garagem
//     54                  =========PP=========                                          P = portão (volta para a Vila)
//
// Organização (um arquivo por dono; cada construtor mexe só no seu):
//   circuito.js      o traçado puro (grade, linha central, checkpoints, box,
//                    corredor da bicicleta). A lógica da corrida mora aqui.
//   zonas.js         puro: de quem é cada tile (ZONAS, dono, naZona), livre
//                    (fora do asfalto e do box) e alturaMax (quanto um objeto
//                    pode subir sem tapar o asfalto para a câmera do sul).
//   comum.js         utilitários (lotes, caixa, chão, atlas, placa, cores) e o
//                    CONTRATO dos módulos (o `ctx` e o que cada um devolve).
//   tracado.js       zona "tracado": chão, asfalto, zebras, pórtico, arcos,
//                    semáforo, box e portão (setProximo, passou, largada,
//                    abrirPorta, pulso dos arcos).
//   arquibancadas.js zona "arquibancadas" (A, a): arquibancada e público.
//   beira.js         zona "beira" (faixa de 3,5 tiles + C): placas, cones,
//                    pneus, mastros com bandeiras e a cerca do mapa.
//   vila.js          zona "vila" (B, b): elementos temáticos da Vila SEMEC.
//   paisagem.js      zona "paisagem" (D + o resto): árvores e a mata.
//   index.js         (este) o núcleo: cena, luzes, névoa, céu, partículas
//                    (soltar, confete e fogos da festa), estado da corrida e
//                    a interface do interior; monta os módulos nesta ordem —
//                    tracado, arquibancadas, beira, vila, paisagem (quem
//                    monta depois desvia do que os anteriores reservaram) —
//                    cada um num try/catch, repassa a eles update, festa,
//                    largada, passou, setProximo e abrirPorta, e no fim fecha
//                    os lotes compartilhados (objetos fixos e atlas) e
//                    descarta tudo no dispose.
//
// Carregamento: módulos registram cargas assíncronas (GLBs) com
// ctx.carregar(promise). pista.pronto() resolve quando todas assentaram
// (Promise.allSettled, como o museu; cargas registradas no meio da espera
// entram também) e pista.progresso() devolve 0..1 (cargas assentadas /
// registradas; 1 sem nenhuma), para a tela de carregamento da corrida.
//
// Medido (renderer.info, já com a passada de sombra): ~29–35 draw calls na
// câmera de jogo; no `lite` (sem sombras, metade da mata de fora e do
// público, sem pneus nem fogos) bem menos.
//
// Uso (motor):
//   const pista = createPista({ pal, lite, reducedMotion, loader, baseUrl });
//   pista.corrida            // { largada, voltas, checkpoints, saidaVila, tilesPorVolta }
//   pista.setProximo(i)      // destaca o arco i (os outros ficam discretos)
//   pista.passou(i)          // faíscas e flash no arco i
//   pista.largada(fase)      // semáforo: null | 3 | 2 | 1 | "vermelho" | "verde"
//   pista.festa()            // confete e fogos (estático com reducedMotion)
//   pista.pronto(); pista.progresso();   // cargas dos módulos
//   pista.update(t, dt); pista.dispose();

import * as THREE from "three";
import { ARQUIBANCADA, CHEGADA, CORREDOR_FOLGA, LARGADA, MH, MURO_Y, MW, PLACA_REGRAS, PORTAO, RAIO_ASFALTO, medirVolta, montarCircuito } from "./circuito";
import {
  chave,
  criarAtlas,
  criarBandeira,
  criarCores,
  criarLote,
  criarPlaca,
  geometriaPortico,
  semente,
  tileToWorld,
  vertexColored,
  wx,
  wz,
} from "./comum";
import { criarZonas } from "./zonas";
import { montarTracado } from "./tracado";
import { montarArquibancadas } from "./arquibancadas";
import { montarBeira } from "./beira";
import { montarVila } from "./vila";
import { montarPaisagem } from "./paisagem";

export { MH, MW, tileToWorld };

const VOLTAS = 2;
// Câmera: um pouco mais longe que dentro do prédio (de bicicleta, ver adiante).
const ZOOM = 1.18;

// Ordem de montagem: quem vem depois desvia do que os anteriores reservaram.
const MODULOS = [
  ["tracado", montarTracado],
  ["arquibancadas", montarArquibancadas],
  ["beira", montarBeira],
  ["vila", montarVila],
  ["paisagem", montarPaisagem],
];

export function createPista({ pal, lite = false, reducedMotion = false, loader = null, baseUrl = "" }) {
  const { pv, mix } = pal;
  const white = pv("white");
  const proprios = [];
  const track = (x) => {
    proprios.push(x);
    return x;
  };
  const rand = semente(20261019);

  const c = montarCircuito();
  const { pts, checkpoints } = c;
  const N = checkpoints.length;
  const portico = geometriaPortico(checkpoints);

  const scene = new THREE.Scene();
  const root = new THREE.Group();
  scene.add(root);

  // ---- Cargas (GLBs dos módulos): pronto / progresso ---------------------------
  const cargas = [];
  let assentadas = 0;
  const carregar = (promessa) => {
    const p = Promise.resolve(promessa);
    cargas.push(p);
    const fim = () => {
      assentadas++;
    };
    p.then(fim, fim);
    return p;
  };
  const pronto = async () => {
    let n;
    do {
      n = cargas.length;
      await Promise.allSettled(cargas.slice());
    } while (n !== cargas.length);
    await new Promise((r) => setTimeout(r, 0));
  };

  // ---- Lotes compartilhados: objetos fixos (cor por vértice) e atlas ---------------
  const lote = criarLote();
  const { tex, regioes } = criarAtlas(pal, lite);
  track(tex);
  const atlas = criarLote({ uv: true });
  const matInst = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, flatShading: true }));
  const dummy = new THREE.Object3D();
  const instanciar = (geo, lista, { cast = true } = {}) => {
    track(geo);
    const mesh = new THREE.InstancedMesh(geo, matInst, Math.max(1, lista.length));
    mesh.count = lista.length;
    lista.forEach((it, i) => {
      dummy.position.set(it.x, it.h ?? 0, it.z);
      dummy.rotation.set(0, it.giro ?? 0, 0);
      dummy.scale.setScalar(it.s ?? 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, it.cor ?? white);
    });
    mesh.castShadow = cast && !lite;
    mesh.receiveShadow = !lite;
    root.add(mesh);
    return mesh;
  };

  // Reservas: tiles/áreas com algo em cima (para o próximo módulo não
  // plantar árvore nem cone ali).
  const reservas = [];
  const reservar = (x0, x1, y0, y1) => {
    reservas.push((x, y) => {
      const tx = Math.round(x);
      const ty = Math.round(y);
      return tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1;
    });
  };
  const reservarArea = (cx, cy, rx, ry) => {
    reservas.push((x, y) => Math.abs(cx - x) < rx && Math.abs(cy - y) < ry);
  };
  const ocupado = (x, y) => c.andavel.has(chave(Math.round(x), Math.round(y))) || reservas.some((f) => f(x, y));

  // ---- Partículas: faíscas e fogos (um pool), confete --------------------------
  const MAX_FAISCAS = lite ? 60 : 180;
  const geoFaisca = track(new THREE.OctahedronGeometry(0.06, 0));
  const matFaisca = track(new THREE.MeshBasicMaterial({ color: white, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  const faiscas = new THREE.InstancedMesh(geoFaisca, matFaisca, MAX_FAISCAS);
  faiscas.count = 0;
  faiscas.frustumCulled = false;
  root.add(faiscas);
  const vivas = []; // { p: Vector3, v: Vector3, vida, total, cor }
  const coresFaisca = [pv("yellow-400"), white, pv("yellow-500"), pv("blue-300")];
  const coresFogos = [pv("red-400"), pv("yellow-400"), pv("blue-300"), pv("green-500"), white];
  const soltar = (origem, n, { vel = 2.5, sobe = 2, vida = 0.7, cores = coresFaisca, espalha = 0, tam = 1 }) => {
    for (let i = 0; i < n && vivas.length < MAX_FAISCAS; i++) {
      const d = new THREE.Vector3(rand() - 0.5, rand() - 0.2, rand() - 0.5).normalize();
      const p = origem.clone();
      if (espalha) p.x += (rand() - 0.5) * espalha;
      vivas.push({ p, v: d.multiplyScalar(vel * (0.5 + rand() * 0.6)).add(new THREE.Vector3(0, sobe * rand(), 0)), vida: vida * (0.6 + rand() * 0.5), total: vida, tam, cor: cores[Math.floor(rand() * cores.length)] });
    }
  };

  const MAX_CONFETE = lite ? 120 : 260;
  const geoConfete = track(new THREE.PlaneGeometry(0.09, 0.13));
  const matConfete = track(new THREE.MeshBasicMaterial({ color: white, side: THREE.DoubleSide }));
  const confete = new THREE.InstancedMesh(geoConfete, matConfete, MAX_CONFETE);
  confete.count = 0;
  confete.frustumCulled = false;
  root.add(confete);
  const papeis = [];
  const coresConfete = [pv("red-500"), pv("yellow-500"), pv("blue-500"), pv("green-500"), white, pv("blue-700")];

  // ---- Luzes: hemisfério e sol que acompanha o jogador ----------------------------
  const ceu = mix(mix(pv("blue-100"), white, 0.5), pv("green-500"), 0.06);
  scene.background = ceu;
  scene.fog = new THREE.Fog(ceu, 26, 62);
  const hemi = new THREE.HemisphereLight(mix(pv("blue-200"), white, 0.2), mix(pv("green-600"), pv("yellow-800"), 0.35), lite ? 2.1 : 1.5);
  root.add(hemi);
  const sol = new THREE.DirectionalLight(mix(white, pv("yellow-400"), 0.24), lite ? 1.9 : 2.2);
  const SOL_DIR = new THREE.Vector3(10, 13.5, 7).normalize().multiplyScalar(30);
  if (!lite) {
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    const sc = sol.shadow.camera;
    sc.left = -15;
    sc.right = 15;
    sc.top = 15;
    sc.bottom = -15;
    sc.near = 5;
    sc.far = 60;
    sol.shadow.bias = -0.0004;
    sol.shadow.normalBias = 0.03;
    sol.shadow.radius = 3;
  }
  root.add(sol, sol.target);
  const jogador = new THREE.Vector3().copy(tileToWorld(CHEGADA.x, CHEGADA.y));
  let jogadorRef = null;
  const posicionarSol = () => {
    const alvo = jogadorRef ?? jogador;
    // "Gruda" o centro numa grade de 1 unidade: a sombra não treme ao andar.
    const cx = Math.round(alvo.x);
    const cz = Math.round(alvo.z) - 2;
    sol.target.position.set(cx, 0, cz);
    sol.position.set(cx + SOL_DIR.x, SOL_DIR.y, cz + SOL_DIR.z);
  };
  posicionarSol();

  // ---- Módulos (contrato em comum.js) ---------------------------------------------
  const ctx = {
    pal,
    pv,
    mix,
    white,
    cor: criarCores(pal),
    lite,
    reducedMotion,
    c,
    pts,
    checkpoints,
    N,
    portico,
    zonas: criarZonas(c),
    scene,
    root,
    track,
    semente,
    lote,
    add: (geo, cr) => lote.add(geo, cr),
    atlas,
    regioes,
    placa: criarPlaca(atlas, regioes),
    bandeira: criarBandeira(atlas, regioes),
    matInst,
    vertexColored,
    instanciar,
    reservar,
    reservarArea,
    ocupado,
    soltar,
    coresFaisca,
    coresFogos,
    carregar,
    loader,
    baseUrl,
    jogador: () => jogadorRef,
  };
  const modulos = [];
  for (const [nome, montar] of MODULOS) {
    try {
      modulos.push({ nome, ...(montar(ctx) ?? {}) });
    } catch (e) {
      console.error(`[pista] o módulo "${nome}" falhou ao montar`, e);
    }
  }
  // Repassa um evento a todos os módulos (um que quebra no update para de
  // ser chamado ali, sem encher o console a cada quadro).
  const avisar = (evento, ...args) => {
    for (const m of modulos) {
      if (typeof m[evento] !== "function" || m.quebrado?.[evento]) continue;
      try {
        m[evento](...args);
      } catch (e) {
        m.quebrado = { ...m.quebrado, [evento]: true };
        console.error(`[pista] o módulo "${m.nome}" falhou em ${evento}`, e);
      }
    }
  };
  const tracado = modulos.find((m) => m.nome === "tracado");
  const centroChegada = tracado?.centroChegada ?? new THREE.Vector3(wx(portico.fx), portico.alt, wz((portico.fyN + portico.fyS) / 2));

  // Fecha os lotes compartilhados (depois de todos os módulos).
  const matLote = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05 }));
  const meshLote = lote.fechar(matLote);
  if (meshLote) {
    track(meshLote.geometry);
    meshLote.castShadow = !lite;
    meshLote.receiveShadow = !lite;
    root.add(meshLote);
  }
  const matAtlas = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0, side: THREE.DoubleSide }));
  const meshAtlas = atlas.fechar(matAtlas);
  if (meshAtlas) {
    track(meshAtlas.geometry);
    meshAtlas.castShadow = false;
    meshAtlas.receiveShadow = !lite;
    root.add(meshAtlas);
  }

  // ---- Estado da corrida (festa) ----------------------------------------------------
  let festaT = -1;
  let tempo = 0;

  function festa() {
    festaT = 0;
    papeis.length = 0;
    const centro = centroChegada;
    for (let i = 0; i < MAX_CONFETE; i++) {
      const p = new THREE.Vector3(centro.x + (rand() - 0.5) * 12, reducedMotion ? 0.04 + rand() * 0.02 : 3 + rand() * 4, centro.z + (rand() - 0.5) * 7);
      // Com reducedMotion: confete parado no chão e alguns "no ar" fixos.
      if (reducedMotion && rand() < 0.3) p.y = 0.6 + rand() * 2.4;
      papeis.push({ p, v: -0.6 - rand() * 0.6, giro: new THREE.Euler(rand() * 6, rand() * 6, rand() * 6), w: 2 + rand() * 4, fase: rand() * 6, cor: coresConfete[i % coresConfete.length] });
    }
    confete.count = papeis.length;
    papeis.forEach((pp, i) => confete.setColorAt(i, pp.cor));
    if (confete.instanceColor) confete.instanceColor.needsUpdate = true;
    atualizarConfete(0);
    avisar("festa");
  }

  function atualizarConfete(dt) {
    papeis.forEach((pp, i) => {
      if (!reducedMotion && pp.p.y > 0.03) {
        pp.p.y = Math.max(0.03, pp.p.y + pp.v * dt);
        pp.p.x += Math.sin(tempo * pp.w + pp.fase) * dt * 0.4;
        pp.giro.x += dt * pp.w;
        pp.giro.y += dt * pp.w * 0.7;
      }
      if (pp.p.y <= 0.031) pp.giro.set(-Math.PI / 2, pp.giro.y, 0);
      dummy.position.copy(pp.p);
      dummy.rotation.copy(pp.giro);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      confete.setMatrixAt(i, dummy.matrix);
    });
    confete.instanceMatrix.needsUpdate = true;
  }

  // ---- Interface do interior ------------------------------------------------------
  const saidas = new Map(PORTAO.map(([x, y]) => [chave(x, y), "rua"]));
  const saidaEm = (x, y) => saidas.get(chave(x, y)) ?? null;
  const INFO_REGRAS = {
    id: "pista-regras",
    titulo: "Regras da corrida",
    texto:
      "Duas voltas. Passe pelos arcos na ordem: o que brilha em amarelo é o próximo. A volta fecha no pórtico de LARGADA · CHEGADA. Para voltar para a Vila, saia pelo portão do box.",
    tiles: [[PLACA_REGRAS.x, PLACA_REGRAS.y]],
  };
  const infoPorTile = new Map(INFO_REGRAS.tiles.map(([x, y]) => [chave(x, y), INFO_REGRAS]));
  const cpPorTile = new Map();
  checkpoints.forEach((cp, i) => cp.corte.forEach(([x, y]) => cpPorTile.set(chave(x, y), i)));
  const tilesPorVolta = medirVolta(c, [LARGADA.x, LARGADA.y], VOLTAS);

  const corrida = {
    largada: { ...LARGADA },
    voltas: VOLTAS,
    checkpoints: checkpoints.map((cp) => ({ id: cp.id, tiles: cp.corte.map((t) => [...t]) })),
    saidaVila: PORTAO.map((t) => [...t]),
    // Caminho mais curto por volta (tiles) da largada, na ordem (medirVolta).
    tilesPorVolta,
  };

  const temp = new THREE.Vector3();
  return {
    scene,
    MW,
    MH,
    tileToWorld,
    // Chega-se da Vila pelo portão do box (logo atrás da chegada).
    chegada: { ...CHEGADA },
    entradaRua: { ...CHEGADA },
    porta: { tile: PORTAO[0] },
    // Câmera do motor: multiplicar a distância por isto (vê mais pista à
    // frente de bicicleta). Os interiores do prédio usam MUSEU_ZOOM = 1.
    zoom: ZOOM,
    piso: "asfalto",
    passable: (x, y) => c.passable(x, y),
    // Bicicleta: corredor contínuo do asfalto (ver vila-engine, colidir).
    // Coordenadas de tile do motor: o tile (x, y) cobre [x, x + 1), daí o
    // −0,5 (aqui o centro do tile é o ponto inteiro).
    corredor: {
      raio: RAIO_ASFALTO + CORREDOR_FOLGA,
      perto: (px, py) => c.corredor(px - 0.5, py - 0.5),
      // Tiles que o círculo da bicicleta (raio < 0,3) pode tocar sem o
      // centro sair do corredor: esses a grade não bloqueia.
      cobre: (x, y) => y < MURO_Y && c.distancia(x, y) <= RAIO_ASFALTO + CORREDOR_FOLGA + 0.3 + Math.SQRT1_2,
      box: (x, y) => c.box.has(chave(x, y)),
    },
    inBounds: (x, y) => x >= 0 && y >= 0 && x < MW && y < MH,
    saidaEm,
    ehPorta: (x, y) => saidaEm(x, y) !== null,
    infoEm: (x, y) => infoPorTile.get(chave(x, y)) ?? null,
    infos: [INFO_REGRAS],
    // Índice do checkpoint no tile (x, y) ou -1.
    checkpointEm: (x, y) => cpPorTile.get(chave(x, y)) ?? -1,
    corrida,
    // Eventos da corrida: os módulos fazem o visual (arcos e semáforo são
    // do traçado).
    setProximo: (i) => avisar("setProximo", i),
    passou: (i) => avisar("passou", i),
    largada: (fase) => avisar("largada", fase),
    festa,
    // Sem quadros nem pessoas que falam aqui.
    pessoaEm: () => null,
    quadroNaParede: () => null,
    quadroVisto: () => null,
    pontoDeVista: () => null,
    ids: [],
    pose: () => null,
    hitQuadros: [],
    hitPessoas: [],
    setDestaque() {},
    setPerto() {},
    falar() {},
    // Posição viva do jogador (Vector3 da cena) ou null: o sol (e a sombra)
    // acompanham.
    setJogador(v) {
      jogadorRef = v ?? null;
      posicionarSol();
    },
    // Portão do box: 0 fechado, 1 aberto (desliza para o leste).
    abrirPorta: (k) => avisar("abrirPorta", k),
    // Cargas dos módulos (ctx.carregar): espera todas / fração assentada.
    pronto,
    progresso: () => (cargas.length ? assentadas / cargas.length : 1),
    update(t, dt) {
      tempo = t;
      posicionarSol();
      avisar("update", t, dt);
      // Festa: confete caindo e fogos sobre a reta da chegada nos primeiros 5 s
      // (baixos e um pouco ao sul: a câmera alta vê o que fica perto do jogador).
      if (festaT >= 0) {
        festaT += dt;
        if (!reducedMotion) {
          atualizarConfete(dt);
          if (!lite && festaT < 5 && Math.floor((festaT - dt) / 0.7) !== Math.floor(festaT / 0.7)) {
            temp.set(wx(portico.fx + (rand() - 0.5) * 12), 3 + rand(), wz(ARQUIBANCADA.y1 + 2 + rand() * 3));
            soltar(temp, 36, { vel: 3.2, sobe: 0.4, vida: 1.1, cores: coresFogos, tam: 2.4 });
          }
        }
      }
      // Faíscas e fogos: gravidade, somem encolhendo.
      for (let i = vivas.length - 1; i >= 0; i--) {
        const s = vivas[i];
        s.vida -= dt;
        if (s.vida <= 0) {
          vivas.splice(i, 1);
          continue;
        }
        s.v.y -= 5.5 * dt;
        s.p.addScaledVector(s.v, dt);
      }
      faiscas.count = vivas.length;
      vivas.forEach((s, i) => {
        dummy.position.copy(s.p);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(Math.max(0.2, s.vida / s.total) * 1.4 * s.tam);
        dummy.updateMatrix();
        faiscas.setMatrixAt(i, dummy.matrix);
        faiscas.setColorAt(i, s.cor);
      });
      if (vivas.length) {
        faiscas.instanceMatrix.needsUpdate = true;
        if (faiscas.instanceColor) faiscas.instanceColor.needsUpdate = true;
      }
    },
    dispose() {
      avisar("dispose");
      root.removeFromParent();
      root.traverse((o) => {
        if (o.isInstancedMesh) o.dispose();
      });
      for (const d of proprios) d.dispose?.();
      proprios.length = 0;
    },
  };
}
