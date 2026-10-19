// Pista de bicicleta da Vila SEMEC: o traçado (dono: zona "tracado").
//
// Tudo que a corrida usa ou que fica em cima do asfalto, em quatro arquivos
// (todos deste dono):
//   tracado.js        (este) junta tudo e cuida dos eventos: o pórtico de
//                     LARGADA · CHEGADA (torres e viga treliçadas, letreiro,
//                     semáforo, bandeiras, cordão de lâmpadas), os arcos
//                     infláveis dos checkpoints (azuis com faixas amarelas,
//                     número na coroa; ficam translúcidos quando o ciclista
//                     passa atrás deles) e a cortina de luz do próximo, a
//                     arte pintada no asfalto ("VILA SEMEC" na reta, números
//                     do grid, setas antes das curvas) e as lâmpadas (um
//                     InstancedMesh só, cor por instância);
//   tracado-chao.js   o chão inteiro numa malha com cor por vértice (gramado
//                     em xadrez de corte, asfalto com variação, borracha e
//                     marcas de frenagem nas curvas, zebras com relevo,
//                     linhas, chegada, grid, box);
//   tracado-arte.js   o atlas de canvas próprio da pintura (alphaTest);
//   tracado-box.js    o box: muros, garagem, bancada, regras, pódio, pneus,
//                     portão (abrirPorta) e holofotes.
//
// Contrato em comum.js. Eventos: setProximo (o próximo arco troca as cores
// por vértice para amarelo e pulsa; os outros ficam azuis, um tico
// apagados), passou (flash e faíscas ao longo do arco via ctx.soltar),
// largada (semáforo + lâmpadas vermelhas, depois verdes), festa (lâmpadas
// em arco-íris e os arcos piscando), abrirPorta (portão do box), update.
// Expõe centroChegada (Vector3, meio da viga do pórtico) para a festa.
//
// Posições da corrida intocadas: pórtico em ctx.portico (pilares fora do
// asfalto), arcos na reta do corte de cada checkpoint (pés a ≥ 2,42 da
// linha central, sempre além da zebra), REGRAS/GARAGEM/BANCADA nos mesmos
// tiles. Draw calls próprios: chão 1, pintura 1, lâmpadas 1, semáforo 1,
// portão 1, cortina 2 e um por arco (o material pulsa) — o resto vai nos
// lotes compartilhados.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { std } from "../../buildings/shared";
import { BOX, LARGURA_ZEBRA, MURO_Y, RAIO_ASFALTO } from "./circuito";
import { ANG_CAM, caixa, criarLote, wx, wz } from "./comum";
import { criarArteTracado } from "./tracado-arte";
import { barraV, montarBox } from "./tracado-box";
import { montarChao } from "./tracado-chao";

const UP = new THREE.Vector3(0, 1, 0);
const rotX = (a) => new THREE.Matrix4().makeRotationX(a);
const rotY = (a) => new THREE.Matrix4().makeRotationY(a);
const mover = (x, h, z) => new THREE.Matrix4().makeTranslation(x, h, z);

export function montarTracado(ctx) {
  const { pal, pv, mix, white, cor, lite, reducedMotion, root, track, add, atlas, regioes, placa, bandeira, soltar, pts, checkpoints, N, coresFogos } = ctx;
  const { fx, fyN, fyS, alt: ALT_P } = ctx.portico;
  const M = pts.length;

  // Ninguém planta nada no box (agora de x 24 a 46) nem em volta do pórtico.
  ctx.reservar(BOX.x0 - 3, BOX.x1 + 1, MURO_Y - 1, Infinity);
  ctx.reservar(fx - 2, fx + 2, fyN - 2, fyS + 1);

  // ---- Chão ---------------------------------------------------------------------------
  const chao = montarChao(ctx);
  const matChao = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide }));
  const meshChao = new THREE.Mesh(track(chao.geo), matChao);
  meshChao.receiveShadow = !lite;
  root.add(meshChao);

  // ---- Pintura (atlas próprio) --------------------------------------------------------
  const arte = criarArteTracado(pal, lite);
  track(arte.tex);
  const decal = criarLote({ uv: true });
  // No chão: centro (x, y) em tile, w × h (h = "para cima" do texto, que
  // aponta para o norte com giro 0; giro em Y).
  const pinta = (reg, x, y, w, h, giro = 0, alt = 0.04) => {
    const mt = mover(wx(x), alt, wz(y)).multiply(rotY(giro)).multiply(rotX(-Math.PI / 2));
    decal.add(new THREE.PlaneGeometry(w, h), arte.regioes[reg], mt);
  };
  // Em pé (como placa() de comum.js, mas com a arte do traçado).
  const placaArte = (reg, x, y, hh, w, alt, { giro = 0, deFrente = false } = {}) => {
    const mt = mover(wx(x), hh, wz(y)).multiply(rotY(giro));
    if (deFrente) mt.multiply(rotX(-ANG_CAM));
    decal.add(new THREE.PlaneGeometry(w, alt), arte.regioes[reg], mt);
  };
  // Giro que aponta o "para cima" da pintura na tangente (tx, ty).
  const giroTangente = (tx, ty) => Math.atan2(-tx, -ty);
  const longeDosCortes = (s, folga) =>
    checkpoints.every((cp) => {
      const d = Math.abs(cp.s - s);
      return Math.min(d, ctx.c.total - d) > folga;
    });

  // "VILA SEMEC" no asfalto da reta, depois da largada.
  {
    let best = null;
    for (const p of pts) if (p.y > 40 && (!best || Math.abs(p.x - 44.5) < Math.abs(best.x - 44.5))) best = p;
    pinta("vila", best.x, best.y, 6.6, 1.03);
  }
  // Números do grid.
  chao.GRID.forEach(([x, y], i) => pinta(`g${i + 1}`, x - 0.06, y, 0.52, 0.52));
  // Setas antes das curvas fortes (as marcas de frenagem são do chão), do
  // lado de dentro da curva para não pisar nos riscos de borracha.
  for (const cv of chao.curvas) {
    const p = pts[(cv.k - 22 + M) % M];
    if (p.y > 44 && p.x > 14 && p.x < 60) continue; // a reta é da pintura grande
    if (!longeDosCortes(p.s, 1.6)) continue;
    const d = Math.sign(cv.kv) * 0.45;
    pinta("seta", p.x - p.ty * d, p.y + p.tx * d, 0.95, 0.95, giroTangente(p.tx, p.ty), 0.041);
  }

  // ---- Lâmpadas (cor por instância; montadas no fim) ----------------------------------
  const bulbos = [];
  const bulbo = (x, y, h, tipo = "pisca") => bulbos.push({ x, y, h, tipo });

  // ---- Box ----------------------------------------------------------------------------
  const box = montarBox(ctx, { pinta, placaArte, bulbo, decal, regioes: arte.regioes });

  // ---- Materiais dos arcos ------------------------------------------------------------
  // Arcos fora da vez: cores SEMEC um tico apagadas. O próximo troca as
  // cores por vértice para o "modo destaque" (azul e alumínio viram amarelo,
  // as faixas amarelas viram brancas) e pulsa com emissivo amarelo: é o
  // "arco que brilha em amarelo" das regras.
  const corDiscreta = mix(white, pv("gray-400"), 0.22);
  const corCheia = white.clone();
  const destaqueForte = pv("yellow-500");
  const destaqueClaro = mix(pv("yellow-400"), white, 0.4);
  const novoMatArco = () => track(std(corDiscreta.clone(), { vertexColors: true, emissive: pv("yellow-400"), emissiveIntensity: 0, roughness: 0.55, metalness: 0.05 }));
  const coresDestaque = (normais) => {
    const out = new Float32Array(normais.length);
    for (let i = 0; i < normais.length; i += 3) {
      const [r, g, b] = [normais[i], normais[i + 1], normais[i + 2]];
      const c = r > b + 0.25 && g > b ? white : b > r + 0.08 || (r > 0.5 && g > 0.5 && b > 0.5) ? destaqueForte : destaqueClaro;
      out.set([c.r, c.g, c.b], i);
    }
    return out;
  };
  // Peças com cor (em coordenadas do mundo) → uma geometria com cor por vértice.
  const juntar = (partes) => {
    const l = criarLote();
    for (const [g, c] of partes) l.add(g, c);
    return l.fechar(null).geometry;
  };
  const P = (x, hh, y) => new THREE.Vector3(wx(x), hh, wz(y));

  // ---- Pórtico de LARGADA · CHEGADA ---------------------------------------------------
  // Duas torres de treliça (a norte mais alta, com o letreiro e o semáforo
  // virados para a câmera) e a viga treliçada sobre a pista, com o topo
  // quadriculado. Torres e viga vão no material do arco da chegada (pulsam
  // quando ela é o próximo checkpoint).
  const corTrelica = mix(pv("gray-200"), white, 0.35);
  const corDiagonal = mix(pv("gray-300"), pv("blue-300"), 0.25);
  const partesPortico = [];
  const torre = (cx, cy, h1, s) => {
    const r = 0.035;
    const cantos = [[-s, -s], [s, -s], [s, s], [-s, s]];
    partesPortico.push([caixa(cx - s - 0.13, cx + s + 0.13, 0, 0.3, cy - s - 0.13, cy + s + 0.13), cor.azul]);
    partesPortico.push([caixa(cx - s - 0.14, cx + s + 0.14, 0.3, 0.36, cy - s - 0.14, cy + s + 0.14), cor.amarelo]);
    for (const [dx, dy] of cantos) partesPortico.push([caixa(cx + dx - r, cx + dx + r, 0.36, h1, cy + dy - r, cy + dy + r), corTrelica]);
    const passo = 0.44;
    for (let hh = 0.36 + passo; hh < h1 - 0.05; hh += passo) {
      partesPortico.push([caixa(cx - s, cx + s, hh - 0.02, hh + 0.02, cy - s - 0.02, cy - s + 0.02), corTrelica]);
      partesPortico.push([caixa(cx - s, cx + s, hh - 0.02, hh + 0.02, cy + s - 0.02, cy + s + 0.02), corTrelica]);
      partesPortico.push([caixa(cx - s - 0.02, cx - s + 0.02, hh - 0.02, hh + 0.02, cy - s, cy + s), corTrelica]);
      partesPortico.push([caixa(cx + s - 0.02, cx + s + 0.02, hh - 0.02, hh + 0.02, cy - s, cy + s), corTrelica]);
      if (lite) continue;
      for (let c2 = 0; c2 < 4; c2++) {
        const [ax, ay] = cantos[c2];
        const [bx2, by2] = cantos[(c2 + 1) % 4];
        partesPortico.push([barraV(P(cx + ax, hh - passo, cy + ay), P(cx + bx2, hh, cy + by2), 0.016, 4), corDiagonal]);
      }
    }
    partesPortico.push([caixa(cx - s - 0.05, cx + s + 0.05, h1, h1 + 0.06, cy - s - 0.05, cy + s + 0.05), cor.azul]);
  };
  const S_T = 0.2;
  const H_NORTE = ALT_P + 1.32;
  torre(fx, fyN, H_NORTE, S_T);
  torre(fx, fyS, ALT_P + 0.22, S_T);
  // Viga: 4 banzos ao longo de y, montantes e diagonais.
  {
    const s = 0.18;
    const r = 0.035;
    for (const dx of [-s, s]) for (const dh of [-s, s]) partesPortico.push([caixa(fx + dx - r, fx + dx + r, ALT_P + dh - r, ALT_P + dh + r, fyN, fyS), corTrelica]);
    const n = Math.round((fyS - fyN) / 0.45);
    for (let j = 1; j < n; j++) {
      const y = fyN + ((fyS - fyN) * j) / n;
      const y0 = fyN + ((fyS - fyN) * (j - 1)) / n;
      for (const dx of [-s, s]) partesPortico.push([caixa(fx + dx - 0.018, fx + dx + 0.018, ALT_P - s, ALT_P + s, y - 0.018, y + 0.018), corTrelica]);
      if (lite) continue;
      for (const dx of [-s, s]) partesPortico.push([barraV(P(fx + dx, ALT_P - s, y0), P(fx + dx, ALT_P + s, y), 0.014, 4), corDiagonal]);
      partesPortico.push([barraV(P(fx - s, ALT_P + s, y0), P(fx + s, ALT_P + s, y), 0.014, 4), corDiagonal]);
    }
  }
  // Topo da viga quadriculado (atlas compartilhado, visto de cima).
  {
    const g = new THREE.PlaneGeometry(fyS - fyN - 0.5, 0.34);
    const mt = mover(wx(fx), ALT_P + 0.22, wz((fyN + fyS) / 2)).multiply(rotX(-Math.PI / 2)).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
    const r = regioes.xadrez;
    atlas.add(g, { ...r, v1: r.v0 + (r.v1 - r.v0) / 3 }, mt);
  }
  // Letreiro e semáforo na torre norte (fixos, no lote compartilhado).
  const YF = fyN + 0.25; // face sul do letreiro
  add(caixa(fx - 2.05, fx + 2.05, ALT_P + 0.74, H_NORTE, fyN - 0.1, YF), cor.azulEsc);
  add(caixa(fx - 2.1, fx + 2.1, H_NORTE, H_NORTE + 0.06, fyN - 0.12, YF + 0.02), cor.amarelo);
  add(caixa(fx - 2.1, fx + 2.1, ALT_P + 0.68, ALT_P + 0.74, fyN - 0.12, YF + 0.02), cor.amarelo);
  placa("faixa", fx, YF + 0.01, (ALT_P + 0.74 + H_NORTE) / 2, 3.9, 0.49);
  // Mãos-francesas do letreiro (da torre às pontas).
  for (const sx of [-1, 1]) add(barraV(P(fx + sx * 0.2, ALT_P + 0.3, fyN), P(fx + sx * 1.6, ALT_P + 0.72, fyN), 0.025, 4), corTrelica);
  // Caixa do semáforo (3 lâmpadas lado a lado) com viseiras.
  add(caixa(fx - 0.72, fx + 0.72, ALT_P + 0.22, ALT_P + 0.68, fyN + 0.04, YF + 0.04), pv("gray-950"));
  for (let i = 0; i < 3; i++) {
    const x = fx + (i - 1) * 0.44;
    add(caixa(x - 0.19, x + 0.19, ALT_P + 0.62, ALT_P + 0.66, YF + 0.04, YF + 0.2), pv("gray-900"));
  }
  // Bandeiras: nas duas torres e nos mastros das pontas do letreiro.
  bandeira(fx + S_T + 0.04, fyN, ALT_P - 0.3);
  bandeira(fx + S_T + 0.04, fyS, ALT_P - 0.3);
  for (const sx of [-1, 1]) {
    const x = fx + sx * 2.05;
    add(caixa(x - 0.025, x + 0.025, H_NORTE, H_NORTE + 0.62, fyN + 0.05, fyN + 0.1), cor.metal);
    bandeira(x, fyN + 0.075, H_NORTE + 0.42, sx < 0 ? Math.PI : 0);
  }
  // Faixas zebradas de atenção nas bases das torres.
  for (const y of [fyN, fyS]) placaArte("listra", fx, y + S_T + 0.135, 0.15, 2 * S_T + 0.26, 0.28);
  // Cordão de lâmpadas: topo do letreiro e os dois banzos de cima da viga.
  {
    const n = lite ? 9 : 15;
    for (let i = 0; i < n; i++) bulbo(fx - 1.95 + (3.9 * i) / (n - 1), YF + 0.03, H_NORTE + 0.1);
    if (!lite) {
      const m = Math.round((fyS - fyN) / 0.4);
      for (let j = 1; j < m; j++) for (const dx of [-0.18, 0.18]) bulbo(fx + dx, fyN + ((fyS - fyN) * j) / m, ALT_P + 0.24);
    }
  }

  // ---- Arcos dos checkpoints ----------------------------------------------------------
  // Infláveis: meia elipse de tubo azul com faixas amarelas e coroa branca,
  // lastros nos pés e a placa com o número na coroa (de frente para a
  // câmera). Na reta do corte; pés além da zebra.
  const H_ARCO = 2.05;
  // Tubo mais fino nos arcos de coluna (atravessam a pista de norte a sul:
  // a câmera do sul os vê de lado, como uma faixa em pé sobre o asfalto).
  const tuboDe = (cp) => (cp.eixo === "col" ? 0.11 : 0.17);
  const arcos = checkpoints.map((cp, i) => {
    const mat = novoMatArco();
    let geo;
    let centro;
    let giro;
    let vao;
    let trilha;
    let tipo;
    let rTubo = 0;
    if (i === N - 1) {
      geo = juntar(partesPortico);
      centro = new THREE.Vector3(wx(fx), ALT_P, wz((fyN + fyS) / 2));
      giro = Math.PI / 2;
      vao = fyS - fyN;
      tipo = "portico";
      trilha = Array.from({ length: 7 }, (_, k) => P(fx, ALT_P + 0.2, fyN + ((fyS - fyN) * k) / 6));
    } else {
      const col = cp.eixo === "col";
      const R_TUBO = tuboDe(cp);
      rTubo = R_TUBO;
      const f = cp.faixa;
      const tc = Math.max(0.5, Math.abs(col ? cp.tangente[0] : cp.tangente[1]));
      const c0 = col ? f.y : f.x;
      const pe = (s) => (col ? [f.x, c0 + s] : [c0 + s, f.y]);
      let S = (RAIO_ASFALTO + LARGURA_ZEBRA) / tc + 0.38;
      for (let it = 0; it < 12; it++) {
        if ([-S, S].every((s) => (ctx.c.corredor(...pe(s))?.d ?? 9) >= 2.42)) break;
        S += 0.05;
      }
      const base = col ? P(f.x, 0, c0) : P(c0, 0, f.y);
      const dir = col ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
      const ponto = (th) => base.clone().addScaledVector(dir, S * Math.cos(th)).addScaledVector(UP, H_ARCO * Math.sin(th));
      const curva = new THREE.CatmullRomCurve3(Array.from({ length: 15 }, (_, k) => ponto(Math.PI * (1 - k / 14))));
      const SEG = lite ? 14 : 20;
      const tubo = new THREE.TubeGeometry(curva, SEG, R_TUBO, lite ? 5 : 7, false).toNonIndexed();
      // Cor por triângulo, pela posição ao longo do tubo (uv.x).
      const uv = tubo.attributes.uv;
      const n = uv.count;
      const cores = new Float32Array(n * 3);
      const azul = cor.azul;
      const faixa = cor.amarelo;
      const coroa = white;
      for (let v = 0; v < n; v += 3) {
        const u = (uv.getX(v) + uv.getX(v + 1) + uv.getX(v + 2)) / 3;
        const seg = Math.floor(u * SEG);
        const fim = SEG - 1 - seg;
        const c = Math.min(seg, fim) === 2 ? faixa : Math.abs(u - 0.5) < 1.2 / SEG ? coroa : Math.min(seg, fim) === 0 ? coroa : azul;
        for (let q = 0; q < 3; q++) cores.set([c.r, c.g, c.b], (v + q) * 3);
      }
      tubo.setAttribute("color", new THREE.BufferAttribute(cores, 3));
      tubo.deleteAttribute("uv");
      const partes = [];
      // Lastros nos pés (brancos com faixa azul) e o anel amarelo.
      for (const s of [-S, S]) {
        const [x, y] = pe(s);
        partes.push([caixa(x - 0.24, x + 0.24, 0, 0.22, y - 0.24, y + 0.24), mix(white, pv("gray-200"), 0.5)]);
        partes.push([caixa(x - 0.245, x + 0.245, 0.12, 0.17, y - 0.245, y + 0.245), cor.azul]);
        const g = new THREE.CylinderGeometry(R_TUBO + 0.03, R_TUBO + 0.03, 0.1, 8);
        g.translate(wx(x), 0.3, wz(y));
        partes.push([g, cor.amarelo]);
      }
      // Placa do número na coroa, inclinada para a câmera.
      const topo = ponto(Math.PI / 2);
      const placaH = topo.y + R_TUBO + 0.36;
      const mt = mover(topo.x, placaH, topo.z).multiply(rotX(-ANG_CAM));
      const gPlaca = new THREE.BoxGeometry(0.66, 0.62, 0.07);
      gPlaca.applyMatrix4(mt);
      partes.push([gPlaca, cor.azulEsc]);
      const gHaste = new THREE.BoxGeometry(0.06, 0.24, 0.06);
      gHaste.translate(topo.x, topo.y + R_TUBO + 0.08, topo.z);
      partes.push([gHaste, cor.azulEsc]);
      atlas.add(new THREE.PlaneGeometry(0.52, 0.52), regioes[`n${i + 1}`], mt.clone().multiply(mover(0, 0, 0.04)));
      geo = mergeGeometries([tubo, juntar(partes)]);
      tubo.dispose();
      centro = new THREE.Vector3(base.x, H_ARCO, base.z);
      giro = col ? Math.PI / 2 : 0;
      vao = 2 * S;
      tipo = "inflavel";
      trilha = Array.from({ length: 9 }, (_, k) => ponto(Math.PI * (k / 8)).add(new THREE.Vector3(0, R_TUBO, 0)));
    }
    track(geo);
    const attCor = geo.attributes.color;
    const normais = attCor.array.slice();
    const destaque = coresDestaque(normais);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = !lite;
    root.add(mesh);
    // Inflável fica translúcido quando o ciclista passa atrás dele (a câmera
    // do sul vê o arco de coluna de lado e a coroa do arco de linha por cima).
    if (tipo === "inflavel") mat.transparent = true;
    return { mat, mesh, centro, giro, vao, flash: 0, tipo, trilha, rTubo, opacidade: 1, attCor, normais, destaque, emDestaque: false };
  });

  // Cortina de luz do próximo arco (aditiva, fina) e a faixa no chão: meia
  // elipse nos infláveis, retângulo no pórtico.
  const matCortina = track(
    new THREE.MeshBasicMaterial({ color: pv("yellow-400"), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
  );
  const geoPlano = track(new THREE.PlaneGeometry(1, 1));
  const geoMeia = track(new THREE.CircleGeometry(1, 18, 0, Math.PI));
  const cortina = new THREE.Mesh(geoPlano, matCortina);
  cortina.userData.noShadow = true;
  const faixaLuz = new THREE.Mesh(geoPlano, matCortina);
  faixaLuz.rotation.x = -Math.PI / 2;
  const luzArco = new THREE.Group();
  luzArco.add(cortina, faixaLuz);
  luzArco.visible = false;
  root.add(luzArco);

  // ---- Semáforo: 3 lâmpadas instanciadas (cor = estado) --------------------------------
  const geoLampada = track(new THREE.CircleGeometry(0.16, 14));
  const matLampada = track(new THREE.MeshBasicMaterial({ color: white }));
  const lampadas = new THREE.InstancedMesh(geoLampada, matLampada, 3);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 3; i++) {
    m4.makeTranslation(wx(fx) + (i - 1) * 0.44, ALT_P + 0.44, wz(YF) + 0.05);
    lampadas.setMatrixAt(i, m4);
  }
  const corApagada = mix(pv("gray-800"), pv("gray-950"), 0.4);
  const corVermelha = mix(pv("red-500"), white, 0.15);
  const corVerde = mix(pv("green-500"), white, 0.2);
  for (let i = 0; i < 3; i++) lampadas.setColorAt(i, corApagada);
  root.add(lampadas);

  // ---- Lâmpadas (cordões e holofotes) --------------------------------------------------
  const geoBulbo = track(new THREE.IcosahedronGeometry(0.055, 0));
  const matBulbo = track(new THREE.MeshBasicMaterial({ color: white }));
  const luzes = new THREE.InstancedMesh(geoBulbo, matBulbo, Math.max(1, bulbos.length));
  luzes.count = bulbos.length;
  bulbos.forEach((b, i) => {
    m4.makeTranslation(wx(b.x), b.h, wz(b.y));
    luzes.setMatrixAt(i, m4);
  });
  root.add(luzes);
  const corQuente = mix(pv("yellow-400"), white, 0.55);
  const corAcesa = mix(pv("yellow-400"), white, 0.8);
  const corMeia = mix(pv("yellow-500"), pv("gray-600"), 0.45);
  const corLuzVermelha = mix(pv("red-500"), white, 0.1);
  const corLuzVerde = mix(pv("green-500"), white, 0.25);
  let modoLuz = "corrida"; // corrida | vermelho | verde | festa
  let tModo = 0;
  let ultimoPasso = -1;
  const pintarLuzes = (t) => {
    const passo = reducedMotion ? 0 : Math.floor(t * 7);
    if (passo === ultimoPasso && modoLuz === "corrida") return;
    ultimoPasso = passo;
    bulbos.forEach((b, i) => {
      let c = corQuente;
      if (b.tipo === "pisca") {
        if (modoLuz === "vermelho") c = reducedMotion || passo % 2 ? corLuzVermelha : corMeia;
        else if (modoLuz === "verde") c = corLuzVerde;
        else if (modoLuz === "festa") c = coresFogos[(i + passo) % coresFogos.length];
        else c = reducedMotion ? corAcesa : (i + passo) % 4 === 0 ? corAcesa : corMeia;
      }
      luzes.setColorAt(i, c);
    });
    if (luzes.instanceColor) luzes.instanceColor.needsUpdate = true;
  };
  pintarLuzes(0);

  // ---- Fecha a pintura -----------------------------------------------------------------
  const matDecal = track(
    new THREE.MeshStandardMaterial({ map: arte.tex, alphaTest: 0.5, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
  );
  const meshDecal = decal.fechar(matDecal);
  if (meshDecal) {
    track(meshDecal.geometry);
    meshDecal.receiveShadow = !lite;
    root.add(meshDecal);
  }

  // ---- Eventos da corrida -----------------------------------------------------------------
  let proximo = -1;
  let festaT = -1;

  function setProximo(i) {
    proximo = Number.isInteger(i) && i >= 0 && i < N ? i : -1;
    arcos.forEach((a, j) => {
      const vez = j === proximo;
      a.mat.color.copy(vez ? corCheia : corDiscreta);
      if (a.emDestaque !== vez) {
        a.attCor.array.set(vez ? a.destaque : a.normais);
        a.attCor.needsUpdate = true;
        a.emDestaque = vez;
      }
      a.mat.emissiveIntensity = vez ? 0.35 : 0;
    });
    luzArco.visible = proximo >= 0;
    if (proximo < 0) return;
    const a = arcos[proximo];
    const alt = a.centro.y;
    if (a.tipo === "portico") {
      cortina.geometry = geoPlano;
      cortina.scale.set(a.vao - 0.5, alt - 0.2, 1);
      cortina.position.set(0, (alt - 0.2) / 2, 0);
    } else {
      cortina.geometry = geoMeia;
      cortina.scale.set(a.vao / 2 - a.rTubo - 0.05, alt - a.rTubo - 0.05, 1);
      cortina.position.set(0, 0, 0);
    }
    faixaLuz.scale.set(a.vao - 0.5, 0.5, 1);
    faixaLuz.position.set(0, 0.05, 0);
    luzArco.position.set(a.centro.x, 0, a.centro.z);
    luzArco.rotation.y = a.giro;
  }

  function passou(i) {
    const a = arcos[i];
    if (!a) return;
    a.flash = reducedMotion ? 0.25 : 0.45;
    if (reducedMotion) return;
    // Faíscas ao longo do arco (ou da viga do pórtico).
    for (const o of a.trilha) soltar(o, lite ? 3 : 6, { vel: 2.4, sobe: 1.5, vida: 0.6 });
  }

  function largada(fase) {
    const acesas = fase === 3 || fase === "3" ? 1 : fase === 2 || fase === "2" ? 2 : fase === 1 || fase === "1" || fase === "vermelho" ? 3 : 0;
    for (let i = 0; i < 3; i++) {
      const c2 = fase === "verde" ? corVerde : i < acesas ? corVermelha : corApagada;
      lampadas.setColorAt(i, c2);
    }
    lampadas.instanceColor.needsUpdate = true;
    // Lâmpadas do pórtico acompanham: vermelhas na contagem, verdes na largada.
    if (modoLuz !== "festa") {
      modoLuz = fase === "verde" ? "verde" : acesas ? "vermelho" : "corrida";
      tModo = 0;
      ultimoPasso = -1;
    }
  }

  function festa() {
    festaT = 0;
    modoLuz = "festa";
    tModo = 0;
    ultimoPasso = -1;
  }

  return {
    centroChegada: arcos[N - 1].centro.clone(),
    setProximo,
    passou,
    largada,
    festa,
    abrirPorta: box.abrirPorta,
    update(t, dt) {
      if (festaT >= 0) festaT += dt;
      // Próximo arco pulsa (com reducedMotion, brilho fixo); na festa, todos
      // piscam em onda por alguns segundos.
      arcos.forEach((a, j) => {
        let e = j === proximo ? (reducedMotion ? 0.35 : 0.3 + 0.25 * Math.sin(t * 5)) : 0;
        if (festaT >= 0 && festaT < 7 && !reducedMotion) e = Math.max(e, 0.35 + 0.35 * Math.sin(t * 6 + j * 1.3));
        if (a.flash > 0) {
          a.flash = Math.max(0, a.flash - dt);
          e = Math.max(e, 2.2 * (a.flash / 0.45));
        }
        a.mat.emissiveIntensity = e;
      });
      if (proximo >= 0) matCortina.opacity = reducedMotion ? 0.22 : 0.16 + 0.1 * Math.sin(t * 5);
      // Arcos infláveis na frente do ciclista ficam translúcidos.
      const pj = ctx.jogador();
      for (const a of arcos) {
        if (a.tipo !== "inflavel") continue;
        let alvo = 1;
        if (pj) {
          const dx = pj.x - a.centro.x;
          const dz = pj.z - a.centro.z;
          const meio = a.vao / 2 + 0.3;
          const atras = a.giro ? Math.abs(dx) < 0.9 && Math.abs(dz) < meio : Math.abs(dx) < meio && dz > -2.1 && dz < 0.35;
          if (atras) alvo = 0.32;
        }
        a.opacidade = reducedMotion ? alvo : a.opacidade + (alvo - a.opacidade) * Math.min(1, dt * 8);
        a.mat.opacity = a.opacidade;
        a.mat.depthWrite = a.opacidade > 0.95;
      }
      // Lâmpadas: o verde da largada dura 2,5 s e a festa 9 s; depois volta
      // ao pisca-pisca da corrida.
      tModo += dt;
      if ((modoLuz === "verde" && tModo > 2.5) || (modoLuz === "festa" && tModo > 9)) {
        modoLuz = "corrida";
        ultimoPasso = -1;
      }
      pintarLuzes(t);
    },
  };
}
