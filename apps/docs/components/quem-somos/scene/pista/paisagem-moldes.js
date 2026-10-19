// Pista de bicicleta da Vila SEMEC: peças da paisagem (só usado por
// paisagem.js).
//
// - criarMaterialBalanco(uT): o material único da paisagem (cor por vértice,
//   facetado, dos dois lados) com o balanço no vertex shader: folhas e
//   juncos balançam (atributo `balanco` = amplitude e fase), asas batem
//   (atributo `asa`, peso por vértice da asa) e a cor da instância só tinge
//   o que tem `tinge` (a arara fica vermelha, a ponta da asa continua azul).
//   Com reducedMotion o uT nunca anda: tudo parado.
// - molde(partes, H): [[geo, cor, flex, tinge], …] → arrays locais (base no
//   chão, y para cima). O balanço de cada vértice é flex × (y / H)^1,5: o
//   pé fica parado e a copa verga (sem a copa "descolar" do tronco).
// - criarMontador(): junta muitos moldes postos no mundo (matriz, tinta,
//   amplitude e fase por objeto) numa geometria só → 1 draw call para todas
//   as árvores. Também faz triângulos de chão (lago, rio, caminho).
// - geoInstancia(partes): geometria para InstancedMesh (aves, patos, nuvens).
// - criarMoldes(ctx, k): os moldes da vegetação (ipê, castanheira, árvore
//   redonda, buriti, açaí, arbustos, flores, tufos, pedras, juncos e
//   vitórias-régias), low-poly no estilo da Vila.

import * as THREE from "three";

export function criarMaterialBalanco(uT) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, flatShading: true, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = uT;
    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uT;
attribute vec2 balanco;
attribute float asa;
attribute float tinge;`,
      )
      .replace(
        "#include <color_vertex>",
        `#if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
  vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR
  vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
  vColor.rgb *= mix( vec3( 1.0 ), instanceColor.rgb, tinge );
#endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
#ifdef USE_INSTANCING
  float faseB = instanceMatrix[3][0] * 0.37 + instanceMatrix[3][2] * 0.53;
  float escB = length( instanceMatrix[0].xyz );
#else
  float faseB = balanco.y;
  float escB = 1.0;
#endif
  transformed.x += sin( uT * 1.7 + faseB ) * balanco.x;
  transformed.z += cos( uT * 1.3 + faseB * 1.7 ) * balanco.x * 0.6;
#ifdef USE_INSTANCING
  // Só as instâncias (aves) têm o atributo asa: na malha montada ele falta,
  // e um atributo ausente lê o valor genérico que sobrou de outro draw call
  // (com x em coordenadas do mundo, virava um triângulo gigante sobre a pista).
  transformed.y += sin( uT * ( 9.0 + 14.0 * ( 1.0 - clamp( escB, 0.0, 1.0 ) ) ) + faseB * 3.0 ) * asa * abs( transformed.x ) * 0.8;
#endif`,
      );
  };
  return mat;
}

// Partes → arrays locais, sem índice (normais por face: visual facetado).
export function molde(partes, H = 1) {
  const pos = [];
  const nor = [];
  const col = [];
  const flex = [];
  const tin = [];
  for (const [g0, c, f = 1, t = 0] of partes) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    if (g !== g0) g0.dispose();
    g.computeVertexNormals();
    const p = g.attributes.position;
    const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      pos.push(p.getX(i), y, p.getZ(i));
      nor.push(n.getX(i), n.getY(i), n.getZ(i));
      col.push(c.r, c.g, c.b);
      flex.push(f * Math.min(1, Math.max(0, y / H)) ** 1.5);
      tin.push(t);
    }
    g.dispose();
  }
  return { pos, nor, col, flex, tin, n: pos.length / 3 };
}

export function criarMontador() {
  const P = [];
  const N = [];
  const C = [];
  const B = [];
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();
  const nm = new THREE.Matrix3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  return {
    // Molde no mundo: matriz m; `tint` multiplica as partes com tinge;
    // `amp` (unidades) e `fase` do balanço.
    por(md, m, { tint = null, amp = 0, fase = 0, s = 1 } = {}) {
      nm.getNormalMatrix(m);
      for (let i = 0; i < md.n; i++) {
        v.fromArray(md.pos, i * 3).applyMatrix4(m);
        n.fromArray(md.nor, i * 3).applyMatrix3(nm).normalize();
        P.push(v.x, v.y, v.z);
        N.push(n.x, n.y, n.z);
        let r = md.col[i * 3];
        let g = md.col[i * 3 + 1];
        let b = md.col[i * 3 + 2];
        if (tint && md.tin[i]) {
          r *= tint.r;
          g *= tint.g;
          b *= tint.b;
        }
        C.push(r, g, b);
        B.push(md.flex[i] * amp * s, fase);
      }
    },
    // Triângulo de chão no mundo (a, b, c = [x, y, z]), frente para cima.
    triChao(a, b, c, cor) {
      ab.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      ac.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]);
      const ny = ab.z * ac.x - ab.x * ac.z;
      const [q, r] = ny >= 0 ? [b, c] : [c, b];
      P.push(...a, ...q, ...r);
      for (let i = 0; i < 3; i++) {
        N.push(0, 1, 0);
        C.push(cor.r, cor.g, cor.b);
        B.push(0, 0);
      }
    },
    fechar() {
      if (!P.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute("balanco", new THREE.Float32BufferAttribute(B, 2));
      g.computeBoundingSphere();
      return g;
    },
  };
}

// Geometria para InstancedMesh: [[geo, cor, tinge, asa], …].
export function geoInstancia(partes) {
  const P = [];
  const N = [];
  const C = [];
  const T = [];
  const A = [];
  for (const [g0, c, t = 1, a = 0] of partes) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    if (g !== g0) g0.dispose();
    g.computeVertexNormals();
    const p = g.attributes.position;
    const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      P.push(p.getX(i), p.getY(i), p.getZ(i));
      N.push(n.getX(i), n.getY(i), n.getZ(i));
      C.push(c.r, c.g, c.b);
      T.push(t);
      A.push(a);
    }
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute("tinge", new THREE.Float32BufferAttribute(T, 1));
  g.setAttribute("asa", new THREE.Float32BufferAttribute(A, 1));
  g.setAttribute("balanco", new THREE.Float32BufferAttribute(new Float32Array((P.length / 3) * 2), 2));
  return g;
}

// ---- Formas básicas ------------------------------------------------------------------
export const ico = (r, x, y, z, sx = 1, sy = 1, sz = 1) => new THREE.IcosahedronGeometry(r, 0).scale(sx, sy, sz).translate(x, y, z);
// Tronco: cilindro aberto do chão (y0) para cima, r0 embaixo e r1 em cima.
export const cil = (r0, r1, h, seg, y0 = 0) => new THREE.CylinderGeometry(r1, r0, h, seg, 1, true).translate(0, y0 + h / 2, 0);
// Galho saindo do tronco em y0, inclinado `incl` e girado `giro`.
const ramo = (len, r, incl, giro, y0) => new THREE.CylinderGeometry(r * 0.6, r, len, 4, 1, true).translate(0, len / 2, 0).rotateZ(incl).rotateY(giro).translate(0, y0, 0);
// Caixa centrada em (x, y, z).
export const bx = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

// ---- Vegetação de Porto Velho ---------------------------------------------------------
export function criarMoldes(ctx, k) {
  const { pv, mix, white } = ctx;
  const M = {};

  // Ipê florido: quase só flor (copa branca tingida pela cor do ipê), dois
  // galhos e o "tapete" de pétalas caídas no chão (também tingido).
  M.ipe = molde(
    [
      [cil(0.1, 0.065, 1.15, 5), k.tronco],
      [ramo(0.6, 0.05, 0.7, 0.3, 0.95), k.tronco],
      [ramo(0.55, 0.045, 0.75, 2.6, 1.0), k.tronco],
      [ico(0.5, 0, 1.55, 0, 1.3, 0.72, 1.15), white, 1, 1],
      [ico(0.36, 0.42, 1.72, 0.14), mix(white, pv("gray-100"), 0.5), 1, 1],
      [ico(0.34, -0.4, 1.66, -0.16), mix(white, pv("gray-200"), 0.5), 1, 1],
      [ico(0.28, 0.06, 1.98, -0.06), white, 1, 1],
      [ico(0.17, -0.12, 1.32, 0.42), k.folhaA, 1, 0],
      [new THREE.CircleGeometry(0.62, 9).rotateX(-Math.PI / 2).translate(0, 0.014, 0), k.petala, 0, 1],
    ],
    2.1,
  );

  // Castanheira: a gigante da mata (tronco reto e alto, copa em guarda-chuva).
  M.castanheira = molde(
    [
      [cil(0.17, 0.1, 2.7, 6), k.troncoClaro],
      [ramo(0.7, 0.06, 0.85, 0.5, 2.3), k.troncoClaro],
      [ramo(0.6, 0.05, 0.85, 3.4, 2.4), k.troncoClaro],
      [ico(0.75, 0, 2.95, 0, 1.45, 0.55, 1.3), k.folhaB, 1, 1],
      [ico(0.55, 0.62, 3.05, 0.25, 1.2, 0.6, 1.1), k.folhaA, 1, 1],
      [ico(0.52, -0.55, 3.0, -0.3, 1.2, 0.6, 1.1), k.folhaA, 1, 1],
      [ico(0.45, 0.05, 3.35, -0.1, 1.1, 0.7, 1.1), k.folhaClara, 1, 1],
    ],
    3.5,
  );

  // Árvore redonda (o grosso da mata).
  M.redonda = molde(
    [
      [cil(0.12, 0.08, 0.75, 5), k.tronco],
      [ico(0.62, 0, 1.08, 0, 1, 0.85, 1), k.folhaA, 1, 1],
      [ico(0.42, 0.28, 1.42, 0.1), k.folhaB, 1, 1],
      [ico(0.36, -0.3, 1.25, -0.2), k.folhaClara, 1, 1],
    ],
    1.7,
  );

  // Buriti: palmeira de leques (setores de círculo), saia de folha seca e
  // cacho de cocos.
  {
    const partes = [
      [cil(0.1, 0.075, 2.25, 5), k.troncoPalm],
      [new THREE.ConeGeometry(0.2, 0.42, 6, 1, true).rotateX(Math.PI).translate(0, 2.06, 0), k.palha],
      [ico(0.11, 0.12, 2.1, 0.06), k.cocoBuriti, 1, 0],
    ];
    for (let i = 0; i < 8; i++) {
      const incl = [0.55, 1.15, 1.7][i % 3];
      const leque = new THREE.CircleGeometry(0.58, 5, Math.PI / 2 - 0.75, 1.5).translate(0, 0.08, 0).rotateX(incl).rotateY((i / 8) * Math.PI * 2 + 0.3).translate(0, 2.24, 0);
      partes.push([leque, i % 2 ? k.folhaClara : k.folhaA, 1, 1]);
    }
    M.buriti = molde(partes, 2.7);
  }

  // Açaizeiro: touceira de 3 estipes finos, folhas pendentes (planos: o
  // material é dos dois lados) e cacho roxo.
  {
    const partes = [];
    for (const [dx, dz, h] of [[0, 0, 2.3], [0.24, 0.1, 1.85], [-0.14, 0.22, 1.55]]) {
      partes.push([new THREE.CylinderGeometry(0.028, 0.04, h, 4, 1, true).translate(dx, h / 2, dz), k.troncoPalm, 1, 0]);
      for (let i = 0; i < 5; i++) {
        const folha = new THREE.PlaneGeometry(0.75, 0.16).rotateX(-Math.PI / 2).translate(0.36, 0, 0).rotateZ(-0.55).rotateY((i / 5) * Math.PI * 2 + h).translate(dx, h, dz);
        partes.push([folha, i % 2 ? k.folhaA : k.folhaClara, 1, 0]);
      }
      partes.push([new THREE.OctahedronGeometry(0.08, 0).translate(dx + 0.07, h - 0.16, dz), k.acai, 1, 0]);
    }
    M.acai = molde(partes, 2.3);
  }

  // Arbustos (um tingido de verde; outro com florzinhas tingidas).
  M.arbusto = molde(
    [
      [ico(0.32, 0, 0.24, 0, 1.25, 0.8, 1.1), k.folhaA, 1, 1],
      [ico(0.24, 0.26, 0.3, 0.1), k.folhaClara, 1, 1],
      [ico(0.22, -0.24, 0.27, -0.1), k.folhaB, 1, 1],
    ],
    0.6,
  );
  M.arbustoFlor = molde(
    [
      [ico(0.32, 0, 0.24, 0, 1.25, 0.8, 1.1), k.folhaA, 1, 0],
      [ico(0.24, 0.26, 0.3, 0.1), k.folhaClara, 1, 0],
      [ico(0.22, -0.24, 0.27, -0.1), k.folhaB, 1, 0],
      ...[[0.1, 0.48, 0.12], [-0.25, 0.42, 0.05], [0.33, 0.4, -0.08], [-0.05, 0.4, -0.28], [0.15, 0.36, 0.3]].map(([x, y, z]) => [new THREE.OctahedronGeometry(0.075, 0).translate(x, y, z), white, 1, 1]),
    ],
    0.6,
  );

  // Flores: 3 hastes com a cabeça tingida e o miolo amarelo.
  {
    const partes = [];
    for (const [x, z, h] of [[0, 0, 0.3], [0.12, 0.08, 0.22], [-0.08, 0.11, 0.26]]) {
      partes.push([new THREE.ConeGeometry(0.014, h, 3, 1, true).translate(x, h / 2, z), k.caule, 1, 0]);
      partes.push([new THREE.OctahedronGeometry(0.075, 0).scale(1, 0.5, 1).translate(x, h + 0.01, z), white, 1, 1]);
      partes.push([new THREE.OctahedronGeometry(0.028, 0).translate(x, h + 0.045, z), k.miolo, 1, 0]);
    }
    M.flores = molde(partes, 0.3);
  }

  // Tufo de capim (4 lâminas).
  {
    const partes = [];
    for (let i = 0; i < 4; i++) {
      const h = 0.24 + (i % 2) * 0.1;
      partes.push([new THREE.ConeGeometry(0.035, h, 3, 1, true).translate(0, h / 2, 0).rotateZ(0.25 + (i % 3) * 0.12).rotateY(i * 1.7), white, 1, 1]);
    }
    M.tufo = molde(partes, 0.34);
  }

  // Pedra (tingida de cinza).
  M.pedra = molde([[new THREE.DodecahedronGeometry(0.2, 0).scale(1.25, 0.6, 1).translate(0, 0.05, 0), white, 0, 1]], 1);

  // Junco / taboa da beira do lago.
  {
    const partes = [];
    for (const [x, z, h] of [[0, 0, 0.62], [0.08, 0.06, 0.5], [-0.07, 0.05, 0.56]]) {
      partes.push([new THREE.ConeGeometry(0.016, h, 3, 1, true).translate(x, h / 2, z), k.folhaClara, 1, 0]);
      partes.push([new THREE.CylinderGeometry(0.028, 0.028, 0.12, 4).translate(x, h - 0.12, z), k.taboa, 1, 0]);
    }
    M.junco = molde(partes, 0.62);
  }

  // Vitória-régia (disco com a borda levantada) e a flor.
  M.vitoria = molde(
    [
      [new THREE.CylinderGeometry(0.3, 0.3, 0.02, 9).translate(0, 0.01, 0), k.vitoria, 0, 0],
      [new THREE.CylinderGeometry(0.33, 0.3, 0.07, 9, 1, true).translate(0, 0.035, 0), k.vitoriaBorda, 0, 0],
    ],
    1,
  );
  M.florVitoria = molde([[new THREE.OctahedronGeometry(0.09, 0).scale(1, 0.7, 1).translate(0, 0.07, 0), white, 0, 1], [new THREE.OctahedronGeometry(0.035, 0).translate(0, 0.12, 0), k.miolo, 0, 0]], 1);

  return M;
}
