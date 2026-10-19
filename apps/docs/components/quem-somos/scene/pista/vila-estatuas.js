// Pista de bicicleta da Vila SEMEC: as estátuas dos mascotes da zona "vila"
// (e tudo mais que gira devagar), numa malha só.
//
// Os mascotes são os mesmos GLBs do museu (samurai, waffle, coelho, rena,
// livro, microfone e a ocarina), SEMPRE na versão -leve: a cor sai por
// triângulo de qualquer jeito, e as sete completas passariam de 130 mil
// triângulos (as -leve somam ~51 mil; no `lite` vão só quatro, ~27 mil).
// Para não gastar um draw call (e uma textura) por estátua, cada GLB é
// "assado" assim que chega:
//   - pose parada (o 1º quadro do clipe "parado", se houver esqueleto: a
//     pele é aplicada no CPU com applyBoneTransform);
//   - cor por triângulo amostrada da textura no centro do triângulo (fica
//     com cara de low-poly pintado, como o resto da pista);
//   - escala para a altura pedida, pé no chão, centrado no pedestal.
// Depois tudo vira UMA geometria com cor por vértice. O giro de cada
// estátua em volta do próprio eixo é feito no vertex shader (atributos
// `centro` e `giro` = (fase, velocidade); uniform uTempo), então animar
// custa só um uniform por quadro. Com reducedMotion: uTempo parado e todas
// de frente para a câmera (sul).
//
// Peças fixas que também giram (a estrela do topo do totem) entram com
// `extras` (geometria já no lugar, em coordenadas do mundo).
//
// Sem sombra projetada (a sombra do three não passaria pelo giro do
// shader): o pedestal, que está no lote fixo, faz a sombra.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { arquivoLeve } from "../qualidade";

// Lê os pixels de uma textura (ImageBitmap ou <img>) numa grade pequena.
function pixels(tex) {
  const img = tex?.image;
  if (!img || !img.width) return null;
  const lado = Math.min(256, img.width);
  const alt = Math.max(1, Math.round((lado * img.height) / img.width));
  const cv = document.createElement("canvas");
  cv.width = lado;
  cv.height = alt;
  const g = cv.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, 0, 0, lado, alt);
  return { w: lado, h: alt, d: g.getImageData(0, 0, lado, alt).data, flipY: tex.flipY };
}

// GLB → geometria não indexada com cor por vértice (pose parada), em
// coordenadas do modelo. Libera o que o GLTFLoader criou.
function assar(gltf) {
  const cena = gltf.scene;
  let mixer = null;
  if (gltf.animations?.length) {
    const clip = gltf.animations.find((c) => c.name === "parado") ?? gltf.animations[0];
    mixer = new THREE.AnimationMixer(cena);
    mixer.clipAction(clip).play();
    mixer.update(0);
  }
  cena.updateMatrixWorld(true);
  const partes = [];
  const v = new THREE.Vector3();
  const cor = new THREE.Color();
  cena.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes.position) return;
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    // Vértices na pose (pele aplicada no índice ORIGINAL do vértice: os
    // atributos de pele podem vir intercalados/quantizados) e depois a
    // expansão pelo índice em triângulos soltos.
    const src = o.geometry;
    const posA = src.attributes.position;
    const nv = posA.count;
    const posados = new Float32Array(nv * 3);
    const posar = (pele) => {
      for (let i = 0; i < nv; i++) {
        v.fromBufferAttribute(posA, i);
        if (pele) o.applyBoneTransform(i, v);
        v.applyMatrix4(o.matrixWorld);
        posados.set([v.x, v.y, v.z], i * 3);
      }
    };
    try {
      posar(o.isSkinnedMesh);
    } catch {
      // Pele que não fecha com o esqueleto: fica a pose de repouso.
      posar(false);
    }
    const idx = src.index ? (i) => src.index.getX(i) : (i) => i;
    const n = src.index ? src.index.count : nv;
    const uv = src.attributes.uv;
    const px = uv && mat?.map ? pixels(mat.map) : null;
    const base = mat?.color ?? new THREE.Color(1, 1, 1);
    const saida = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const j = idx(i) * 3;
      saida.set([posados[j], posados[j + 1], posados[j + 2]], i * 3);
    }
    const cores = new Float32Array(n * 3);
    for (let t = 0; t + 2 < n; t += 3) {
      cor.copy(base);
      if (px) {
        const a = idx(t);
        const b = idx(t + 1);
        const c = idx(t + 2);
        let u = (uv.getX(a) + uv.getX(b) + uv.getX(c)) / 3;
        let w = (uv.getY(a) + uv.getY(b) + uv.getY(c)) / 3;
        u -= Math.floor(u);
        w -= Math.floor(w);
        if (px.flipY) w = 1 - w;
        const ix = Math.min(px.w - 1, Math.floor(u * px.w));
        const iy = Math.min(px.h - 1, Math.floor(w * px.h));
        const k = (iy * px.w + ix) * 4;
        const amostra = new THREE.Color().setRGB(px.d[k] / 255, px.d[k + 1] / 255, px.d[k + 2] / 255, THREE.SRGBColorSpace);
        cor.multiply(amostra);
      }
      for (let j = 0; j < 3; j++) cores.set([cor.r, cor.g, cor.b], (t + j) * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(saida, 3));
    g.setAttribute("color", new THREE.BufferAttribute(cores, 3));
    partes.push(g);
  });
  mixer?.stopAllAction();
  // Libera o GLB (não entra na cena).
  cena.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry?.dispose();
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m) continue;
      for (const k of Object.keys(m)) if (m[k]?.isTexture) m[k].dispose();
      m.dispose();
    }
  });
  if (!partes.length) return null;
  const geo = mergeGeometries(partes, false);
  for (const p of partes) p.dispose();
  return geo;
}

// Escala para a altura `alt` (ou a maior medida, com porMaior), pé em y = 0, centro do pé em (0, 0) e põe
// no lugar (mundo). Acrescenta os atributos do giro.
function posicionar(geo, { alt, porMaior, x, z, h, fase, vel }) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const tam = bb.getSize(new THREE.Vector3());
  const k = alt / Math.max(1e-3, porMaior ? Math.max(tam.x, tam.y, tam.z) : tam.y);
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  geo.scale(k, k, k);
  geo.translate(x, h, z);
  return comGiro(geo, x, z, fase, vel);
}

function comGiro(geo, x, z, fase, vel) {
  const n = geo.attributes.position.count;
  const centro = new Float32Array(n * 3);
  const giro = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    centro.set([x, 0, z], i * 3);
    giro.set([fase, vel], i * 2);
  }
  geo.setAttribute("centro", new THREE.BufferAttribute(centro, 3));
  geo.setAttribute("giro", new THREE.BufferAttribute(giro, 2));
  if (!geo.attributes.normal) geo.computeVertexNormals();
  for (const k of Object.keys(geo.attributes)) if (!["position", "normal", "color", "centro", "giro"].includes(k)) geo.deleteAttribute(k);
  return geo;
}

// Material com o giro no vertex shader.
function materialGiro(track) {
  const uniforms = { uTempo: { value: 0 } };
  const mat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.05, flatShading: true }));
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTempo = uniforms.uTempo;
    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute vec3 centro;\nattribute vec2 giro;\nuniform float uTempo;",
      )
      .replace(
        "#include <beginnormal_vertex>",
        [
          "#include <beginnormal_vertex>",
          "float angGiro = giro.x + uTempo * giro.y;",
          "float cG = cos(angGiro);",
          "float sG = sin(angGiro);",
          "objectNormal = vec3(cG * objectNormal.x + sG * objectNormal.z, objectNormal.y, -sG * objectNormal.x + cG * objectNormal.z);",
        ].join("\n"),
      )
      .replace(
        "#include <begin_vertex>",
        [
          "#include <begin_vertex>",
          "vec3 relGiro = transformed - centro;",
          "transformed = centro + vec3(cG * relGiro.x + sG * relGiro.z, relGiro.y, -sG * relGiro.x + cG * relGiro.z);",
        ].join("\n"),
      );
  };
  mat.customProgramCacheKey = () => "pista-vila-giro";
  return { mat, uniforms };
}

// lugares: [{ arquivo, alt, porMaior, x, z, h, fase, vel }] (mundo); extras:
// [{ geo, x, z, fase, vel }] (geometria com cor por vértice, já no lugar).
// Devolve { update(t, dt), acelerar(s), dispose() }.
export function montarEstatuas(ctx, lugares, extras) {
  const { root, track, loader, baseUrl, lite, reducedMotion } = ctx;
  const { mat, uniforms } = materialGiro(track);
  let acabou = false;
  let mesh = null;
  let tempo = 0;
  let turbo = 0;

  const fixas = extras.map((e) => comGiro(e.geo, e.x, e.z, e.fase, e.vel));
  const montar = (geos) => {
    const todas = [...fixas, ...geos.filter(Boolean)];
    if (acabou || !todas.length) {
      for (const gg of todas) gg.dispose();
      return;
    }
    const geo = track(mergeGeometries(todas, false));
    for (const gg of todas) gg.dispose();
    mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = !lite;
    // O giro do shader sai da caixa de repouso: sem corte na borda.
    mesh.frustumCulled = false;
    root.add(mesh);
  };

  const cargas = loader
    ? lugares.map((l) =>
        ctx.carregar(
          loader.loadAsync(baseUrl + arquivoLeve(l.arquivo, true)).then((gltf) => {
            const geo = assar(gltf);
            return geo ? posicionar(geo, l) : null;
          }),
        ),
      )
    : [];
  // A malha sai quando todas as estátuas chegaram (ou falharam): a tela de
  // carregamento espera por elas (ctx.carregar).
  ctx.carregar(
    Promise.allSettled(cargas).then((rs) => {
      for (const r of rs) if (r.status === "rejected") console.warn("[pista] vila: uma estátua não carregou", r.reason);
      montar(rs.map((r) => (r.status === "fulfilled" ? r.value : null)));
    }),
  );

  return {
    update(t, dt) {
      if (reducedMotion) return;
      // Festa: giram mais depressa por uns segundos.
      turbo = Math.max(0, turbo - dt);
      tempo += dt * (1 + Math.min(1, turbo / 2) * 5);
      uniforms.uTempo.value = tempo;
    },
    acelerar(s) {
      turbo = s;
    },
    dispose() {
      acabou = true;
    },
  };
}
