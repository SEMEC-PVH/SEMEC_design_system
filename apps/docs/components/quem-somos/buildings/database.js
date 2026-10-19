// Prédio Banco de Dados: torre cilíndrica em três volumes empilhados (como o
// ícone de banco de dados), aletas verticais em todo o perímetro, faixas de
// vidro com luz âmbar entre os volumes, cobertura com claraboia facetada e
// condensadoras, e pátio murado com portão de grades na frente.
// Coordenadas locais: centro do footprint na origem, chão em y = 0, fachada
// e portão em +z. Contrato em ./shared.js.

import * as THREE from "three";
import { std, makeBox } from "./shared";

export function buildDatabase(group, b, { pal, track, unitBox, onFrame }) {
  const hw = b.w / 2 - 0.05;
  const hd = b.h / 2 - 0.05;
  const pv = pal.pv;
  const amber = pal.mix(pv("yellow-400"), pv("yellow-500"), 0.5);
  // Bege quente da imagem: cinzas claros com um toque de amarelo.
  const beige = (gray, t) => pal.mix(pv(gray), pv("yellow-400"), t);

  const mats = {
    stone: track(std(beige("gray-100", 0.1), { flatShading: true })),
    fin: track(std(beige("gray-50", 0.08), { flatShading: true })),
    stoneDark: track(std(beige("gray-400", 0.08))),
    roofFloor: track(std(beige("gray-200", 0.08), { flatShading: true })),
    tile: track(std(pv("white"))), // cor por instância
    metal: track(std(pv("gray-700"), { roughness: 0.5, metalness: 0.4 })),
    metalLight: track(std(pv("gray-300"), { roughness: 0.55, metalness: 0.3 })),
    dark: track(std(pv("gray-800"), { roughness: 0.6 })),
    pipe: track(std(pv("gray-400"), { roughness: 0.45, metalness: 0.4, flatShading: true })),
    glass: track(
      std(pal.mix(pv("yellow-400"), pv("white"), 0.5), {
        roughness: 0.08,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      })
    ),
    warm: track(
      std(pal.mix(amber, pv("white"), 0.4), {
        emissive: pal.mix(amber, pv("white"), 0.3),
        emissiveIntensity: 0.9,
        flatShading: true,
      })
    ),
    mullion: track(std(pal.mix(pv("yellow-800"), pv("gray-700"), 0.5), { roughness: 0.5, metalness: 0.3 })),
    domeGlass: track(
      std(pal.mix(pv("yellow-500"), pv("white"), 0.25), {
        roughness: 0.1,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        flatShading: true,
      })
    ),
    domeInner: track(
      std(pal.mix(pv("yellow-500"), pv("white"), 0.3), {
        emissive: pal.mix(pv("yellow-500"), pv("white"), 0.2),
        emissiveIntensity: 0.8,
        flatShading: true,
      })
    ),
    lamp: track(new THREE.MeshBasicMaterial({ color: pal.mix(pv("yellow-400"), pv("white"), 0.4) })),
    gravel: track(std(pv("gray-300"))),
    leaves: track(std(pv("white"), { flatShading: true })), // cor por instância
  };
  const ribMat = track(new THREE.LineBasicMaterial({ color: pal.mix(pv("yellow-800"), pv("gray-700"), 0.4) }));

  const box = makeBox(group, unitBox);

  // Auxiliares para InstancedMesh.
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const instanced = (geo, mat, list, opts = {}) => {
    const mesh = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([x, y, z, sx, sy, sz, rotY = 0], i) => {
      q.setFromAxisAngle(yAxis, rotY);
      m4.compose(v.set(x, y, z), q, s.set(sx, sy, sz));
      mesh.setMatrixAt(i, m4);
    });
    if (opts.colors) list.forEach((_, i) => mesh.setColorAt(i, opts.colors[i]));
    if (opts.noShadow) mesh.userData.noShadow = true;
    group.add(mesh);
    return mesh;
  };
  // Instância na superfície do cilindro: ângulo θ medido a partir de +z.
  const onRing = (theta, r, y, sx, sy, sz) => [Math.sin(theta) * r, y, Math.cos(theta) * r, sx, sy, sz, theta];

  // Cilindro unitário (raio 1, altura 1), escalado por instância.
  const SEG = 28;
  const cyl = track(new THREE.CylinderGeometry(1, 1, 1, SEG));
  const cylOpen = track(new THREE.CylinderGeometry(1, 1, 1, SEG, 1, true));

  // ---- Medidas da torre -------------------------------------------------------
  const R = Math.min(1.4, Math.min(hw, hd) - 0.45); // raio do núcleo
  const ringR = R + 0.1; // cintas salientes
  const ringH = 0.07;
  const base = 0.045; // topo do piso do pátio
  const volumes = [
    [base, 1.08],
    [1.27, 1.92],
    [2.11, 2.75],
  ];
  const roofY = volumes[2][1];

  // ---- Pátio: piso de placas claras -------------------------------------------
  const wallIn = 0.14; // espessura do muro (até a face interna)
  box(mats.stoneDark, -hw, hw, 0, 0.02, -hd, hd, { noShadow: true }); // rejunte
  const tiles = [];
  const tileColors = [];
  const N = 8;
  const px0 = -hw + wallIn;
  const pz0 = -hd + wallIn;
  const tw = (2 * (hw - wallIn)) / N;
  const td = (2 * (hd - wallIn)) / N;
  const tileBase = beige("gray-100", 0.12);
  for (let ix = 0; ix < N; ix++)
    for (let iz = 0; iz < N; iz++) {
      tiles.push([px0 + tw * (ix + 0.5), 0.0325, pz0 + td * (iz + 0.5), tw - 0.025, 0.025, td - 0.025]);
      tileColors.push(tileBase.clone().offsetHSL(0, 0, ((ix * 7 + iz * 13) % 5) * 0.008 - 0.016));
    }
  instanced(unitBox, mats.tile, tiles, { colors: tileColors });

  // ---- Torre: volumes, cintas e aletas ----------------------------------------
  const cores = [];
  const rings = [];
  const fins = [];
  const doorHalfAngle = 0.55; // sem aletas atrás da porta e da placa
  volumes.forEach(([y0, y1], vi) => {
    cores.push([0, (y0 + y1) / 2, 0, R, y1 - y0, R]);
    rings.push([0, y0 + ringH / 2, 0, ringR, ringH, ringR]);
    rings.push([0, y1 - ringH / 2, 0, ringR, ringH, ringR]);
    const FINS = 40;
    const fy0 = y0 + ringH;
    const fy1 = y1 - ringH;
    for (let i = 0; i < FINS; i++) {
      const theta = ((i + (vi % 2) * 0.5) / FINS) * Math.PI * 2;
      const wrapped = Math.atan2(Math.sin(theta), Math.cos(theta));
      if (vi === 0 && Math.abs(wrapped) < doorHalfAngle) continue;
      // Ritmo da imagem: aletas alternam profundidade e um leve recuo vertical.
      const deep = i % 2 === 0;
      const depth = deep ? 0.11 : 0.07;
      const inset = deep ? 0 : 0.03;
      fins.push(onRing(theta, R + depth / 2 - 0.01, (fy0 + fy1) / 2, 0.1, fy1 - fy0 - inset * 2, depth));
    }
  });
  instanced(cyl, mats.stone, cores);
  instanced(cyl, mats.fin, rings);
  instanced(unitBox, mats.fin, fins);

  // ---- Faixas de vidro âmbar entre os volumes ---------------------------------
  const bands = [
    [volumes[0][1], volumes[1][0]],
    [volumes[1][1], volumes[2][0]],
  ];
  const inner = [];
  const panes = [];
  const mullions = [];
  bands.forEach(([y0, y1]) => {
    const h = y1 - y0;
    inner.push([0, (y0 + y1) / 2, 0, R - 0.16, h, R - 0.16]);
    panes.push([0, (y0 + y1) / 2, 0, R - 0.03, h, R - 0.03]);
    const MUL = 24;
    for (let i = 0; i < MUL; i++) {
      mullions.push(onRing((i / MUL) * Math.PI * 2, R - 0.02, (y0 + y1) / 2, 0.025, h, 0.03));
    }
  });
  instanced(cyl, mats.warm, inner, { noShadow: true });
  instanced(cylOpen, mats.glass, panes, { noShadow: true });
  instanced(unitBox, mats.mullion, mullions);

  // ---- Térreo: porta de metal, painel de acesso e placa ------------------------
  const doorFront = R + 0.05;
  box(mats.stoneDark, -0.34, 0.34, base + 0.06, 0.71, R - 0.12, doorFront + 0.02); // moldura
  box(mats.metal, -0.26, 0.26, base + 0.07, 0.68, R - 0.1, doorFront + 0.03); // folha
  box(mats.dark, -0.005, 0.005, base + 0.07, 0.68, doorFront + 0.03, doorFront + 0.035, { noShadow: true }); // junta das folhas
  box(mats.lamp, 0.08, 0.1, 0.32, 0.46, doorFront + 0.03, doorFront + 0.04, { noShadow: true }); // puxador iluminado
  // Painel de acesso com luzinha âmbar, à direita da porta.
  const panelZ = Math.sqrt(R * R - 0.46 * 0.46) + 0.03;
  box(mats.metal, 0.41, 0.51, 0.34, 0.5, panelZ - 0.08, panelZ);
  box(mats.lamp, 0.44, 0.48, 0.44, 0.47, panelZ, panelZ + 0.01, { noShadow: true });
  // Placa plana acima da porta (fundo do rótulo).
  const signFront = R + 0.08;
  box(mats.stoneDark, -0.68, 0.68, 0.72, 1.0, R - 0.35, signFront);

  // ---- Cobertura: piso, platibanda em blocos e claraboia -----------------------
  const roof = new THREE.Mesh(cyl, mats.roofFloor);
  roof.scale.set(R - 0.05, 0.03, R - 0.05);
  roof.position.set(0, roofY + 0.015, 0);
  group.add(roof);
  const PARAPET = 26;
  const blocks = [];
  const blockW = ((2 * Math.PI * (R + 0.02)) / PARAPET) * 0.92;
  for (let i = 0; i < PARAPET; i++) {
    blocks.push(onRing((i / PARAPET) * Math.PI * 2, R + 0.02, roofY + 0.08, blockW, 0.16, 0.16));
  }
  instanced(unitBox, mats.fin, blocks);

  // Claraboia em cúpula facetada (10 lados) sobre um meio-fio.
  const curb = new THREE.Mesh(track(new THREE.CylinderGeometry(0.4, 0.45, 0.1, 10)), mats.stoneDark);
  curb.position.set(0, roofY + 0.08, 0);
  group.add(curb);
  const domeGeo = track(new THREE.SphereGeometry(0.34, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2));
  const domeIn = new THREE.Mesh(domeGeo, mats.domeInner);
  domeIn.scale.set(0.9, 0.55, 0.9);
  domeIn.position.set(0, roofY + 0.13, 0);
  domeIn.userData.noShadow = true;
  // Cúpula achatada: mantém a torre perto de 3,0 de altura total.
  const dome = new THREE.Mesh(domeGeo, mats.domeGlass);
  dome.scale.set(1, 0.6, 1);
  dome.position.set(0, roofY + 0.13, 0);
  dome.userData.noShadow = true;
  const ribs = new THREE.LineSegments(track(new THREE.EdgesGeometry(domeGeo)), ribMat);
  ribs.position.copy(dome.position);
  ribs.scale.copy(dome.scale);
  group.add(domeIn, dome, ribs);

  // ---- Condensadoras com 4 ventoinhas cada -------------------------------------
  const fanHousings = [];
  const fanCenters = [];
  const condTop = roofY + 0.03 + 0.22;
  for (const cx of [-0.68, 0.68]) {
    const cz = -0.45;
    box(mats.metalLight, cx - 0.28, cx + 0.28, roofY + 0.03, condTop, cz - 0.15, cz + 0.15);
    // Grelhas laterais (frente) escuras.
    box(mats.dark, cx - 0.25, cx - 0.02, roofY + 0.06, condTop - 0.04, cz + 0.15, cz + 0.16, { noShadow: true });
    box(mats.dark, cx + 0.02, cx + 0.25, roofY + 0.06, condTop - 0.04, cz + 0.15, cz + 0.16, { noShadow: true });
    for (const fx of [-0.135, 0.135])
      for (const fz of [-0.072, 0.072]) {
        fanHousings.push([cx + fx, condTop + 0.01, cz + fz, 0.062, 0.02, 0.062]);
        fanCenters.push([cx + fx, condTop + 0.025, cz + fz]);
      }
  }
  instanced(track(new THREE.CylinderGeometry(1, 1, 1, 12)), mats.dark, fanHousings);
  // Pás: duas caixinhas cruzadas por ventoinha, giradas a cada quadro.
  const blades = new THREE.InstancedMesh(unitBox, mats.metalLight, fanCenters.length * 2);
  const setBlades = (angle) => {
    fanCenters.forEach(([x, y, z], i) => {
      for (let k = 0; k < 2; k++) {
        q.setFromAxisAngle(yAxis, angle + (i % 3) * 0.7 + (k * Math.PI) / 2);
        m4.compose(v.set(x, y, z), q, s.set(0.11, 0.008, 0.022));
        blades.setMatrixAt(i * 2 + k, m4);
      }
    });
    blades.instanceMatrix.needsUpdate = true;
  };
  setBlades(0);
  group.add(blades);
  let bladeAngle = 0;
  onFrame((t, dt) => {
    bladeAngle = (bladeAngle + dt * 6) % (Math.PI * 2);
    setBlades(bladeAngle);
  });

  // ---- Caixas técnicas com dutos curtos ---------------------------------------
  const pipes = [];
  const pipeH = (x0, x1, y, z) => pipes.push([(x0 + x1) / 2, y, z, x1 - x0, 0.06, 0.06]);
  const pipeV = (x, y0, y1, z) => pipes.push([x, (y0 + y1) / 2, z, 0.06, y1 - y0, 0.06]);
  const techBox = (x, z, w, d, h, side) => {
    box(mats.metalLight, x - w / 2, x + w / 2, roofY + 0.03, roofY + 0.03 + h, z - d / 2, z + d / 2);
    // Duto saindo pela lateral e descendo até o piso do telhado.
    const sx = x + (side * w) / 2;
    const ex = sx + side * 0.18;
    const py = roofY + 0.03 + h * 0.65;
    pipeH(Math.min(sx, ex), Math.max(sx, ex), py, z);
    pipeV(ex, roofY + 0.03, py + 0.03, z);
  };
  techBox(-0.7, 0.55, 0.28, 0.22, 0.2, 1);
  techBox(0.7, 0.55, 0.32, 0.24, 0.24, -1);
  techBox(0.1, -1.0, 0.3, 0.2, 0.22, -1);
  instanced(unitBox, mats.pipe, pipes);

  // ---- Muro baixo com pilares, portão e arandelas ------------------------------
  const wallH = 0.5;
  const gateHalf = 0.42;
  const pillarW = 0.2;
  // Segmento de muro entre (x0,z0) e (x1,z1) — alinhado a x ou a z.
  const wall = (x0, x1, z0, z1) => {
    box(mats.stoneDark, x0, x1, 0, 0.1, z0, z1); // rodapé escuro
    const ix = x1 - x0 > z1 - z0 ? 0 : 0.012;
    const iz = ix ? 0 : 0.012;
    box(mats.stone, x0 + ix, x1 - ix, 0.1, wallH - 0.04, z0 + iz, z1 - iz);
    box(mats.fin, x0, x1, wallH - 0.04, wallH, z0, z1); // capa
  };
  const wo = 0.02; // face externa do muro recuada do limite
  wall(-hw, hw, -hd + wo, -hd + wallIn); // fundos
  wall(-hw + wo, -hw + wallIn, -hd, hd); // esquerda
  wall(hw - wallIn, hw - wo, -hd, hd); // direita
  wall(-hw, -gateHalf, hd - wallIn, hd - wo); // frente, esquerda do portão
  wall(gateHalf, hw, hd - wallIn, hd - wo); // frente, direita do portão

  const gatePillarX = gateHalf + pillarW / 2;
  const pillarSpots = [
    [-hw + pillarW / 2, -hd + pillarW / 2],
    [hw - pillarW / 2, -hd + pillarW / 2],
    [-hw + pillarW / 2, hd - pillarW / 2],
    [hw - pillarW / 2, hd - pillarW / 2],
    [-gatePillarX, hd - pillarW / 2],
    [gatePillarX, hd - pillarW / 2],
    [-hw + pillarW / 2, 0],
    [hw - pillarW / 2, 0],
    [0, -hd + pillarW / 2],
  ];
  instanced(
    unitBox,
    mats.stone,
    pillarSpots.map(([x, z]) => [x, 0.31, z, pillarW, 0.62, pillarW])
  );
  instanced(
    unitBox,
    mats.fin,
    pillarSpots.map(([x, z]) => [x, 0.64, z, pillarW + 0.03, 0.04, pillarW + 0.03])
  );
  // Arandelas âmbar na face frontal dos pilares do portão.
  for (const sx of [-1, 1]) {
    box(mats.dark, sx * gatePillarX - 0.05, sx * gatePillarX + 0.05, 0.38, 0.52, hd - 0.01, hd + 0.005);
    box(mats.lamp, sx * gatePillarX - 0.035, sx * gatePillarX + 0.035, 0.4, 0.5, hd + 0.005, hd + 0.012, {
      noShadow: true,
    });
  }

  // Portão de grades em duas folhas, centrado em x.
  const gateZ = hd - wallIn / 2 - wo / 2;
  const gateTop = 0.48;
  box(mats.metal, -gateHalf, gateHalf, 0.03, 0.07, gateZ - 0.02, gateZ + 0.02); // trilho
  box(mats.metal, -gateHalf, gateHalf, gateTop - 0.04, gateTop, gateZ - 0.02, gateZ + 0.02); // travessa
  box(mats.metal, -0.015, 0.015, 0.03, gateTop, gateZ - 0.025, gateZ + 0.025); // encontro das folhas
  const bars = [];
  const BARS = 12;
  for (let i = 0; i < BARS; i++) {
    const x = -gateHalf + ((i + 0.5) / BARS) * 2 * gateHalf;
    bars.push([x, (0.07 + gateTop - 0.04) / 2, gateZ, 0.022, gateTop - 0.11, 0.022]);
  }
  instanced(unitBox, mats.metal, bars);

  // ---- Jardineiras com cascalho e arbustos facetados ---------------------------
  const planters = [];
  const gravels = [];
  const shrubs = [];
  const shrubColors = [];
  const leafBase = pv("green-700");
  const planter = (x0, x1, z0, z1, plants) => {
    planters.push([(x0 + x1) / 2, 0.06, (z0 + z1) / 2, x1 - x0, 0.12, z1 - z0]);
    gravels.push([(x0 + x1) / 2, 0.123, (z0 + z1) / 2, x1 - x0 - 0.06, 0.006, z1 - z0 - 0.06]);
    plants.forEach(([fx, fz, k], i) => {
      const x = x0 + (x1 - x0) * fx;
      const z = z0 + (z1 - z0) * fz;
      shrubs.push([x, 0.13 + 0.09 * k, z, k, k * 0.9, k, i * 1.1 + x]);
      shrubColors.push(leafBase.clone().offsetHSL(0, 0, ((i + shrubs.length) % 3) * 0.025 - 0.02));
    });
  };
  const c0 = hw - wallIn - 0.48;
  const c1 = hw - wallIn - 0.04;
  const d0 = hd - wallIn - 0.48;
  const d1 = hd - wallIn - 0.04;
  const cornerPlants = [
    [0.35, 0.35, 1.1],
    [0.7, 0.65, 0.9],
  ];
  planter(-c1, -c0, -d1, -d0, cornerPlants);
  planter(c0, c1, -d1, -d0, cornerPlants);
  planter(-c1, -c0, d0, d1, cornerPlants);
  planter(c0, c1, d0, d1, cornerPlants);
  // Jardineiras baixas ladeando a entrada.
  const fz0 = Math.min(R + 0.12, d0 - 0.05);
  const fz1 = Math.min(fz0 + 0.24, hd - wallIn - 0.03);
  planter(-1.2, -0.82, fz0, fz1, [[0.5, 0.5, 0.95]]);
  planter(0.82, 1.2, fz0, fz1, [[0.5, 0.5, 0.95]]);
  instanced(unitBox, mats.stone, planters);
  instanced(unitBox, mats.gravel, gravels, { noShadow: true });
  instanced(track(new THREE.IcosahedronGeometry(0.12, 0)), mats.leaves, shrubs, { colors: shrubColors });

  // Rótulo na placa plana acima da porta, voltado para +z.
  return {
    labelPos: new THREE.Vector3(0, 0.865, signFront + 0.012),
    labelBg: pv("yellow-800"),
  };
}
