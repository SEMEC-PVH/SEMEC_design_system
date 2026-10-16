// Vinicius (Gava) — boneco 3D da Diretoria, na porta da SEMEC, de notebook
// aberto: é quem entrega a primeira linguagem. Era o boneco do jogador; agora
// quem joga escolhe outro personagem e ele vira morador da Vila.
//
// O GLB (public/quem-somos/gava.glb) traz `entrada` (abre o notebook e
// senta) e `digitando` (loop). A `digitando` não anima escala/rotação do
// notebook nem a tampa: guardamos a pose do fim da `entrada` e a
// reaplicamos a cada quadro (mesmo truque do jogador em vila-engine.js).
//
// Fica dentro do chibi dele (`fig`, malhas escondidas pelo motor): o chibi
// continua dono do tile, do balão, do clique, da conversa e das cenas, e o
// 3D só acompanha (posição e giro).

import * as THREE from "three";

export function createVinicius({ fig, loader, url, shadowColor, reducedMotion = false }) {
  const root = new THREE.Group();
  let mixer = null;
  let laptopPose = null;
  let disposed = false;

  // Desfaz a escala do chibi: o 3D tem a altura dos outros bonecos.
  root.scale.setScalar(1 / (fig.scale.x || 1));
  fig.add(root);
  // O clique acha o NPC pelo npcIndex das malhas (o chibi já tem o dele).
  const marcaClique = () => root.traverse((o) => (o.userData.npcIndex = fig.userData.npcIndex));

  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 20),
    new THREE.MeshBasicMaterial({ color: shadowColor, transparent: true, opacity: 0.18, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.01;
  root.add(blob);
  marcaClique();

  loader
    .loadAsync(url)
    .then((gltf) => {
      if (disposed) return;
      const model = gltf.scene;
      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          o.frustumCulled = false;
        }
      });
      // Mesma escala do jogador (vila-engine.js): 0,98 m de altura em pé.
      const box = new THREE.Box3().setFromObject(model);
      const k = 0.98 / box.getSize(new THREE.Vector3()).y;
      model.scale.setScalar(k);
      model.position.y = -box.min.y * k;
      root.add(model);
      marcaClique();

      const laptop = model.getObjectByName("Laptop");
      const lid = model.getObjectByName("LaptopLid");
      if (laptop) laptop.visible = true;
      const clip = (n) => gltf.animations.find((a) => a.name === n);
      const entrada = clip("entrada");
      const digitando = clip("digitando");
      if (!entrada || !digitando) return;
      mixer = new THREE.AnimationMixer(model);
      const aEntrada = mixer.clipAction(entrada);
      aEntrada.setLoop(THREE.LoopOnce, 1);
      aEntrada.clampWhenFinished = true;
      aEntrada.play();
      // Já começa sentado: a `entrada` vai direto ao último quadro.
      aEntrada.time = entrada.duration;
      mixer.update(0);
      laptopPose = [laptop, lid].filter(Boolean).map((o) => ({ o, s: o.scale.clone(), q: o.quaternion.clone() }));
      if (reducedMotion) return;
      const aDigitando = mixer.clipAction(digitando);
      aDigitando.play();
      aDigitando.crossFadeFrom(aEntrada, 0.01, false);
      // Ele e o jogador não digitam em sincronia.
      aDigitando.time = digitando.duration * 0.37;
    })
    .catch(() => {
      // Sem o modelo: fica só o tile ocupado e a sombra.
    });

  function update(dt) {
    if (!mixer) return;
    if (!reducedMotion) mixer.update(dt);
    if (laptopPose) {
      for (const p of laptopPose) {
        p.o.scale.copy(p.s);
        p.o.quaternion.copy(p.q);
      }
    }
  }

  function dispose() {
    disposed = true;
    mixer?.stopAllAction();
    // Malhas e materiais são liberados pelo dispose do motor (scene.traverse).
  }

  return { root, update, dispose };
}
