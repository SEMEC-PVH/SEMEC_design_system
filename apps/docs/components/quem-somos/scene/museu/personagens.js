// Galeria da Equipe: o time em 3D, cada um ao lado do próprio quadro.
//
// Mesmos GLBs, alturas e mascotes da Vila (scene/walkers.js, scene/pedro.js,
// scene/pets.js): o dono é ajustado com fitModel/createClips de
// scene/companion.js e o mascote reusa o comportamento de pets.js, então os
// dois têm aqui a mesma cara e o mesmo jeito de lá. A diferença é que aqui
// ninguém passeia: o dono fica no tile `pessoa` do slot (layout.js),
// tocando `parado`, e o mascote fica ao lado, no mesmo tile, do lado oposto
// ao quadro (para não cobrir a moldura) e um tico para dentro da sala.
//
// O Pedro não tem mascote em pets.js: o dele é a ocarina (ocarina.glb), que
// flutua ao lado dele girando devagar. Quando ele dança (falar), a ocarina
// do próprio pedro.glb entra orbitando e a flutuante se esconde.
//
// O Gava é o jogador, então o slot dele (o último) ganha um cavalete com o
// notebook aberto e uma plaquinha "você está aqui".
//
// Falar (motor: "Espaço: falar"): dono e mascote se viram para o jogador, o
// dono dá dois pulinhos (o Pedro dança) e o mascote se apresenta; depois de
// uns segundos os dois voltam à pose. De tempos em tempos o mascote também se
// apresenta sozinho. Com movimento reduzido, tudo fica parado na pose e falar
// só vira os dois.
//
// Cada GLB entra quando carrega; se um falhar, aquele fica de fora.

import * as THREE from "three";
import { ORDEM } from "../../museu-dados";
import { createClips, createHitProxy, disposeHitProxy, fitModel } from "../companion";
import { bunnyPet, livroPet, microfonePet, renaPet, samuraiPet, wafflePet } from "../pets";
import { arquivoLeve } from "../qualidade";
import { SLOTS, tileToWorld } from "./layout";

const ALTURA_DONO = 0.98; // a mesma da Vila (companion.js e pedro.js)
const FALA_SEGUNDOS = 4; // olhando para o jogador antes de voltar à pose
const GIRO = 10; // velocidade da virada (maior = mais rápida)
const SHOW_GAP = [10, 18]; // mascote se apresenta sozinho (mín., máx., s)
// Para os slots das paredes oeste e leste: quanto o dono vira para o meio.
const VIRADA_LATERAL = 0.35;
// Posição dentro do tile (ao longo da parede, para longe do quadro; e para
// dentro da sala).
const DONO_AO_LONGO = 0.08;
const PET_AO_LONGO = 0.4;
const PET_PARA_DENTRO = 0.16;
// Pulinhos do dono ao falar.
const PULO = { dur: 0.8, altura: 0.07, vezes: 2 };

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

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

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

export function createPersonagens({ scene, loader, baseUrl, lite = false, reducedMotion = false, pal, track }) {
  const grupo = new THREE.Group();
  grupo.name = "museu-personagens";
  scene.add(grupo);
  const hitProxies = [];
  const pessoas = new Map(); // id → estado
  const porTile = new Map(); // "x,y" → id
  const carregados = []; // raízes dos GLBs (para liberar)
  let disposed = false;
  let relogio = 0;
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
    const dono = { root: raiz(centro.clone().addScaledVector(ao, DONO_AO_LONGO), 0.3), yaw, yawGoal: yaw };
    const corpo = new THREE.Group(); // entre a raiz e o modelo: pulinhos
    dono.root.add(corpo);
    const masc = {
      root: raiz(centro.clone().addScaledVector(ao, PET_AO_LONGO).addScaledVector(dentro, PET_PARA_DENTRO), petRaio),
      yaw,
      yawGoal: yaw,
    };
    dono.root.rotation.y = masc.root.rotation.y = yaw;
    hitProxies.push(createHitProxy(dono.root, id, 0.28, ALTURA_DONO));
    hitProxies.push(createHitProxy(masc.root, dupla.petId, petRaio + 0.08, pet ? 0.55 : 0.8)); // ocarina: no ar

    const p = {
      id,
      dupla,
      dono,
      corpo,
      masc,
      pet,
      yawPose: yaw,
      clips: null,
      ocarina: null,
      fala: 0,
      pulo: -1,
      dancando: false,
      showWait: 4 + ((i * 2.3) % 6),
    };
    pessoas.set(id, p);
    porTile.set(`${slot.pessoa[0]},${slot.pessoa[1]}`, id);

    carregar(dupla.owner)
      .then((gltf) => {
        const model = fitModel(gltf, ALTURA_DONO);
        corpo.add(model);
        p.clips = createClips(model, gltf.animations);
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
      if (e.action === acts.entrada) p.clips.play("dancando", 0.2);
      else if (e.action === acts.dancando) {
        p.dancando = false;
        p.clips.play("parado", 0.3);
      }
    });
  }

  // ---- Cavalete do Gava -------------------------------------------------------

  // Cavalete de madeira com o notebook aberto (código na tela, cursor
  // piscando) e uma plaquinha: o Gava não está aqui porque é você.
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
    g.font = `700 104px ${pal.font}`;
    g.fillText("Gava", 256, 104);
    g.fillStyle = pal.pv("blue-700").getStyle();
    g.font = `600 50px ${pal.font}`;
    g.fillText("você está aqui", 256, 190);
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

  function update(dt) {
    relogio += dt;
    if (cavalete && !reducedMotion) cavalete.cursor.visible = relogio % 1.1 < 0.6;
    for (const p of pessoas.values()) {
      // Conversa: depois de uns segundos, volta à pose.
      if (p.fala > 0) p.fala -= dt;
      else if (!p.dancando) p.dono.yawGoal = p.masc.yawGoal = p.yawPose;
      for (const b of [p.dono, p.masc]) {
        b.yaw = reducedMotion ? b.yawGoal : b.yaw + wrap(b.yawGoal - b.yaw) * (1 - Math.exp(-dt * GIRO));
        b.root.rotation.y = b.yaw;
      }
      if (reducedMotion) continue;
      p.clips?.mixer.update(dt);

      // Pulinhos do dono (falar).
      if (p.pulo >= 0) {
        p.pulo += dt;
        const k = Math.min(p.pulo / PULO.dur, 1);
        p.corpo.position.y = PULO.altura * Math.abs(Math.sin(Math.PI * PULO.vezes * k));
        if (k >= 1) {
          p.pulo = -1;
          p.corpo.position.y = 0;
        }
      }

      // Mascote: vivo (respira, se apresenta de vez em quando).
      if (p.pet) {
        p.showWait -= dt;
        if (p.showWait <= 0) {
          const shows = p.dupla.shows;
          if (!p.pet.busy && p.fala <= 0) p.pet.perform(shows[Math.floor(Math.random() * shows.length)]);
          p.showWait = SHOW_GAP[0] + Math.random() * (SHOW_GAP[1] - SHOW_GAP[0]);
        }
        p.pet.update(dt, { speed: 0 });
      }

      // Ocarina do Pedro: flutua e gira; some enquanto ele dança (a do GLB
      // entra orbitando).
      if (p.ocarina) {
        const o = p.ocarina;
        o.escala += ((p.dancando ? 0 : 1) - o.escala) * (1 - Math.exp(-dt * 8));
        o.holder.scale.setScalar(Math.max(o.escala, 0.001));
        o.holder.visible = o.escala > 0.02;
        o.holder.position.y = 0.55 + Math.sin(relogio * 2.2) * 0.04;
        o.holder.rotation.y += dt * 0.9;
      }
    }
  }

  // Quem está no tile (o motor usa para "Espaço: falar").
  function at(x, y) {
    const id = porTile.get(`${x},${y}`);
    return id ? { id } : null;
  }

  // Jogador falou: os dois se viram para ele e se exibem.
  function falar(id, yaw) {
    const p = pessoas.get(id);
    if (!p) return;
    p.dono.yawGoal = p.masc.yawGoal = yaw;
    p.fala = FALA_SEGUNDOS;
    if (reducedMotion) return;
    const acts = p.clips?.acts;
    if (id === "pedro" && acts?.entrada && acts?.dancando) {
      if (!p.dancando) {
        p.dancando = true;
        p.clips.play("entrada", 0.2);
      }
    } else if (p.clips) {
      p.pulo = 0;
    }
    if (p.pet && !p.pet.busy) {
      p.pet.perform(p.dupla.shows[0]);
      p.showWait = SHOW_GAP[0] + Math.random() * (SHOW_GAP[1] - SHOW_GAP[0]);
    }
  }

  function dispose() {
    disposed = true;
    for (const p of pessoas.values()) {
      p.clips?.mixer.stopAllAction();
      p.pet?.dispose?.();
    }
    for (const h of hitProxies) disposeHitProxy(h);
    hitProxies.length = 0;
    for (const m of carregados) liberarArvore(m);
    carregados.length = 0;
    pessoas.clear();
    porTile.clear();
    grupo.removeFromParent();
    // Geometrias e materiais do cavalete e das sombras: via track().
  }

  return { update, at, falar, hitProxies, dispose };
}
