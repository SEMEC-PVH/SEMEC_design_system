// Pista de bicicleta da Vila SEMEC: o time da SEMEC torcendo no camarote
// (dono: arquibancadas.js).
//
// Os mesmos GLBs, altura e mascotes da Vila e da Galeria (scene/museu/
// personagens.js): o dono é ajustado com fitModel de scene/companion.js e o
// mascote reusa os comportamentos de scene/pets.js (com as apresentações
// deles). Sempre as versões -leve (arquivoLeve: ~12–27 mil triângulos cada,
// sobra para o tamanho deles na tela; as cheias somariam ~540 mil) e, no
// `lite`, sem mascotes (cada GLB é uma draw call a mais). Cada carga passa por ctx.carregar (conta na
// tela de carregamento da corrida); se um GLB falhar, segue sem ele.
//
// Torcida procedural, barata para o PC da prefeitura: o clipe `parado` (no
// Gava, um quadro do `andando`) é aplicado UMA vez e fica parado; por cima,
// a cada quadro, só três ossos (cabeça e os dois braços) giram e o corpo
// sobe e balança. Sem mixer por quadro (só o Pedro, na festa, dança com o
// clipe dele e mostra a ocarina e as notas; fora disso essas malhas ficam
// escondidas, que é draw call a menos). Os mascotes rodam o update deles.
//   - parado: balança o corpo e olha em volta devagar;
//   - de vez em quando (sorteio com semente): pulinhos com os dois braços
//     para cima, aceno com um braço ou os dois braços balançando no alto;
//   - jogador perto (ctx.jogador): a cabeça e um pouco do corpo acompanham,
//     e quem está mais perto acena;
//   - largada("verde") e passar na chegada: grito coletivo curto;
//   - festa(): comemoração forte (pulos e braços) por ~10 s, depois animada;
//     o Pedro dança e cada mascote faz as duas apresentações.
// Com reducedMotion: pose parada (alguns com um braço para cima), sem update.
// Sem sombra projetada (draw call dobrada): a bolha de sombra vai no lote
// (arquibancadas.js). O grupo some quando o jogador está longe do camarote
// (fora da caixa VISTO a câmera de jogo não chega lá), poupando as draw
// calls e os triângulos no resto da volta.

import * as THREE from "three";
import { fitModel } from "../companion";
import { bunnyPet, livroPet, microfonePet, renaPet, samuraiPet, wafflePet } from "../pets";
import { arquivoLeve } from "../qualidade";

export const ALTURA_DONO = 0.98; // a mesma da Vila (companion.js e pedro.js)

// Ordem da Galeria; arquivo do dono, mascote e as apresentações dele.
export const TIME = [
  { id: "leo", owner: "leo.glb", petFile: "leo-samurai.glb", pet: ({ pal }) => samuraiPet({ slashColor: pal.white }), shows: ["ataque", "taichi"] },
  { id: "rafa", owner: "rafa.glb", petFile: "rafa-waffle.glb", pet: () => wafflePet({}), shows: ["danca", "giro"] },
  { id: "tiago", owner: "tiago.glb", petFile: "tiago-coelho.glb", pet: () => bunnyPet({}), shows: ["mortal", "pulinhos"] },
  { id: "mariana", owner: "mariana.glb", petFile: "mariana-rena.glb", pet: () => renaPet({}), shows: ["alegria", "timida"] },
  { id: "pedro", owner: "pedro.glb" },
  { id: "ze-carlos", owner: "ze-carlos.glb", petFile: "ze-carlos-livro.glb", pet: () => livroPet({}), shows: ["sabio", "cambalhota"] },
  { id: "emily", owner: "emily.glb", petFile: "emily-microfone.glb", pet: () => microfonePet({}), shows: ["cantar", "giro"] },
  { id: "gava", owner: "gava.glb" },
];

const SHOW_GAP = [7, 15]; // mascote se apresenta sozinho (mín., máx., s)
const CHEER_GAP = [2.5, 7]; // entre as comemorações de cada um (s)
const PERTO = 7; // jogador a até isto (tiles): a cabeça acompanha
const ACENA = 4.5; // e acena se estiver ainda mais perto
const CABECA_MAX = 0.9;
const CORPO_MAX = 0.3;
const FESTA_FORTE = 10; // s de comemoração forte na festa
const GRITO = 1.8; // s do grito coletivo
// Caixa (mundo, em volta do camarote) em que o jogador ainda pode ver o time.
const VISTO = { dx: 15, dzNorte: 10, dzSul: 14 };

const suave = (dt, k) => 1 - Math.exp(-dt * k);
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a) => Math.max(-a, Math.min(a, v));

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

// Temporários (sem alocar por quadro).
const _q = new THREE.Quaternion();
const _qr = new THREE.Quaternion();
const _eixo = new THREE.Vector3();
const _frente = new THREE.Vector3();
const _cima = new THREE.Vector3(0, 1, 0);

// lugares: [{ x, z, h, yaw, pet: { x, z, h } }] (mundo), na ordem de TIME.
export function montarTime({ grupo, lugares, loader, baseUrl, carregar, lite, reducedMotion, pal, semente, jogador, centro }) {
  const rand = semente;
  const lista = [];
  const carregados = [];
  let disposed = false;
  let festaT = -1;
  let gritoT = -1;

  const entre = ([a, b]) => a + rand() * (b - a);
  const carregarGlb = (nome) =>
    carregar(
      loader.loadAsync(baseUrl + arquivoLeve(nome, true)).then((gltf) => {
        if (disposed) {
          liberarArvore(gltf.scene);
          throw new Error("descartado");
        }
        carregados.push(gltf.scene);
        return gltf;
      })
    );

  TIME.forEach((d, i) => {
    const l = lugares[i];
    if (!l) return;
    const root = new THREE.Group();
    root.position.set(l.x, l.h, l.z);
    root.rotation.y = l.yaw;
    const corpo = new THREE.Group();
    root.add(corpo);
    grupo.add(root);
    const p = {
      ...d,
      root,
      corpo,
      yaw: l.yaw,
      fase: rand() * Math.PI * 2,
      ossos: null, // { cabeca, bracoE, bracoD, base: Map }
      clips: null,
      extras: [], // malhas do Pedro que só aparecem na dança
      dancando: false,
      dancaFim: -1,
      cheerT: -1,
      cheerDur: 0,
      tipo: "pulos",
      cheerWait: 1 + rand() * 5,
      // Pose parada (reducedMotion): uns com o braço direito para cima.
      bracoFixo: rand() < 0.45 ? 2.3 : 0,
      cabecaYaw: 0,
      corpoYaw: 0,
      pet: null,
      petRoot: null,
      showWait: 3 + i * 1.3,
      fila: null,
    };
    lista.push(p);

    carregarGlb(d.owner)
      .then((gltf) => {
        const model = fitModel(gltf, ALTURA_DONO);
        corpo.add(model);
        model.traverse((o) => {
          if (!o.isMesh) return;
          o.castShadow = false;
          o.receiveShadow = !lite;
        });
        prepararOssos(p, model, gltf);
      })
      .catch(() => {});

    if (d.pet && !lite && l.pet) {
      const pet = d.pet({ pal });
      const petRoot = new THREE.Group();
      petRoot.position.set(l.pet.x, l.pet.h, l.pet.z);
      petRoot.rotation.y = l.pet.yaw ?? l.yaw;
      grupo.add(petRoot);
      carregarGlb(d.petFile)
        .then((gltf) => {
          pet.attach(petRoot, gltf);
          petRoot.traverse((o) => {
            if (o.isMesh) o.castShadow = false;
          });
          if (reducedMotion) pet.freeze();
          p.pet = pet;
          p.petRoot = petRoot;
        })
        .catch(() => {});
    }
  });

  // Pose base: o `parado` (ou um quadro do `andando` do Gava, que não tem
  // `parado`) aplicado uma vez; guarda a pose dos três ossos que giram.
  function prepararOssos(p, model, gltf) {
    const mixer = new THREE.AnimationMixer(model);
    const acts = {};
    for (const c of gltf.animations) acts[c.name] = mixer.clipAction(c);
    p.clips = { mixer, acts };
    const pose = acts.parado ?? acts.andando;
    if (pose) {
      pose.play();
      pose.time = acts.parado ? ((p.fase / (Math.PI * 2)) % 1) * pose.getClip().duration : 0;
      pose.paused = true;
    }
    mixer.update(0);
    // Gava: sem o notebook (ele está torcendo, não programando).
    model.traverse((o) => {
      if (p.id === "gava" && /^Laptop/.test(o.name)) o.visible = false;
      if (p.id === "pedro" && o.isMesh && !o.isSkinnedMesh) {
        o.visible = false;
        p.extras.push(o);
      }
    });
    const achar = (...nomes) => {
      let r = null;
      model.traverse((o) => {
        if (!r && o.isBone && nomes.includes(o.name)) r = o;
      });
      return r;
    };
    const ossos = {
      cabeca: achar("Head", "head"),
      bracoE: achar("LeftArm", "upperarm.L"),
      bracoD: achar("RightArm", "upperarm.R"),
      base: new Map(),
    };
    for (const k of ["cabeca", "bracoE", "bracoD"]) if (ossos[k]) ossos.base.set(ossos[k], ossos[k].quaternion.clone());
    p.ossos = ossos;
    if (p.id === "pedro" && acts.entrada && acts.dancando) {
      for (const a of [acts.entrada, acts.dancando]) {
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
      }
      mixer.addEventListener("finished", (e) => {
        if (e.action === acts.entrada) trocar(p, "dancando", 0.2);
        else if (e.action === acts.dancando) {
          trocar(p, acts.parado ? "parado" : null, 0.3);
          p.dancaFim = 0.45;
        }
      });
    }
    aplicarOssos(p, p.bracoFixo * 0.2, reducedMotion ? p.bracoFixo : 0, 0);
  }

  function trocar(p, nome, fade) {
    const { acts } = p.clips;
    const atual = Object.values(acts).find((a) => a.isRunning() && a.getEffectiveWeight() > 0.5);
    const prox = nome ? acts[nome] : null;
    if (!prox) return;
    prox.reset();
    prox.paused = nome === "parado";
    prox.play();
    if (atual && atual !== prox) prox.crossFadeFrom(atual, fade, false);
  }

  function dancar(p) {
    const acts = p.clips?.acts;
    if (!acts?.entrada || !acts?.dancando || p.dancando) return;
    p.dancando = true;
    p.dancaFim = -1;
    restaurarOssos(p);
    for (const o of p.extras) o.visible = true;
    const parado = acts.parado;
    acts.entrada.reset().play();
    if (parado) {
      parado.paused = false;
      acts.entrada.crossFadeFrom(parado, 0.2, false);
    }
  }

  function restaurarOssos(p) {
    if (!p.ossos) return;
    for (const [b, q] of p.ossos.base) b.quaternion.copy(q);
  }

  // Gira um osso em volta de um eixo do mundo (convertido para o espaço do
  // pai), por cima da pose base.
  function girar(osso, eixoMundo, ang) {
    if (!osso || Math.abs(ang) < 1e-4) return;
    osso.parent.getWorldQuaternion(_q).invert();
    _eixo.copy(eixoMundo).applyQuaternion(_q).normalize();
    _qr.setFromAxisAngle(_eixo, ang);
    osso.quaternion.premultiply(_qr);
  }

  // angE/angD: braços (0 caído … ~2,5 para cima, para fora do corpo).
  function aplicarOssos(p, angE, angD, cabeca) {
    const o = p.ossos;
    if (!o) return;
    restaurarOssos(p);
    const yaw = p.root.rotation.y + p.corpoYaw;
    _frente.set(Math.sin(yaw), 0, Math.cos(yaw));
    // Olhando para +z: o braço esquerdo fica em +x; girar em volta da frente
    // leva o esquerdo para cima com ângulo positivo e o direito com negativo.
    girar(o.bracoE, _frente, angE);
    girar(o.bracoD, _frente, -angD);
    girar(o.cabeca, _cima, cabeca);
  }

  function festa() {
    festaT = 0;
    // Com reducedMotion ninguém dança nem se apresenta (pose parada).
    if (reducedMotion) return;
    for (const p of lista) {
      if (p.id === "pedro") dancar(p);
      if (p.pet && p.shows) {
        if (!p.pet.busy) p.pet.perform(p.shows[0]);
        p.fila = p.shows[1] ?? null;
      }
    }
  }

  function grito() {
    gritoT = 0;
    for (const p of lista) if (p.pet && p.shows && !p.pet.busy) p.pet.perform(p.shows[0]);
  }

  function update(t, dt) {
    const jog = jogador();
    // Longe do camarote a câmera não vê o time: esconde e não anima. Vale
    // também com reducedMotion (pose parada, mas o custo de desenhar é o mesmo).
    if (jog && centro) {
      const dx = Math.abs(jog.x - centro.x);
      const dz = jog.z - centro.z;
      grupo.visible = dx < VISTO.dx && dz > -VISTO.dzNorte && dz < VISTO.dzSul;
      if (!grupo.visible) return;
    }
    if (reducedMotion) return;
    if (festaT >= 0) festaT += dt;
    if (gritoT >= 0) {
      gritoT += dt;
      if (gritoT > GRITO) gritoT = -1;
    }
    const forte = festaT >= 0 && festaT < FESTA_FORTE;
    const animada = festaT >= FESTA_FORTE;
    const gritando = gritoT >= 0;
    for (const p of lista) {
      // Jogador perto: cabeça e corpo acompanham; mais perto, acena.
      let alvoCabeca = 0.28 * Math.sin(t * 0.45 + p.fase) * Math.sin(t * 0.21 + p.fase * 2);
      let alvoCorpo = 0;
      let acenando = false;
      if (jog) {
        const dx = jog.x - p.root.position.x;
        const dz = jog.z - p.root.position.z;
        const d = Math.hypot(dx, dz);
        if (d < PERTO) {
          const rel = wrap(Math.atan2(dx, dz) - p.yaw);
          alvoCorpo = clamp(rel, CORPO_MAX);
          alvoCabeca = clamp(rel - alvoCorpo, CABECA_MAX);
          acenando = d < ACENA;
        }
      }
      p.corpoYaw += (alvoCorpo - p.corpoYaw) * suave(dt, 4);
      p.cabecaYaw += (alvoCabeca - p.cabecaYaw) * suave(dt, 6);
      p.root.rotation.y = p.yaw + p.corpoYaw;

      // Comemoração sorteada.
      p.cheerWait -= dt;
      if (p.cheerT < 0 && p.cheerWait <= 0) {
        const r = rand();
        p.tipo = r < 0.45 ? "pulos" : r < 0.8 ? "aceno" : "bracos";
        p.cheerT = 0;
        p.cheerDur = p.tipo === "pulos" ? 1.3 : 1.8;
        p.cheerWait = entre(CHEER_GAP);
      }
      let pulo = 0;
      let angE = 0;
      let angD = 0;
      let balanco = 0.04 * Math.sin(t * 1.7 + p.fase);
      if (p.cheerT >= 0) {
        p.cheerT += dt;
        const k = p.cheerT / p.cheerDur;
        const env = Math.sin(Math.PI * Math.min(k, 1));
        if (p.tipo === "pulos") {
          pulo = 0.09 * Math.abs(Math.sin(Math.PI * 3 * k));
          angE = angD = 2.65 * env;
        } else if (p.tipo === "aceno") {
          angD = env * (2.6 + 0.3 * Math.sin(t * 11 + p.fase));
        } else {
          // Os dois braços para cima, balançando de um lado para o outro.
          angE = env * (2.55 + 0.25 * Math.sin(t * 6 + p.fase));
          angD = env * (2.55 - 0.25 * Math.sin(t * 6 + p.fase));
        }
        if (k >= 1) p.cheerT = -1;
      }
      if (acenando && p.cheerT < 0) angD = 2.55 + 0.3 * Math.sin(t * 10 + p.fase);
      if (forte || gritando) {
        pulo = 0.11 * Math.abs(Math.sin(t * 7.5 + p.fase));
        angE = 2.6 + 0.3 * Math.sin(t * 9 + p.fase);
        angD = 2.6 + 0.3 * Math.sin(t * 9 + p.fase + 1.4);
        balanco = 0.08 * Math.sin(t * 5 + p.fase);
      } else if (animada) {
        pulo = Math.max(pulo, 0.04 * Math.abs(Math.sin(t * 4 + p.fase)));
        angD = Math.max(angD, 1.6 + 0.4 * Math.sin(t * 6 + p.fase));
      }
      p.corpo.position.y = pulo;
      p.corpo.rotation.z = balanco;

      if (p.dancando) {
        p.clips.mixer.update(dt);
        if (p.dancaFim >= 0) {
          p.dancaFim -= dt;
          if (p.dancaFim < 0) {
            p.dancando = false;
            for (const o of p.extras) o.visible = false;
            for (const [b] of p.ossos.base) p.ossos.base.set(b, b.quaternion.clone());
          }
        }
      } else aplicarOssos(p, angE, angD, p.cabecaYaw);

      // Mascote: vivo, se apresenta de vez em quando (e na festa, as duas).
      if (p.pet) {
        if (p.fila && !p.pet.busy) {
          p.pet.perform(p.fila);
          p.fila = null;
        }
        p.showWait -= dt;
        if (p.showWait <= 0) {
          if (!p.pet.busy) p.pet.perform(p.shows[Math.floor(rand() * p.shows.length)]);
          p.showWait = entre(SHOW_GAP);
        }
        p.pet.update(dt, { speed: 0 });
      }
    }
  }

  function dispose() {
    disposed = true;
    for (const p of lista) {
      p.clips?.mixer.stopAllAction();
      p.pet?.dispose?.();
    }
    for (const m of carregados) liberarArvore(m);
    // O que os pets criam fora da árvore do GLB (o arco do corte do samurai)
    // também sai: liberar duas vezes o mesmo recurso não faz mal.
    liberarArvore(grupo);
    carregados.length = 0;
    lista.length = 0;
    grupo.removeFromParent();
  }

  return { update, festa, grito, dispose };
}
