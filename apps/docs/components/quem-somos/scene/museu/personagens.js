// Galeria da Equipe: o time em 3D, cada um ao lado do próprio quadro.
//
// Mesmos GLBs, alturas e mascotes da Vila (scene/walkers.js, scene/pedro.js,
// scene/pets.js): o dono é ajustado com fitModel/createClips de
// scene/companion.js e o mascote reusa o comportamento de pets.js, então os
// dois têm aqui a mesma cara e o mesmo jeito de lá. A diferença é que aqui
// ninguém passeia: o dono fica no tile `pessoa` do slot (layout.js) e o
// mascote fica ao lado, no mesmo tile, do lado oposto ao quadro (para não
// cobrir a moldura) e um tico para dentro da sala.
//
// O Pedro não tem mascote em pets.js: o dele é a ocarina (ocarina.glb), que
// flutua ao lado dele girando devagar. Quando ele dança (falar), a ocarina
// do próprio pedro.glb entra orbitando e a flutuante se esconde.
//
// O Gava (Vinicius) está lá fora, na porta da SEMEC, entregando a primeira
// linguagem (scene/vinicius.js), então o slot dele (o último) ganha um
// cavalete com o notebook aberto e uma plaquinha "lá fora, na SEMEC".
//
// Vida (fora do movimento reduzido). Os GLBs dos donos só têm `parado` e
// `andando` (o Pedro tem também `entrada` e `dancando`), então as variações
// do parado são feitas com eles e com o osso `Head`:
//   - olhar em volta: a cabeça vira para um lado e volta;
//   - trocar o peso: o corpo pende devagar para o outro lado e fica;
//   - passinho: vira o corpo com uns passos de `andando` no lugar (para o
//     salão ou para admirar o próprio quadro) e depois volta do mesmo jeito;
//   - o Pedro, de vez em quando, toca a ocarina e dança.
// O mascote se apresenta sozinho em intervalos (sorteio determinístico por
// slot: a mesma sequência a cada visita, mas cada um no seu ritmo).
//
// Jogador perto (≤ 2 tiles): a pessoa vira o corpo e a cabeça para ele, e o
// mascote também espia; quando ele se afasta, voltam à pose. É uma checagem
// de distância por quadro (em rodízio entre as pessoas). A posição vem de
// `setJogador(vec3 | null)` (o motor passa a Vector3 viva do jogador, na
// cena do museu, uma vez ao entrar e null ao sair) ou da opção
// `posJogador: () => Vector3 | null`.
//
// Falar (motor: "Espaço: falar"): o dono vira para o jogador (com passinhos
// se o giro for grande), dá dois pulinhos e acena com a cabeça (o Pedro
// dança), e o mascote comemora com as duas apresentações dele; depois de uns
// segundos os dois voltam à pose. Com movimento reduzido, tudo fica parado
// na pose e falar só vira os dois.
//
// Cada GLB entra quando carrega; se um falhar, aquele fica de fora.

import * as THREE from "three";
import { ORDEM } from "../../museu-dados";
import { createClips, createHitProxy, disposeHitProxy, fitModel } from "../companion";
import { bunnyPet, livroPet, microfonePet, renaPet, samuraiPet, wafflePet } from "../pets";
import { arquivoLeve } from "../qualidade";
import { SLOTS, tileToWorld } from "./layout";

const ALTURA_DONO = 0.98; // a mesma da Vila (companion.js e pedro.js)
const FALA_SEGUNDOS = 4.5; // olhando para o jogador antes de voltar à pose
const GIRO = 8; // velocidade da virada do corpo (maior = mais rápida)
const SHOW_GAP = [9, 17]; // mascote se apresenta sozinho (mín., máx., s)
const IDLE_GAP = [2.5, 6]; // entre as variações do parado (mín., máx., s)
// Para os slots das paredes oeste e leste: quanto o dono vira para o meio.
const VIRADA_LATERAL = 0.35;
// Posição dentro do tile (ao longo da parede, para longe do quadro; e para
// dentro da sala).
const DONO_AO_LONGO = 0.08;
const PET_AO_LONGO = 0.4;
const PET_PARA_DENTRO = 0.16;
// Pulinhos do dono ao falar e o "sim" com a cabeça logo depois.
const PULO = { dur: 0.8, altura: 0.07, vezes: 2 };
const ACENO = { dur: 0.9, angulo: 0.32, vezes: 2 };
// Jogador perto (até 2 tiles, contando o "cavalo" 2×1): raio para reparar
// e para soltar (histerese), em tiles.
const PERTO = 2.5;
const LONGE = 3;
// Quanto o corpo e a cabeça (além do corpo) viram para olhar alguém (rad).
const CORPO_MAX = 0.5;
const CABECA_MAX = 0.75;
// Velocidade da cabeça: dois amortecimentos exponenciais em série (a
// velocidade também começa e termina suave, sem tranco ao trocar de alvo).
const CABECA_GIRO = 9;
// Quanto o giro por cima do clipe vale (0 enquanto o Pedro dança: o clipe
// já mexe a cabeça) e com que rapidez esse peso muda.
const CABECA_PESO_GIRO = 5;
const MASC_MAX = 0.7; // o mascote espia o jogador até este ângulo
// Passinho: giros maiores que isto são feitos andando no lugar.
const PASSO = { limiar: 0.6, dur: 0.55 };

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a) => Math.max(-a, Math.min(a, v));
const suave = (dt, k) => 1 - Math.exp(-dt * k);

// Sorteio determinístico (mulberry32): cada slot tem a sua sequência.
function sorteador(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 1831565813) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const entre = (rng, [a, b]) => a + rng() * (b - a);

// Duplas da Vila: arquivo do dono, ficha e arquivo do mascote, comportamento
// e as apresentações dele (a primeira é a de falar, como `talkShow`).
const DUPLAS = {
  pedro: { owner: "pedro.glb", petId: "ocarina", petFile: "ocarina.glb" },
  rafa: { owner: "rafa.glb", petId: "waffle", petFile: "rafa-waffle.glb", pet: () => wafflePet({}), shows: ["danca", "giro"] },
  leo: {
    owner: "leo.glb",
    petId: "samurai",
    petFile: "leo-samurai.glb",
    pet: ({ pal }) => samuraiPet({ slashColor: pal.white }),
    shows: ["ataque", "taichi"],
  },
  mariana: { owner: "mariana.glb", petId: "rena", petFile: "mariana-rena.glb", pet: () => renaPet({}), shows: ["alegria", "timida"] },
  tiago: { owner: "tiago.glb", petId: "coelho", petFile: "tiago-coelho.glb", pet: () => bunnyPet({}), shows: ["mortal", "pulinhos"] },
  "ze-carlos": { owner: "ze-carlos.glb", petId: "livro", petFile: "ze-carlos-livro.glb", pet: () => livroPet({}), shows: ["sabio", "cambalhota"] },
  emily: { owner: "emily.glb", petId: "microfone", petFile: "emily-microfone.glb", pet: () => microfonePet({}), shows: ["cantar", "giro"] },
};

// Apresentação da ocarina do Pedro (ela não tem pets.js): sobe girando
// rápido, dá uma cambalhota de lado e pousa de volta.
const OCARINA_SHOW = 1.4;

// Onde fica cada um no slot: centro do tile, direção "ao longo da parede"
// (do quadro para o dono), direção "para dentro" (normal do quadro) e o
// ângulo da pose (sul; nas laterais, um pouco virado para o meio).
function poseDoSlot(slot) {
  const [nx, nz] = slot.normal;
  const centro = tileToWorld(slot.pessoa[0], slot.pessoa[1]);
  const ao = nz
    ? new THREE.Vector3(Math.sign(slot.pessoa[0] - slot.parede[0]), 0, 0)
    : new THREE.Vector3(0, 0, Math.sign(slot.pessoa[1] - slot.parede[1]));
  const dentro = new THREE.Vector3(nx, 0, nz);
  const yaw = nz ? 0 : nx > 0 ? VIRADA_LATERAL : -VIRADA_LATERAL;
  return { centro, ao, dentro, yaw };
}

// Libera malhas, materiais e texturas de um GLB carregado aqui.
function liberarArvore(obj) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry?.dispose();
    for (const m of [].concat(o.material ?? [])) {
      for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
      m.dispose();
    }
  });
}

// O `parado` da maioria dos GLBs não fecha o loop (a última pose fica longe
// da primeira: o quadril, por exemplo, termina 0,5 rad girado) e o corpo
// todo estala a cada volta. Aqui o clipe vira um vaivém (ida e volta, o
// dobro da duração), que emenda sem salto. Clipes que já fecham (Rafa) ou
// com interpolação que não seja linear/degrau ficam como estão.
const _qA = new THREE.Quaternion();
const _qB = new THREE.Quaternion();
function semEmenda(clip) {
  let emenda = 0;
  for (const tr of clip.tracks) {
    const n = tr.times.length;
    if (tr.getInterpolation() === THREE.InterpolateSmooth || tr.values.length !== n * tr.getValueSize()) return clip;
    if (n < 2 || !(tr instanceof THREE.QuaternionKeyframeTrack)) continue;
    _qA.fromArray(tr.values, 0).normalize();
    _qB.fromArray(tr.values, (n - 1) * 4).normalize();
    emenda = Math.max(emenda, _qA.angleTo(_qB));
  }
  if (emenda < 0.05) return clip;
  const T = clip.duration;
  const tracks = clip.tracks.map((tr) => {
    const n = tr.times.length;
    if (n < 2) return tr;
    const s = tr.getValueSize();
    const times = new Float32Array(2 * n - 1);
    const values = new Float32Array((2 * n - 1) * s);
    times.set(tr.times);
    values.set(tr.values);
    for (let k = 1; k < n; k++) {
      const src = n - 1 - k;
      times[n - 1 + k] = 2 * T - tr.times[src];
      values.set(tr.values.subarray(src * s, (src + 1) * s), (n - 1 + k) * s);
    }
    const novo = new tr.constructor(tr.name, times, values);
    novo.setInterpolation(tr.getInterpolation());
    return novo;
  });
  return new THREE.AnimationClip(clip.name, 2 * T, tracks);
}

// Temporários do giro da cabeça (sem alocar por quadro).
const _qPai = new THREE.Quaternion();
const _qRaiz = new THREE.Quaternion();
const _qGiro = new THREE.Quaternion();
const _qAceno = new THREE.Quaternion();
const _eixoY = new THREE.Vector3();
const _eixoX = new THREE.Vector3();

export function createPersonagens({ scene, loader, baseUrl, lite = false, reducedMotion = false, pal, track, posJogador = null }) {
  const grupo = new THREE.Group();
  grupo.name = "museu-personagens";
  scene.add(grupo);
  const hitProxies = [];
  const pessoas = new Map(); // id → estado
  const lista = []; // os mesmos estados, para o rodízio da checagem
  const porTile = new Map(); // "x,y" → id
  const carregados = []; // raízes dos GLBs (para liberar)
  let disposed = false;
  let relogio = 0;
  let vez = 0; // quem tem a checagem de distância neste quadro
  let jogador = null; // Vector3 viva do jogador (setJogador)
  let cavalete = null; // { root, cursor } do slot do Gava

  // Sombra de bolha embaixo de cada um (geometria e material compartilhados).
  const blobMat = track(new THREE.MeshBasicMaterial({ color: pal.black, transparent: true, opacity: 0.18, depthWrite: false }));
  const blobGeo = track(new THREE.CircleGeometry(1, 20));
  function raiz(pos, raio) {
    const r = new THREE.Group();
    r.position.copy(pos);
    const blob = new THREE.Mesh(blobGeo, blobMat);
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.01;
    blob.scale.setScalar(raio);
    r.add(blob);
    grupo.add(r);
    return r;
  }

  const carregar = (nome) =>
    loader.loadAsync(baseUrl + arquivoLeve(nome, lite)).then((gltf) => {
      if (disposed) {
        liberarArvore(gltf.scene);
        throw new Error("descartado");
      }
      carregados.push(gltf.scene);
      return gltf;
    });

  ORDEM.forEach((id, i) => {
    const slot = SLOTS[i];
    if (!slot) return;
    const dupla = DUPLAS[id];
    if (!dupla) {
      if (id === "gava") criarCavalete(slot);
      return;
    }
    criarDupla(id, i, slot, dupla);
  });

  function criarDupla(id, i, slot, dupla) {
    const { centro, ao, dentro, yaw } = poseDoSlot(slot);
    const pet = dupla.pet ? dupla.pet({ pal }) : null;
    const petRaio = pet?.shadowSize ?? 0.14;
    const dono = { root: raiz(centro.clone().addScaledVector(ao, DONO_AO_LONGO), 0.3), yaw };
    const corpo = new THREE.Group(); // entre a raiz e o modelo: pulinhos e peso
    dono.root.add(corpo);
    const masc = {
      root: raiz(centro.clone().addScaledVector(ao, PET_AO_LONGO).addScaledVector(dentro, PET_PARA_DENTRO), petRaio),
      yaw,
    };
    dono.root.rotation.y = masc.root.rotation.y = yaw;
    hitProxies.push(createHitProxy(dono.root, id, 0.28, ALTURA_DONO));
    hitProxies.push(createHitProxy(masc.root, dupla.petId, petRaio + 0.08, pet ? 0.55 : 0.8)); // ocarina: no ar
    const rng = sorteador(i * 9973 + 17);
    // Lado (sinal do giro) em que fica o próprio quadro, visto da pose.
    const ladoQuadro = Math.sign(wrap(Math.atan2(-ao.x, -ao.z) - yaw)) || 1;

    const p = {
      id,
      dupla,
      dono,
      corpo,
      masc,
      pet,
      rng,
      ladoQuadro,
      yawPose: yaw,
      yawFala: yaw,
      clips: null,
      fade: 0.25, // duração da troca de clipe em curso (tocar)
      cabeca: null, // osso Head (giro da cabeça por cima do clipe)
      ocarina: null,
      fala: 0,
      perto: false,
      dancando: false,
      passo: 0, // s restantes do passinho (`andando` no lugar)
      pulo: -1, // tempo dos pulinhos (-1 = parado)
      puloEspera: -1,
      aceno: -1, // tempo do "sim" com a cabeça
      acenoEspera: -1,
      cabecaPose: null, // pose do clipe no osso Head (sem o nosso giro)
      cabecaYaw: 0,
      cabecaMeio: 0, // primeiro estágio do amortecimento da cabeça
      cabecaPeso: 1,
      olharJog: null, // ângulo (mundo) até o jogador, quando perto
      olhar: 0, // giro da cabeça da variação "olhar em volta"
      olharT: 0,
      olharVolta: false, // depois de olhar para um lado, olha para o outro
      desvio: 0, // giro do corpo do passinho
      desvioT: 0,
      peso: 0,
      pesoAlvo: 0,
      idleWait: entre(rng, IDLE_GAP),
      showWait: 4 + ((i * 2.3) % 6),
      fila: null, // segunda apresentação do mascote ao falar
      ocShow: -1, // tempo da apresentação da ocarina
    };
    pessoas.set(id, p);
    lista.push(p);
    porTile.set(`${slot.pessoa[0]},${slot.pessoa[1]}`, id);

    carregar(dupla.owner)
      .then((gltf) => {
        const model = fitModel(gltf, ALTURA_DONO);
        corpo.add(model);
        const anims = gltf.animations.map((c) => (c.name === "parado" ? semEmenda(c) : c));
        p.clips = createClips(model, anims);
        model.traverse((o) => {
          if (!p.cabeca && o.isBone && o.name === "Head") p.cabeca = o;
        });
        // Fase do `parado` diferente para cada um (determinística pelo slot).
        const parado = p.clips.acts.parado;
        if (parado) parado.time = ((i * 0.37) % 1) * parado.getClip().duration;
        if (id === "pedro") prepararDanca(p);
        if (reducedMotion) {
          if (parado) parado.paused = true;
          p.clips.mixer.update(0);
        }
      })
      .catch(() => {});

    if (pet) {
      carregar(dupla.petFile)
        .then((gltf) => {
          pet.attach(masc.root, gltf);
          if (reducedMotion) pet.freeze();
        })
        .catch(() => {});
    } else if (id === "pedro") {
      carregar(dupla.petFile)
        .then((gltf) => {
          p.ocarina = montarOcarina(masc.root, gltf);
        })
        .catch(() => {});
    }
  }

  // Ocarina flutuante (o "mascote" do Pedro): o mesmo ajuste de tamanho do
  // esconderijo da quest (scene/quest.js), mas em pé e no ar.
  function montarOcarina(root, gltf) {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const k = 0.34 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(k);
    model.position.copy(box.getCenter(new THREE.Vector3()).multiplyScalar(-k));
    model.traverse((o) => {
      if (o.isMesh) o.castShadow = true;
    });
    const holder = new THREE.Group();
    holder.position.y = 0.55;
    holder.rotation.z = 0.25;
    holder.add(model);
    root.add(holder);
    return { holder, escala: 1 };
  }

  // Pedro: `entrada` (a ocarina surge girando) e uma volta de `dancando`,
  // como na Vila (scene/pedro.js); depois volta ao `parado`.
  function prepararDanca(p) {
    const { acts, mixer } = p.clips;
    if (!acts.entrada || !acts.dancando) return;
    acts.entrada.setLoop(THREE.LoopOnce, 1);
    acts.entrada.clampWhenFinished = true;
    acts.dancando.setLoop(THREE.LoopOnce, 1);
    acts.dancando.clampWhenFinished = true;
    mixer.addEventListener("finished", (e) => {
      if (e.action === acts.entrada) tocar(p, "dancando", 0.2);
      else if (e.action === acts.dancando) {
        p.dancando = false;
        tocar(p, "parado", 0.3);
      }
    });
  }

  function dancar(p) {
    const acts = p.clips?.acts;
    if (p.dancando || !acts?.entrada || !acts?.dancando) return false;
    p.dancando = true;
    p.passo = 0;
    tocar(p, "entrada", 0.2);
    return true;
  }

  // Troca de clipe com pesos amortecidos (misturarClipes, a cada quadro).
  // O clips.play de companion.js recomeça cada fade do peso cheio e volta o
  // clipe novo ao início: trocar de novo no meio de uma troca (o passinho
  // acaba e logo recomeça) dava um tranco no corpo e na cabeça. Aqui cada
  // clipe sai do peso em que está; um clipe ainda visível não volta ao início.
  function tocar(p, nome, fade = 0.25) {
    const c = p.clips;
    const next = c?.acts[nome];
    if (!next || next === c.current) return;
    // Os de uma volta só (entrada, dança) sempre recomeçam: senão o
    // "finished" não viria de novo.
    if (!next.isScheduled() || next.getEffectiveWeight() < 0.01 || next.loop === THREE.LoopOnce) {
      next.reset();
      next.setEffectiveWeight(0);
      next.play();
    }
    c.current = next;
    p.fade = fade;
  }

  function misturarClipes(p, dt) {
    const c = p.clips;
    if (!c?.current) return;
    // O clipe atual sobe em rampa (1 / fade por segundo, como o crossfade do
    // three) e os outros descem na mesma proporção: a soma continua 1.
    let antes = 0;
    for (const a of Object.values(c.acts)) if (a !== c.current && a.isScheduled()) antes += a.getEffectiveWeight();
    if (antes <= 0) {
      c.current.setEffectiveWeight(1);
      return;
    }
    const depois = Math.max(0, antes - dt / p.fade);
    const k = depois / antes;
    let resto = 0;
    for (const a of Object.values(c.acts)) {
      if (a === c.current || !a.isScheduled()) continue;
      const w = a.getEffectiveWeight() * k;
      if (w < 0.002) a.stop();
      else {
        a.setEffectiveWeight(w);
        resto += w;
      }
    }
    c.current.setEffectiveWeight(1 - resto);
  }

  // ---- Cavalete do Gava -------------------------------------------------------

  // Cavalete de madeira com o notebook aberto (código na tela, cursor
  // piscando) e uma plaquinha: o Gava saiu para programar lá fora.
  function criarCavalete(slot) {
    const { centro, yaw } = poseDoSlot(slot);
    const root = raiz(centro, 0.32);
    root.rotation.y = yaw;
    const madeira = track(new THREE.MeshStandardMaterial({ color: pal.woodLight, roughness: 0.8 }));
    const escuro = track(new THREE.MeshStandardMaterial({ color: pal.pv("gray-800"), roughness: 0.5, metalness: 0.2 }));
    const malha = (geo, mat) => {
      const m = new THREE.Mesh(track(geo), mat);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    };

    // Pernas: duas na frente, abertas, e uma atrás, todas se juntando no topo.
    const perna = (pe, topo) => {
      const a = new THREE.Vector3(...pe);
      const b = new THREE.Vector3(...topo);
      const m = malha(new THREE.BoxGeometry(0.035, a.distanceTo(b), 0.035), madeira);
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      root.add(m);
    };
    perna([-0.24, 0, 0.14], [-0.07, 1.12, 0.0]);
    perna([0.24, 0, 0.14], [0.07, 1.12, 0.0]);
    perna([0, 0, -0.3], [0, 1.08, -0.04]);

    // Prateleira onde o notebook fica apoiado.
    const prateleira = malha(new THREE.BoxGeometry(0.56, 0.035, 0.24), madeira);
    prateleira.position.set(0, 0.64, 0.1);
    root.add(prateleira);

    // Notebook: base e tela abertas, de frente para a sala.
    const note = new THREE.Group();
    note.position.set(0, 0.66, 0.12);
    root.add(note);
    const base = malha(new THREE.BoxGeometry(0.36, 0.018, 0.22), escuro);
    base.position.y = 0.009;
    note.add(base);
    const dobra = new THREE.Group();
    dobra.position.set(0, 0.018, -0.105);
    dobra.rotation.x = -0.32;
    note.add(dobra);
    const tampa = malha(new THREE.BoxGeometry(0.36, 0.24, 0.014), escuro);
    tampa.position.set(0, 0.12, 0);
    dobra.add(tampa);

    // Tela: código colorido em canvas (cores da paleta).
    const tela = document.createElement("canvas");
    tela.width = 256;
    tela.height = 160;
    const c = tela.getContext("2d");
    c.fillStyle = pal.pv("gray-900").getStyle();
    c.fillRect(0, 0, 256, 160);
    const linhas = [
      [0, 0.55], [1, 0.7], [1, 0.45], [2, 0.6], [2, 0.35], [1, 0.5], [0, 0.3], [0, 0.6],
    ];
    linhas.forEach(([recuo, larg], n) => {
      c.fillStyle = pal.screenAccent[n % pal.screenAccent.length].getStyle();
      c.fillRect(16 + recuo * 18, 14 + n * 17, (200 - recuo * 18) * larg, 8);
    });
    const texTela = track(new THREE.CanvasTexture(tela));
    texTela.colorSpace = THREE.SRGBColorSpace;
    const telaMesh = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.32, 0.2)),
      track(new THREE.MeshBasicMaterial({ map: texTela, toneMapped: false }))
    );
    telaMesh.position.set(0, 0.12, 0.0075);
    dobra.add(telaMesh);
    const cursor = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.012, 0.016)),
      track(new THREE.MeshBasicMaterial({ color: pal.white, toneMapped: false }))
    );
    // Logo depois da última linha de código.
    cursor.position.set(-0.16 + (16 + 200 * 0.6 + 6) / 256 * 0.32, 0.12 + 0.1 - (14 + 7 * 17 + 4) / 160 * 0.2, 0.008);
    dobra.add(cursor);

    // Plaquinha no topo do cavalete.
    const placa = document.createElement("canvas");
    placa.width = 512;
    placa.height = 256;
    const g = placa.getContext("2d");
    g.fillStyle = pal.white.getStyle();
    g.strokeStyle = pal.pv("yellow-800").getStyle();
    g.lineWidth = 14;
    g.beginPath();
    g.roundRect(10, 10, 492, 236, 28);
    g.fill();
    g.stroke();
    g.fillStyle = pal.pv("gray-900").getStyle();
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `700 92px ${pal.font}`;
    g.fillText("Vinicius", 256, 104, 460);
    g.fillStyle = pal.pv("blue-700").getStyle();
    g.font = `600 42px ${pal.font}`;
    g.fillText("lá fora, na SEMEC", 256, 190, 460);
    const texPlaca = track(new THREE.CanvasTexture(placa));
    texPlaca.colorSpace = THREE.SRGBColorSpace;
    texPlaca.anisotropy = 4;
    const moldura = malha(new THREE.BoxGeometry(0.46, 0.25, 0.025), madeira);
    moldura.position.set(0, 1.02, 0.045);
    moldura.rotation.x = -0.12;
    root.add(moldura);
    const plaquinha = new THREE.Mesh(
      track(new THREE.PlaneGeometry(0.42, 0.21)),
      track(new THREE.MeshStandardMaterial({ map: texPlaca, roughness: 0.9 }))
    );
    plaquinha.position.z = 0.0135;
    moldura.add(plaquinha);

    cavalete = { root, cursor };
  }

  // ---- Animação ---------------------------------------------------------------

  // Variação do parado (sorteada pelo slot). Não roda conversando, com o
  // jogador perto ou dançando.
  function variarParado(p) {
    const r = p.rng();
    const lado = p.rng() < 0.5 ? -1 : 1;
    if (r < 0.38) {
      // Olhar em volta: um lado e, às vezes, o outro em seguida.
      p.olhar = lado * (0.4 + 0.3 * p.rng());
      p.olharT = 1.3 + 1.2 * p.rng();
      p.olharVolta = p.rng() < 0.45;
    } else if (r < 0.66) {
      // Trocar o peso de perna (fica assim até a próxima troca).
      p.pesoAlvo = -(Math.sign(p.pesoAlvo) || lado) * (0.6 + 0.4 * p.rng());
    } else if (r < 0.9 || p.id !== "pedro") {
      // Passinho: vira para o salão ou para admirar o próprio quadro (com a
      // cabeça acompanhando), espera e volta.
      const praQuadro = r >= 0.82;
      const sinal = praQuadro ? p.ladoQuadro : lado;
      p.desvio = sinal * (0.7 + 0.2 * p.rng());
      p.desvioT = 2 + 1.5 * p.rng();
      if (praQuadro) {
        p.olhar = sinal * 0.6;
        p.olharT = p.desvioT;
        p.olharVolta = false;
      }
    } else {
      // Pedro: um pedacinho de show com a ocarina.
      dancar(p);
    }
  }

  // Gira o osso da cabeça por cima do clipe (que acabou de ser aplicado pelo
  // mixer): `yaw` em volta do "para cima" do mundo e `aceno` em volta do eixo
  // lateral do corpo, ambos convertidos para o espaço do pescoço.
  function virarCabeca(p, yaw, aceno) {
    const head = p.cabeca;
    head.parent.getWorldQuaternion(_qPai).invert();
    _eixoY.set(0, 1, 0).applyQuaternion(_qPai);
    p.dono.root.getWorldQuaternion(_qRaiz);
    _eixoX.set(1, 0, 0).applyQuaternion(_qRaiz).applyQuaternion(_qPai);
    _qGiro.setFromAxisAngle(_eixoY, yaw);
    _qAceno.setFromAxisAngle(_eixoX, aceno);
    head.quaternion.premultiply(_qGiro.multiply(_qAceno));
  }

  function atualizar(p, dt, jog) {
    const { dono, masc } = p;
    const conversando = p.fala > 0;
    if (conversando) p.fala -= dt;

    // Para onde cada um olha: conversa > jogador perto > variação > pose.
    let alvoDono = p.yawPose + p.desvio;
    let alvoMasc = p.yawPose;
    p.olharJog = null;
    if (conversando) {
      alvoDono = alvoMasc = p.yawFala;
    } else if (p.perto && jog && !reducedMotion) {
      p.olharJog = Math.atan2(jog.x - dono.root.position.x, jog.z - dono.root.position.z);
      alvoDono = p.yawPose + clamp(wrap(p.olharJog - p.yawPose), CORPO_MAX);
      const relMasc = wrap(Math.atan2(jog.x - masc.root.position.x, jog.z - masc.root.position.z) - p.yawPose);
      alvoMasc = p.yawPose + clamp(relMasc, MASC_MAX);
    }

    if (reducedMotion) {
      dono.yaw = alvoDono;
      masc.yaw = alvoMasc;
      dono.root.rotation.y = dono.yaw;
      masc.root.rotation.y = masc.yaw;
      return;
    }

    // Giro grande: passinhos no lugar enquanto vira.
    const falta = wrap(alvoDono - dono.yaw);
    if (p.passo > 0) {
      p.passo -= dt;
      if (p.passo <= 0) tocar(p, "parado", 0.3);
    } else if (Math.abs(falta) > PASSO.limiar && p.clips?.acts.andando && !p.dancando && p.pulo < 0) {
      p.passo = PASSO.dur;
      tocar(p, "andando", 0.15);
    }
    dono.yaw += falta * suave(dt, p.passo > 0 ? GIRO * 0.9 : GIRO * 0.6);
    masc.yaw += wrap(alvoMasc - masc.yaw) * suave(dt, GIRO);
    dono.root.rotation.y = dono.yaw;
    masc.root.rotation.y = masc.yaw;

    // Variações do parado.
    if (p.desvioT > 0) {
      p.desvioT -= dt;
      if (p.desvioT <= 0) p.desvio = 0;
    }
    if (p.olharT > 0) {
      p.olharT -= dt;
      if (p.olharT <= 0) {
        if (p.olharVolta) {
          p.olhar = -p.olhar * 0.9;
          p.olharT = 1.2 + p.rng();
          p.olharVolta = false;
        } else p.olhar = 0;
      }
    }
    if (!conversando && !p.perto && !p.dancando && p.passo <= 0) {
      p.idleWait -= dt;
      if (p.idleWait <= 0 && p.desvioT <= 0 && p.olharT <= 0) {
        variarParado(p);
        p.idleWait = entre(p.rng, IDLE_GAP);
      }
    }

    // O mixer só regrava um osso quando o valor do clipe muda de um quadro
    // para o outro (PropertyMixer.apply). Faixas com keyframes repetidos (a
    // cabeça do Pedro tem dezenas) deixariam o nosso giro do quadro anterior
    // no osso e o próximo se somaria a ele: a cabeça disparava e voltava de
    // repente. Então a pose do clipe é devolvida ao osso antes do mixer, e o
    // giro é sempre aplicado de novo sobre ela, depois.
    if (p.cabecaPose) p.cabeca.quaternion.copy(p.cabecaPose);
    misturarClipes(p, dt);
    p.clips?.mixer.update(dt);
    if (p.cabeca) (p.cabecaPose ??= new THREE.Quaternion()).copy(p.cabeca.quaternion);

    // Corpo: pulinhos (falar) e o peso de uma perna para a outra.
    if (p.puloEspera >= 0) {
      p.puloEspera -= dt;
      if (p.puloEspera < 0) p.pulo = 0;
    }
    let y = 0;
    if (p.pulo >= 0) {
      p.pulo += dt;
      const k = Math.min(p.pulo / PULO.dur, 1);
      y = PULO.altura * Math.abs(Math.sin(Math.PI * PULO.vezes * k));
      if (k >= 1) p.pulo = -1;
    }
    p.peso += (p.pesoAlvo - p.peso) * suave(dt, 1.4);
    p.corpo.position.set(0.012 * p.peso, y, 0);
    p.corpo.rotation.z = -0.035 * p.peso;

    // Cabeça: segue o alvo devagar e acena "sim" ao falar. Olhando para o
    // jogador, o alvo é medido a partir do corpo como ele está agora (não de
    // onde ele vai parar), então a cabeça fica no jogador enquanto o corpo
    // termina de virar. Dançando, o giro relaxa a zero (o clipe mexe a cabeça).
    let alvoCabeca = p.olhar;
    if (p.dancando || conversando) alvoCabeca = 0;
    else if (p.olharJog !== null) alvoCabeca = clamp(wrap(p.olharJog - dono.yaw), CABECA_MAX);
    const kc = suave(dt, CABECA_GIRO);
    p.cabecaMeio += (alvoCabeca - p.cabecaMeio) * kc;
    p.cabecaYaw += (p.cabecaMeio - p.cabecaYaw) * kc;
    p.cabecaPeso += ((p.dancando ? 0 : 1) - p.cabecaPeso) * suave(dt, CABECA_PESO_GIRO);
    let aceno = 0;
    if (p.acenoEspera >= 0) {
      p.acenoEspera -= dt;
      if (p.acenoEspera < 0) p.aceno = 0;
    }
    if (p.aceno >= 0) {
      p.aceno += dt;
      const k = Math.min(p.aceno / ACENO.dur, 1);
      aceno = ACENO.angulo * Math.max(0, Math.sin(Math.PI * 2 * ACENO.vezes * k)) * (1 - k * 0.4);
      if (k >= 1) p.aceno = -1;
    }
    const yawCabeca = p.cabecaYaw * p.cabecaPeso;
    aceno *= p.cabecaPeso;
    if (p.cabeca && (Math.abs(yawCabeca) > 1e-4 || aceno > 1e-4)) virarCabeca(p, yawCabeca, aceno);

    // Mascote: vivo (respira, comemora ao falar, se apresenta de vez em quando).
    if (p.pet) {
      if (p.fila && !p.pet.busy && p.fala > 1) {
        p.pet.perform(p.fila);
        p.fila = null;
      }
      p.showWait -= dt;
      if (p.showWait <= 0) {
        const shows = p.dupla.shows;
        if (!p.pet.busy && !conversando) p.pet.perform(shows[Math.floor(p.rng() * shows.length)]);
        p.showWait = entre(p.rng, SHOW_GAP);
      }
      p.pet.update(dt, { speed: 0 });
    }

    // Ocarina do Pedro: flutua e gira; se apresenta de vez em quando; some
    // enquanto ele dança (a do GLB entra orbitando).
    if (p.ocarina) {
      const o = p.ocarina;
      p.showWait -= dt;
      if (p.showWait <= 0) {
        if (!p.dancando && !conversando) p.ocShow = 0;
        p.showWait = entre(p.rng, SHOW_GAP);
      }
      let sobe = 0;
      let tomba = 0;
      let gira = 0.9;
      if (p.ocShow >= 0) {
        p.ocShow += dt;
        const k = Math.min(p.ocShow / OCARINA_SHOW, 1);
        const ar = Math.sin(Math.PI * k);
        sobe = 0.2 * ar;
        gira = 0.9 + 9 * ar;
        tomba = Math.PI * 2 * k * k * (3 - 2 * k);
        if (k >= 1) p.ocShow = -1;
      }
      o.escala += ((p.dancando ? 0 : 1) - o.escala) * suave(dt, 8);
      o.holder.scale.setScalar(Math.max(o.escala, 0.001));
      o.holder.visible = o.escala > 0.02;
      o.holder.position.y = 0.55 + sobe + Math.sin(relogio * 2.2) * 0.04;
      o.holder.rotation.y += dt * gira;
      o.holder.rotation.x = tomba;
    }
  }

  function update(dt) {
    relogio += dt;
    if (cavalete && !reducedMotion) cavalete.cursor.visible = relogio % 1.1 < 0.6;
    const jog = jogador ?? (posJogador ? posJogador() : null);
    // Uma checagem de distância por quadro, em rodízio entre as pessoas.
    if (lista.length && !reducedMotion) {
      vez = (vez + 1) % lista.length;
      const p = lista[vez];
      if (!jog) p.perto = false;
      else {
        const dx = jog.x - p.dono.root.position.x;
        const dz = jog.z - p.dono.root.position.z;
        const r = p.perto ? LONGE : PERTO;
        p.perto = dx * dx + dz * dz <= r * r;
      }
    }
    for (const p of lista) atualizar(p, dt, jog);
  }

  // Posição do jogador na cena do museu (Vector3 viva) ou null ao sair.
  function setJogador(v) {
    jogador = v ?? null;
  }

  // Quem está no tile (o motor usa para "Espaço: falar").
  function at(x, y) {
    const id = porTile.get(`${x},${y}`);
    return id ? { id } : null;
  }

  // Raiz do dono `id` (Group parado no tile dele; não pula nem gira com a
  // fala, que vão no `corpo` filho): o motor pendura ali o cristal de quest.
  // Existe desde a criação, antes do GLB chegar. null se não está aqui.
  const raizDe = (id) => pessoas.get(id)?.dono.root ?? null;

  // Tile { x, y } do dono `id` (para "perto de quem dá a quest") ou null.
  function tileDe(id) {
    for (const [k, v] of porTile) {
      if (v !== id) continue;
      const [x, y] = k.split(",").map(Number);
      return { x, y };
    }
    return null;
  }

  // Jogador falou: os dois se viram para ele e se exibem; depois de
  // FALA_SEGUNDOS voltam à pose (atualizar).
  function falar(id, yaw) {
    const p = pessoas.get(id);
    if (!p) return;
    p.yawFala = yaw;
    p.fala = FALA_SEGUNDOS;
    if (reducedMotion) return;
    // Larga a variação do parado que estiver fazendo.
    p.desvio = p.desvioT = 0;
    p.olhar = p.olharT = 0;
    p.olharVolta = false;
    p.pesoAlvo = 0;
    const dancou = id === "pedro" && (dancar(p) || p.dancando);
    if (!dancou && p.clips && p.pulo < 0) {
      // Pulinhos depois de virar (com passinhos se o giro for grande) e,
      // em seguida, o "sim" com a cabeça.
      const giro = Math.abs(wrap(yaw - p.dono.yaw)) > PASSO.limiar ? PASSO.dur + 0.1 : 0.15;
      p.puloEspera = giro;
      p.acenoEspera = giro + PULO.dur + 0.05;
    }
    if (p.pet) {
      const [primeira, segunda] = p.dupla.shows;
      if (!p.pet.busy) p.pet.perform(primeira);
      p.fila = segunda ?? null;
      p.showWait = entre(p.rng, SHOW_GAP);
    }
    if (p.ocarina && !p.dancando) p.ocShow = 0;
  }

  function dispose() {
    disposed = true;
    jogador = null;
    for (const p of pessoas.values()) {
      p.clips?.mixer.stopAllAction();
      p.pet?.dispose?.();
    }
    for (const h of hitProxies) disposeHitProxy(h);
    hitProxies.length = 0;
    for (const m of carregados) liberarArvore(m);
    carregados.length = 0;
    pessoas.clear();
    lista.length = 0;
    porTile.clear();
    grupo.removeFromParent();
    // Geometrias e materiais do cavalete e das sombras: via track().
  }

  // Para a prévia e a depuração (o motor usa o retorno).
  grupo.userData.setJogador = setJogador;

  return { update, at, raizDe, tileDe, falar, setJogador, hitProxies, dispose };
}
