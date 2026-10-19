// Vitrine da tela de escolha de personagem: os dois jogadores lado a lado,
// num canvas próprio (transparente, por cima da vila em modo vitrine).
// Cada um toca a `parado` em loop; o escolhido ganha um anel sob os pés e
// vira um pouco para a câmera. Ao confirmar, toca a `escolhido` (uma vez)
// se o GLB tiver essa clip. three.js puro: a TitleScreen importa sob demanda.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

const ALTURA = 0.98; // mesma altura do jogador na vila
const DX = 0.62; // meia distância entre os dois
const ESCALA_FOCO = 1.08;
const ESCALA_OUTRO = 0.94;
const GIRO_FOCO = 0.35; // rad: o escolhido vira para o centro da tela
const LARGURA = DX + 0.5; // meia largura que precisa caber (bonecos + folga)

// canvas: <canvas> já no DOM; arquivos: URLs dos GLBs, na ordem dos cartões.
export function createVitrineJogador(canvas, { arquivos, reducedMotion = false, onReady = () => {} }) {
  const cs = getComputedStyle(document.documentElement);
  const cor = (n) => new THREE.Color(cs.getPropertyValue(`--pv-${n}`).trim() || "gray");

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  // Sem checar erro de cada shader no 1º uso (trava o quadro; ver vila-engine.js).
  renderer.debug.checkShaderErrors = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 0.72, 3.1);
  camera.lookAt(0, 0.5, 0);
  scene.add(new THREE.HemisphereLight(cor("white"), cor("blue-900"), 2.2));
  const sol = new THREE.DirectionalLight(cor("white"), 2.4);
  sol.position.set(1.5, 3, 2.5);
  scene.add(sol);

  const descartaveis = [];
  const guarda = (x) => (descartaveis.push(x), x);
  const anel = new THREE.Mesh(
    guarda(new THREE.RingGeometry(0.3, 0.38, 40)),
    guarda(new THREE.MeshBasicMaterial({ color: cor("yellow-400"), transparent: true, opacity: 0.9, depthWrite: false }))
  );
  anel.rotation.x = -Math.PI / 2;
  anel.position.y = 0.005;
  scene.add(anel);

  const lugares = arquivos.map((_, i) => {
    const raiz = new THREE.Group();
    raiz.position.x = (i === 0 ? -1 : 1) * DX;
    scene.add(raiz);
    return { raiz, mixer: null, parado: null, escolhido: null, escala: 1, giro: 0 };
  });
  let foco = 0;
  let confirmando = null; // { i, resolve, fim }
  let disposed = false;

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  let prontos = 0;
  arquivos.forEach((url, i) => {
    loader
      .loadAsync(url)
      .then((gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        // A bicicleta (nó do GLB) não entra na vitrine nem na medida.
        model.getObjectByName("Bicicleta")?.removeFromParent();
        const box = new THREE.Box3().setFromObject(model);
        const k = ALTURA / box.getSize(new THREE.Vector3()).y;
        model.scale.setScalar(k);
        model.position.y = -box.min.y * k;
        const l = lugares[i];
        l.raiz.add(model);
        l.mixer = new THREE.AnimationMixer(model);
        const clip = (n) => gltf.animations.find((a) => a.name === n);
        if (clip("parado")) {
          l.parado = l.mixer.clipAction(clip("parado"));
          l.parado.play();
          // Os dois não respiram em sincronia.
          l.parado.time = i * 0.7;
          l.parado.paused = reducedMotion;
        }
        if (clip("escolhido")) {
          l.escolhido = l.mixer.clipAction(clip("escolhido"));
          l.escolhido.setLoop(THREE.LoopOnce, 1);
          l.escolhido.clampWhenFinished = true;
        }
        l.mixer.update(0);
        if (++prontos === arquivos.length) onReady();
      })
      .catch(() => {
        if (++prontos === arquivos.length) onReady();
      });
  });

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Afasta a câmera até os dois (±LARGURA) caberem na largura do palco.
    const tanMeio = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.z = Math.max(3.1, LARGURA / (tanMeio * camera.aspect));
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const relogio = new THREE.Timer(); // (THREE.Clock está obsoleto)
  function quadro(ts) {
    if (disposed) return;
    relogio.update(ts);
    const dt = Math.min(relogio.getDelta(), 0.1);
    const suave = reducedMotion ? 1 : 1 - Math.exp(-dt * 10);
    lugares.forEach((l, i) => {
      const alvo = i === foco ? ESCALA_FOCO : ESCALA_OUTRO;
      l.escala += (alvo - l.escala) * suave;
      l.raiz.scale.setScalar(l.escala);
      const giro = i === foco ? (i === 0 ? GIRO_FOCO : -GIRO_FOCO) : 0;
      l.giro += (giro - l.giro) * suave;
      l.raiz.rotation.y = l.giro;
      l.mixer?.update(dt);
    });
    anel.position.x += (lugares[foco].raiz.position.x - anel.position.x) * suave;
    if (confirmando && performance.now() >= confirmando.fim) {
      const { resolve } = confirmando;
      confirmando = null;
      resolve();
    }
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(quadro);

  return {
    selecionar(i) {
      if (!confirmando) foco = i;
    },
    // Toca a `escolhido` no personagem i; resolve quando ela termina (na
    // hora, sem a clip ou com movimento reduzido).
    confirmar(i) {
      foco = i;
      const l = lugares[i];
      if (reducedMotion || !l.escolhido) return Promise.resolve();
      return new Promise((resolve) => {
        l.escolhido.reset().play();
        if (l.parado) l.escolhido.crossFadeFrom(l.parado, 0.15, false);
        confirmando = { resolve, fim: performance.now() + l.escolhido.getClip().duration * 1000 };
      });
    },
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      if (confirmando) confirmando.resolve();
      scene.traverse((o) => {
        o.geometry?.dispose();
        for (const m of [].concat(o.material ?? [])) {
          for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
          m.dispose();
        }
      });
      descartaveis.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}
